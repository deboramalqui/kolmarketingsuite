import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const PredictiveAnalyticsView: React.FC = () => {
  const [budgetSim, setBudgetSim] = useState(3000);

  // Simulación predictiva basada en los CPL actuales de KOL
  const estimatedMetaLeads = Math.round((budgetSim * 0.45) / 10.77);
  const estimatedSearchLeads = Math.round((budgetSim * 0.45) / 11.07);
  const estimatedDisplayLeads = Math.round((budgetSim * 0.1) / 16.31);
  const totalEstimatedLeads = estimatedMetaLeads + estimatedSearchLeads + estimatedDisplayLeads;
  const avgCpl = (budgetSim / totalEstimatedLeads).toFixed(2);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Machine Learning & Modelos Predictivos
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Analítica Predictiva de Adquisición
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulación de conversiones de franquicias y distribución óptima de inversión entre Google Search, Meta Ads y Display.
          </p>
        </div>
      </div>

      {/* Simulador de Inversión */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Simulador de Presupuesto Mensual
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajustá la inversión total para predecir el volumen estimado de inversores contactados.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block uppercase font-mono">Presupuesto Simulado</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              US$ {budgetSim.toLocaleString()}
            </span>
          </div>
        </div>

        <input
          type="range"
          min="1000"
          max="15000"
          step="500"
          value={budgetSim}
          onChange={(e) => setBudgetSim(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
        />

        {/* Tarjetas de Proyección */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">Total Leads Estimados</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {totalEstimatedLeads} inversores
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +14.2% vs mes anterior
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block">CPL Promedio Estimado</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">
              US$ {avgCpl}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              En rango benchmark (US$ 10-13)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-purple-400 block">Meta Ads (IG & FB)</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {estimatedMetaLeads} leads
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              US$ {(budgetSim * 0.45).toFixed(0)} asignados
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-blue-400 block">Google Search</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {estimatedSearchLeads} leads
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              US$ {(budgetSim * 0.45).toFixed(0)} asignados
            </span>
          </div>
        </div>
      </div>

      {/* Reglas de negocio validadas */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Premisas Comerciales de Modelado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-white block">Tasa de Cierre de Franquicia</span>
            <p className="text-slate-400 mt-1">
              Estimada en 1.5% a 2.2% sobre leads calificados tras reunión de dossier informativo.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-white block">Derecho Inicial Fijo</span>
            <p className="text-slate-400 mt-1">
              US$ 3.000 constante sin modificaciones estacionales. 0% de regalías contractuales.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-white block">Capilaridad Geográfica</span>
            <p className="text-slate-400 mt-1">
              Foco en plazas del interior con 10 locales operativos (Rosario, Córdoba, Mendoza, San Juan).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
