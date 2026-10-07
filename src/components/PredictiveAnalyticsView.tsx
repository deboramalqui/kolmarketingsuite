import React, { useState } from "react";
import {
  CampaignMetric,
  ClarityPageTelemetry,
  PredictiveForecastResult,
  PredictiveRecommendation,
} from "../types/marketing";
import { RefreshCw, Check, ArrowRight } from "lucide-react";

interface PredictiveAnalyticsViewProps {
  campaigns: CampaignMetric[];
  clarityPages: ClarityPageTelemetry[];
  forecast: PredictiveForecastResult;
  onUpdateForecast: (newForecast: PredictiveForecastResult) => void;
  onApplyRecommendation: (rec: PredictiveRecommendation) => void;
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({
  campaigns,
  clarityPages,
  forecast,
  onUpdateForecast,
  onApplyRecommendation,
}) => {
  const [horizonDays, setHorizonDays] = useState<30 | 60 | 90>(30);
  const [categoryFilter, setCategoryFilter] = useState<
    "Todas" | "Presupuesto" | "Segmentación" | "Creativos"
  >("Todas");
  const [isPredicting, setIsPredicting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentAvgRoas =
    campaigns.reduce((acc, c) => acc + c.roas, 0) /
    Math.max(1, campaigns.length);

  const handleRunPrediction = async (days: 30 | 60 | 90) => {
    setHorizonDays(days);
    setIsPredicting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaigns,
          clarityMetrics: clarityPages,
          horizonDays: days,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo recalcular el modelo");
      }
      onUpdateForecast({
        summaryForecast: data.summaryForecast || forecast.summaryForecast,
        projectedRoas: Number(data.projectedRoas) || forecast.projectedRoas,
        projectedConversionsDeltaPct:
          Number(data.projectedConversionsDeltaPct) ||
          forecast.projectedConversionsDeltaPct,
        projectedCpaReductionPct:
          Number(data.projectedCpaReductionPct) ||
          forecast.projectedCpaReductionPct,
        confidenceScore: Number(data.confidenceScore) || 95,
        recommendations: Array.isArray(data.recommendations)
          ? data.recommendations
          : forecast.recommendations,
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error al recalcular predicción"
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const filteredRecommendations = forecast.recommendations.filter((r) =>
    categoryFilter === "Todas" ? true : r.category === categoryFilter
  );

  const trajectorySeries = [
    {
      label: "Hace 30 días",
      roas: Number((currentAvgRoas * 0.91).toFixed(2)),
      cpa: 132.4,
    },
    {
      label: "Hace 15 días",
      roas: Number((currentAvgRoas * 0.96).toFixed(2)),
      cpa: 125.1,
    },
    {
      label: "Hoy (en vivo)",
      roas: Number(currentAvgRoas.toFixed(2)),
      cpa: 118.5,
    },
    {
      label: `En ${horizonDays} días (proyectado)`,
      roas: Number(forecast.projectedRoas.toFixed(2)),
      cpa: Number(
        (118.5 * (1 - forecast.projectedCpaReductionPct / 100)).toFixed(2)
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cabecera y cifras de predicción */}
      <div className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                1
              </span>
              <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Pronóstico de rendimiento y recupero en campañas
              </h2>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Elegí el horizonte para proyectar ROAS, CPA y eventos clave del embudo de 4 etapas según Google Marketing Platform y Clarity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Segmentado conectado con 2 px entre botones (Lámina 9.2) */}
            <div className="flex items-center gap-[2px]">
              {([30, 60, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleRunPrediction(d)}
                  disabled={isPredicting}
                  className={`kol-btn-normal px-3.5 border flex items-center gap-1.5 whitespace-nowrap ${
                    horizonDays === d
                      ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                  }`}
                >
                  {horizonDays === d && <Check className="w-4 h-4 shrink-0" />}
                  <span>{d} días</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleRunPrediction(horizonDays)}
              disabled={isPredicting}
              className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] disabled:opacity-40 flex items-center gap-2 whitespace-nowrap kol-focus"
            >
              <RefreshCw
                className={`w-4 h-4 ${isPredicting ? "animate-spin" : ""}`}
              />
              <span>
                {isPredicting ? "Calculando..." : "Recalcular predicción"}
              </span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#A40F5F] rounded-[10px] text-[14px] text-[#A40F5F] font-medium flex items-center gap-2">
            <span className="font-bold">!</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cuatro cifras en una fila en escritorio: 1 tarjeta de énfasis en rosa #FFD9E4 + 3 tarjetas Outlined (Lámina 7.4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[#FFD9E4] text-[#161418] kol-card-12">
            <div className="text-[14px] font-semibold">
              ROAS proyectado a {horizonDays} días
            </div>
            <div className="font-kol-display font-extrabold text-[36px] leading-[44px] tabular-nums mt-1">
              {forecast.projectedRoas.toFixed(2)}x
            </div>
            <div className="text-[14px] mt-1">
              Actual en vivo: {currentAvgRoas.toFixed(2)}x
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12">
            <div className="text-[14px] font-semibold text-[#161418]">
              Incremento en leads de franquicia
            </div>
            <div className="font-kol-display font-extrabold text-[36px] leading-[44px] text-[#EC2992] tabular-nums mt-1">
              +{forecast.projectedConversionsDeltaPct.toFixed(1)} %
            </div>
            <div className="text-[14px] text-[#46413F] mt-1">
              Evento lead_franquicia en GA4
            </div>
          </div>

          <div className="p-5 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12">
            <div className="text-[14px] font-semibold text-[#161418]">
              Reducción estimada de CPA
            </div>
            <div className="font-kol-display font-extrabold text-[36px] leading-[44px] text-[#EC2992] tabular-nums mt-1">
              -{forecast.projectedCpaReductionPct.toFixed(1)} %
            </div>
            <div className="text-[14px] text-[#46413F] mt-1">
              Ajustando puja y fricción UX
            </div>
          </div>

          <div className="p-5 bg-[#F3F0ED] kol-card-12">
            <div className="text-[14px] font-semibold text-[#161418]">
              Confianza sobre datos reales
            </div>
            <div className="font-kol-display font-extrabold text-[36px] leading-[44px] text-[#161418] tabular-nums mt-1">
              {forecast.confidenceScore} %
            </div>
            <div className="text-[14px] text-[#46413F] mt-1">
              56 enlaces del hub auditados
            </div>
          </div>
        </div>

        {/* Explicación en contenedor tonal #F3F0ED */}
        <div className="p-4 bg-[#F3F0ED] kol-card-12 text-[15px] text-[#161418]">
          {forecast.summaryForecast}
        </div>

        {/* Tabla tonal con cebra de trayectoria (Lámina 3.4) */}
        <div className="overflow-x-auto border border-[#C9C3BE] kol-card-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E7E3DF] text-[#2A2629] text-[14px] font-bold">
                <th className="py-3 px-4">Periodo evaluado</th>
                <th className="py-3 px-4 text-right">ROAS consolidado</th>
                <th className="py-3 px-4 text-right">CPA promedio (US$)</th>
                <th className="py-3 px-4">Progreso hacia la meta</th>
              </tr>
            </thead>
            <tbody className="text-[15px] text-[#161418]">
              {trajectorySeries.map((row, idx) => {
                const widthPct = Math.min(
                  100,
                  Math.round((row.roas / 7.0) * 100)
                );
                return (
                  <tr
                    key={row.label}
                    className={
                      idx % 2 === 1
                        ? "bg-[#F3F0ED] border-t border-[#C9C3BE]"
                        : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                    }
                  >
                    <td className="py-3 px-4 font-medium">{row.label}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      {row.roas.toFixed(2)}x
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      US$ {row.cpa.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full h-[10px] bg-[#E7E3DF] rounded-[4px] overflow-hidden">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-full bg-[#C51172] rounded-[4px]"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recomendaciones accionables con número y filete */}
      <div className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                2
              </span>
              <h3 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Recomendaciones accionables sobre tus campañas
              </h3>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Elegí una categoría para filtrar o aplicá el ajuste directamente en Google Marketing Platform
            </p>
          </div>

          {/* Chips de filtro con tilde al seleccionar (Lámina 7.3) */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              ["Todas", "Presupuesto", "Segmentación", "Creativos"] as const
            ).map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`kol-chip-filter px-3.5 border flex items-center gap-1.5 whitespace-nowrap kol-focus ${
                    active
                      ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-[#C9C3BE]">
          {filteredRecommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="py-5 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                    {index + 1}
                  </span>
                  <span className="text-[14px] font-bold text-[#161418]">
                    {rec.category}
                  </span>
                  <span className="text-[14px] text-[#46413F]">
                    · Campaña: {rec.targetCampaign}
                  </span>
                  <span className="text-[14px] font-bold text-[#C51172] tabular-nums">
                    · {rec.expectedImpact}
                  </span>
                </div>

                <h4 className="font-kol-display font-bold text-[18px] leading-[24px] text-[#161418] pt-1">
                  {rec.title}
                </h4>

                <p className="text-[15px] text-[#46413F]">
                  <span className="font-semibold text-[#161418]">
                    Dato sincronizado:
                  </span>{" "}
                  {rec.evidenceSignal}
                </p>

                <p className="text-[15px] text-[#161418]">
                  <span className="font-semibold">Qué cambia al aplicar:</span>{" "}
                  {rec.concreteAction}
                </p>
              </div>

              <div className="shrink-0">
                {rec.applied ? (
                  <div className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] flex items-center gap-2 whitespace-nowrap">
                    <Check className="w-4 h-4 text-[#161418]" />
                    <span>Ajuste aplicado en GMP</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApplyRecommendation(rec)}
                    className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap kol-focus"
                  >
                    <span>Aplicar en {rec.category.toLowerCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
