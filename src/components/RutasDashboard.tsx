import React, { useState } from 'react';
import Image from 'next/image';
import { RutaTransporte } from '../types';

interface RutasDashboardProps {
  rutas: RutaTransporte[];
  onRutasChange: (updated: RutaTransporte[]) => void;
}



/* ─── Map pin coordinates (viewBox 0 0 760 200) ─── 
   Expanded list of coordinates to map route IDs up to 40 along the La Guaira coastline
─── */
const PINS = [
  { n: '1',  x: 80,  y: 130 },
  { n: '2',  x: 120, y: 115 },
  { n: '3',  x: 130, y: 125 },
  { n: '4',  x: 170, y: 105 },
  { n: '5',  x: 140, y: 110 },
  { n: '6',  x: 215, y: 95  },
  { n: '7',  x: 185, y: 145 },
  { n: '8',  x: 232, y: 92  },
  { n: '9',  x: 240, y: 102 },
  { n: '10', x: 250, y: 88  },
  { n: '11', x: 255, y: 98  },
  { n: '12', x: 260, y: 108 },
  { n: '13', x: 265, y: 118 },
  { n: '14', x: 280, y: 90  },
  { n: '15', x: 286, y: 94  },
  { n: '16', x: 364, y: 80  },
  { n: '17', x: 375, y: 88  },
  { n: '18', x: 380, y: 98  },
  { n: '19', x: 390, y: 76  },
  { n: '20', x: 474, y: 80  },
  { n: '21', x: 500, y: 80  },
  { n: '22', x: 510, y: 81  },
  { n: '23', x: 520, y: 82  },
  { n: '24', x: 540, y: 84  },
  { n: '25', x: 560, y: 84  },
  { n: '26', x: 608, y: 64  },
  { n: '27', x: 620, y: 70  },
  { n: '28', x: 630, y: 72  },
  { n: '29', x: 650, y: 74  },
  { n: '30', x: 670, y: 82  },
  { n: '31', x: 690, y: 80  },
  { n: '32', x: 710, y: 80  },
  { n: '33', x: 584, y: 68  },
  { n: '34', x: 590, y: 72  },
  { n: '35', x: 600, y: 74  },
  { n: '36', x: 610, y: 76  },
  { n: '37', x: 620, y: 78  },
  { n: '38', x: 630, y: 80  },
  { n: '39', x: 640, y: 82  },
  { n: '40', x: 650, y: 84  },
];

export const RutasDashboard: React.FC<RutasDashboardProps> = ({ rutas, onRutasChange }) => {
  // ── Sorting Mode State ──
  const [sortMode, setSortMode] = useState<'id' | 'unidades' | 'nombre' | 'manual'>('manual');

  // ── Edit Modal State ──
  const [editingRuta, setEditingRuta] = useState<RutaTransporte | null>(null);
  const [formRuta, setFormRuta] = useState('');
  const [formUnidades, setFormUnidades] = useState(0);
  const [formCoop, setFormCoop] = useState('');

  // ── Add Modal State ──
  const [addingRuta, setAddingRuta] = useState(false);
  const [addId, setAddId] = useState(0);
  const [addRuta, setAddRuta] = useState('');
  const [addUnidades, setAddUnidades] = useState(0);
  const [addCoop, setAddCoop] = useState('');

  // ── Drag & Drop State ──
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Dynamic sorting function
  const getSortedRutas = () => {
    const arr = [...rutas];
    if (sortMode === 'id') {
      return arr.sort((a, b) => a.id - b.id);
    } else if (sortMode === 'unidades') {
      return arr.sort((a, b) => b.unidades - a.unidades);
    } else if (sortMode === 'nombre') {
      return arr.sort((a, b) => a.ruta.localeCompare(b.ruta));
    }
    return arr; // 'manual' / natural order
  };

  const sortedRutas = getSortedRutas();

  // Split routes list dynamically and evenly into two columns
  const midPoint = Math.ceil(sortedRutas.length / 2);
  const leftCol = sortedRutas.slice(0, midPoint);
  const rightCol = sortedRutas.slice(midPoint);

  // Totals calculations based strictly on parsed data
  const totalRutas = sortedRutas.length;
  const totalUnidades = sortedRutas.reduce((s, r) => s + r.unidades, 0);

  // Open edit modal
  const openEdit = (ruta: RutaTransporte) => {
    setEditingRuta(ruta);
    setFormRuta(ruta.ruta);
    setFormUnidades(ruta.unidades);
    setFormCoop(ruta.cooperativa);
  };

  // Save edited route
  const saveEdit = () => {
    if (!editingRuta) return;
    const updated = {
      ...editingRuta,
      ruta: formRuta.trim().toUpperCase(),
      unidades: Math.max(0, Number(formUnidades) || 0),
      cooperativa: formCoop.trim() || "LÍNEA / COOPERATIVA INDEPENDIENTE",
    };
    onRutasChange(rutas.map(r => r.id === updated.id ? updated : r));
    setEditingRuta(null);
  };

  const cancelEdit = () => setEditingRuta(null);

  // Delete route
  const deleteRuta = (id: number) => {
    onRutasChange(rutas.filter(r => r.id !== id));
  };

  // Open add route modal
  const getNextId = () => {
    if (rutas.length === 0) return 1;
    return Math.max(...rutas.map(r => r.id)) + 1;
  };

  const openAddModal = () => {
    setAddId(getNextId());
    setAddRuta('');
    setAddUnidades(0);
    setAddCoop('');
    setAddingRuta(true);
  };

  // Save new route
  const saveAdd = () => {
    if (rutas.some(r => r.id === Number(addId))) {
      alert(`El ID ${addId} ya está siendo usado por otra ruta.`);
      return;
    }
    if (!addRuta.trim()) {
      alert("El nombre de la ruta no puede estar vacío.");
      return;
    }
    const newRuta: RutaTransporte = {
      id: Number(addId),
      ruta: addRuta.trim().toUpperCase(),
      unidades: Math.max(0, Number(addUnidades) || 0),
      cooperativa: addCoop.trim() || "LÍNEA / COOPERATIVA INDEPENDIENTE",
    };
    onRutasChange([...rutas, newRuta]);
    setAddingRuta(false);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...sortedRutas];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);

    setSortMode('manual');
    onRutasChange(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Manual move helper
  const moveItem = (fromIndex: number, direction: number) => {
    const targetIndex = fromIndex + direction;
    if (targetIndex < 0 || targetIndex >= sortedRutas.length) return;

    const updated = [...sortedRutas];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, removed);

    setSortMode('manual');
    onRutasChange(updated);
  };

  /* ─── Single route pill ─── */
  const Pill = ({ ruta, index }: { ruta: RutaTransporte; index: number }) => {
    const isBlue = [6, 17, 20, 21, 23, 26].includes(ruta.id);
    const gold = !isBlue;
    
    const isDragged = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        draggable={true}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => openEdit(ruta)}
        title="Haz clic para editar esta ruta. Arrástrala para reordenar."
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: isDragOver 
            ? 'linear-gradient(90deg, #004d99 0%, #002d59 100%)'
            : 'linear-gradient(90deg, #003a75 0%, #001c3a 100%)',
          borderRadius: 999,
          padding: '4px 12px 4px 4px',
          marginBottom: 5,
          minHeight: 46,
          border: isDragOver ? '2px solid #f5b025' : '1.5px solid #002a58',
          boxShadow: isDragOver ? '0 5px 18px rgba(245,176,37,0.45)' : '0 3px 7px rgba(0,0,0,0.35)',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'grab',
          opacity: isDragged ? 0.4 : 1,
          transform: isDragOver ? 'scale(1.025)' : 'scale(1)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease',
        }}
        onMouseEnter={e => {
          if (!isDragOver) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.015)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 5px 18px rgba(245,176,37,0.35)';
            (e.currentTarget as HTMLDivElement).style.borderColor = '#f5b025';
          }
        }}
        onMouseLeave={e => {
          if (!isDragOver) {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 3px 7px rgba(0,0,0,0.35)';
            (e.currentTarget as HTMLDivElement).style.borderColor = '#002a58';
          }
        }}
      >
        {/* Number circle */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: gold ? '#f5b025' : '#002d6e',
          color: gold ? '#140d00' : '#ffffff',
          border: '2px solid #ffffff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 13,
          boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {ruta.id}
        </div>
        {/* Text */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            color: '#ffffff', fontWeight: 800, fontSize: 10.5,
            textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.25,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {ruta.ruta}
          </div>
          <div style={{
            color: '#f5b025', fontWeight: 900, fontSize: 10,
            letterSpacing: '0.03em',
            fontFamily: "'Outfit', sans-serif",
          }}>
            [{ruta.unidades} {ruta.unidades === 1 ? 'Unidad' : 'Unidades'}]
          </div>
          <div style={{
            color: '#7dc8f0', fontWeight: 700, fontSize: 8.5,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: "'Outfit', sans-serif",
          }}>
            {ruta.cooperativa}
          </div>
        </div>
        {/* Actions panel */}
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            padding: '2px 4px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              moveItem(index, -1);
            }}
            disabled={index === 0}
            style={{
              background: 'none', border: 'none', 
              color: index === 0 ? 'rgba(255,255,255,0.15)' : '#f5b025',
              cursor: index === 0 ? 'not-allowed' : 'pointer', 
              fontSize: 10, padding: '2px', fontWeight: 'bold'
            }}
            title="Subir ruta"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              moveItem(index, 1);
            }}
            disabled={index === sortedRutas.length - 1}
            style={{
              background: 'none', border: 'none', 
              color: index === sortedRutas.length - 1 ? 'rgba(255,255,255,0.15)' : '#f5b025',
              cursor: index === sortedRutas.length - 1 ? 'not-allowed' : 'pointer', 
              fontSize: 10, padding: '2px', fontWeight: 'bold'
            }}
            title="Bajar ruta"
          >
            ▼
          </button>
          <span 
            onClick={() => openEdit(ruta)}
            style={{ 
              fontSize: 9, 
              color: 'rgba(255,255,255,0.6)', 
              cursor: 'pointer',
              marginLeft: 2,
              padding: '2px'
            }}
            title="Editar ruta"
          >
            ✏️
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        {/* ══ OUTER CARD ══ */}
      <div
        id="informe-rutas"
        style={{
          width: '100%',
          maxWidth: 800,
          background: '#ffffff',
          borderRadius: 28,
          border: '4px solid #e25b44',
          outline: '2px solid #002f6c',
          outlineOffset: -10,
          padding: '6px 18px 44px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          position: 'relative',
          backgroundImage:
            'linear-gradient(rgba(180,205,230,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(180,205,230,0.18) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          fontFamily: "'Outfit', Arial, sans-serif",
        }}
      >

        {/* ══ HEADER BANNER ══ */}
        <div style={{
          position: 'relative',
          marginBottom: 0,
          borderRadius: 999,
          background: '#f5b025',      /* gold outer ring */
          padding: '2.5px',
          boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {/* Inner dark panel */}
          <div style={{
            background: 'linear-gradient(92deg, #003571 0%, #001d3e 80%)',
            borderRadius: 999,
            padding: '10px 60px 10px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)',
          }}>
            {/* REAL LOGO */}
             <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden',
              border: '2px solid white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Image
                src="/logo.jpg"
                alt="Gobernación Bolivariana de La Guaira"
                width={64}
                height={64}
                style={{ objectFit: 'cover', borderRadius: '50%' }}
              />
            </div>

            {/* Title text */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                fontWeight: 900, fontSize: 14.5,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                lineHeight: 1.3, color: '#ffffff',
                fontFamily: "'Outfit', sans-serif",
              }}>
                <span style={{ color: '#f5b025' }}>ESTADO LA GUAIRA: </span>
                SITUACIÓN DE LAS UNIDADES DE TRANSPORTE PÚBLICO EN EL TERRITORIO
              </div>
            </div>
          </div>

          {/* Gold wedge on the right */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 48, background: '#f5b025',
            borderRadius: '0 999px 999px 0',
          }} />
        </div>

        {/* ══ COAST SVG MAP — High-fidelity vector path ══ */}
        <div style={{ width: '100%', marginBottom: 0, position: 'relative' }}>
          <svg viewBox="0 28 760 140" style={{ width: '100%', display: 'block' }}>
            {/* Faint cartographic lines */}
            <g stroke="#e25b44" strokeWidth="0.6" opacity="0.07" fill="none">
              <path d="M0,100 Q380,40 760,100" strokeDasharray="5 5"/>
              <path d="M0,100 Q380,160 760,100" strokeDasharray="5 5"/>
              <line x1="190" y1="0" x2="190" y2="200" strokeDasharray="3 3"/>
              <line x1="400" y1="0" x2="400" y2="200" strokeDasharray="3 3"/>
              <line x1="600" y1="0" x2="600" y2="200" strokeDasharray="3 3"/>
            </g>

            {/* Exact SVG trace of La Guaira State (red/coral) */}
            <path
              d="M 589.1,43.4 L 585.6,46.9 L 561.7,46.9 L 558.2,50.3 L 510.2,50.3 L 506.8,53.7 L 493.1,53.7 L 489.7,50.3 L 479.4,50.3 L 476.0,53.7 L 469.1,53.7 L 465.7,57.2 L 462.3,53.7 L 455.4,53.7 L 448.5,60.6 L 421.1,60.6 L 421.1,70.9 L 414.3,81.1 L 407.4,81.1 L 397.1,70.9 L 397.1,64.0 L 404.0,57.2 L 397.1,50.3 L 386.9,50.3 L 380.0,57.2 L 373.1,57.2 L 369.7,60.6 L 359.4,60.6 L 349.2,67.4 L 335.4,67.4 L 328.6,60.6 L 321.7,60.6 L 321.7,64.0 L 318.3,67.4 L 314.9,64.0 L 308.0,64.0 L 304.6,67.4 L 301.2,67.4 L 290.9,57.2 L 280.6,57.2 L 273.7,50.3 L 266.9,57.2 L 256.6,57.2 L 256.6,64.0 L 249.8,70.9 L 242.9,70.9 L 232.6,81.1 L 222.3,81.1 L 218.9,84.6 L 212.1,84.6 L 201.8,94.9 L 198.3,94.9 L 194.9,98.3 L 184.6,98.3 L 181.2,94.9 L 174.4,94.9 L 164.1,105.1 L 150.4,105.1 L 146.9,108.6 L 136.7,98.3 L 129.8,98.3 L 129.8,101.7 L 126.4,105.1 L 122.9,105.1 L 119.5,101.7 L 102.4,101.7 L 102.4,105.1 L 98.9,108.6 L 68.1,108.6 L 64.7,112.0 L 47.5,112.0 L 37.3,122.3 L 37.3,125.7 L 30.4,136.0 L 30.4,139.4 L 37.3,146.3 L 37.3,149.7 L 40.7,149.7 L 44.1,153.1 L 44.1,156.6 L 246.3,156.6 L 249.8,153.1 L 249.8,142.8 L 253.2,139.4 L 253.2,136.0 L 260.0,129.1 L 266.9,129.1 L 270.3,125.7 L 270.3,115.4 L 277.2,108.6 L 287.5,108.6 L 297.7,115.4 L 308.0,115.4 L 311.5,118.9 L 321.7,118.9 L 325.2,115.4 L 332.0,115.4 L 335.4,112.0 L 338.9,112.0 L 352.6,122.3 L 366.3,122.3 L 369.7,118.9 L 380.0,125.7 L 383.4,125.7 L 393.7,118.9 L 404.0,118.9 L 407.4,122.3 L 424.6,122.3 L 428.0,118.9 L 438.3,118.9 L 441.7,122.3 L 448.5,122.3 L 452.0,118.9 L 465.7,118.9 L 469.1,122.3 L 541.1,122.3 L 551.4,112.0 L 561.7,112.0 L 565.1,115.4 L 582.2,115.4 L 585.6,112.0 L 592.5,112.0 L 606.2,122.3 L 613.1,122.3 L 616.5,125.7 L 637.1,125.7 L 640.5,129.1 L 647.3,129.1 L 657.6,122.3 L 664.5,122.3 L 667.9,125.7 L 681.6,125.7 L 685.0,122.3 L 698.8,122.3 L 705.6,132.6 L 719.3,132.6 L 726.2,125.7 L 726.2,118.9 L 722.7,115.4 L 722.7,98.3 L 726.2,94.9 L 726.2,84.6 L 729.6,81.1 L 729.6,74.3 L 726.2,70.9 L 729.6,60.6 L 726.2,57.2 L 722.7,57.2 L 705.6,67.4 L 702.2,64.0 L 695.3,64.0 L 685.0,53.7 L 681.6,53.7 L 671.3,46.9 L 664.5,46.9 L 661.1,43.4 L 650.8,43.4 L 647.3,46.9 L 633.6,46.9 L 630.2,43.4 L 626.8,43.4 L 623.3,46.9 L 619.9,46.9 L 616.5,43.4 L 592.5,43.4 Z"
              fill="#e25b44"
              style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.45)) drop-shadow(0 2px 4px rgba(180,40,20,0.35)) drop-shadow(0 0px 1px rgba(0,0,0,0.5))' }}
            />

            {/* ── Gold numbered pins on top of map — filtered dynamically based on loaded routes ── */}
            {PINS.filter(p => sortedRutas.some(r => r.id === Number(p.n))).map((p, i) => (
              <g key={i}>
                {/* Drop shadow for visibility */}
                <circle cx={p.x} cy={p.y + 1} r={11} fill="rgba(0,0,0,0.25)"/>
                <circle cx={p.x} cy={p.y} r={11} fill="#eab308" stroke="white" strokeWidth="2"/>
                <text
                  x={p.x} y={p.y + 4}
                  textAnchor="middle"
                  style={{ fontSize: 8.5, fontWeight: 900, fill: '#1a0e00', pointerEvents: 'none', fontFamily: "'Outfit', sans-serif" }}
                >
                  {p.n}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* ══ TOOLBAR: SORT & ADD ROUTE ══ */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          background: 'rgba(0,47,108,0.04)',
          padding: '10px 16px',
          borderRadius: 16,
          border: '1.5px solid rgba(0,47,108,0.08)',
        }}>
          {/* Left side: Sort Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#002f6c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ordenar:
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['id', 'unidades', 'nombre', 'manual'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: '1.5px solid',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    background: sortMode === mode ? 'linear-gradient(90deg, #003a75 0%, #001c3a 100%)' : '#ffffff',
                    color: sortMode === mode ? '#f5b025' : '#002d62',
                    borderColor: sortMode === mode ? '#002a58' : '#cbd5e1',
                    boxShadow: sortMode === mode ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {mode === 'id' && '🔢 ID'}
                  {mode === 'unidades' && '🚍 Unidades'}
                  {mode === 'nombre' && '🔤 Nombre'}
                  {mode === 'manual' && '🎛️ Manual'}
                </button>
              ))}
            </div>
          </div>

          {/* Right side: Add Route Button */}
          <button
            type="button"
            onClick={openAddModal}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              background: 'linear-gradient(90deg, #f5b025 0%, #d99818 100%)',
              color: '#1a0e00',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 3px 8px rgba(245,176,37,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'transform 0.15s, opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.opacity = '0.95';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '1';
            }}
          >
            <span>➕</span> Agregar Ruta
          </button>
        </div>

        {/* Tip for manual mode */}
        {sortMode === 'manual' && sortedRutas.length > 0 && (
          <div style={{
            fontSize: 10.5,
            color: '#003b70',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: 'rgba(245,176,37,0.08)',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px dashed rgba(245,176,37,0.3)'
          }}>
            💡 Arrastra las tarjetas o usa las flechas (▲/▼) para organizar las rutas como desees.
          </div>
        )}

        {/* ══ ROUTE CARDS — 2 COLUMNS ══ */}
        {sortedRutas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            color: '#002d62',
            fontSize: '12.5px',
            fontWeight: 800,
            background: '#f1f5f9',
            borderRadius: 16,
            border: '2px dashed #002d62',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontFamily: "'Outfit', sans-serif",
          }}>
            Por favor, cargue un archivo Excel para poblar las rutas de transporte público en el mapa.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '0 16px',
            width: '100%',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {leftCol.map((r, i) => <Pill key={r.id} ruta={r} index={i} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              {rightCol.map((r, i) => <Pill key={r.id} ruta={r} index={midPoint + i} />)}
            </div>
          </div>
        )}

        {/* ══ TOTALS BOX ── aligned right ══ */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <div style={{
            border: '5px double #d97706',
            borderRadius: 14,
            padding: '10px 24px',
            background: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            textAlign: 'left',
            minWidth: 260,
          }}>
            <div style={{
              fontWeight: 900, fontSize: 16,
              color: '#002060', textTransform: 'uppercase',
              letterSpacing: '0.05em', lineHeight: 1.5,
              fontFamily: "'Outfit', sans-serif",
            }}>
              TOTAL DE UNIDADES: <span>{totalUnidades}</span>
            </div>
            <div style={{
              fontWeight: 900, fontSize: 16,
              color: '#002060', textTransform: 'uppercase',
              letterSpacing: '0.05em', lineHeight: 1.5,
              fontFamily: "'Outfit', sans-serif",
            }}>
              TOTAL DE RUTAS: <span>{totalRutas}</span>
            </div>
          </div>
        </div>

        {/* ══ FOOTER TAB ══ */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          background: '#8b2c20',
          color: '#ffffff',
          fontWeight: 800, fontSize: 10.5,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          padding: '5px 32px',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.18)',
          fontFamily: "'Outfit', sans-serif",
          whiteSpace: 'nowrap',
        }}>
          Actualización de Dptos
        </div>

      </div>
    </div>

    {/* ══ EDIT MODAL OVERLAY ══ */}
    {editingRuta && (
      <div
        onClick={cancelEdit}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,10,30,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '28px 32px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            border: '3px solid #e25b44',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: [6,17,20,21,23,26].includes(editingRuta.id) ? '#002d6e' : '#f5b025',
              color: [6,17,20,21,23,26].includes(editingRuta.id) ? '#fff' : '#1a0e00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 15,
              border: '2px solid #002060',
              flexShrink: 0,
            }}>
              {editingRuta.id}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#002060', textTransform: 'uppercase' }}>
                Editar Ruta {editingRuta.id}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Los cambios se reflejan en el reporte al instante
              </div>
            </div>
          </div>

          {/* Field: Nombre de Ruta */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Nombre de la Ruta
            </label>
            <input
              type="text"
              value={formRuta}
              onChange={e => setFormRuta(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#003a75'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Field: Unidades */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Unidades en Servicio
            </label>
            <input
              type="number"
              min={0}
              value={formUnidades}
              onChange={e => setFormUnidades(Number(e.target.value))}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#003a75'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Field: Cooperativa */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Línea / Cooperativa
            </label>
            <input
              type="text"
              value={formCoop}
              onChange={e => setFormCoop(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#003a75'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={saveEdit}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12,
                  background: 'linear-gradient(90deg, #003a75, #001c3a)',
                  color: '#f5b025', border: 'none',
                  fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.07em', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 4px 14px rgba(0,30,80,0.3)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                ✔ Guardar
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12,
                  background: '#f1f5f9',
                  color: '#475569', border: '2px solid #e2e8f0',
                  fontWeight: 800, fontSize: 13, textTransform: 'uppercase',
                  letterSpacing: '0.07em', cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
              >
                ✕ Cancelar
              </button>
            </div>

            <button
              onClick={() => {
                if (window.confirm(`¿Está seguro de que desea eliminar la ruta ${editingRuta.id}?`)) {
                  deleteRuta(editingRuta.id);
                  setEditingRuta(null);
                }
              }}
              style={{
                padding: '11px 0', borderRadius: 12,
                background: '#ef4444',
                color: '#ffffff', border: 'none',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                letterSpacing: '0.07em', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              🗑 Eliminar Ruta
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ══ ADD ROUTE MODAL OVERLAY ══ */}
    {addingRuta && (
      <div
        onClick={() => setAddingRuta(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,10,30,0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 20,
            padding: '28px 32px',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            border: '3px solid #f5b025',
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          {/* Modal header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#f5b025',
              color: '#1a0e00',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 15,
              border: '2px solid #002060',
              flexShrink: 0,
            }}>
              ➕
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#002060', textTransform: 'uppercase' }}>
                Agregar Nueva Ruta
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                Añada una nueva ruta al reporte y mapa interactivo
              </div>
            </div>
          </div>

          {/* Field: ID de Ruta */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              ID / Número de Ruta
            </label>
            <input
              type="number"
              min={1}
              value={addId}
              onChange={e => setAddId(Number(e.target.value))}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#f5b025'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Field: Nombre de Ruta */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Nombre de la Ruta
            </label>
            <input
              type="text"
              placeholder="E.j. CATIA LA MAR - CARAYACA"
              value={addRuta}
              onChange={e => setAddRuta(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#f5b025'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Field: Unidades */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Unidades en Servicio
            </label>
            <input
              type="number"
              min={0}
              value={addUnidades}
              onChange={e => setAddUnidades(Number(e.target.value))}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#f5b025'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Field: Cooperativa */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#002060', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Línea / Cooperativa
            </label>
            <input
              type="text"
              placeholder="E.j. COOP. SAN JOSE DE CARAYACA"
              value={addCoop}
              onChange={e => setAddCoop(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 14px', borderRadius: 10,
                border: '2px solid #cbd5e1', fontSize: 13, fontWeight: 700,
                color: '#1e293b', outline: 'none',
                fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#f5b025'}
              onBlur={e => e.target.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={saveAdd}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12,
                background: 'linear-gradient(90deg, #f5b025, #d99818)',
                color: '#1a0e00', border: 'none',
                fontWeight: 900, fontSize: 13, textTransform: 'uppercase',
                letterSpacing: '0.07em', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 14px rgba(245,176,37,0.3)',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              ✔ Agregar
            </button>
            <button
              onClick={() => setAddingRuta(false)}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 12,
                background: '#f1f5f9',
                color: '#475569', border: '2px solid #e2e8f0',
                fontWeight: 800, fontSize: 13, textTransform: 'uppercase',
                letterSpacing: '0.07em', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
