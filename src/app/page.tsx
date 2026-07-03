'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Info,
  Map,
  BarChart4
} from 'lucide-react';
import { RutaTransporte } from '../types';
import { mockRutas } from '../data/mockData';
import { parseExcelOrCSV } from '../utils/parser';
import { RutasDashboard } from '../components/RutasDashboard';

export default function Home() {
  // Page States
  const [rutasData, setRutasData] = useState<RutaTransporte[]>([]);

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [fileSuccess, setFileSuccess] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // UI Loading State
  const [isExporting, setIsExporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle multiple files parsing and state assignment/merging
  const handleFilesProcess = async (files: File[]) => {
    setFileError(null);
    setFileSuccess(null);

    // Detect mock data and clear it to prevent merging mock data with uploaded Excel files
    const hasMockRutas = rutasData.some(r => r.cooperativa && r.cooperativa.includes("SAN JOSE DE CARAYACA"));

    let activeRutas = hasMockRutas ? [] : [...rutasData];

    let parsedCount = 0;
    const errors: string[] = [];
    const summary: string[] = [];

    // Process all files
    for (const file of files) {
      try {
        const result = await parseExcelOrCSV(file);
        
        let parsedRutas = false;

        if (result.rutas && result.rutas.length > 0) {
          const incoming: RutaTransporte[] = result.rutas;
          const merged: Record<number, RutaTransporte> = {};
          activeRutas.forEach(r => { merged[r.id] = r; });
          incoming.forEach(r => { merged[r.id] = r; });
          activeRutas = (Object.values(merged) as RutaTransporte[]).sort((a, b) => a.id - b.id);
          setRutasData(activeRutas);
          summary.push(`• ${file.name}: +${incoming.length} rutas de transporte`);
          parsedRutas = true;
        }

        if (parsedRutas) {
          parsedCount++;
        }
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`);
      }
    }

    if (summary.length > 0) {
      setFileSuccess(`Se procesaron con éxito ${parsedCount} archivo(s):\n${summary.join('\n')}`);
    }
    if (errors.length > 0) {
      setFileError(`Errores al procesar algunos archivos:\n${errors.join('\n')}`);
    }

    // Reset input value so same files can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Input file change handler (supports multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesProcess(Array.from(e.target.files));
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcess(Array.from(e.dataTransfer.files));
    }
  };

  // Reset to default mock data
  const handleResetData = () => {
    setRutasData(mockRutas);
    setFileSuccess("Los datos han sido restablecidos a los valores por defecto del Estado La Guaira.");
    setFileError(null);
  };

  // PNG Export capturing
  const handleExportPNG = () => {
    const element = document.getElementById('informe-rutas');
    
    if (!element) {
      setFileError("No se encontró el contenedor del reporte actual para exportar.");
      return;
    }

    setIsExporting(true);

    // Capture using html-to-image toPng
    // pixelRatio: 2 provides high definition retina-sharp outputs
    toPng(element, { 
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        width: element.offsetWidth + 'px',
        height: element.offsetHeight + 'px'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `reporte-rutas-la-guaira-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
        setIsExporting(false);
      })
      .catch((err) => {
        console.error("Error generating high-definition image:", err);
        setFileError(`Fallo al exportar reporte en alta definición: ${err.message}`);
        setIsExporting(false);
      });
  };

  return (
    <main className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col items-center py-8 px-4 md:px-8">
      <div className="w-full max-w-6xl flex flex-col gap-6">
        
        {/* Banner Superior Principal de la Aplicación (Light Theme) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-300 pb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#002d62] flex items-center gap-2">
              SISTEMA INTEGRAL DE AUTOMATIZACIÓN DE REPORTES
            </h1>
            <p className="text-slate-600 text-xs md:text-sm font-bold tracking-wide uppercase mt-1">
              Secretaría de Transporte y Dirección de Distribución de Combustible • Estado La Guaira
            </p>
          </div>
          
          <button 
            onClick={handleResetData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold transition-all shadow-sm"
            title="Restablecer base de datos inicial"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restablecer Valores Ficticios
          </button>
        </div>

        {/* Zona Lector de Excel Inteligente (Light Theme) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all-300 relative overflow-hidden ${
            isDragging 
              ? 'border-yellow-500 bg-yellow-500/5 glow-gold scale-[1.01]' 
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv" 
            multiple
            className="hidden" 
          />

          <div className="p-4 rounded-full bg-slate-50 border border-slate-200 text-slate-500 mb-3 shadow-inner">
            <Upload className="w-7 h-7 text-[#003066] animate-bounce" />
          </div>

          <h2 className="text-sm font-bold text-[#002d62] tracking-wide uppercase">
            Arrastra y suelta tu archivo Excel (.xlsx) o CSV aquí
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed font-medium">
            El sistema detectará el esquema automáticamente. Admite columnas de transporte (<span className="text-yellow-600 font-extrabold">ruta, unidades</span>), 
            litros institucionales (<span className="text-yellow-600 font-extrabold">institucion, litros</span>), o inventario de E/S (<span className="text-yellow-600 font-extrabold">estaciones, gasolina, diesel</span>).
          </p>

          <div className="flex gap-4 mt-4 flex-wrap justify-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 shadow-sm">
              <FileText className="w-3 h-3 text-slate-500" />
              Soporta .XLSX / .XLS
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 shadow-sm">
              <FileText className="w-3 h-3 text-slate-500" />
              Soporta .CSV delimitado
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-200 shadow-sm">
              <Info className="w-3 h-3 text-slate-500" />
              Procesamiento 100% en Cliente
            </span>
          </div>
        </div>

        {/* Notificaciones y Alertas de Archivo */}
        {fileSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 text-slate-800 shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-extrabold uppercase block text-emerald-600">Procesamiento Exitoso</span>
              <p className="mt-0.5 font-semibold leading-relaxed">{fileSuccess}</p>
            </div>
            <button 
              onClick={() => setFileSuccess(null)}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-800"
            >
              Cerrar
            </button>
          </div>
        )}

        {fileError && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-slate-800 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-extrabold uppercase block text-red-600">Error de Procesamiento</span>
              <p className="mt-0.5 font-semibold leading-relaxed">{fileError}</p>
            </div>
            <button 
              onClick={() => setFileError(null)}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-800"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Barra de Herramientas: Botón de Captura PNG */}
        <div className="flex justify-end bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          {/* Botón Global de Exportación PNG */}
          <button 
            onClick={handleExportPNG}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md ${
              isExporting 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 hover:scale-[1.02] active:scale-[0.98] glow-gold'
            }`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Capturando Reporte HD...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportar Reporte Actual en PNG
              </>
            )}
          </button>
        </div>

        {/* Contenedor del Reporte Activo (Se renderiza directamente) */}
        <div className="w-full transition-all duration-300">
          <RutasDashboard
            rutas={rutasData}
            onRutaUpdate={(updated) =>
              setRutasData(prev => prev.map(r => r.id === updated.id ? updated : r))
            }
          />
        </div>
      </div>
    </main>
  );
}
