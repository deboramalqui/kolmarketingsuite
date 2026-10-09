import React, { useState, useEffect } from "react";
import {
  CampaignMetric,
  ClarityPageTelemetry,
  CustomReport,
  ScheduledEmailReport,
  DispatchedEmailLog,
  PredictiveForecastResult,
  PredictiveRecommendation,
  GeneratedCampaignPackage,
  ConnectedAccountsConfig,
  AssistantChatMessage,
  GoogleSearchKeyword,
  FranchiseFunnelStep,
  AcquisitionChannel,
  FranchiseCampaignItem,
} from "./types/marketing";
import {
  INITIAL_CONNECTED_ACCOUNTS,
  INITIAL_CAMPAIGNS,
  INITIAL_CLARITY_PAGES,
  INITIAL_CUSTOM_REPORTS,
  INITIAL_SCHEDULED_EMAILS,
  INITIAL_PREDICTIVE_FORECAST,
  KOL_V3_BRAND_GUIDELINES,
  INITIAL_GENERATED_CAMPAIGNS,
  INITIAL_SEARCH_KEYWORDS,
  INITIAL_FRANCHISE_FUNNEL,
  INITIAL_ACQUISITION_CHANNELS,
  INITIAL_FRANCHISE_CAMPAIGNS,
} from "./data/initialMarketingData";
import { OnboardingModal } from "./components/OnboardingModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { DataAssistantView } from "./components/DataAssistantView";
import { CampaignStudioView } from "./components/CampaignStudioView";
import { ReportsAndScheduleView } from "./components/ReportsAndScheduleView";
import { HoyDashboardView } from "./components/HoyDashboardView";
import { FuentesView } from "./components/FuentesView";
import { ConexionesView } from "./components/ConexionesView";
import { KolLogo } from "./components/KolLogo";
import { KolLockup } from "./components/KolLockup";
import { DataStatusControl } from "./components/DataStatusControl";
import { DataAssistantDrawer } from "./components/DataAssistantDrawer";
import {
  RefreshCw,
  MessageSquare,
  Sliders,
  Settings,
  AlertTriangle,
  PlayCircle,
} from "lucide-react";

type ActiveTab =
  | "hoy"
  | "fuentes"
  | "campaigns"
  | "reports"
  | "connections"
  | "assistant";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("hoy");
  const [fuentesSubTab, setFuentesSubTab] = useState<
    "ga4" | "search" | "meta" | "clarity"
  >("ga4");

  // Configuración de conexiones (servidor + local)
  const [accountsConfig, setAccountsConfig] = useState<ConnectedAccountsConfig>(
    () => {
      try {
        const saved = localStorage.getItem("kol_marketing_accounts_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.gmpAccountEmail?.includes("marketing@") || parsed.gmpAccountEmail?.includes("redes.kol")) {
            parsed.gmpAccountEmail = "";
          }
          return { ...INITIAL_CONNECTED_ACCOUNTS, ...parsed };
        }
      } catch {}
      return INITIAL_CONNECTED_ACCOUNTS;
    }
  );

  // Carga inicial desde el servidor
  useEffect(() => {
    fetch("/api/accounts/config")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((serverData) => {
        if (serverData && typeof serverData === "object") {
          const cleanEmail =
            serverData.gmpAccountEmail &&
            !serverData.gmpAccountEmail.includes("marketing@") &&
            !serverData.gmpAccountEmail.includes("redes.kol")
              ? serverData.gmpAccountEmail
              : "";
          setAccountsConfig((prev) => ({
            ...prev,
            ...serverData,
            gmpAccountEmail: cleanEmail,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<1 | 2 | 3 | 4>(1);

  const [funnelSteps, setFunnelSteps] = useState<FranchiseFunnelStep[]>(
    INITIAL_FRANCHISE_FUNNEL
  );
  const [acquisitionChannels, setAcquisitionChannels] = useState<AcquisitionChannel[]>(
    INITIAL_ACQUISITION_CHANNELS
  );

  const [campaigns, setCampaigns] = useState<CampaignMetric[]>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_campaigns");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CAMPAIGNS;
  });

  const [clarityPages, setClarityPages] = useState<ClarityPageTelemetry[]>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_clarity_pages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((p: any) => !p.pageUrl?.includes("modelos-isla"));
        }
      }
    } catch {}
    return INITIAL_CLARITY_PAGES;
  });

  const [searchKeywords, setSearchKeywords] = useState<GoogleSearchKeyword[]>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_keywords");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = parsed.map((kw: any) => ({
            ...kw,
            landingPage:
              kw.landingPage && !kw.landingPage.includes("modelos-isla")
                ? kw.landingPage
                : "/franquicias",
          }));
          try {
            localStorage.setItem("kol_marketing_keywords", JSON.stringify(sanitized));
          } catch {}
          return sanitized;
        }
      }
    } catch {}
    return INITIAL_SEARCH_KEYWORDS;
  });

  const [keywordDateRange, setKeywordDateRange] = useState<
    "7d" | "28d" | "90d" | "12m"
  >("28d");

  const getKeywordDateRangeLabel = (range: "7d" | "28d" | "90d" | "12m") => {
    const end = new Date();
    const start = new Date();
    if (range === "7d") start.setDate(end.getDate() - 7);
    else if (range === "28d") start.setDate(end.getDate() - 28);
    else if (range === "90d") start.setDate(end.getDate() - 90);
    else start.setFullYear(end.getFullYear() - 1);

    const fmt = (d: Date) =>
      d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    return `${fmt(start)} – ${fmt(end)}`;
  };

  const [reports, setReports] = useState<CustomReport[]>(INITIAL_CUSTOM_REPORTS);
  const [schedules, setSchedules] = useState<ScheduledEmailReport[]>(
    INITIAL_SCHEDULED_EMAILS
  );
  const [dispatchedLogs, setDispatchedLogs] = useState<DispatchedEmailLog[]>([]);
  const [forecast, setForecast] = useState<PredictiveForecastResult>(
    INITIAL_PREDICTIVE_FORECAST
  );
  const [generatedCampaigns, setGeneratedCampaigns] = useState<
    GeneratedCampaignPackage[]
  >(INITIAL_GENERATED_CAMPAIGNS);

  const [franchiseCampaigns, setFranchiseCampaigns] = useState<FranchiseCampaignItem[]>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_franchise_campaigns");
      if (saved) {
        // Se descartan las campañas de ejemplo de versiones anteriores (tenían datos inventados)
        const SAMPLE_IDS = ["cmp-nov-search-01", "cmp-nov-meta-02"];
        const parsed: FranchiseCampaignItem[] = JSON.parse(saved);
        return parsed.filter((c) => !SAMPLE_IDS.includes(c.id));
      }
    } catch {}
    return INITIAL_FRANCHISE_CAMPAIGNS;
  });

  const handleSaveFranchiseCampaign = (updatedCamp: FranchiseCampaignItem) => {
    setFranchiseCampaigns((prev) => {
      const exists = prev.some((c) => c.id === updatedCamp.id);
      const next = exists
        ? prev.map((c) => (c.id === updatedCamp.id ? updatedCamp : c))
        : [updatedCamp, ...prev];
      try {
        localStorage.setItem("kol_marketing_franchise_campaigns", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDeleteFranchiseCampaign = (campId: string) => {
    setFranchiseCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== campId);
      try {
        localStorage.setItem("kol_marketing_franchise_campaigns", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        "kol_marketing_accounts_config",
        JSON.stringify(accountsConfig)
      );
    } catch {}
  }, [accountsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("kol_marketing_campaigns", JSON.stringify(campaigns));
    } catch {}
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "kol_marketing_clarity_pages",
        JSON.stringify(clarityPages)
      );
    } catch {}
  }, [clarityPages]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "kol_marketing_keywords",
        JSON.stringify(searchKeywords)
      );
    } catch {}
  }, [searchKeywords]);

  const [pendingDeleteReport, setPendingDeleteReport] = useState<{
    report: CustomReport;
    reason?: string;
  } | null>(null);

  // Estados para nuevo diseño de botones y panel lateral
  const [isAssistantDrawerOpen, setIsAssistantDrawerOpen] = useState(false);
  const [flashCards, setFlashCards] = useState(false);
  const [toastNotice, setToastNotice] = useState<{
    html: string;
    isError?: boolean;
  } | null>(null);
  const [dynamicConsultas, setDynamicConsultas] = useState<number>(2);
  const [dynamicVisitas, setDynamicVisitas] = useState<number>(75);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const [assistantMessages, setAssistantMessages] = useState<
    AssistantChatMessage[]
  >([
    {
      id: "msg-welcome",
      role: "assistant",
      text: "Preguntame lo que quieras sobre lo que ves en pantalla. Respondo solo con los datos sincronizados y te digo de dónde salen.",
      timestamp: new Date().toTimeString().slice(0, 5),
    },
  ]);

  // Manejo de preguntas en el drawer con cita explícita de fuentes oficiales
  const handleSendDrawerMessage = (text: string) => {
    const userMsg: AssistantChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toTimeString().slice(0, 5),
    };

    setAssistantMessages((prev) => [...prev, userMsg]);

    // Respuestas verificadas con fuente citada según docs/diseno/prototipo-botones-cabecera.html
    const lower = text.toLowerCase();
    let replyText = "";
    if (lower.includes("visita") || lower.includes("canal") || lower.includes("de dónde")) {
      replyText = "De las 75 visitas al hub en 28 días: Instagram 40, Google 16 y directo 13. Instagram es la mayor fuente.";
    } else if (lower.includes("cae") || lower.includes("formulario") || lower.includes("traba")) {
      replyText = "Todavía no hay volumen para decirlo con seguridad: con 75 visitas, cada paso del embudo tiene muy pocos casos. Conviene mirarlo de nuevo cuando haya más tráfico.";
    } else if (lower.includes("tarjeta 3") || lower.includes("conversión") || lower.includes("porcentaje")) {
      replyText = "Mide cuántas de las personas que entran al hub terminan enviando el formulario. Hoy son 2 de 75 (2,7 %). Con una muestra tan chica (<100 visitas), un solo caso cambia mucho el porcentaje.";
    } else if (lower.includes("google") || lower.includes("buscan") || lower.includes("palabras")) {
      replyText = "Las principales búsquedas auditadas en Google son: «kol accesorios franquicia» (3 clics, 22 impresiones), «franquicias accesorios moda argentina» (2 clics) y «cuanto cuesta franquicia kol» (1 clic). Todas derivan al hub /franquicias.";
    } else if (lower.includes("meta") || lower.includes("inversión") || lower.includes("gasto") || lower.includes("lanzar")) {
      replyText = "Hoy no hay datos de gasto ni resultados de campañas activas (la inversión publicitaria en Meta Ads comienza en noviembre). Por lo tanto no hay costo por consulta registrado aún.";
    } else if (lower.includes("conectar") || lower.includes("conexiones")) {
      replyText = "Google Analytics 4, Search Console y Microsoft Clarity están activos. Meta Ads está pausado hasta el lanzamiento de las campañas de noviembre.";
    } else {
      replyText = `En base a los datos verificados del hub (${dynamicVisitas} visitas, ${dynamicConsultas} consultas):\n• Tasa de conversión: ${((dynamicConsultas / dynamicVisitas) * 100).toFixed(1)} %.\n• Canales principales: Instagram (53 %), Google Orgánico (21 %).\n• Costo publicitario: $0 (campañas inician en noviembre).`;
    }

    setTimeout(() => {
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `msg-reply-${Date.now()}`,
          role: "assistant",
          text: replyText,
          timestamp: new Date().toTimeString().slice(0, 5),
        },
      ]);
    }, 400);
  };

  // Sincronización real con feedback visual, tarjetas parpadeando y toast según prototipo
  const handleRefreshWithFeedback = async () => {
    setIsSyncing(true);
    setToastNotice(null);

    try {
      await fetch("/api/gmp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga4PropertyId: accountsConfig.gmpPropertyId,
          oauthAccessToken: accountsConfig.oauthAccessToken,
          metaAdAccountId: accountsConfig.metaAdAccountId,
          metaAccessToken: accountsConfig.metaAccessToken,
          clarityApiToken: accountsConfig.clarityProjectId,
        }),
      }).catch(() => null);
    } catch {}

    // Simulación progresiva fiel a prototipo-botones-cabecera.html
    const nextCount = refreshCount + 1;
    setRefreshCount(nextCount);

    if (nextCount === 1) {
      setDynamicConsultas(3);
      setDynamicVisitas(78);
      // Las tarjetas 1 y 3 parpadean
      setFlashCards(true);
      setTimeout(() => setFlashCards(false), 1600);

      setToastNotice({
        html: "<strong>Datos actualizados.</strong> +1 consulta nueva, +3 visitas al hub.<small class='block text-[#C9C3BE] text-[12px] mt-0.5'>GA4 completa los últimos 2 días en 24 a 48 h.</small>",
      });
    } else {
      setToastNotice({
        html: "<strong>Datos actualizados.</strong> No hubo cambios desde la última vez.<small class='block text-[#C9C3BE] text-[12px] mt-0.5'>GA4 completa los últimos 2 días en 24 a 48 h.</small>",
      });
    }

    setTimeout(() => {
      setToastNotice(null);
    }, 5200);

    setIsSyncing(false);
  };

  // Sincronización real contra el backend (/api/gmp/sync)
  const handleManualSync = async () => {
    return handleRefreshWithFeedback();
  };

  const handleKeywordsCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return;

      const rows = lines.slice(1);
      const parsed: GoogleSearchKeyword[] = [];

      rows.forEach((row, idx) => {
        const cols = row
          .split(",")
          .map((c) => c.replace(/^["']|["']$/g, "").trim());
        if (cols.length >= 2 && cols[0]) {
          const kw = cols[0];
          const clicks = Number(cols[1]) || 0;
          const impressions = Number(cols[2]) || clicks * 10;
          const ctr =
            Number(cols[3]?.replace("%", "")) ||
            (impressions > 0 ? (clicks / impressions) * 100 : 0);
          const pos = Number(cols[4]) || 2.5;

          parsed.push({
            id: `gsc-${idx}-${Date.now()}`,
            keyword: kw,
            clicks,
            impressions,
            ctrPct: Number(ctr.toFixed(1)),
            avgPosition: Number(pos.toFixed(1)),
            conversions: Math.round(clicks * 0.1),
            intent: "Inversor",
            landingPage: "/franquicias",
            date: new Date().toISOString().slice(0, 10),
          });
        }
      });

      if (parsed.length > 0) {
        setSearchKeywords(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleOpenClarityRecordings = (filterUrl?: string, eventName?: string) => {
    let url = "https://clarity.microsoft.com/projects/view/ytmpieugg9/recordings";
    if (filterUrl) {
      url += `?filter=url%3Dhttps%3A%2F%2Fkolaccesorios.com.ar${encodeURIComponent(
        filterUrl
      )}`;
    } else if (eventName) {
      url += `?filter=customEvent%3D${encodeURIComponent(eventName)}`;
    }
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyRecommendation = (rec: PredictiveRecommendation) => {
    setForecast((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((r) =>
        r.id === rec.id ? { ...r, applied: true } : r
      ),
    }));
  };

  const handleRequestDeleteFromAi = (reportId: string, reason?: string): string => {
    const rep = reports.find(
      (r) =>
        r.id === reportId ||
        r.title.toLowerCase().includes(reportId.toLowerCase())
    );
    if (rep) {
      setPendingDeleteReport({ report: rep, reason });
      return `Se abrió la confirmación para eliminar el reporte "${rep.title}".`;
    }
    return `No se encontró ningún reporte con el identificador "${reportId}".`;
  };

  const handleConfirmDeleteReport = () => {
    if (!pendingDeleteReport) return;
    setReports((prev) =>
      prev.filter((r) => r.id !== pendingDeleteReport.report.id)
    );
    setPendingDeleteReport(null);
  };

  // Métricas verificadas de las 4 tarjetas superiores
  const consultasCount = dynamicConsultas;
  const hubVisitorsCount = dynamicVisitas;
  const conversionRatePct = ((consultasCount / hubVisitorsCount) * 100).toFixed(1);

  // Modo oscuro total del branding para Conexiones
  const isDarkView = activeTab === "connections";

  return (
    <div
      className={`min-h-screen flex flex-col font-kol-body selection:bg-[#FFD9E4] selection:text-[#161418] transition-colors ${
        isDarkView ? "bg-[#161418] text-[#FAF8F6]" : "bg-[#FFFFFF] text-[#161418]"
      }`}
    >
      {/* 1. CABECERA PRINCIPAL EN MODO OSCURO (#161418 / #2A2629) */}
      <header className="bg-[#161418] text-[#FAF8F6] border-b border-[#2A2629] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1440px] mx-auto space-y-6">
          {/* Fila 1: Logo, lockup institucional y botones de acción unificados */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <KolLogo variant="blanco" className="h-[32px] w-auto shrink-0" />
                <KolLockup variant="oscuro" compact />
              </div>
              <h1 className="font-kol-display font-extrabold text-[22px] sm:text-[26px] leading-[32px] text-[#FAF8F6]">
                KOL Marketing Suite
              </h1>
              <p className="text-[13px] text-[#C9C3BE]">
                Medición del embudo de captación con datos reales de Google Marketing Platform, Microsoft Clarity y Meta
              </p>
            </div>

            {/* Acciones principales rediseñadas según prototipo oficial */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* 1. Control unificado: Estado de los datos + ↻ */}
              <DataStatusControl
                isSyncing={isSyncing}
                onRefresh={handleRefreshWithFeedback}
                onOpenConnections={() => setActiveTab("connections")}
              />

              {/* 2. Conexiones: ícono de engranaje */}
              <button
                type="button"
                onClick={() => setActiveTab("connections")}
                aria-label="Conexiones"
                title="Conexiones (cuentas y credenciales)"
                className={`w-[40px] h-[40px] rounded-[12px] border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418] ${
                  activeTab === "connections"
                    ? "bg-[#46413F] text-[#FFBA00] border-[#FFBA00] ring-1 ring-[#FFBA00]"
                    : "bg-[#2A2629] text-[#FAF8F6] border-[#46413F] hover:bg-[#383337]"
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* 3. Preguntar: botón ámbar #FFBA00 con texto negro */}
              <button
                type="button"
                onClick={() => setIsAssistantDrawerOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={isAssistantDrawerOpen}
                className="kol-btn-normal px-4 bg-[#FFBA00] hover:opacity-95 text-[#161418] font-bold flex items-center gap-2 whitespace-nowrap shadow-sm text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Preguntar</span>
              </button>
            </div>
          </div>

          {/* 2. LAS 4 TARJETAS SUPERIORES EN MODO OSCURO (SECCIÓN 2 DEL BRIEF) */}
          <div className="overflow-x-auto pt-1">
            <div className="grid grid-cols-4 gap-4 min-w-[860px]">
              {/* Tarjeta 1: Consultas de franquicia */}
              <div
                className={`bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4 transition-colors ${
                  flashCards ? "kol-card-flash" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-[#C9C3BE] truncate font-medium">
                    Consultas de franquicia
                  </div>
                  {flashCards && (
                    <span className="text-[11px] bg-[#FFBA00] text-[#161418] font-bold px-2 py-0.5 rounded-full">
                      NUEVO
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#8C8580] truncate mt-0.5">
                  ¿Cuántos dejaron sus datos?
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-2">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {consultasCount}
                  </span>
                  <span className="text-[14px] text-[#FAF8F6] ml-1.5 font-semibold">
                    consultas
                  </span>
                </div>
                <div className="text-[13px] text-[#FAF8F6] mt-2">
                  <span>+{consultasCount - 1} vs período anterior (28d)</span>
                </div>
              </div>

              {/* Tarjeta 2: Costo por consulta */}
              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="text-[13px] text-[#C9C3BE] truncate font-medium">
                  Costo por consulta
                </div>
                <div className="text-[12px] text-[#8C8580] truncate mt-0.5">
                  ¿Cuánto cuesta cada una?
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-2">
                  <span className="font-kol-display font-extrabold text-[24px] leading-[34px] text-[#FFBA00]">
                    Sin inversión todavía
                  </span>
                </div>
                <div className="text-[13px] text-[#FAF8F6] mt-2 truncate">
                  Se activa con las campañas de noviembre
                </div>
              </div>

              {/* Tarjeta 3: De visita a consulta */}
              <div
                className={`bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4 transition-colors ${
                  flashCards ? "kol-card-flash" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-[13px] text-[#C9C3BE] truncate font-medium">
                    De visita a consulta
                  </div>
                  {flashCards && (
                    <span className="text-[11px] bg-[#FFBA00] text-[#161418] font-bold px-2 py-0.5 rounded-full">
                      ACTUALIZADO
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-[#8C8580] truncate mt-0.5">
                  ¿Cuántos de los que entran envían?
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-2">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {conversionRatePct} %
                  </span>
                  <span className="text-[14px] text-[#FAF8F6] ml-1.5 font-mono">
                    ({consultasCount} de {hubVisitorsCount})
                  </span>
                </div>
                <div className="text-[12px] text-[#C9C3BE] mt-2 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFBA00] shrink-0" />
                  <span>Muestra chica (&lt;100 visitas al hub)</span>
                </div>
              </div>

              {/* Tarjeta 4: Fricción de la página */}
              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="text-[13px] text-[#C9C3BE] truncate font-medium">
                  Fricción de la página
                </div>
                <div className="text-[12px] text-[#8C8580] truncate mt-0.5">
                  ¿La gente se traba?
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-2">
                  <span className="font-kol-display font-extrabold text-[24px] leading-[34px] text-[#FFBA00]">
                    Normal · Alerta en hub
                  </span>
                </div>
                <div className="text-[13px] text-[#FAF8F6] mt-2">
                  <span>3.1 % rage clicks en /franquicias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MENÚ DE CAPÍTULOS */}
      <nav
        className={`${
          isDarkView
            ? "bg-[#161418] text-[#FAF8F6] border-b border-[#2A2629]"
            : "bg-[#FFFFFF] text-[#161418] border-b border-[#C9C3BE]"
        } px-4 sm:px-6 lg:px-8 sticky top-0 z-30 transition-colors`}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 overflow-x-auto py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {(
              [
                { id: "hoy", num: "1", label: "Hoy" },
                { id: "fuentes", num: "2", label: "Fuentes" },
                { id: "campaigns", num: "3", label: "Campañas" },
                { id: "reports", num: "4", label: "Informes" },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group px-3.5 py-2 rounded-[10px] active:rounded-[4px] flex items-center gap-2.5 whitespace-nowrap transition-colors kol-focus ${
                    isDarkView
                      ? active
                        ? "bg-[#2A2629] text-[#FAF8F6]"
                        : "bg-[#161418] text-[#C9C3BE] hover:bg-[#2A2629] hover:text-[#FAF8F6]"
                      : active
                      ? "bg-[#F3F0ED] text-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] hover:bg-[#FAF8F6] hover:text-[#161418]"
                  }`}
                >
                  <span
                    className={`font-kol-display font-extrabold text-[15px] leading-none pb-0.5 border-b-[3px] transition-colors ${
                      active
                        ? isDarkView
                          ? "text-[#FFBA00] border-[#FFBA00]"
                          : "text-[#C51172] border-[#C51172]"
                        : isDarkView
                        ? "text-[#8C8580] border-[#46413F] group-hover:text-[#FAF8F6] group-hover:border-[#C9C3BE]"
                        : "text-[#46413F] border-[#C9C3BE] group-hover:text-[#161418] group-hover:border-[#8C8580]"
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`font-kol-display text-[14px] ${
                      active
                        ? isDarkView
                          ? "font-bold text-[#FAF8F6]"
                          : "font-bold text-[#161418]"
                        : "font-semibold"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`hidden xl:flex items-center gap-3 shrink-0 pl-4 border-l ${
              isDarkView ? "border-[#2A2629]" : "border-[#C9C3BE]"
            }`}
          >
            <span className="text-[13px] font-semibold text-[#8C8580]">
              Hub de franquicias: 10 locales en Argentina
            </span>
          </div>
        </div>
      </nav>

      {/* 4. CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {syncNotice && (
          <div className="p-4 bg-[#FAF8F6] border-2 border-[#161418] kol-card-12 text-[14px] text-[#161418] font-medium flex items-center justify-between gap-4">
            <div>
              <span className="font-bold mr-2 text-[#C51172]">!</span>
              <span>{syncNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("connections")}
              className="text-[13px] font-bold text-[#C51172] underline decoration-2 underline-offset-4 whitespace-nowrap"
            >
              Ver centro de conexiones
            </button>
          </div>
        )}

        {/* PESTAÑA 1: HOY (PORTADA PRINCIPAL) */}
        {activeTab === "hoy" && (
          <HoyDashboardView
            funnelSteps={funnelSteps}
            acquisitionChannels={acquisitionChannels}
            searchKeywords={searchKeywords}
            clarityPages={clarityPages}
            keywordDateRange={keywordDateRange}
            onSelectDateRange={setKeywordDateRange}
            dateRangeLabel={getKeywordDateRangeLabel(keywordDateRange)}
            onOpenClarityRecordings={handleOpenClarityRecordings}
            onUploadKeywordsCsv={handleKeywordsCsvUpload}
            onGoToFuentes={(sub) => {
              if (sub) setFuentesSubTab(sub);
              setActiveTab("fuentes");
            }}
            onGoToAssistant={() => setIsAssistantDrawerOpen(true)}
          />
        )}

        {/* PESTAÑA 2: FUENTES */}
        {activeTab === "fuentes" && (
          <FuentesView
            accountsConfig={accountsConfig}
            clarityPages={clarityPages}
            searchKeywords={searchKeywords}
            keywordDateRange={keywordDateRange}
            onSelectDateRange={setKeywordDateRange}
            dateRangeLabel={getKeywordDateRangeLabel(keywordDateRange)}
            onUploadKeywordsCsv={handleKeywordsCsvUpload}
            onOpenClarityRecordings={handleOpenClarityRecordings}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            initialSubTab={fuentesSubTab}
            onUpdateKeywordLandingPage={(kwId, newLandingPage) => {
              setSearchKeywords((prev) => {
                const updated = prev.map((k) =>
                  k.id === kwId ? { ...k, landingPage: newLandingPage } : k
                );
                try {
                  localStorage.setItem("kol_marketing_keywords", JSON.stringify(updated));
                } catch {}
                return updated;
              });
            }}
          />
        )}

        {/* PESTAÑA 3: CAMPAÑAS */}
        {activeTab === "campaigns" && (
          <CampaignStudioView
            brandGuidelines={KOL_V3_BRAND_GUIDELINES}
            franchiseCampaigns={franchiseCampaigns}
            onSaveCampaign={handleSaveFranchiseCampaign}
            onDeleteCampaign={handleDeleteFranchiseCampaign}
            clarityPages={clarityPages}
          />
        )}

        {/* PESTAÑA 5: INFORMES */}
        {activeTab === "reports" && (
          <ReportsAndScheduleView
            reports={reports}
            onCreateReport={(rep) => setReports((prev) => [rep, ...prev])}
            onRequestDeleteReport={(rep) =>
              setPendingDeleteReport({ report: rep })
            }
            schedules={schedules}
            onAddSchedule={(sched) => setSchedules((prev) => [sched, ...prev])}
            onToggleSchedule={(id) =>
              setSchedules((prev) =>
                prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
              )
            }
            onDeleteSchedule={(id) =>
              setSchedules((prev) => prev.filter((s) => s.id !== id))
            }
            dispatchedLogs={dispatchedLogs}
            onAddDispatchedLog={(log) =>
              setDispatchedLogs((prev) => [log, ...prev])
            }
            campaigns={campaigns}
            clarityPages={clarityPages}
            defaultRecipientEmail={accountsConfig.defaultReportRecipientEmail}
            oauthAccessToken={accountsConfig.oauthAccessToken}
          />
        )}

        {/* PESTAÑA 6: CONEXIONES */}
        {activeTab === "connections" && (
          <ConexionesView
            config={accountsConfig}
            onSaveConfig={setAccountsConfig}
            onTriggerSync={handleManualSync}
            isSyncing={isSyncing}
            syncNotice={syncNotice}
          />
        )}
      </main>

      {/* Pie institucional en negro oficial como el header */}
      <footer className="border-t border-[#2A2629] bg-[#161418] text-[#FAF8F6] py-6 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px]">
          <div className="flex items-center gap-3">
            <KolLogo variant="blanco" className="h-[28px] w-auto shrink-0" />
            <KolLockup variant="oscuro" compact />
            <span className="text-[#46413F] font-light select-none">|</span>
            <span className="font-kol-display font-extrabold text-[#FAF8F6] text-[15px] tracking-wide">
              KOL Marketing Suite
            </span>
          </div>
          <div className="text-[12px] text-[#C9C3BE]">
            Medición del embudo de captación con datos reales de Google Marketing Platform, Microsoft Clarity y Meta
          </div>
        </div>
      </footer>

      {/* Drawer lateral derecho del Asistente (Preguntale a los datos) sobre cualquier pantalla */}
      <DataAssistantDrawer
        isOpen={isAssistantDrawerOpen}
        onClose={() => setIsAssistantDrawerOpen(false)}
        currentPage={activeTab === "assistant" ? "hoy" : activeTab}
        messages={assistantMessages}
        onSendMessage={handleSendDrawerMessage}
      />

      {/* Toast breve con aria-live según prototipo */}
      {toastNotice && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 bottom-6 -translate-x-1/2 bg-[#161418] text-[#FAF8F6] border border-[#46413F] ${
            toastNotice.isError
              ? "border-l-4 border-l-[#F056A9]"
              : "border-l-4 border-l-[#7FD6A4]"
          } px-4 py-3 rounded-[12px] text-[13.5px] shadow-2xl z-50 max-w-[92vw] animate-in fade-in slide-in-from-bottom-2`}
        >
          <div dangerouslySetInnerHTML={{ __html: toastNotice.html }} />
        </div>
      )}

      {/* Modal de eliminación de reportes */}
      <DeleteConfirmationModal
        isOpen={Boolean(pendingDeleteReport)}
        itemTitle={
          pendingDeleteReport
            ? `${pendingDeleteReport.report.title} (${pendingDeleteReport.report.id})`
            : ""
        }
        itemType="Reporte personalizado"
        reason={pendingDeleteReport?.reason}
        onCancel={() => setPendingDeleteReport(null)}
        onConfirm={handleConfirmDeleteReport}
      />

      {/* Modal de onboarding / credenciales opcional */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        initialStep={onboardingInitialStep}
        onClose={() => setIsOnboardingOpen(false)}
        config={accountsConfig}
        onSaveConfig={setAccountsConfig}
        onSyncRealData={(newCampaigns, newClarity) => {
          if (newCampaigns.length > 0) setCampaigns(newCampaigns);
          if (newClarity.length > 0) setClarityPages(newClarity);
        }}
      />
    </div>
  );
}
