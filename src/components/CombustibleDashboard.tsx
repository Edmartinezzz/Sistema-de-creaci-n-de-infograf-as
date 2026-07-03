import React, { useState } from 'react';
import Image from 'next/image';
import { ConsumoInstitucion, DisponibilidadEstacion } from '../types';

interface CombustibleDashboardProps {
  consumo: ConsumoInstitucion[];
  estaciones: DisponibilidadEstacion[];
  onConsumoUpdate?: (updated: ConsumoInstitucion, originalName: string) => void;
  onEstacionUpdate?: (updated: DisponibilidadEstacion, originalName: string) => void;
}

export const CombustibleDashboard: React.FC<CombustibleDashboardProps> = ({ 
  consumo, 
  estaciones, 
  onConsumoUpdate, 
  onEstacionUpdate 
}) => {
  
  // ─── Default Placeholders for Empty State ───
  // We use these structures with 0 values when no Excel has been parsed
  const defaultEstaciones: DisponibilidadEstacion[] = [
    { estacion: "MIRAMAR", gasolina: 0, diesel: 0 },
    { estacion: "AEROPUERTO", gasolina: 0, diesel: 0 },
    { estacion: "G. MARINA", gasolina: 0, diesel: 0 },
    { estacion: "BOMBEROS", gasolina: 0, diesel: 0 },
    { estacion: "ALDO", gasolina: 0, diesel: 0 },
    { estacion: "AVIACIÓN", gasolina: 0, diesel: 0 },
    { estacion: "LITORAL", gasolina: 0, diesel: 0 },
    { estacion: "SOUBLETTE", gasolina: 0, diesel: 0 },
    { estacion: "LA ZORRA", gasolina: 0, diesel: 0 }
  ];

  const defaultConsumoGasolina: ConsumoInstitucion[] = [
    { institucion: "CONTINGENCIA GOBERNACION", litros: 0, unidades: 0, tipoCombustible: "gasolina" },
    { institucion: "TRANSPORTE PUBLICO", litros: 0, unidades: 0, tipoCombustible: "gasolina" },
    { institucion: "RUTAS ESPECIALES", litros: 0, unidades: 0, tipoCombustible: "gasolina" },
    { institucion: "TAXIS", litros: 0, unidades: 0, tipoCombustible: "gasolina" }
  ];

  const defaultConsumoDiesel: ConsumoInstitucion[] = [
    { institucion: "CONTINGENCIA", litros: 0, unidades: 0, tipoCombustible: "diesel" },
    { institucion: "RUTAS ESPECIALES", litros: 0, unidades: 0, tipoCombustible: "diesel" },
    { institucion: "TRANSP. PÚBLICO", litros: 0, unidades: 0, tipoCombustible: "diesel" },
    { institucion: "CIUDAD CARIBIA", litros: 0, unidades: 0, tipoCombustible: "diesel" }
  ];

  const displayEstaciones = estaciones.length > 0 ? estaciones : defaultEstaciones;
  const displayConsumo = consumo.length > 0 ? consumo : [
    ...defaultConsumoGasolina,
    ...defaultConsumoDiesel
  ];

  // ─── 1. KPI Calculations ───
  const totalGasolinaLitros = displayConsumo
    .filter(c => c.tipoCombustible === 'gasolina')
    .reduce((acc, curr) => acc + curr.litros, 0);

  const totalDieselLitros = displayConsumo
    .filter(c => c.tipoCombustible === 'diesel')
    .reduce((acc, curr) => acc + curr.litros, 0);

  const totalVehiculosAtendidos = displayConsumo.reduce((acc, curr) => acc + curr.unidades, 0);

  // Find station with highest GASOLINA value
  const estacionMayorReserva = displayEstaciones.reduce((prev, current) => {
    return (prev.gasolina > current.gasolina) ? prev : current;
  }, displayEstaciones[0] || { estacion: 'NINGUNA', gasolina: 0, diesel: 0 });

  // ─── 2. Edit Modal States ───
  const [editingEstacion, setEditingEstacion] = useState<DisponibilidadEstacion | null>(null);
  const [estName, setEstName] = useState('');
  const [estGas, setEstGas] = useState(0);
  const [estDie, setEstDie] = useState(0);

  const [editingConsumo, setEditingConsumo] = useState<ConsumoInstitucion | null>(null);
  const [instName, setInstName] = useState('');
  const [instLitros, setInstLitros] = useState(0);
  const [instUnidades, setInstUnidades] = useState(0);

  const openEditEstacion = (est: DisponibilidadEstacion) => {
    setEditingEstacion(est);
    setEstName(est.estacion);
    setEstGas(est.gasolina);
    setEstDie(est.diesel);
  };

  const saveEstacion = () => {
    if (!editingEstacion) return;
    onEstacionUpdate?.({
      estacion: estName.trim().toUpperCase(),
      gasolina: Math.max(0, Number(estGas) || 0),
      diesel: Math.max(0, Number(estDie) || 0)
    }, editingEstacion.estacion);
    setEditingEstacion(null);
  };

  const openEditConsumo = (c: ConsumoInstitucion) => {
    setEditingConsumo(c);
    setInstName(c.institucion);
    setInstLitros(c.litros);
    setInstUnidades(c.unidades);
  };

  const saveConsumo = () => {
    if (!editingConsumo) return;
    onConsumoUpdate?.({
      ...editingConsumo,
      institucion: instName.trim().toUpperCase(),
      litros: Math.max(0, Number(instLitros) || 0),
      unidades: Math.max(0, Number(instUnidades) || 0)
    }, editingConsumo.institucion);
    setEditingConsumo(null);
  };

  // ─── Donut Colors ───
  const GAS_DONUT_COLORS = ['#15803d', '#22c55e', '#4ade80', '#a3e635'];
  const DIE_DONUT_COLORS = ['#b45309', '#f59e0b', '#fbbf24', '#fef08a'];

  // ─── SVG Donut Chart Component ───
  const RenderDonut = ({ 
    tipo, 
    total, 
    title, 
    note 
  }: { 
    tipo: 'gasolina' | 'diesel', 
    total: number, 
    title: string, 
    note: string 
  }) => {
    const rawData = displayConsumo.filter(c => c.tipoCombustible === tipo);
    const sum = rawData.reduce((acc, curr) => acc + curr.litros, 0);


    // Only show institutions with actual litros > 0 in the chart
    const data = rawData
      .filter(item => item.litros > 0)
      .map((item, idx) => {
        const percentage = sum > 0 ? (item.litros / sum) * 100 : 0;
        return {
          label: item.institucion,
          value: item.litros,
          percentage,
          color: tipo === 'gasolina'
            ? GAS_DONUT_COLORS[idx % GAS_DONUT_COLORS.length]
            : DIE_DONUT_COLORS[idx % DIE_DONUT_COLORS.length],
          rawItem: item
        };
      });

    const isChartEmpty = sum === 0;
    const r = 38;
    const cx = 50;
    const cy = 50;
    const C = 2 * Math.PI * r; // ~238.76

    let accumulatedCircumference = 0;

    return (
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: 16,
        padding: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{
          fontSize: 9.5, fontWeight: 900, color: '#002060',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          borderBottom: '1px solid #e2e8f0', paddingBottom: 4
        }}>
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          {/* Donut circle & Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {/* Circle SVG */}
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background base circle */}
                <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="11" />
                
                {isChartEmpty ? (
                  // Neutral placeholder circle
                  <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                ) : (
                  data.map((slice, index) => {
                    const strokeLength = (slice.percentage / 100) * C;
                    const strokeOffset = C - strokeLength + accumulatedCircumference;
                    accumulatedCircumference -= strokeLength;
                    return (
                      <circle 
                        key={index}
                        cx={cx} cy={cy} r={r}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={`${strokeLength} ${C}`}
                        strokeDashoffset={strokeOffset}
                        style={{ transition: 'stroke-width 0.2s', cursor: 'pointer' }}
                      />
                    );
                  })
                )}
              </svg>
              {/* Inner Text label */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center', pointerEvents: 'none'
              }}>
                <span style={{ fontSize: 7, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total</span>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: '#0f172a' }}>
                  {total > 0 ? `${(total/1000).toFixed(1)}K L` : '0 L'}
                </span>
              </div>
            </div>

            {/* Legend list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              {isChartEmpty ? (
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', fontStyle: 'italic' }}>
                  Esperando archivo Excel...
                </div>
              ) : (
                data.map((slice, index) => (
                  <div 
                    key={index} 
                    onClick={() => openEditConsumo(slice.rawItem)}
                    title="Clic para editar este consumo"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 9.5, cursor: 'pointer', gap: 4,
                      padding: '2px 4px', borderRadius: 4, transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: slice.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontWeight: 800, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {slice.label} ✎
                    </div>
                    <div style={{ fontWeight: 900, color: '#1e293b', flexShrink: 0, textAlign: 'right' }}>
                      {slice.percentage.toFixed(0)}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Side Box Annotation */}
          <div style={{
            width: 80,
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            padding: '6px 8px',
            fontSize: 8.5,
            fontWeight: 800,
            color: '#475569',
            lineHeight: 1.3,
            textAlign: 'center',
            flexShrink: 0
          }}>
            {note}
          </div>
        </div>
      </div>
    );
  };

  // ─── 3. Horizontal Ranking Renderer ───
  const RenderRanking = ({ 
    tipo, 
    color, 
    title, 
    note 
  }: { 
    tipo: 'gasolina' | 'diesel', 
    color: string, 
    title: string, 
    note: string 
  }) => {
    const rawItems = displayConsumo
      .filter(c => c.tipoCombustible === tipo)
      .sort((a, b) => b.litros - a.litros)
      .slice(0, 4);

    const maxLitros = rawItems[0]?.litros || 1;
    const isListEmpty = rawItems.every(r => r.litros === 0);

    return (
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: 16,
        padding: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{
          fontSize: 9.5, fontWeight: 900, color: '#002060',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          borderBottom: '1px solid #e2e8f0', paddingBottom: 4
        }}>
          {title}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Horizontal list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {isListEmpty ? (
              <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
                Sin registros a graficar. Carga un archivo para llenar el ranking.
              </div>
            ) : (
              rawItems.map((item, idx) => {
                const widthPct = maxLitros > 0 ? (item.litros / maxLitros) * 100 : 0;
                return (
                  <div 
                    key={idx} 
                    onClick={() => openEditConsumo(item)}
                    title="Clic para editar este consumo institucional"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5,
                      cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 80, fontWeight: 800, color: '#475569', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.institucion} ✎
                    </div>
                    <div style={{ flex: 1, height: 11, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${widthPct}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '3px 0 0 3px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ width: 40, fontWeight: 900, color: '#1e293b', textAlign: 'right' }}>
                      {item.litros > 0 ? `${(item.litros / 1000).toFixed(1)}K` : '0'}
                    </div>
                  </div>
                );
              })
            )}
            
            {/* Axis marks */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', 
              paddingLeft: 86, paddingRight: 40, 
              fontSize: 8, fontWeight: 800, color: '#94a3b8', 
              borderTop: '1px dashed #cbd5e1', paddingTop: 2, marginTop: 1
            }}>
              <span>0</span>
              <span>{(maxLitros / 2000).toFixed(0)}K</span>
              <span>{(maxLitros / 1000).toFixed(0)}K Lts</span>
            </div>
          </div>

          {/* Side Box Annotation */}
          <div style={{
            width: 80,
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            padding: '6px 8px',
            fontSize: 8.5,
            fontWeight: 800,
            color: '#475569',
            lineHeight: 1.3,
            textAlign: 'center',
            flexShrink: 0
          }}>
            {note}
          </div>
        </div>
      </div>
    );
  };

  // ─── 4. SVG Vertical Grouped Chart ───
  const renderComplexInventoryChart = () => {
    const chartHeight = 220;
    const chartWidth = 720;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 32;
    const paddingBottom = 30;

    const plotWidth = chartWidth - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;
    
    // Auto-scale vertical axes based on maximum inventory load, min 50K
    const maxVal = Math.max(...displayEstaciones.map(e => Math.max(e.gasolina, e.diesel)), 50000);
    const roundedMax = Math.ceil(maxVal / 10000) * 10000;

    const miramarIndex = displayEstaciones.findIndex(e => e.estacion.toUpperCase().includes('MIRAMAR'));
    const miramarItem = displayEstaciones[miramarIndex];
    const hasMiramarStock = miramarItem && miramarItem.gasolina > 0;

    const soubletteIdx = displayEstaciones.findIndex(e => e.estacion.toUpperCase().includes('SOUBLETTE'));
    const zorraIdx = displayEstaciones.findIndex(e => e.estacion.toUpperCase().includes('LA ZORRA'));

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{
          minWidth: 720,
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: 16,
          padding: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          display: 'flex', gap: 14, alignItems: 'center'
        }}>
          {/* Main SVG Plot */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Stock Disponible por Estación de Servicio (Gasolina vs Diesel)
            </div>
            
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="arrowhead-black" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 9 3, 0 6" fill="#1e293b" />
                </marker>
                <marker id="arrowhead-red" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 9 3, 0 6" fill="#ef4444" />
                </marker>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((scale, i) => {
                const tickVal = roundedMax * scale;
                const y = chartHeight - paddingBottom - (tickVal / roundedMax) * plotHeight;
                return (
                  <g key={i}>
                    <line 
                      x1={paddingLeft} y1={y} 
                      x2={chartWidth - paddingRight} y2={y} 
                      stroke="#e2e8f0" strokeWidth="1.2" 
                      strokeDasharray={scale === 0 ? "0" : "3 3"} 
                    />
                    <text x={paddingLeft - 8} y={y + 3} textAnchor="end" style={{ fontSize: 8.5, fontWeight: 800, fill: '#64748b' }}>
                      {tickVal > 0 ? `${(tickVal / 1000).toFixed(0)}K` : '0K'}
                    </text>
                  </g>
                );
              })}

              {/* Columns Group */}
              {displayEstaciones.map((est, idx) => {
                const numCols = displayEstaciones.length;
                const colWidth = plotWidth / numCols;
                const xCenter = paddingLeft + idx * colWidth + colWidth / 2;

                const barWidth = Math.min(13, colWidth * 0.32);
                const xGas = xCenter - barWidth - 1.5;
                const xDie = xCenter + 1.5;

                const hGas = (est.gasolina / roundedMax) * plotHeight;
                const hDie = (est.diesel / roundedMax) * plotHeight;

                const yGas = chartHeight - paddingBottom - hGas;
                const yDie = chartHeight - paddingBottom - hDie;

                const isZeroStock = est.gasolina === 0 && est.diesel === 0;

                return (
                  <g 
                    key={idx}
                    onClick={() => openEditEstacion(est)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>Haz clic para editar stock de {est.estacion}</title>
                    {/* Gasolina Bar (Green) */}
                    {est.gasolina > 0 && (
                      <rect 
                        x={xGas} y={yGas} 
                        width={barWidth} height={hGas} 
                        rx="2" fill="#16a34a" 
                        style={{ transition: 'opacity 0.15s' }}
                      />
                    )}
                    {est.gasolina > 0 && (
                      <text x={xGas + barWidth/2} y={yGas - 3} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 900, fill: '#15803d' }}>
                        {`${(est.gasolina / 1000).toFixed(0)}K`}
                      </text>
                    )}

                    {/* Diesel Bar (Yellow) */}
                    {est.diesel > 0 && (
                      <rect 
                        x={xDie} y={yDie} 
                        width={barWidth} height={hDie} 
                        rx="2" fill="#eab308"
                        style={{ transition: 'opacity 0.15s' }}
                      />
                    )}
                    {est.diesel > 0 && (
                      <text x={xDie + barWidth/2} y={yDie - 3} textAnchor="middle" style={{ fontSize: 7.5, fontWeight: 900, fill: '#b45309' }}>
                        {`${(est.diesel / 1000).toFixed(0)}K`}
                      </text>
                    )}

                    {/* Small ⚠️ ESCASEZ tag for 0 L */}
                    {isZeroStock && (
                      <text x={xCenter} y={chartHeight - paddingBottom - 10} textAnchor="middle" style={{ fontSize: 7, fontWeight: 900, fill: '#ef4444' }}>
                        ⚠️ CERO
                      </text>
                    )}

                    {/* Station Name Label */}
                    <text 
                      x={xCenter} y={chartHeight - paddingBottom + 14} 
                      textAnchor="middle" 
                      style={{ fontSize: 8.5, fontWeight: 900, fill: '#334155', textTransform: 'uppercase' }}
                    >
                      {est.estacion} ✎
                    </text>
                  </g>
                );
              })}

              {/* ── Graphic Annotations matching Visual Guide ── */}
              {/* 1. Pulmón de Reserva Principal pointing to Miramar */}
              {hasMiramarStock && miramarIndex !== -1 && (
                <g>
                  <text x="210" y="24" style={{ fontSize: 8.5, fontWeight: 900, fill: '#1e293b' }} textAnchor="start">
                    PULMÓN DE RESERVA PRINCIPAL
                  </text>
                  <path 
                    d={`M 205,21 L ${paddingLeft + miramarIndex * (plotWidth / displayEstaciones.length) + (plotWidth / displayEstaciones.length)/2 + 10},21`} 
                    stroke="#1e293b" strokeWidth="1.2" fill="none"
                    markerEnd="url(#arrowhead-black)"
                  />
                </g>
              )}

              {/* 2. Muestra de Escasez pointing to Soublette & La Zorra */}
              {soubletteIdx !== -1 && zorraIdx !== -1 && (
                <g>
                  <text x="590" y="70" style={{ fontSize: 8, fontWeight: 900, fill: '#ef4444' }} textAnchor="middle">
                    MUESTRA DE ESCASEZ
                  </text>
                  {/* Line to Soublette */}
                  <path 
                    d={`M 570,74 L ${paddingLeft + soubletteIdx * (plotWidth / displayEstaciones.length) + (plotWidth / displayEstaciones.length)/2},150`} 
                    stroke="#ef4444" strokeWidth="1.2" fill="none" strokeDasharray="3 2"
                    markerEnd="url(#arrowhead-red)"
                  />
                  {/* Line to La Zorra */}
                  <path 
                    d={`M 610,74 L ${paddingLeft + zorraIdx * (plotWidth / displayEstaciones.length) + (plotWidth / displayEstaciones.length)/2},150`} 
                    stroke="#ef4444" strokeWidth="1.2" fill="none" strokeDasharray="3 2"
                    markerEnd="url(#arrowhead-red)"
                  />
                </g>
              )}
            </svg>
            
            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', borderTop: '1px solid #cbd5e1', paddingTop: 6, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: '#475569' }}>
                <div style={{ width: 10, height: 6, borderRadius: 1.5, background: '#16a34a' }} />
                <span>Gasolina M-95</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: '#475569' }}>
                <div style={{ width: 10, height: 6, borderRadius: 1.5, background: '#eab308' }} />
                <span>Diesel / Gasoil</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: '#ef4444' }}>
                <span>⚠️ Escasez en Cero</span>
              </div>
            </div>
          </div>

          {/* Side Box Annotation */}
          <div style={{
            width: 80,
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            padding: '8px',
            fontSize: 8.5,
            fontWeight: 800,
            color: '#475569',
            lineHeight: 1.3,
            textAlign: 'center',
            flexShrink: 0
          }}>
            Comparación directa de reservas por estación. Identificación de stock crítico.
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {/* ══ OUTER CONTAINER CARD ══ */}
        <div
          id="panel-combustible"
          style={{
            width: '100%',
            maxWidth: 800,
            background: '#ffffff',
            borderRadius: 28,
            border: '4px solid #e25b44',
            outline: '2px solid #002f6c',
            outlineOffset: -10,
            padding: '10px 18px 44px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            position: 'relative',
            backgroundImage: 'linear-gradient(rgba(180,205,230,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(180,205,230,0.18) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            fontFamily: "'Outfit', Arial, sans-serif"
          }}
        >
          {/* ══ HEADER BANNER ══ */}
          <div style={{
            position: 'relative',
            marginBottom: 0,
            borderRadius: 999,
            background: '#f5b025',
            padding: '2.5px',
            boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(92deg, #003571 0%, #001d3e 80%)',
              borderRadius: 999,
              padding: '10px 60px 10px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                overflow: 'hidden',
                border: '2px solid white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Image
                  src="/logo.jpg"
                  alt="Logo Gobernación La Guaira"
                  width={64}
                  height={64}
                  style={{ objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  fontWeight: 900, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  lineHeight: 1.3, color: '#ffffff'
                }}>
                  <span style={{ color: '#f5b025' }}>CONTROL DE COMBUSTIBLE: </span>
                  DISTRIBUCIÓN DE HIDROCARBUROS E INVENTARIOS EN EL TERRITORIO
                </div>
              </div>
            </div>
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: 48, background: '#f5b025',
              borderRadius: '0 999px 999px 0'
            }} />
          </div>

          {/* ══ SUBTITLE BAR ══ */}
          <div style={{
            background: '#f1f5f9',
            border: '1.5px solid #cbd5e1',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: 10,
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            marginTop: 6,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span style={{ color: '#e25b44', fontWeight: 900 }}>PERÍODO REPORTADO:</span> JUN 25 - JUL 02, 2026. Basado en informes históricos
          </div>

          {/* ══ KPI CARDS ══ */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 10
          }}>
            {/* KPI 1 */}
            <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eefdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M3 22h12M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
                  <path d="M19 5v14a2 2 0 0 0 2 2h0V9a4 4 0 0 0-4-4h-1" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Gasolina Total</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {totalGasolinaLitros.toLocaleString('es-VE')} L
                </div>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Ilustrativo</div>
              </div>
            </div>

            {/* KPI 2 */}
            <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fefbeb', border: '1.5px solid #fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ca8a04" strokeWidth="2.5">
                  <rect x="2" y="7" width="14" height="10" rx="2" />
                  <path d="M16 10l4-2v8l-4-2" />
                  <circle cx="5" cy="18" r="1.5" />
                  <circle cx="13" cy="18" r="1.5" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Diesel Total</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {totalDieselLitros.toLocaleString('es-VE')} L
                </div>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#ca8a04', textTransform: 'uppercase' }}>Ilustrativo</div>
              </div>
            </div>

            {/* KPI 3 */}
            <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff7ed', border: '1.5px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ea580c" strokeWidth="2.5">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16" />
                  <circle cx="5" cy="18" r="2" />
                  <circle cx="13" cy="18" r="2" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Atendidos</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {totalVehiculosAtendidos.toLocaleString('es-VE')}
                </div>
                <div style={{ fontSize: 7, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Ilustrativo</div>
              </div>
            </div>

            {/* KPI 4 */}
            <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', border: '1.5px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2.5">
                  <path d="M3 22V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14M9 22V12h6v10" />
                </svg>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 7.5, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Mayor Reserva</div>
                <div style={{ fontSize: 9.5, fontWeight: 900, color: '#2563eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
                  {estacionMayorReserva.estacion}
                </div>
                <div style={{ fontSize: 7, fontWeight: 800, color: '#475569' }}>
                  {estacionMayorReserva.gasolina.toLocaleString('es-VE')} L
                </div>
              </div>
            </div>
          </div>

          {/* ══ SECTION HEADERS: GASOLINA vs DIESEL ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 6 }}>
            <div style={{ background: '#dbeafe', color: '#002f6c', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6, textAlign: 'center' }}>
              Consumo General Gasolina
            </div>
            <div style={{ background: '#fef3c7', color: '#78350f', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 6, textAlign: 'center' }}>
              Consumo General Diesel
            </div>
          </div>

          {/* ══ DONUT CHARTS ROW ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 10 }}>
            <RenderDonut 
              tipo="gasolina" 
              total={totalGasolinaLitros} 
              title="Resumen Despacho Gasolina (Datos Muestra)" 
              note="Muestra la proporción de consumo por sector. La Contingencia domina."
            />
            <RenderDonut 
              tipo="diesel" 
              total={totalDieselLitros} 
              title="Resumen Despacho Diesel (Datos Muestra)" 
              note="Análisis proporcional de consumo Diesel. Ciudad Caribia destaca."
            />
          </div>

          {/* ══ RANKINGS ROW ══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <RenderRanking 
              tipo="gasolina" 
              color="#16a34a" 
              title="Top Instituciones - Contingencia Gasolina (Datos Muestra)" 
              note="Ranking detallado para control institucional."
            />
            <RenderRanking 
              tipo="diesel" 
              color="#eab308" 
              title="Top Instituciones - Contingencia Diesel (Datos Muestra)" 
              note="Distribución institucional Diesel."
            />
          </div>

          {/* ══ INSTITUTION BREAKDOWN CHART ══ */}
          {(() => {
            const gasolinaItems = displayConsumo
              .filter(c => c.tipoCombustible === 'gasolina' && c.litros > 0)
              .sort((a, b) => b.litros - a.litros);
            const dieselItems = displayConsumo
              .filter(c => c.tipoCombustible === 'diesel' && c.litros > 0)
              .sort((a, b) => b.litros - a.litros);

            const renderSection = (
              items: ConsumoInstitucion[],
              barColor: string,
              unitColor: string
            ) => {
              const maxLit = Math.max(...items.map(i => i.litros), 1);
              const maxUni = Math.max(...items.map(i => i.unidades), 1);
              const ROW_H  = 11;
              const GAP    = 2;
              const PGAP   = 7;
              const NAME_W = 155;
              const BAR_W  = 370;
              const TOTAL_W = 700;
              const totalH = items.length * (ROW_H * 2 + GAP + PGAP) + 8;

              return (
                <svg
                  viewBox={`0 0 ${TOTAL_W} ${totalH}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                >
                  {items.map((item, idx) => {
                    const yBase   = idx * (ROW_H * 2 + GAP + PGAP) + 4;
                    const yLit    = yBase;
                    const yUni    = yBase + ROW_H + GAP;
                    const litPx   = (item.litros   / maxLit) * BAR_W;
                    const uniPx   = (item.unidades / maxUni) * BAR_W;
                    const truncName = item.institucion.length > 22
                      ? item.institucion.slice(0, 21) + '…'
                      : item.institucion;

                    return (
                      <g
                        key={idx}
                        onClick={() => openEditConsumo(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <title>Clic para editar: {item.institucion}</title>
                        {/* Alternating row bg */}
                        <rect
                          x={0} y={yBase - 2}
                          width={TOTAL_W} height={ROW_H * 2 + GAP + 4}
                          rx={3}
                          fill={idx % 2 === 0 ? '#f8fafc' : 'transparent'}
                        />
                        {/* Institution label */}
                        <text
                          x={NAME_W - 5} y={yLit + ROW_H * 0.82}
                          textAnchor="end"
                          style={{ fontSize: 7.8, fontWeight: 800, fill: '#334155' }}
                        >
                          {truncName} ✎
                        </text>
                        {/* LITROS bar bg */}
                        <rect x={NAME_W} y={yLit} width={BAR_W} height={ROW_H} rx={2} fill="#e2e8f0" />
                        {/* LITROS bar */}
                        <rect x={NAME_W} y={yLit} width={litPx} height={ROW_H} rx={2} fill={barColor} />
                        {/* LITROS micro-label inside bar */}
                        {litPx > 40 && (
                          <text
                            x={NAME_W + litPx - 4} y={yLit + ROW_H * 0.78}
                            textAnchor="end"
                            style={{ fontSize: 7, fontWeight: 900, fill: '#ffffff' }}
                          >
                            {item.litros.toLocaleString('es-VE')} L
                          </text>
                        )}
                        {/* LITROS label outside */}
                        {litPx <= 40 && (
                          <text
                            x={NAME_W + BAR_W + 5} y={yLit + ROW_H * 0.78}
                            style={{ fontSize: 7.5, fontWeight: 900, fill: '#1e293b' }}
                          >
                            {item.litros.toLocaleString('es-VE')} L
                          </text>
                        )}
                        {/* UNIDADES bar bg */}
                        <rect x={NAME_W} y={yUni} width={BAR_W} height={ROW_H} rx={2} fill="#e2e8f0" />
                        {/* UNIDADES bar */}
                        <rect x={NAME_W} y={yUni} width={uniPx} height={ROW_H} rx={2} fill={unitColor} />
                        {/* UNIDADES label */}
                        <text
                          x={NAME_W + BAR_W + 5} y={yUni + ROW_H * 0.78}
                          style={{ fontSize: 7.5, fontWeight: 900, fill: unitColor }}
                        >
                          {item.unidades} veh.
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            };

            const hasData = gasolinaItems.length > 0 || dieselItems.length > 0;

            return (
              <div style={{ marginBottom: 12 }}>
                {/* Section title */}
                <div style={{
                  background: 'linear-gradient(90deg, #002f6c, #003a85)',
                  color: '#f5b025',
                  fontWeight: 900, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '5px 12px', borderRadius: 6,
                  textAlign: 'center', marginBottom: 8
                }}>
                  Desglose Completo por Institución — Litros &amp; Unidades Totales
                </div>

                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 16,
                  padding: '10px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  width: '100%',
                  overflowX: 'auto'
                }}>
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 800, color: '#475569' }}>
                      <div style={{ width: 14, height: 8, background: '#16a34a', borderRadius: 2 }} />
                      Total Litros (Gasolina)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 800, color: '#475569' }}>
                      <div style={{ width: 14, height: 8, background: '#2563eb', borderRadius: 2 }} />
                      Total Unidades (Gasolina)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 800, color: '#475569' }}>
                      <div style={{ width: 14, height: 8, background: '#d97706', borderRadius: 2 }} />
                      Total Litros (Diesel)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 8.5, fontWeight: 800, color: '#475569' }}>
                      <div style={{ width: 14, height: 8, background: '#7c3aed', borderRadius: 2 }} />
                      Total Unidades (Diesel)
                    </div>
                  </div>

                  {!hasData && (
                    <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0', fontWeight: 700 }}>
                      Carga un archivo Excel para ver el desglose institucional completo
                    </div>
                  )}

                  {gasolinaItems.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 8.5, fontWeight: 900, color: '#15803d',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1.5px solid #dcfce7', paddingBottom: 3, marginBottom: 4,
                        display: 'flex', alignItems: 'center', gap: 5
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                        Gasolina M-95 — Contingencia Institucional
                      </div>
                      {renderSection(gasolinaItems, '#16a34a', '#2563eb')}
                    </div>
                  )}

                  {dieselItems.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        fontSize: 8.5, fontWeight: 900, color: '#b45309',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        borderBottom: '1.5px solid #fef3c7', paddingBottom: 3, marginBottom: 4,
                        display: 'flex', alignItems: 'center', gap: 5
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706' }} />
                        Diesel / Gasoil — Contingencia Institucional
                      </div>
                      {renderSection(dieselItems, '#d97706', '#7c3aed')}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ══ INVENTORY SECTION TITLE ══ */}
          <div style={{ background: '#002f6c', color: '#ffffff', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 6, textAlign: 'center', marginBottom: 8 }}>
            Estado del Inventario (Visualización Compleja)
          </div>

          {/* ══ INVENTORY SVG PLOT ══ */}
          {renderComplexInventoryChart()}


          {/* ══ FOOTER BRANDING ══ */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
            background: '#8b2c20',
            color: '#ffffff',
            fontWeight: 800, fontSize: 10,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '5px 32px',
            borderRadius: '8px 8px 0 0',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap'
          }}>
            Control Combustible Dptos
          </div>
        </div>
      </div>

      {/* ══ EDIT ESTACION MODAL ══ */}
      {editingEstacion && (
        <div
          onClick={() => setEditingEstacion(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,10,30,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '24px 28px',
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              border: '3px solid #e25b44',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 15, color: '#002060', textTransform: 'uppercase', marginBottom: 16 }}>
              Editar E/S {editingEstacion.estacion}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Nombre de Estación
              </label>
              <input
                type="text"
                value={estName}
                onChange={e => setEstName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Inventario Gasolina (Lts)
              </label>
              <input
                type="number"
                value={estGas}
                onChange={e => setEstGas(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Inventario Diesel (Lts)
              </label>
              <input
                type="number"
                value={estDie}
                onChange={e => setEstDie(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveEstacion}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(90deg, #003a75, #001c3a)', color: '#f5b025', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingEstacion(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#f1f5f9', color: '#475569', border: '2px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT CONSUMO MODAL ══ */}
      {editingConsumo && (
        <div
          onClick={() => setEditingConsumo(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,10,30,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 20,
              padding: '24px 28px',
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
              border: '3px solid #e25b44',
              fontFamily: "'Outfit', sans-serif"
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 14, color: '#002060', textTransform: 'uppercase', marginBottom: 16 }}>
              Editar Consumo: {editingConsumo.tipoCombustible?.toUpperCase()}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Nombre Institución
              </label>
              <input
                type="text"
                value={instName}
                onChange={e => setInstName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Litros Asignados
              </label>
              <input
                type="number"
                value={instLitros}
                onChange={e => setInstLitros(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#002060', textTransform: 'uppercase', marginBottom: 4 }}>
                Unidades Vehiculares
              </label>
              <input
                type="number"
                value={instUnidades}
                onChange={e => setInstUnidades(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '2px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveConsumo}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(90deg, #003a75, #001c3a)', color: '#f5b025', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12 }}
              >
                Guardar
              </button>
              <button
                onClick={() => setEditingConsumo(null)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: '#f1f5f9', color: '#475569', border: '2px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', fontSize: 12 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
