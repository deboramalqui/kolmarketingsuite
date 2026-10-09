import React, { useState } from 'react';
import { CampaignStudioView } from './components/CampaignStudioView';
import { PredictiveAnalyticsView } from './components/PredictiveAnalyticsView';
import { DataAssistantView } from './components/DataAssistantView';
import { KolLogo } from './components/KolLogo';
import {
  Megaphone,
  TrendingUp,
  FileSpreadsheet,
  Globe,
  ShieldCheck,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<'campanas' | 'predictive' | 'asistente'>('campanas');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* CABECERA (Header) */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Marca / Identidad */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shadow-inner">
              <KolLogo size={28} variant="oscuro" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  KOL
                </span>
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  Marketing Suite
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                Plataforma de Crecimiento & Franquicias
              </span>
            </div>
          </div>

          {/* Navegación Modular */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentModule('campanas')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'campanas'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Campañas & Creativos</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentModule('predictive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'predictive'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Analítica Predictiva</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentModule('asistente')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentModule === 'asistente'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Asistente de Datos</span>
            </button>
          </nav>

          {/* Estado de conexión / Dominio oficial */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-slate-300">kolaccesorios.com</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN MÓDULO */}
      <main className="flex-1 pb-16">
        {currentModule === 'campanas' && <CampaignStudioView />}
        {currentModule === 'predictive' && <PredictiveAnalyticsView />}
        {currentModule === 'asistente' && <DataAssistantView />}
      </main>

      {/* Footer minimalista */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>KOL Accesorios · Sistema de Gestión Publicitaria y Franquicias</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Directivas comerciales verificadas
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
