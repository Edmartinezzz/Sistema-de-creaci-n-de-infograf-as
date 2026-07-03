import * as XLSX from 'xlsx';
import { RutaTransporte, ConsumoInstitucion, DisponibilidadEstacion } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalizeKey = (str: string): string => {
  if (str == null) return '';
  return str.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_");
};

const detectFuelInText = (text: string): 'gasolina' | 'diesel' | null => {
  const n = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("diesel") || n.includes("gasoil")) return 'diesel';
  if (n.includes("gasolina") || n.includes("gasoline")) return 'gasolina';
  return null;
};

/** True if this institution name looks like a row that should be skipped */
const shouldSkipRow = (name: string): boolean => {
  const n = name.trim().toUpperCase();
  if (!n) return true;
  // Skip totals / summary rows
  if (n === 'TOTAL' || n === 'TOTALES' || n === 'SUMA' || n === 'GRAN TOTAL') return true;
  if (n.startsWith('TOTAL ') || n.startsWith('TOTALES ')) return true;
  // Skip sub-table vehicle header rows
  if (n.includes('VEHICULOS EQUIPADO')) return true;
  if (n.includes('TRANSPORTE MASIVO')) return true;
  if (n.includes('TOALT EQUIPADO') || n.includes('TOTALT EQUIPADO')) return true;
  if (n === 'PRINCIPAL' || n === 'TRONCAL') return true;
  // Skip report title rows (contain date patterns or known report keywords)
  if (/\d{2}\/\d{2}\/\d{4}/.test(n)) return true;
  if (/\d{2}-\d{2}-\d{4}/.test(n)) return true;
  if (/\d{2}\.\d{2}\.\d{4}/.test(n)) return true;
  if (n.includes('REPORTE DIARIO')) return true;
  if (n.includes('CONTINGENCIA DEL')) return true;
  if (n.includes('RELACION DE')) return true;
  if (n.includes('DISPONIBILIDAD')) return true;
  // Skip rows where the name is a pure number (group column labels)
  if (/^\d+$/.test(n)) return true;
  // Skip rows where the name is suspiciously long (likely a merged title cell)
  if (n.length > 95) return true;
  return false;
};

// ─── Find TOTALES column indices ─────────────────────────────────────────────
/**
 * Check if there is a "group header" row immediately above the detected header row
 * that labels columns as "1ER CORTE", "2DO CORTE", "TOTALES", etc.
 * If TOTALES is found, returns the column indices for the TOTALES UNIDADES and LITROS.
 */
function findTotalesIndices(
  rows: any[][],
  headerRowIdx: number,
  normHeader: string[],
  startCol: number,
  endCol: number
): { uniIdx: number; litIdx: number } | null {
  for (let k = 1; k <= Math.min(4, headerRowIdx); k++) {
    const row = rows[headerRowIdx - k];
    if (!row) continue;
    
    // Slice only within the startCol and endCol range to avoid capturing adjacent table totals
    const rangeCells = row.slice(startCol, endCol).map((c: any) => normalizeKey(String(c ?? '')));
    
    let lastTotalesColInRange = -1;
    for (let col = rangeCells.length - 1; col >= 0; col--) {
      const v = rangeCells[col];
      if (v === 'totales' || v === 'total') {
        lastTotalesColInRange = startCol + col;
        break;
      }
    }
    if (lastTotalesColInRange === -1) continue;

    let uniIdx = -1;
    let litIdx = -1;
    for (let col = lastTotalesColInRange; col < endCol; col++) {
      const h = normHeader[col];
      if (!h) continue;
      if (uniIdx === -1 && (
        h.includes("unidade") || h.includes("vehiculo") ||
        h.includes("convocado") || h.includes("flota") || h.includes("cantidad")
      )) {
        uniIdx = col;
      } else if (uniIdx !== -1 && litIdx === -1 && (
        h.includes("litro") || h.includes("lts") || h.includes("volumen")
      )) {
        litIdx = col;
      }
    }
    if (uniIdx !== -1 && litIdx !== -1) return { uniIdx, litIdx };
  }
  return null;
}

// ─── Schema detection ────────────────────────────────────────────────────────

function detectRowSchema(rowCells: string[]): 'rutas' | 'institaciones' | 'estaciones' | null {
  const hasRuta  = rowCells.some(c => c.includes("ruta") || c.includes("trayecto") || c.includes("destino"));
  const hasUnits = rowCells.some(c =>
    c.includes("unidade") || c.includes("cantidad") ||
    c.includes("vehiculo") || c.includes("flota") || c.includes("convocado"));
  const hasCoop  = rowCells.some(c =>
    c.includes("cooperativa") || c.includes("linea") ||
    c.includes("asociacion")  || c.includes("gremio") ||
    c.includes("coop")        || c === "empresa" || c === "lineas");

  const hasEst = rowCells.some(c => c.includes("estacion") || c.includes("gasolinera"));
  const hasGas = rowCells.some(c => c.includes("gasolina") || c.includes("premium"));
  const hasDie = rowCells.some(c => c.includes("diesel")   || c.includes("gasoil"));

  const hasInst = rowCells.some(c =>
    c.includes("institucion") || c.includes("organismo") ||
    c.includes("entidad")     || c.includes("empresa")   ||
    c.includes("cliente")     || c === "servicio");
  const hasLit = rowCells.some(c => c.includes("litro") || c.includes("lts") || c.includes("volumen"));

  if (hasRuta  && hasUnits && hasCoop) return 'rutas';
  if (hasEst   && (hasGas || hasDie))  return 'estaciones';
  if (hasInst  && hasLit)              return 'institaciones';
  return null;
}

// ─── Payload type ────────────────────────────────────────────────────────────

export interface ParsedPayload {
  rutas:       RutaTransporte[];
  institaciones: ConsumoInstitucion[];
  estaciones:  DisponibilidadEstacion[];
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export const parseExcelOrCSV = (file: File): Promise<ParsedPayload> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const raw = e.target?.result;
        if (!raw) { reject(new Error("No se pudo leer el contenido del archivo.")); return; }

        const workbook = XLSX.read(raw, { type: 'binary' });
        if (workbook.SheetNames.length === 0) {
          reject(new Error("El archivo no contiene ninguna hoja.")); return;
        }

        const payload: ParsedPayload = { rutas: [], institaciones: [], estaciones: [] };
        let parsedSheets = 0;

        for (const sheetName of workbook.SheetNames) {
          const ws   = workbook.Sheets[sheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (rows.length < 2) continue;

          let i = 0;
          let sheetHadData = false;

          while (i < rows.length) {
            const rowCells  = rows[i].map((c: any) => normalizeKey(String(c ?? '')));
            const nonEmpty  = rowCells.filter((c: string) => c.length > 0);
            if (nonEmpty.length < 2) { i++; continue; }

            const schema = detectRowSchema(rowCells);
            if (!schema)  { i++; continue; }

            // ── INSTITUTIONS / SERVICES ─────────────────────────────────────
            if (schema === 'institaciones') {
              const localHeaders: { r: number; col: number }[] = [];
              const colsSeen = new Set<number>();

              // Scan row i and row i - 1 for table headers (institucion, servicio, organismo)
              for (const r of [i - 1, i]) {
                if (r < 0 || r >= rows.length) continue;
                const row = rows[r];
                if (!row) continue;
                for (let col = 0; col < row.length; col++) {
                  const val = normalizeKey(String(row[col] ?? ''));
                  if (val === 'institucion' || val === 'servicio' || val === 'organismo') {
                    if (!colsSeen.has(col)) {
                      colsSeen.add(col);
                      localHeaders.push({ r, col });
                    }
                  }
                }
              }

              // Get all unique column starts sorted ascending
              const uniqueCols = Array.from(colsSeen).sort((a, b) => a - b);
              const sectionData: ConsumoInstitucion[] = [];
              let maxRowReached = i + 1;

              // Parse each detected horizontal table
              for (let t = 0; t < localHeaders.length; t++) {
                const { r: headerRowIdx, col: instColIdx } = localHeaders[t];
                
                // Determine column range for this specific table
                const nextColIdx = uniqueCols.find(c => c > instColIdx);
                const endCol = nextColIdx !== undefined ? nextColIdx : rows[headerRowIdx].length;

                const origHeader = rows[headerRowIdx].map((h: any) => String(h ?? '').trim());
                const normHeader = origHeader.map((h: string) => normalizeKey(h));

                // Context = check rows above within this table's column range for fuel type keywords
                let fuelType: 'gasolina' | 'diesel' = 'gasolina';
                let fuelDetected = false;
                for (let scanRow = headerRowIdx - 1; scanRow >= Math.max(0, headerRowIdx - 4); scanRow--) {
                  const row = rows[scanRow];
                  if (!row) continue;
                  const textToScan = row.slice(instColIdx, endCol).join(' ');
                  const detected = detectFuelInText(textToScan);
                  if (detected) {
                    fuelType = detected;
                    fuelDetected = true;
                    break;
                  }
                }
                if (!fuelDetected) {
                  fuelType = detectFuelInText(sheetName) ?? 'gasolina';
                }

                // Determine data column indices (prefer TOTALES if found within the range)
                const totalesIdxs = findTotalesIndices(rows, headerRowIdx, normHeader, instColIdx, endCol);
                let uniColIdx = -1;
                let litColIdx = -1;
                if (totalesIdxs) {
                  uniColIdx = totalesIdxs.uniIdx;
                  litColIdx = totalesIdxs.litIdx;
                } else {
                  for (let col = endCol - 1; col >= instColIdx; col--) {
                    const h = normHeader[col];
                    if (litColIdx === -1 && (h.includes("litro") || h.includes("lts") || h.includes("volumen"))) {
                      litColIdx = col;
                    }
                  }
                  for (let col = litColIdx - 1; col >= instColIdx; col--) {
                    const h = normHeader[col];
                    if (h && (h.includes("unidade") || h.includes("vehiculo") ||
                        h.includes("convocado") || h.includes("flota") || h.includes("cantidad"))) {
                      uniColIdx = col;
                      break;
                    }
                  }
                }

                // Extract table rows vertically
                let j = headerRowIdx + 1;
                while (j < rows.length) {
                  const dataRow = rows[j];
                  if (!dataRow) { j++; continue; }

                  // Stop if we hit another header keyword in this column range
                  const nextCells = dataRow.slice(instColIdx, endCol).map((c: any) => normalizeKey(String(c ?? '')));
                  const hasHeaderWord = nextCells.some((c: string) => c === 'institucion' || c === 'servicio' || c === 'organismo');
                  if (hasHeaderWord) break;

                  // Stop if we hit a different schema
                  const rowCells = dataRow.map((c: any) => normalizeKey(String(c ?? '')));
                  if (detectRowSchema(rowCells) !== null && j > headerRowIdx + 1 && !colsSeen.has(rowCells.findIndex(c => c === 'institucion' || c === 'servicio' || c === 'organismo'))) {
                    break;
                  }

                  const instName = String(dataRow[instColIdx] ?? '').trim();
                  if (!instName) { j++; continue; }
                  if (shouldSkipRow(instName)) { j++; continue; }

                  const headerName = normHeader[instColIdx];
                  if (headerName === 'servicio' || headerName === 'organismo' || headerName === 'cooperativa') {
                    const normName = normalizeKey(instName);
                    if (normName.includes('contingencia')) {
                      j++;
                      continue;
                    }
                  }

                  const rawUni = uniColIdx >= 0 ? Number(dataRow[uniColIdx]) : 0;
                  const rawLit = litColIdx >= 0 ? Number(dataRow[litColIdx]) : 0;
                  const parsedUni = isNaN(rawUni) ? 0 : Math.max(0, rawUni);
                  const parsedLit = isNaN(rawLit) ? 0 : Math.max(0, rawLit);

                  // Determine fuel type override if tipo/combustible column exists in this table range
                  let rowFuelType = fuelType;
                  const tipoColIdx = normHeader.slice(instColIdx, endCol).findIndex((h: string) =>
                    h.includes("tipo") || h.includes("combustible") || h.includes("producto")
                  );
                  if (tipoColIdx >= 0) {
                    const tv = String(dataRow[instColIdx + tipoColIdx] ?? '').toLowerCase();
                    if (tv.includes("diesel") || tv.includes("gasoil")) rowFuelType = 'diesel';
                    else if (tv.includes("gasolina"))                    rowFuelType = 'gasolina';
                  }

                  sectionData.push({
                    institucion:     instName.toUpperCase(),
                    unidades:        parsedUni,
                    litros:          parsedLit,
                    tipoCombustible: rowFuelType
                  });

                  j++;
                }
                maxRowReached = Math.max(maxRowReached, j);
              }

              if (sectionData.length > 0) {
                payload.institaciones.push(...sectionData);
                sheetHadData = true;
              }
              i = maxRowReached;
              continue;
            }

            // ── ESTACIONES ───────────────────────────────────────────────────
            if (schema === 'estaciones') {
              const origHeader = rows[i].map((h: any) => String(h ?? '').trim());
              const normHeader = origHeader.map((h: string) => normalizeKey(h));

              const estColIdx = normHeader.findIndex(h =>
                h.includes("estacion") || h.includes("gasolinera")
              );
              const gasColIdx = normHeader.findIndex(h =>
                h.includes("gasolina") || h.includes("premium")
              );
              const dieColIdx = normHeader.findIndex(h =>
                h.includes("diesel") || h.includes("gasoil")
              );

              const parsed: DisponibilidadEstacion[] = [];
              for (let j = i + 1; j < rows.length; j++) {
                const dr = rows[j];
                const estName = estColIdx >= 0 ? String(dr[estColIdx] ?? '').trim() : '';
                if (!estName || shouldSkipRow(estName)) continue;
                const rawGas = gasColIdx >= 0 ? Number(dr[gasColIdx]) : 0;
                const rawDie = dieColIdx >= 0 ? Number(dr[dieColIdx]) : 0;
                parsed.push({
                  estacion: estName.toUpperCase(),
                  gasolina: isNaN(rawGas) ? 0 : Math.max(0, rawGas),
                  diesel:   isNaN(rawDie) ? 0 : Math.max(0, rawDie)
                });
              }

              if (parsed.length > 0) {
                const existing = new Set(payload.estaciones.map(e => e.estacion));
                parsed.forEach(p => { if (!existing.has(p.estacion)) payload.estaciones.push(p); });
                sheetHadData = true;
              }
              break; // one estaciones section per sheet
            }

            // ── RUTAS ────────────────────────────────────────────────────────
            if (schema === 'rutas') {
              const origHeader = rows[i].map((h: any) => String(h ?? '').trim());
              const normHeader = origHeader.map((h: string) => normalizeKey(h));

              const idColIdx = normHeader.findIndex(h =>
                h === "id" || h === "codigo" || h === "nro" || h === "numero"
              );
              const rutaColIdx = normHeader.findIndex(h =>
                h.includes("ruta") || h.includes("nombre") ||
                h.includes("trayecto") || h.includes("destino")
              );
              const uniColIdx = normHeader.findIndex(h =>
                h.includes("unidade") || h.includes("vehiculo") ||
                h.includes("cantidad") || h.includes("flota") || h.includes("convocado")
              );
              const coopColIdx = normHeader.findIndex(h =>
                h.includes("cooperativa") || h.includes("linea") ||
                h.includes("asociacion")  || h.includes("empresa") || h.includes("gremio")
              );

              const parsed: RutaTransporte[] = [];
              for (let j = i + 1, autoId = 1; j < rows.length; j++) {
                const dr = rows[j];
                const rutVal  = rutaColIdx  >= 0 ? String(dr[rutaColIdx]  ?? '').trim() : '';
                const coopVal = coopColIdx  >= 0 ? String(dr[coopColIdx]  ?? '').trim() : '';
                if (!rutVal || shouldSkipRow(rutVal)) continue;
                if (coopVal && shouldSkipRow(coopVal)) continue;

                const rawId  = idColIdx  >= 0 ? Number(dr[idColIdx])  : NaN;
                const rawUni = uniColIdx >= 0 ? Number(dr[uniColIdx]) : 0;

                parsed.push({
                  id:          (!isNaN(rawId) && rawId > 0) ? rawId : autoId++,
                  ruta:        rutVal.toUpperCase(),
                  unidades:    isNaN(rawUni) ? 0 : Math.max(0, rawUni),
                  cooperativa: coopVal || "LÍNEA / COOPERATIVA INDEPENDIENTE"
                });
              }

              if (parsed.length > 0) {
                const existing = new Set(payload.rutas.map(r => r.id));
                parsed.forEach(p => { if (!existing.has(p.id)) payload.rutas.push(p); });
                sheetHadData = true;
              }
              break; // one rutas section per sheet
            }

            i++;
          }

          if (sheetHadData) parsedSheets++;
        }

        if (parsedSheets === 0) {
          reject(new Error(
            "No se detectó ninguna pestaña con columnas reconocibles.\n" +
            "• 'Ruta' + 'Unidades' → transporte\n" +
            "• 'Institucion' (o 'Servicio') + 'Litros' → consumo gasolina/diesel\n" +
            "• 'Estacion' + 'Gasolina' + 'Diesel' → inventario E/S"
          ));
          return;
        }

        payload.rutas.sort((a, b) => a.id - b.id);
        resolve(payload);

      } catch (err) {
        reject(new Error("Fallo al interpretar el archivo: " + (err as Error).message));
      }
    };

    reader.onerror = () => reject(new Error("Fallo en la lectura del archivo."));
    reader.readAsBinaryString(file);
  });
};
