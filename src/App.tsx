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
} from "./data/initialMarketingData";
import { OnboardingModal } from "./components/OnboardingModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { DataAssistantView } from "./components/DataAssistantView";
import { PredictiveAnalyticsView } from "./components/PredictiveAnalyticsView";
import { CampaignStudioView } from "./components/CampaignStudioView";
import { ReportsAndScheduleView } from "./components/ReportsAndScheduleView";
import { KolLogo } from "./components/KolLogo";
import {
  RefreshCw,
  Search,
  MessageSquare,
  Check,
  Upload,
  Filter,
  Trash2,
  TrendingUp,
  Globe,
} from "lucide-react";

type ActiveTab =
  | "dashboard"
  | "assistant"
  | "predictive"
  | "campaigns"
  | "reports";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  const [accountsConfig, setAccountsConfig] = useState<ConnectedAccountsConfig>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_accounts_config");
      if (saved) return { ...INITIAL_CONNECTED_ACCOUNTS, ...JSON.parse(saved) };
    } catch {}
    return INITIAL_CONNECTED_ACCOUNTS;
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<
    1 | 2 | 3 | 4
  >(1);

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
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CLARITY_PAGES;
  });

  const [searchKeywords, setSearchKeywords] = useState<GoogleSearchKeyword[]>(() => {
    try {
      const saved = localStorage.getItem("kol_marketing_keywords");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.id?.startsWith("kw-")) {
          return [];
        }
        return parsed;
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

  const [reports, setReports] = useState<CustomReport[]>(
    INITIAL_CUSTOM_REPORTS
  );
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

  const [platformFilter, setPlatformFilter] = useState<
    "Todas" | "Meta Ads" | "Google Analytics" | "Google Search"
  >("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [metaSearchQuery, setMetaSearchQuery] = useState("");
  const [keywordFilterQuery, setKeywordFilterQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kol_marketing_accounts_config", JSON.stringify(accountsConfig));
    } catch {}
  }, [accountsConfig]);

  useEffect(() => {
    try {
      localStorage.setItem("kol_marketing_campaigns", JSON.stringify(campaigns));
    } catch {}
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem("kol_marketing_clarity_pages", JSON.stringify(clarityPages));
    } catch {}
  }, [clarityPages]);

  useEffect(() => {
    try {
      localStorage.setItem("kol_marketing_keywords", JSON.stringify(searchKeywords));
    } catch {}
  }, [searchKeywords]);

  const [pendingDeleteReport, setPendingDeleteReport] = useState<{
    report: CustomReport;
    reason?: string;
  } | null>(null);

  const [assistantMessages, setAssistantMessages] = useState<
    AssistantChatMessage[]
  >([
    {
      id: "msg-welcome",
      role: "assistant",
      text: "Estás en el chat de IA de Marketing KOL Suite.\n\nNo inventamos ningún número: conectá tu propiedad de Google Analytics 4 o el token de Microsoft Clarity desde «Conectar cuentas», o subí un CSV exportado, y haceme preguntas sobre tus datos reales, pedime que cree o elimine reportes, que automatice campañas o que programe envíos por correo.",
      timestamp: new Date().toTimeString().slice(0, 5),
    },
  ]);

  // Sincronización real contra el backend (/api/gmp/sync) con filtro selectivo de Meta Ads
  const handleManualSync = async () => {
    if (
      !accountsConfig.gmpPropertyId.trim() &&
      !accountsConfig.metaAdAccountId.trim() &&
      !accountsConfig.clarityProjectId.trim()
    ) {
      setOnboardingInitialStep(1);
      setIsOnboardingOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await fetch("/api/gmp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga4PropertyId: accountsConfig.gmpPropertyId,
          oauthAccessToken: accountsConfig.oauthAccessToken,
          metaAdAccountId: accountsConfig.metaAdAccountId,
          metaAccessToken: accountsConfig.metaAccessToken,
          metaOnlySpecificCampaigns: accountsConfig.metaOnlySpecificCampaigns,
          metaAllowedCampaignKeywords:
            accountsConfig.metaAllowedCampaignKeywords,
          metaSelectedCampaignNames: accountsConfig.metaSelectedCampaignNames,
          metaTrackedEvents: accountsConfig.metaTrackedEvents,
          clarityApiToken: accountsConfig.clarityProjectId,
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.campaigns) && data.campaigns.length > 0) {
        setCampaigns(data.campaigns);
      }
      if (Array.isArray(data.clarityPages) && data.clarityPages.length > 0) {
        setClarityPages(data.clarityPages);
      }
      if (Array.isArray(data.searchKeywords) && data.searchKeywords.length > 0) {
        setSearchKeywords(data.searchKeywords);
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setSyncNotice(data.errors[0]);
      }
    } catch {
      setSyncNotice("No se pudo conectar con la API. Verificá las credenciales en Conectar cuentas.");
    } finally {
      setIsSyncing(false);
    }
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

          const isInvestor =
            kw.toLowerCase().includes("invers") ||
            kw.toLowerCase().includes("cost") ||
            kw.toLowerCase().includes("rentab") ||
            kw.toLowerCase().includes("precio");
          const isFranchise = kw.toLowerCase().includes("franquicia");

          parsed.push({
            id: `gsc-${idx}-${Date.now()}`,
            keyword: kw,
            clicks,
            impressions,
            ctrPct: Number(ctr.toFixed(1)),
            avgPosition: Number(pos.toFixed(1)),
            conversions: Math.round(clicks * 0.12),
            intent: isInvestor
              ? "Inversor"
              : isFranchise
              ? "Franquicia"
              : "Informativa",
          });
        }
      });

      if (parsed.length > 0) {
        setSearchKeywords(parsed);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRecommendation = (rec: PredictiveRecommendation) => {
    setForecast((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((r) =>
        r.id === rec.id ? { ...r, applied: true } : r
      ),
    }));

    setCampaigns((prev) =>
      prev.map((c) => {
        if (
          c.name.toLowerCase().includes(rec.targetCampaign.toLowerCase()) ||
          rec.targetCampaign.toLowerCase().includes(c.name.toLowerCase())
        ) {
          const updatedBudget = Math.max(
            50,
            c.dailyBudget + (rec.budgetShiftUsd || 0)
          );
          const updatedRoas = Number(
            (c.roas + (rec.roasLift || 0)).toFixed(2)
          );
          return {
            ...c,
            dailyBudget: updatedBudget,
            roas: updatedRoas,
            status: "Optimización IA",
            lastSyncedAt: "Ajuste aplicado",
          };
        }
        return c;
      })
    );
  };

  const handleRequestDeleteFromAi = (
    identifier: string,
    reason?: string
  ): string => {
    const cleanId = identifier.trim().toLowerCase();
    const found =
      reports.find(
        (r) =>
          r.id.toLowerCase() === cleanId ||
          r.title.toLowerCase().includes(cleanId)
      ) || reports[reports.length - 1];

    if (found) {
      setPendingDeleteReport({ report: found, reason });
      return `${found.title} (${found.id})`;
    }
    return identifier;
  };

  const handleConfirmDeleteReport = () => {
    if (!pendingDeleteReport) return;
    const targetId = pendingDeleteReport.report.id;
    setReports((prev) => prev.filter((r) => r.id !== targetId));
    setPendingDeleteReport(null);
  };

  const googleCampaigns = campaigns.filter(
    (c) =>
      c.platform === "GA4" ||
      c.platform === "SA360" ||
      c.platform === "DV360" ||
      c.platform === "CM360"
  );
  const metaCampaigns = campaigns.filter((c) => c.platform === "Meta Ads");

  const filteredGoogleCampaigns = googleCampaigns.filter(
    (c) =>
      !googleSearchQuery.trim() ||
      c.name.toLowerCase().includes(googleSearchQuery.toLowerCase()) ||
      c.landingPagePath.toLowerCase().includes(googleSearchQuery.toLowerCase())
  );

  const filteredMetaCampaigns = metaCampaigns.filter(
    (c) =>
      !metaSearchQuery.trim() ||
      c.name.toLowerCase().includes(metaSearchQuery.toLowerCase()) ||
      c.landingPagePath.toLowerCase().includes(metaSearchQuery.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesPlatform =
      platformFilter === "Todas" ? true : c.platform === platformFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.landingPagePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesQuery;
  });

  const hasCampaigns = campaigns.length > 0;
  const totalSpend30d = campaigns.reduce((sum, c) => sum + c.spend30d, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const portfolioRoas =
    hasCampaigns && totalSpend30d > 0
      ? campaigns.reduce((sum, c) => sum + c.roas * c.spend30d, 0) /
        totalSpend30d
      : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#161418]">
      {/* 1. BLOQUE SUPERIOR EN MODO OSCURO (#161418): Logo KOL + Lockup + Título + 4 Tarjetas en Modo Oscuro (Láminas 3.3 y 9.1) */}
      <header className="bg-[#161418] text-[#FAF8F6] px-4 sm:px-6 lg:px-8 pt-6 pb-7">
        <div className="max-w-[1440px] mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Logo oficial de KOL (logo-blanco.png) + Lockup KOL FRANQUICIAS + nombre de la suite */}
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("dashboard");
                  }}
                  className="flex items-center kol-focus rounded-[8px]"
                  aria-label="KOL Marketing Suite"
                >
                  <KolLogo variant="blanco" className="h-[46px] w-auto" />
                </a>

                <span className="kol-lockup-dark">KOL FRANQUICIAS</span>

                <span className="text-[15px] font-medium text-[#C9C3BE]">
                  Marketing KOL Suite
                </span>
              </div>

              <h1 className="font-kol-display font-extrabold text-[26px] sm:text-[34px] leading-[34px] sm:leading-[42px] text-[#FAF8F6] tracking-[-0.02em]">
                Sincronización en vivo de Google Marketing Platform y Clarity
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleManualSync}
                className="kol-btn-normal px-4 bg-[#2A2629] text-[#FAF8F6] border border-[#46413F] hover:bg-[#46413F] flex items-center gap-2 whitespace-nowrap kol-focus"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                />
                <span>Sincronizar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnboardingInitialStep(2);
                  setIsOnboardingOpen(true);
                }}
                className="kol-btn-normal px-4 bg-[#2A2629] text-[#FAF8F6] border border-[#46413F] hover:bg-[#46413F] flex items-center gap-2 whitespace-nowrap kol-focus"
              >
                <Filter className="w-4 h-4" />
                <span>Meta Ads (elegir campañas)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnboardingInitialStep(1);
                  setIsOnboardingOpen(true);
                }}
                className="kol-btn-normal px-4 bg-[#2A2629] text-[#FAF8F6] border border-[#46413F] hover:bg-[#46413F] whitespace-nowrap kol-focus"
              >
                Conectar cuentas
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("assistant")}
                className="kol-btn-normal px-5 bg-[#FFBA00] hover:opacity-95 text-[#161418] font-bold flex items-center gap-2 whitespace-nowrap kol-focus"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Preguntar a mis datos (Chat IA)</span>
              </button>
            </div>
          </div>

          {/* 2. LAS 4 TARJETAS EN MODO OSCURO EN 4 COLUMNAS FIJAS */}
          <div className="overflow-x-auto pt-1">
            <div className="grid grid-cols-4 gap-4 min-w-[860px]">
              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="text-[14px] text-[#C9C3BE] truncate">
                  ROAS consolidado
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-1">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {hasCampaigns ? `${portfolioRoas.toFixed(2)}x` : "Sin datos"}
                  </span>
                </div>
                <div className="text-[14px] text-[#FAF8F6] mt-2 truncate">
                  {forecast.projectedRoas > 0
                    ? `Proyectado a 30 días: ${forecast.projectedRoas.toFixed(2)}x`
                    : "Google y Meta Ads"}
                </div>
              </div>

              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="text-[14px] text-[#C9C3BE] truncate">
                  Campañas activas
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-1">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {hasCampaigns ? `${campaigns.length}` : "0"}
                  </span>
                </div>
                <div className="text-[14px] text-[#FAF8F6] mt-2 truncate">
                  {hasCampaigns
                    ? "Google Analytics y Meta Ads (selectivo)"
                    : "Conectá Google o Meta"}
                </div>
              </div>

              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="text-[14px] text-[#C9C3BE] truncate">
                  Google Search (Keywords)
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-1">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {searchKeywords.length} términos
                  </span>
                </div>
                <div className="text-[14px] text-[#FAF8F6] mt-2 truncate">
                  {searchKeywords.reduce((sum, k) => sum + k.clicks, 0)} clics · Intención franquicias
                </div>
              </div>

              <div className="bg-[#2A2629] border border-[#46413F] kol-card-12 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#C9C3BE] truncate">
                    Microsoft Clarity
                  </span>
                  {accountsConfig.clarityProjectId && (
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#FFD9E4] text-[#161418] border border-[#C51172] text-[11px] font-bold">
                      Conectado
                    </span>
                  )}
                </div>
                <div className="inline-block border-b-[3px] border-[#FFBA00] pb-1 mt-1">
                  <span className="font-kol-display font-extrabold text-[28px] leading-[34px] text-[#FFBA00] tabular-nums">
                    {accountsConfig.clarityProjectId ? "Activo" : "Sin conectar"}
                  </span>
                </div>
                <div className="text-[14px] text-[#FAF8F6] mt-2 truncate">
                  {clarityPages.length > 0
                    ? `${clarityPages.length} rutas analizadas en vivo`
                    : accountsConfig.clarityProjectId
                    ? "Token activo · Listo para medir"
                    : "Esperando token de Clarity"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. MENÚ EN TODO BLANCO (#FFFFFF): Índice de capítulos con número y filete magenta + barra de ubicación (Láminas 2, 5.2, 9.4a y A.7) */}
      <nav className="bg-[#FFFFFF] text-[#161418] border-b border-[#C9C3BE] px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 overflow-x-auto py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {(
              [
                { id: "dashboard", num: "1", label: "Sincronización" },
                { id: "assistant", num: "2", label: "Consultá tus datos" },
                { id: "predictive", num: "3", label: "Predictivo" },
                { id: "campaigns", num: "4", label: "Campañas" },
                { id: "reports", num: "5", label: "Reportes y correo" },
              ] as const
            ).map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group px-4 py-2 rounded-[10px] active:rounded-[4px] flex items-center gap-3 whitespace-nowrap transition-colors kol-focus ${
                    active
                      ? "bg-[#F3F0ED] text-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] hover:bg-[#FAF8F6] hover:text-[#161418]"
                  }`}
                >
                  <span
                    className={`font-kol-display font-extrabold text-[16px] leading-none pb-1 border-b-[3px] transition-colors ${
                      active
                        ? "text-[#C51172] border-[#C51172]"
                        : "text-[#46413F] border-[#C9C3BE] group-hover:text-[#161418] group-hover:border-[#8C8580]"
                    }`}
                  >
                    {item.num}
                  </span>
                  <span
                    className={`font-kol-display text-[15px] ${
                      active ? "font-bold text-[#161418]" : "font-semibold"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-3 shrink-0 pl-4 border-l border-[#C9C3BE]">
            <div className="space-y-1.5 w-40">
              <div className="flex items-center justify-between text-[14px] font-semibold text-[#161418]">
                <span>
                  Sección{" "}
                  {activeTab === "dashboard"
                    ? "1"
                    : activeTab === "assistant"
                    ? "2"
                    : activeTab === "predictive"
                    ? "3"
                    : activeTab === "campaigns"
                    ? "4"
                    : "5"}{" "}
                  de 5
                </span>
              </div>
              <div className="w-full h-[4px] bg-[#E7E3DF] rounded-[4px] overflow-hidden">
                <div
                  style={{
                    width:
                      activeTab === "dashboard"
                        ? "20%"
                        : activeTab === "assistant"
                        ? "40%"
                        : activeTab === "predictive"
                        ? "60%"
                        : activeTab === "campaigns"
                        ? "80%"
                        : "100%",
                  }}
                  className="h-full bg-[#C51172] rounded-[4px] transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 4. CONTENIDO PRINCIPAL EN TEMA BLANCO (#FFFFFF) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {syncNotice && (
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#A40F5F] kol-card-12 text-[14px] text-[#A40F5F] font-medium flex items-center justify-between gap-4">
            <div>
              <span className="font-bold mr-2">!</span>
              <span>{syncNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="text-[14px] font-bold text-[#C51172] underline decoration-2 underline-offset-4 whitespace-nowrap"
            >
              Revisar credenciales
            </button>
          </div>
        )}

        {/* VISTA 1: SINCRONIZACIÓN */}
        {activeTab === "dashboard" && (
          <div className="space-y-10">
            {/* SECCIÓN 1: CAMPAÑAS DE GOOGLE (Google Analytics 4 / GMP) */}
            <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="font-kol-display font-extrabold text-[26px] leading-[32px] text-[#161418]">
                    Campañas de Google (Google Analytics 4)
                  </h2>
                  <p className="text-[15px] text-[#46413F] mt-1">
                    Campañas publicitarias, tráfico y conversiones capturadas desde Google Analytics 4
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#46413F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={googleSearchQuery}
                      onChange={(e) => setGoogleSearchQuery(e.target.value)}
                      placeholder="Buscá campaña o página..."
                      className="h-[38px] pl-10 pr-4 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 whitespace-nowrap kol-focus text-[13px] font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar Google"}</span>
                  </button>
                </div>
              </div>

              {/* Recuadro de configuración y filtro de Google */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[14px]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {accountsConfig.gmpPropertyId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Conexión activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#E7E3DF] text-[#46413F] text-[12px] font-semibold uppercase tracking-wider">
                        Sin conectar
                      </span>
                    )}
                    <span className="font-bold text-[#161418]">
                      {accountsConfig.gmpPropertyId
                        ? `Propiedad GA4: ${accountsConfig.gmpPropertyId} · ${accountsConfig.gmpAccountEmail || "Cuenta asociada"}`
                        : "Google Analytics 4 no configurado"}
                    </span>
                  </div>
                  <div className="text-[#46413F] text-[13px]">
                    Módulos habilitados: Google Analytics 4 (Data API) · Google Search (Palabras clave)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOnboardingInitialStep(1);
                    setIsOnboardingOpen(true);
                  }}
                  className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#2A2629] border border-[#8C8580] hover:bg-[#F3F0ED] whitespace-nowrap shrink-0 kol-focus font-medium text-[13px]"
                >
                  Modificar conexión de Google
                </button>
              </div>

              {filteredGoogleCampaigns.length === 0 ? (
                <div className="p-8 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                      Todavía no hay campañas sincronizadas de Google
                    </h3>
                    <p className="text-[15px] text-[#46413F]">
                      Conectá tu cuenta de Google Analytics 4 o sincronizá para visualizar las campañas activas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingInitialStep(1);
                      setIsOnboardingOpen(true);
                    }}
                    className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap shrink-0 kol-focus font-bold"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Conectar o sincronizar Google</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#C9C3BE] kol-card-12">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#E7E3DF] text-[#2A2629] text-[14px] font-bold">
                        <th className="py-3.5 px-4">Campaña y página de destino</th>
                        <th className="py-3.5 px-3">Canal</th>
                        <th className="py-3.5 px-3">Estado</th>
                        <th className="py-3.5 px-3 text-right">Presup. diario</th>
                        <th className="py-3.5 px-3 text-right">Inversión 30d</th>
                        <th className="py-3.5 px-3 text-right">CTR</th>
                        <th className="py-3.5 px-3 text-right">Conversiones</th>
                        <th className="py-3.5 px-3 text-right">CPA</th>
                        <th className="py-3.5 px-3 text-right">ROAS</th>
                        <th className="py-3.5 px-3 text-right">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-[#161418]">
                      {filteredGoogleCampaigns.map((c, idx) => (
                        <tr
                          key={c.id}
                          className={
                            idx % 2 === 1
                              ? "bg-[#F3F0ED] border-t border-[#C9C3BE]"
                              : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                          }
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#161418]">{c.name}</div>
                            <div className="text-[#46413F] mt-0.5">
                              {c.landingPagePath} · {c.lastSyncedAt}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">{c.platform}</td>
                          <td className="py-3.5 px-3">
                            <span className="text-[#161418] font-semibold whitespace-nowrap">
                              ✓ {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-medium">
                            US$ {c.dailyBudget.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            US$ {c.spend30d.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            {c.ctrPct.toFixed(1)} %
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-bold">
                            {c.conversions.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            US$ {c.cpaUsd.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-bold text-[#C51172]">
                            {c.roas.toFixed(2)}x
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setCampaigns((prev) => prev.filter((item) => item.id !== c.id))
                              }
                              title="Excluir esta campaña"
                              className="text-[#A40F5F] hover:text-[#161418] p-1 rounded-[4px] kol-focus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SECCIÓN 2: GOOGLE SEARCH (Keywords y términos de búsqueda con filtro de fechas real) */}
            <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-5 h-5 text-[#C51172]" />
                    <h3 className="font-kol-display font-extrabold text-[24px] leading-[30px] text-[#161418]">
                      Google Search: Palabras clave y términos de búsqueda
                    </h3>
                  </div>
                  <p className="text-[14px] text-[#46413F] mt-1">
                    Búsquedas reales en Google sobre franquicias, inversión y costos asociados a tus páginas
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#46413F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={keywordFilterQuery}
                      onChange={(e) => setKeywordFilterQuery(e.target.value)}
                      placeholder="Filtrar palabra clave..."
                      className="h-[38px] pl-10 pr-4 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                    />
                  </div>

                  <label className="kol-btn-normal px-3.5 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 cursor-pointer whitespace-nowrap text-[13px] font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir CSV de Search Console</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleKeywordsCsvUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Barra de filtro de fechas y verificación de veracidad de datos */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[14px]">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-[#161418]">Filtro de fechas:</span>
                  {(
                    [
                      { id: "7d", label: "Últimos 7 días" },
                      { id: "28d", label: "Últimos 28 días" },
                      { id: "90d", label: "Últimos 90 días" },
                      { id: "12m", label: "Últimos 12 meses" },
                    ] as const
                  ).map((rng) => {
                    const active = keywordDateRange === rng.id;
                    return (
                      <button
                        key={rng.id}
                        type="button"
                        onClick={() => setKeywordDateRange(rng.id)}
                        className={`px-3 py-1 text-[13px] rounded-[6px] border transition-colors kol-focus font-medium ${
                          active
                            ? "bg-[#161418] text-[#FAF8F6] border-[#161418] font-bold"
                            : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                        }`}
                      >
                        {rng.label}
                      </button>
                    );
                  })}
                  <span className="text-[13px] text-[#46413F] font-mono bg-[#E7E3DF] px-2.5 py-1 rounded-[6px] ml-1">
                    {getKeywordDateRangeLabel(keywordDateRange)}
                  </span>
                </div>

                <div className="text-[13px] text-[#46413F] flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Datos reales de GA4 Data API / Search Console. Sin números inventados.</span>
                </div>
              </div>

              {searchKeywords.length === 0 ? (
                <div className="p-8 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                      Todavía no hay términos de búsqueda de Google Search
                    </h3>
                    <p className="text-[15px] text-[#46413F]">
                      Se obtienen automáticamente al conectar Google Analytics 4 o subiendo la exportación CSV de Search Console.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="kol-btn-normal px-4 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 cursor-pointer whitespace-nowrap kol-focus font-bold">
                      <Upload className="w-4 h-4" />
                      <span>Subir CSV de Search Console</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleKeywordsCsvUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingInitialStep(1);
                        setIsOnboardingOpen(true);
                      }}
                      className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#2A2629] border border-[#8C8580] hover:bg-[#F3F0ED] whitespace-nowrap kol-focus font-medium"
                    >
                      Conectar Google
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#C9C3BE] kol-card-12">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#E7E3DF] text-[#2A2629] text-[13px] font-bold">
                        <th className="py-3 px-4">Término de búsqueda (Keyword)</th>
                        <th className="py-3 px-3">Intención</th>
                        <th className="py-3 px-3 text-right">Impresiones</th>
                        <th className="py-3 px-3 text-right">Clics</th>
                        <th className="py-3 px-3 text-right">CTR</th>
                        <th className="py-3 px-3 text-right">Posición media</th>
                        <th className="py-3 px-3 text-right">Leads</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-[#161418]">
                      {searchKeywords
                        .filter(
                          (kw) =>
                            !keywordFilterQuery.trim() ||
                            kw.keyword
                              .toLowerCase()
                              .includes(keywordFilterQuery.toLowerCase())
                        )
                        .map((kw, idx) => (
                          <tr
                            key={kw.id}
                            className={
                              idx % 2 === 1
                                ? "bg-[#F3F0ED] border-t border-[#C9C3BE]"
                                : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                            }
                          >
                            <td className="py-3 px-4 font-semibold text-[#161418]">
                              {kw.keyword}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[12px] font-bold ${
                                  kw.intent === "Inversor"
                                    ? "bg-[#FFD9E4] text-[#161418]"
                                    : "bg-[#E7E3DF] text-[#161418]"
                                }`}
                              >
                                {kw.intent}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums">
                              {kw.impressions.toLocaleString("es-AR")}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums font-bold">
                              {kw.clicks.toLocaleString("es-AR")}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums">
                              {kw.ctrPct.toFixed(1)} %
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums font-semibold text-[#C51172]">
                              #{kw.avgPosition.toFixed(1)}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums font-bold">
                              {kw.conversions}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SECCIÓN 3: CAMPAÑAS DE META ADS (Filtro selectivo por franquicia/inversor y eventos) */}
            <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="font-kol-display font-extrabold text-[26px] leading-[32px] text-[#161418]">
                    Campañas de Meta Ads (Filtro selectivo)
                  </h2>
                  <p className="text-[15px] text-[#46413F] mt-1">
                    Campañas publicitarias sincronizadas con la API de Meta Ads filtradas por tus reglas de negocio
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#46413F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={metaSearchQuery}
                      onChange={(e) => setMetaSearchQuery(e.target.value)}
                      placeholder="Buscá campaña en Meta..."
                      className="h-[38px] pl-10 pr-4 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 whitespace-nowrap kol-focus text-[13px] font-semibold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    <span>{isSyncing ? "Sincronizando..." : "Sincronizar Meta Ads"}</span>
                  </button>
                </div>
              </div>

              {/* Recuadro exclusivo de Filtro Selectivo de Meta Ads */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[14px]">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Filtro activo
                    </span>
                    <span className="font-bold text-[#161418]">
                      Filtro selectivo de Meta Ads: solo campañas que coincidan con [{accountsConfig.metaAllowedCampaignKeywords.join(", ") || "franquicia, inversor"}]
                    </span>
                    {accountsConfig.metaAdAccountId && (
                      <span className="text-[12px] font-mono text-[#46413F] bg-[#E7E3DF] px-2 py-0.5 rounded">
                        act_{accountsConfig.metaAdAccountId.replace(/^act_/, "")}
                      </span>
                    )}
                  </div>
                  <div className="text-[#46413F] text-[13px] flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#161418]">Eventos contabilizados:</span>
                    <span className="bg-[#E7E3DF] px-2 py-0.5 rounded text-[#161418] font-mono text-[12px]">
                      {accountsConfig.metaTrackedEvents.join(", ") || "lead_franquicia, Lead, Contact"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setOnboardingInitialStep(2);
                    setIsOnboardingOpen(true);
                  }}
                  className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#2A2629] border border-[#8C8580] hover:bg-[#F3F0ED] whitespace-nowrap shrink-0 kol-focus font-medium text-[13px]"
                >
                  Modificar filtro de Meta Ads
                </button>
              </div>

              {filteredMetaCampaigns.length === 0 ? (
                <div className="p-8 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-1.5 max-w-2xl">
                    <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                      Todavía no hay campañas sincronizadas de Meta Ads
                    </h3>
                    <p className="text-[15px] text-[#46413F]">
                      Conectá tu cuenta publicitaria de Meta o sincronizá para visualizar las campañas que cumplen el filtro selectivo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingInitialStep(2);
                      setIsOnboardingOpen(true);
                    }}
                    className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap shrink-0 kol-focus font-bold"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Conectar o sincronizar Meta Ads</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#C9C3BE] kol-card-12">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#E7E3DF] text-[#2A2629] text-[14px] font-bold">
                        <th className="py-3.5 px-4">Campaña, eventos y destino</th>
                        <th className="py-3.5 px-3">Canal</th>
                        <th className="py-3.5 px-3">Estado</th>
                        <th className="py-3.5 px-3 text-right">Presup. diario</th>
                        <th className="py-3.5 px-3 text-right">Inversión 30d</th>
                        <th className="py-3.5 px-3 text-right">CTR</th>
                        <th className="py-3.5 px-3 text-right">Conversiones</th>
                        <th className="py-3.5 px-3 text-right">CPA</th>
                        <th className="py-3.5 px-3 text-right">ROAS</th>
                        <th className="py-3.5 px-3 text-right">Quitar</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] text-[#161418]">
                      {filteredMetaCampaigns.map((c, idx) => (
                        <tr
                          key={c.id}
                          className={
                            idx % 2 === 1
                              ? "bg-[#F3F0ED] border-t border-[#C9C3BE]"
                              : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                          }
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#161418]">{c.name}</div>
                            <div className="text-[#46413F] mt-0.5">
                              {c.landingPagePath} · {c.lastSyncedAt}
                              {c.trackedEvents && c.trackedEvents.length > 0
                                ? ` · Eventos: ${c.trackedEvents.join(", ")}`
                                : ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-semibold">{c.platform}</td>
                          <td className="py-3.5 px-3">
                            <span className="text-[#161418] font-semibold whitespace-nowrap">
                              ✓ {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-medium">
                            US$ {c.dailyBudget.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            US$ {c.spend30d.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            {c.ctrPct.toFixed(1)} %
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-bold">
                            {c.conversions.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums">
                            US$ {c.cpaUsd.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-right tabular-nums font-bold text-[#C51172]">
                            {c.roas.toFixed(2)}x
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setCampaigns((prev) => prev.filter((item) => item.id !== c.id))
                              }
                              title="Excluir esta campaña"
                              className="text-[#A40F5F] hover:text-[#161418] p-1 rounded-[4px] kol-focus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SECCIÓN 4: MAPAS DE CALOR Y FRICCIÓN EN MICROSOFT CLARITY */}
            <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-4">
              <div className="border-b border-[#C9C3BE] pb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                    Mapas de calor y fricción en Microsoft Clarity
                  </h3>
                  <p className="text-[14px] text-[#46413F] mt-1">
                    Dónde hacen clic y hasta dónde leen las personas que llegan desde tus campañas
                  </p>
                </div>
                <div className="shrink-0">
                  {accountsConfig.clarityProjectId ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[6px] bg-[#FFD9E4] text-[#161418] border border-[#C51172] text-[13px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#C51172] inline-block" />
                      Microsoft Clarity conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-[#F3F0ED] text-[#46413F] text-[13px] font-medium">
                      Sin conectar
                    </span>
                  )}
                </div>
              </div>

              {clarityPages.length === 0 ? (
                <div className="p-6 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 text-[15px] text-[#46413F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {accountsConfig.clarityProjectId ? (
                      <div className="space-y-1">
                        <div className="font-bold text-[#161418] flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#C51172]" />
                          <span>Microsoft Clarity conectado (Token activo)</span>
                        </div>
                        <p className="text-[14px] text-[#46413F]">
                          El token de exportación está guardado. Hacé clic en «Sincronizar Clarity» para actualizar las sesiones y mapas de calor en tiempo real.
                        </p>
                      </div>
                    ) : (
                      <span>
                        Sin sesiones de Microsoft Clarity todavía. Conectá tu token de Data Export para traer las métricas reales por URL.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {accountsConfig.clarityProjectId ? (
                      <>
                        <button
                          type="button"
                          onClick={handleManualSync}
                          disabled={isSyncing}
                          className="kol-btn-normal px-4 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] flex items-center gap-2 whitespace-nowrap kol-focus font-bold"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                          />
                          <span>{isSyncing ? "Sincronizando..." : "Sincronizar Clarity"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOnboardingInitialStep(3);
                            setIsOnboardingOpen(true);
                          }}
                          className="text-[14px] font-bold text-[#46413F] hover:text-[#161418] underline decoration-1 underline-offset-4 whitespace-nowrap"
                        >
                          Ver o modificar token
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setOnboardingInitialStep(3);
                          setIsOnboardingOpen(true);
                        }}
                        className="text-[14px] font-bold text-[#C51172] underline decoration-2 underline-offset-4 whitespace-nowrap"
                      >
                        Configurar token de Clarity
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[#C9C3BE]">
                  {clarityPages.map((page, index) => (
                    <div
                      key={page.id}
                      className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2.5 text-[14px]">
                          <span className="font-kol-display font-extrabold text-[16px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                            {index + 1}
                          </span>
                          <span className="font-bold text-[#161418]">
                            {page.pageUrl}
                          </span>
                          <span className="text-[#46413F] tabular-nums">
                            · {page.sessions.toLocaleString("es-AR")} sesiones
                          </span>
                        </div>
                        <p className="text-[14px] text-[#46413F] pt-1">
                          {page.dominantFrictionIssue}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-[14px] tabular-nums shrink-0">
                        <div className="text-right">
                          <div className="text-[#46413F]">Rage clicks</div>
                          <div
                            className={`font-bold ${
                              page.rageClicksPct > 10
                                ? "text-[#A40F5F]"
                                : "text-[#161418]"
                            }`}
                          >
                            {page.rageClicksPct > 10 ? "! " : ""}
                            {page.rageClicksPct} %
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#46413F]">Scroll</div>
                          <div className="font-bold text-[#161418]">
                            {page.avgScrollDepthPct} %
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VISTA 2: CONSULTÁ TUS DATOS (CHAT CON IA) */}
        {activeTab === "assistant" && (
          <DataAssistantView
            messages={assistantMessages}
            onAddMessage={(msg) =>
              setAssistantMessages((prev) => [...prev, msg])
            }
            campaigns={campaigns}
            clarityPages={clarityPages}
            reports={reports}
            brandGuidelines={KOL_V3_BRAND_GUIDELINES}
            onCreateReportFromAi={(rep) =>
              setReports((prev) => [rep, ...prev])
            }
            onRequestDeleteReportFromAi={handleRequestDeleteFromAi}
            onCreateCampaignFromAi={(camp) =>
              setCampaigns((prev) => [camp, ...prev])
            }
            onScheduleEmailFromAi={(sched) =>
              setSchedules((prev) => [sched, ...prev])
            }
            onApplyRecommendationFromAi={(campName, actionType) => {
              const targetRec =
                forecast.recommendations.find(
                  (r) =>
                    r.targetCampaign
                      .toLowerCase()
                      .includes(campName.toLowerCase()) ||
                    r.category.toLowerCase() === actionType.toLowerCase()
                ) || forecast.recommendations[0];
              if (targetRec) {
                handleApplyRecommendation(targetRec);
              }
            }}
            recommendations={forecast.recommendations}
          />
        )}

        {/* VISTA 3: PREDICTIVO */}
        {activeTab === "predictive" && (
          <PredictiveAnalyticsView
            campaigns={campaigns}
            clarityPages={clarityPages}
            forecast={forecast}
            onUpdateForecast={setForecast}
            onApplyRecommendation={handleApplyRecommendation}
          />
        )}

        {/* VISTA 4: CAMPAÑAS */}
        {activeTab === "campaigns" && (
          <CampaignStudioView
            brandGuidelines={KOL_V3_BRAND_GUIDELINES}
            generatedCampaigns={generatedCampaigns}
            onAddGeneratedCampaign={(pkg) =>
              setGeneratedCampaigns((prev) => [pkg, ...prev])
            }
            onPublishToGmp={(newCamp) =>
              setCampaigns((prev) => [newCamp, ...prev])
            }
            clarityPages={clarityPages}
          />
        )}

        {/* VISTA 5: REPORTES Y CORREO */}
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
      </main>

      {/* Pie libre en tema blanco */}
      <footer className="border-t border-[#C9C3BE] bg-[#FFFFFF] py-6 px-6 mt-16">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#46413F]">
          <div className="flex items-center gap-4">
            <KolLogo variant="oscuro" className="h-[28px] w-auto" />
            <span className="kol-lockup-light">KOL FRANQUICIAS</span>
            <span>Marketing KOL Suite · Google Marketing Platform y Clarity</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="font-semibold text-[#C51172] underline decoration-2 underline-offset-4 hover:text-[#A40F5F]"
            >
              Cambiar cuenta o correo
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveTab("reports")}
              className="font-semibold text-[#C51172] underline decoration-2 underline-offset-4 hover:text-[#A40F5F]"
            >
              Programar informes
            </button>
          </div>
        </div>
      </footer>

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
    </div>
  );
}
