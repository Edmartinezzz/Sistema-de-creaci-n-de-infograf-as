const fs = require('fs');
const XLSX = require('xlsx');

const normalizeKey = (str) => {
  if (str == null) return '';
  return str.toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_");
};

const detectFuelInText = (text) => {
  const n = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (n.includes("diesel") || n.includes("gasoil")) return 'diesel';
  if (n.includes("gasolina") || n.includes("gasoline")) return 'gasolina';
  return null;
};

const shouldSkipRow = (name) => {
  const n = name.trim().toUpperCase();
  if (!n) return true;
  if (n === 'TOTAL' || n === 'TOTALES' || n === 'SUMA' || n === 'GRAN TOTAL') return true;
  if (n.startsWith('TOTAL ') || n.startsWith('TOTALES ')) return true;
  if (n.includes('VEHICULOS EQUIPADO')) return true;
  if (n.includes('TRANSPORTE MASIVO')) return true;
  if (n.includes('TOALT EQUIPADO') || n.includes('TOTALT EQUIPADO')) return true;
  if (n === 'PRINCIPAL' || n === 'TRONCAL') return true;
  if (/\d{2}\/\d{2}\/\d{4}/.test(n)) return true;
  if (/\d{2}-\d{2}-\d{4}/.test(n)) return true;
  if (/\d{2}\.\d{2}\.\d{4}/.test(n)) return true;
  if (n.includes('REPORTE DIARIO')) return true;
  if (n.includes('CONTINGENCIA DEL')) return true;
  if (n.includes('RELACION DE')) return true;
  if (n.includes('DISPONIBILIDAD')) return true;
  if (/^\d+$/.test(n)) return true;
  if (n.length > 55) return true;
  return false;
};

function findTotalesIndices(rows, headerRowIdx, normHeader, startCol, endCol) {
  for (let k = 1; k <= Math.min(4, headerRowIdx); k++) {
    const row = rows[headerRowIdx - k];
    if (!row) continue;
    const rangeCells = row.slice(startCol, endCol).map((c) => normalizeKey(String(c ?? '')));
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

const filePath = 'C:\\Users\\ADMIN\\Downloads\\REPORTE DE ATENCION GENERAL JULIO 2026 (1).xlsx';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

for (const sheetName of workbook.SheetNames) {
  console.log(`\n=================== HOJA: ${sheetName} ===================`);
  const ws = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  
  // 1. Scan the entire sheet to find all "table headers"
  const tableHeaders = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let col = 0; col < row.length; col++) {
      const val = normalizeKey(String(row[col] ?? ''));
      if (val === 'institucion' || val === 'servicio' || val === 'organismo') {
        tableHeaders.push({ r, col });
      }
    }
  }

  console.log(`Detected table header cells:`, tableHeaders);

  // Get all unique column starts from the table headers, sorted ascending
  const uniqueCols = Array.from(new Set(tableHeaders.map(th => th.col))).sort((a, b) => a - b);

  const parsedInstitutions = [];

  // 2. Parse each detected table
  for (let t = 0; t < tableHeaders.length; t++) {
    const { r: headerRowIdx, col: instColIdx } = tableHeaders[t];
    
    // Determine endCol (the start of the next table on the right, or the row length)
    const nextColIdx = uniqueCols.find(c => c > instColIdx);
    const endCol = nextColIdx !== undefined ? nextColIdx : rows[headerRowIdx].length;


    const origHeader = rows[headerRowIdx].map(h => String(h ?? '').trim());
    const normHeader = origHeader.map(h => normalizeKey(h));

    // Determine fuel type
    let fuelType = 'gasolina';
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

    // Determine data columns (prefer TOTALES)
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

    console.log(`\nTable at Row ${headerRowIdx}, Col ${instColIdx} (Fuel: ${fuelType}, Range: cols ${instColIdx}-${endCol})`);
    console.log(`-> Institution: "${origHeader[instColIdx]}", Unidades index: ${uniColIdx} (${origHeader[uniColIdx]}), Litros index: ${litColIdx} (${origHeader[litColIdx]})`);

    // Parse data rows
    let j = headerRowIdx + 1;
    let tableDataCount = 0;
    while (j < rows.length) {
      const dataRow = rows[j];
      if (!dataRow) { j++; continue; }
      
      // Check if we hit another header in this column range
      const nextCells = dataRow.slice(instColIdx, endCol).map(c => normalizeKey(String(c ?? '')));
      const hasHeaderWord = nextCells.some(c => c === 'institucion' || c === 'servicio' || c === 'organismo');
      if (hasHeaderWord) {
        console.log(`-> Stopped at Row ${j} due to header keyword`);
        break;
      }

      const instName = String(dataRow[instColIdx] ?? '').trim();
      if (!instName) { j++; continue; }
      if (shouldSkipRow(instName)) { j++; continue; }

      const rawUni = uniColIdx >= 0 ? Number(dataRow[uniColIdx]) : 0;
      const rawLit = litColIdx >= 0 ? Number(dataRow[litColIdx]) : 0;
      const parsedUni = isNaN(rawUni) ? 0 : Math.max(0, rawUni);
      const parsedLit = isNaN(rawLit) ? 0 : Math.max(0, rawLit);

      parsedInstitutions.push({
        institucion: instName.toUpperCase(),
        unidades: parsedUni,
        litros: parsedLit,
        tipoCombustible: fuelType
      });
      tableDataCount++;
      j++;
    }
    console.log(`-> Extracted ${tableDataCount} data rows.`);
  }

  console.log(`\n=== EXTRACTED DATA SUMMARY FOR ${sheetName} ===`);
  console.log(`Total records parsed: ${parsedInstitutions.length}`);
  const gas = parsedInstitutions.filter(x => x.tipoCombustible === 'gasolina');
  const die = parsedInstitutions.filter(x => x.tipoCombustible === 'diesel');
  console.log(`- Gasolina (${gas.length} records):`);
  gas.forEach(x => console.log(`  * ${x.institucion}: ${x.litros} L / ${x.unidades} veh.`));
  console.log(`- Diesel (${die.length} records):`);
  die.forEach(x => console.log(`  * ${x.institucion}: ${x.litros} L / ${x.unidades} veh.`));
}
process.exit(0);
