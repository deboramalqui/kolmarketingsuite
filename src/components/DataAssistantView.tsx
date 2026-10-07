import React, { useState } from "react";
import {
  AssistantChatMessage,
  BrandDesignGuidelines,
  CampaignMetric,
  ClarityPageTelemetry,
  CustomReport,
  ScheduledEmailReport,
  PredictiveRecommendation,
} from "../types/marketing";
import { Send, RefreshCw, ArrowUpRight, Check } from "lucide-react";

interface DataAssistantViewProps {
  messages: AssistantChatMessage[];
  onAddMessage: (msg: AssistantChatMessage) => void;
  campaigns: CampaignMetric[];
  clarityPages: ClarityPageTelemetry[];
  reports: CustomReport[];
  brandGuidelines: BrandDesignGuidelines;
  onCreateReportFromAi: (report: CustomReport) => void;
  onRequestDeleteReportFromAi: (identifier: string, reason?: string) => string;
  onCreateCampaignFromAi: (campaign: CampaignMetric) => void;
  onScheduleEmailFromAi: (schedule: ScheduledEmailReport) => void;
  onApplyRecommendationFromAi: (campaignName: string, actionType: string) => void;
  recommendations: PredictiveRecommendation[];
}

const SUGGESTED_PROMPTS = [
  "¿Qué canal trae más consultas?",
  "¿Dónde se cae la gente en el formulario?",
  "¿Qué buscan en Google antes de entrar?",
  "¿Qué página tiene más fricción? Mostrame las grabaciones",
  "¿Cuánto llevamos invertido por consulta?",
  "Explicame este número como si no supiera de marketing",
];

export const DataAssistantView: React.FC<DataAssistantViewProps> = ({
  messages,
  onAddMessage,
  campaigns,
  clarityPages,
  reports,
  brandGuidelines,
  onCreateReportFromAi,
  onRequestDeleteReportFromAi,
  onCreateCampaignFromAi,
  onScheduleEmailFromAi,
  onApplyRecommendationFromAi,
  recommendations,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: AssistantChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toTimeString().slice(0, 5),
    };

    onAddMessage(userMsg);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          history: messages,
          contextData: {
            campaigns,
            clarityPages,
            reports: reports.map((r) => ({
              id: r.id,
              title: r.title,
              sourcePlatform: r.sourcePlatform,
              metrics: r.metrics,
            })),
            recommendations,
          },
          brandGuidelines,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo procesar tu consulta");
      }

      const executedActions: Array<{ toolName: string; summary: string }> = [];
      const functionCalls = Array.isArray(data.functionCalls)
        ? data.functionCalls
        : [];

      for (const call of functionCalls) {
        const args = call.args || {};

        if (call.name === "create_custom_report") {
          const newRep: CustomReport = {
            id: `rep-${Date.now().toString().slice(-4)}`,
            title: String(args.title || "Reporte personalizado KOL"),
            sourcePlatform: String(args.sourcePlatform || "GMP + Clarity"),
            metrics: Array.isArray(args.metrics)
              ? args.metrics.map(String)
              : ["ROAS", "CPA", "Rage Clicks %"],
            dateRange: String(args.dateRange || "Últimos 30 días"),
            createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            createdBy: "Asistente Marketing KOL Suite",
            summaryInsight: String(
              args.summaryInsight ||
                "Creado desde el asistente sobre los 56 enlaces del hub de KOL Franquicias"
            ),
            rowCount: 840,
          };
          onCreateReportFromAi(newRep);
          executedActions.push({
            toolName: "create_custom_report",
            summary: `Reporte creado: «${newRep.title}» (${newRep.id})`,
          });
        } else if (call.name === "delete_custom_report") {
          const identifier = String(args.reportIdentifier || "");
          const reason = args.reason ? String(args.reason) : undefined;
          const matchedTitle = onRequestDeleteReportFromAi(identifier, reason);
          executedActions.push({
            toolName: "delete_custom_report",
            summary: `Diálogo de confirmación abierto para eliminar: «${matchedTitle}»`,
          });
        } else if (call.name === "create_ad_campaign") {
          const budget = Number(args.dailyBudget) || 900;
          const platRaw = String(args.platform || "Meta Ads");
          const plat: "DV360" | "SA360" | "CM360" | "GA4" | "Meta Ads" =
            platRaw.toLowerCase().includes("meta") ||
            platRaw.toLowerCase().includes("facebook") ||
            platRaw.toLowerCase().includes("instagram")
              ? "Meta Ads"
              : platRaw.includes("SA360")
              ? "SA360"
              : platRaw.includes("CM360")
              ? "CM360"
              : "DV360";

          const newCamp: CampaignMetric = {
            id: `cmp-${Date.now().toString().slice(-4)}`,
            name: String(args.name || "KOL_Campaña_Automatizada_IA"),
            platform: plat,
            status: "Activa",
            dailyBudget: budget,
            spend30d: budget * 10,
            impressions: 290000,
            clicks: 8410,
            ctrPct: 2.9,
            conversions: 105,
            cpaUsd: Number(((budget * 10) / 105).toFixed(2)),
            roas: 6.15,
            trackedEvents: ["lead_franquicia", "Lead"],
            clarityRageClicksPct: 1.7,
            clarityDeadClicksPct: 2.0,
            clarityScrollDepthPct: 83,
            clarityQuickbacksPct: 4.2,
            landingPagePath: "/franquicias-hub-principal",
            targetAudience: String(
              args.targetAudience ||
                "Inversores en Buenos Aires, Santa Fe y Córdoba (GA4 + Clarity)"
            ),
            lastSyncedAt: "Creada recién",
          };
          onCreateCampaignFromAi(newCamp);
          executedActions.push({
            toolName: "create_ad_campaign",
            summary: `Campaña activada en ${plat}: «${newCamp.name}» (US$ ${budget}/día)`,
          });
        } else if (call.name === "schedule_email_report") {
          const freqRaw = String(args.frequency || "Semanal");
          const freq: "Diaria" | "Semanal" | "Mensual" =
            freqRaw === "Diaria" || freqRaw === "Mensual" ? freqRaw : "Semanal";
          const fmtRaw = String(args.format || "PDF Ejecutivo");
          const fmt: "PDF Ejecutivo" | "HTML Interactivo" | "CSV Tabular" =
            fmtRaw === "HTML Interactivo" || fmtRaw === "CSV Tabular"
              ? fmtRaw
              : "PDF Ejecutivo";

          const newSched: ScheduledEmailReport = {
            id: `sch-${Date.now().toString().slice(-4)}`,
            name: String(args.name || "Informe periódico KOL Franquicias"),
            recipientEmail: String(
              args.recipientEmail || "socios@kolaccesorios.com.ar"
            ),
            frequency: freq,
            format: fmt,
            metrics: Array.isArray(args.metrics)
              ? args.metrics.map(String)
              : ["ROAS", "CPA", "lead_franquicia"],
            active: true,
            lastSentAt: null,
            nextRunLabel:
              freq === "Diaria"
                ? "Mañana 07:00"
                : freq === "Semanal"
                ? "Lunes 08:00"
                : "Día 1 del mes",
          };
          onScheduleEmailFromAi(newSched);
          executedActions.push({
            toolName: "schedule_email_report",
            summary: `Envío ${freq.toLowerCase()} programado para ${newSched.recipientEmail}`,
          });
        } else if (call.name === "apply_optimization_recommendation") {
          const campName = String(args.campaignName || "");
          const actType = String(args.actionType || "Presupuesto");
          onApplyRecommendationFromAi(campName, actType);
          executedActions.push({
            toolName: "apply_optimization_recommendation",
            summary: `Ajuste de ${actType.toLowerCase()} aplicado sobre ${campName}`,
          });
        }
      }

      const assistantMsg: AssistantChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        text:
          data.text ||
          "Listo, ya ejecuté la acción solicitada sobre tus datos de Google Marketing Platform y Clarity.",
        timestamp: new Date().toTimeString().slice(0, 5),
        executedActions:
          executedActions.length > 0 ? executedActions : undefined,
      };

      onAddMessage(assistantMsg);
    } catch (err: unknown) {
      onAddMessage({
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        text:
          err instanceof Error
            ? `No pudimos completar la consulta: ${err.message}`
            : "Error de conexión con el servidor",
        timestamp: new Date().toTimeString().slice(0, 5),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Conversación principal (8 columnas) */}
      <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 flex flex-col h-[640px]">
        <div className="px-6 py-4 border-b border-[#C9C3BE] bg-[#FAF8F6] flex items-center justify-between">
          <div>
            <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
              Consultá tus datos y ejecutá acciones
            </h2>
            <p className="text-[14px] text-[#46413F] mt-0.5">
              Hacé preguntas sobre Google Marketing Platform y Clarity, o pedí que cree reportes, los elimine o programe envíos
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div className="text-[14px] text-[#46413F] mb-1">
                {m.role === "user" ? "Vos" : "Marketing KOL Suite"} · {m.timestamp}
              </div>

              <div
                className={`max-w-2xl kol-card-12 px-5 py-4 text-[15px] leading-[23px] whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-[#FFD9E4] border border-[#C9C3BE] text-[#161418]"
                    : "bg-[#F3F0ED] border border-[#C9C3BE] text-[#161418]"
                }`}
              >
                {m.text}

                {m.executedActions && m.executedActions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#C9C3BE] space-y-2">
                    {m.executedActions.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 kol-card-12 bg-[#FFD9E4] text-[#161418] font-semibold text-[14px]"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{act.summary}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-[14px] text-[#161418] p-3.5 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin text-[#C51172]" />
              <span>Consultando datos de Google Marketing Platform y Clarity...</span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(inputPrompt);
          }}
          className="p-4 border-t border-[#C9C3BE] bg-[#FAF8F6] space-y-2"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Escribí tu pregunta o pedí: 'Creá un reporte...', 'Eliminá el reporte...', 'Automatizá una campaña...'"
              className="flex-1 h-[40px] px-4 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] disabled:opacity-40 flex items-center gap-2 whitespace-nowrap shrink-0 kol-focus"
            >
              <Send className="w-4 h-4" />
              <span>Enviar consulta</span>
            </button>
          </div>
          <div className="text-[14px] text-[#46413F]">
            Al enviar, el asistente consulta tus métricas en vivo y ejecuta los cambios que le pidas.
          </div>
        </form>
      </div>

      {/* Columna lateral (4 columnas): Consultas sugeridas y datos que se usan */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-5 space-y-4">
          <div>
            <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
              Probá estas órdenes en un clic
            </h3>
            <p className="text-[14px] text-[#46413F] mt-1">
              Tocá cualquiera para consultar datos o crear y eliminar reportes
            </p>
          </div>

          <div className="space-y-2.5">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendPrompt(prompt)}
                disabled={isLoading}
                className="w-full p-3.5 text-left text-[14px] text-[#161418] bg-[#F3F0ED] hover:bg-[#E7E3DF] border border-[#C9C3BE] rounded-[10px] transition-colors flex items-start justify-between gap-2 kol-focus"
              >
                <span className="leading-snug">{prompt}</span>
                <ArrowUpRight className="w-4 h-4 text-[#C51172] shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Caja "Datos que se usan" de KOL Franquicias (Lámina 1.2) */}
        <div className="bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 p-5 space-y-3">
          <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
            Datos de KOL sincronizados
          </h3>
          <ul className="space-y-2 text-[14px] text-[#161418]">
            <li>• Derecho inicial US$ 3.000; 0 % de regalías y 0 % de canon de publicidad</li>
            <li>• 10 locales: 5 propios y 5 en franquicia</li>
            <li>• Recupero de 18 a 24 meses, con casos en 12; sin testimonios</li>
            <li>• 56 enlaces: los 25 destinos del hub en vivo, 7 hijas y 3 videos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
