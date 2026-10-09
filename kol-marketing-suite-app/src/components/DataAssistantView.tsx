import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Share2,
} from 'lucide-react';

export const DataAssistantView: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState('q4_2026');
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGenerateReport = () => {
    setGenerating(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setGenerating(false);
      setDownloadSuccess(true);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Generación Programada & Auditoría
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Asistente de Reportes y Datos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidado de métricas publicitarias de Google Ads, Meta Ads y auditoría de directivas de marca KOL.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {generating ? 'Consolidando Datos...' : 'Exportar Reporte Ejecutivo'}
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Reporte consolidado listo para descarga: <strong>Informe_Franquicias_KOL_Q4.pdf</strong></span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccess(false)}
            className="text-emerald-400 hover:text-white font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Configuración del Reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Parámetros del Reporte
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Período a evaluar
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="q4_2026">Q4 2026 (Octubre - Diciembre actual)</option>
                <option value="september_2026">Septiembre 2026</option>
                <option value="annual_2026">Consolidado Anual 2026</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block">Fuentes integradas:</span>
              <p>✓ Google Ads API (Campañas Search & Display)</p>
              <p>✓ Meta Graph API (Instagram & Facebook Lead Ads)</p>
              <p>✓ Microsoft Clarity (Mapas de calor en landing kolaccesorios.com)</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Auditoría de Cumplimiento de Marca
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Dominio verificado en 100% de creativos</span>
                <p className="text-slate-400 mt-0.5">kolaccesorios.com auditado sin desvíos.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Consistencia de fee inicial</span>
                <p className="text-slate-400 mt-0.5">US$ 3.000 informado sin ambigüedades.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Red de 10 locales operativos</span>
                <p className="text-slate-400 mt-0.5">Foco interior del país respetado.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
