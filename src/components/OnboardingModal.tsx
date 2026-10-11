import { useConnectionsStatus } from "../lib/secrets";
import React, { useState, useEffect } from "react";
import {
  ConnectedAccountsConfig,
  CampaignMetric,
  ClarityPageTelemetry,
  DiscoveredCampaignCandidate,
} from "../types/marketing";
import { Check, RefreshCw, Upload, X, Plus, Trash2, Filter } from "lucide-react";
import { KolLogo } from "./KolLogo";

interface OnboardingModalProps {
  isOpen: boolean;
  initialStep?: 1 | 2 | 3 | 4;
  onClose: () => void;
  config: ConnectedAccountsConfig;
  onSaveConfig: (updated: ConnectedAccountsConfig) => void;
  onSyncRealData: (
    campaigns: CampaignMetric[],
    clarityPages: ClarityPageTelemetry[]
  ) => void;
}

const AVAILABLE_GMP_MODULES = [
  "Google Analytics 4 (Data API v1beta)",
  "Google Search (Términos y palabras clave)",
];

const PRESET_META_EVENTS = [
  { id: "lead_franquicia", label: "lead_franquicia (Evento clave KOL)" },
  { id: "Lead", label: "Lead (Formulario Meta / Web)" },
  { id: "Contact", label: "Contact (WhatsApp / Consulta)" },
  { id: "Schedule", label: "Schedule (Agenda de reunión)" },
  { id: "CompleteRegistration", label: "CompleteRegistration (Registro)" },
  { id: "ViewContent", label: "ViewContent (Calculadora de recupero)" },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  initialStep = 1,
  onClose,
  config,
  onSaveConfig,
  onSyncRealData,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const [gmpEmail, setGmpEmail] = useState(config.gmpAccountEmail);
  const [gmpPropertyId, setGmpPropertyId] = useState(config.gmpPropertyId);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    config.gmpConnectedModules
  );
  const connections = useConnectionsStatus();
  // Las claves no se piden ni se guardan acá: viven en los Secrets del servidor
  const [oauthToken, setOauthToken] = useState("");

  // Estado para Meta Ads con selección de campañas y eventos específicos
  const [metaAdAccountId, setMetaAdAccountId] = useState(
    config.metaAdAccountId
  );
  const [metaAccessToken, setMetaAccessToken] = useState(
    ""
  );
  const [metaPixelId, setMetaPixelId] = useState(config.metaPixelId);
  const [metaOnlySpecific, setMetaOnlySpecific] = useState<boolean>(
    config.metaOnlySpecificCampaigns
  );
  const [metaKeywords, setMetaKeywords] = useState<string[]>(
    config.metaAllowedCampaignKeywords
  );
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [metaTrackedEvents, setMetaTrackedEvents] = useState<string[]>(
    config.metaTrackedEvents
  );
  const [newCustomEventInput, setNewCustomEventInput] = useState("");
  const [discoveredCandidates, setDiscoveredCandidates] = useState<
    DiscoveredCampaignCandidate[]
  >([]);

  const [clarityToken, setClarityToken] = useState(config.clarityProjectId);
  const [showClarityToken, setShowClarityToken] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(
    config.defaultReportRecipientEmail
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncingApi, setIsSyncingApi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setGmpEmail(config.gmpAccountEmail);
      setGmpPropertyId(config.gmpPropertyId);
      setSelectedModules(config.gmpConnectedModules);
      setOauthToken("");
      setMetaAdAccountId(config.metaAdAccountId);
      setMetaAccessToken("");
      setMetaPixelId(config.metaPixelId);
      setMetaOnlySpecific(config.metaOnlySpecificCampaigns);
      setMetaKeywords(config.metaAllowedCampaignKeywords);
      setMetaTrackedEvents(config.metaTrackedEvents);
      setClarityToken(config.clarityProjectId);
      setRecipientEmail(config.defaultReportRecipientEmail);
    }
  }, [isOpen, initialStep, config]);

  if (!isOpen) return null;

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const toggleMetaEvent = (evName: string) => {
    setMetaTrackedEvents((prev) =>
      prev.includes(evName)
        ? prev.filter((e) => e !== evName)
        : [...prev, evName]
    );
  };

  const handleAddKeyword = () => {
    const clean = newKeywordInput.trim();
    if (!clean) return;
    if (!metaKeywords.includes(clean)) {
      setMetaKeywords((prev) => [...prev, clean]);
    }
    setNewKeywordInput("");
  };

  const handleRemoveKeyword = (kw: string) => {
    setMetaKeywords((prev) => prev.filter((item) => item !== kw));
  };

  const handleAddCustomEvent = () => {
    const clean = newCustomEventInput.trim();
    if (!clean) return;
    if (!metaTrackedEvents.includes(clean)) {
      setMetaTrackedEvents((prev) => [...prev, clean]);
    }
    setNewCustomEventInput("");
  };

  const matchesKeywordRule = (campName: string, campId: string): boolean => {
    if (!metaOnlySpecific) return true;
    if (metaKeywords.length === 0) return true;
    const lowerName = campName.toLowerCase();
    const lowerId = campId.toLowerCase();
    return metaKeywords.some(
      (kw) =>
        lowerName.includes(kw.toLowerCase()) ||
        lowerId.includes(kw.toLowerCase())
    );
  };

  // Sincronización real contra Google Analytics Data API v1beta, Meta Marketing API v21.0 y Microsoft Clarity API
  const handleLiveApiSync = async () => {
    setErrorMsg(null);
    setStatusMsg(null);

    if (
      !gmpPropertyId.trim() &&
      !metaAdAccountId.trim() &&
      !connections.clarity
    ) {
      setErrorMsg(
        "Ingresá tu Property ID de GA4, tu Ad Account ID de Meta Ads o tu token de Microsoft Clarity, o subí un archivo CSV exportado"
      );
      return;
    }

    setIsSyncingApi(true);
    try {
      const selectedCandidateNames = discoveredCandidates
        .filter((c) => c.selected)
        .map((c) => c.name);

      const res = await fetch("/api/gmp/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga4PropertyId: gmpPropertyId.trim(),
          metaAdAccountId: metaAdAccountId.trim(),
          metaOnlySpecificCampaigns: metaOnlySpecific,
          metaAllowedCampaignKeywords: metaKeywords,
          metaSelectedCampaignNames: selectedCandidateNames,
          metaTrackedEvents,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al conectar con las APIs");
      }

      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setErrorMsg(data.errors.join(" | "));
      }

      const rawDiscovered: CampaignMetric[] = Array.isArray(
        data.discoveredCampaigns
      )
        ? data.discoveredCampaigns
        : [];

      if (rawDiscovered.length > 0) {
        setDiscoveredCandidates(
          rawDiscovered.map((c) => ({
            id: c.id,
            name: c.name,
            platform: c.platform,
            spend30d: c.spend30d,
            conversions: c.conversions,
            detectedEvents: c.trackedEvents || metaTrackedEvents,
            selected: matchesKeywordRule(c.name, c.id),
            rawMetric: c,
          }))
        );
      }

      const newCampaigns = Array.isArray(data.campaigns) ? data.campaigns : [];
      const newClarity = Array.isArray(data.clarityPages)
        ? data.clarityPages
        : [];

      if (newCampaigns.length > 0 || newClarity.length > 0) {
        onSyncRealData(newCampaigns, newClarity);
        const totalDiscoveredCount = rawDiscovered.length || newCampaigns.length;
        setStatusMsg(
          `✓ Se sincronizaron datos reales (${newCampaigns.length} campañas y ${newClarity.length} páginas de Clarity)`
        );
      } else if (!data.errors || data.errors.length === 0) {
        setStatusMsg(
          "Conexión exitosa: credenciales validadas"
        );
      }
      // Guardar automáticamente la configuración ingresada
      onSaveConfig({
        onboardingCompleted: true,
        gmpAccountEmail: gmpEmail.trim(),
        gmpPropertyId: gmpPropertyId.trim(),
        gmpConnectedModules:
          selectedModules.length > 0 ? selectedModules : AVAILABLE_GMP_MODULES,
        oauthAccessToken: "",
        metaAdAccountId: metaAdAccountId.trim(),
        metaAccessToken: "",
        metaPixelId: metaPixelId.trim(),
        metaOnlySpecificCampaigns: metaOnlySpecific,
        metaAllowedCampaignKeywords: metaKeywords,
        metaSelectedCampaignNames: discoveredCandidates
          .filter((c) => c.selected)
          .map((c) => c.name),
        metaTrackedEvents,
        clarityProjectId: clarityToken.trim(),
        clarityConnected: connections.clarity,
        defaultReportRecipientEmail: recipientEmail.trim() || gmpEmail.trim(),
        realtimeSyncActive: connections.ga4.connected || connections.meta || connections.clarity,
      });
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo consultar la API"
      );
    } finally {
      setIsSyncingApi(false);
    }
  };

  // Importación de CSV real (de Meta Ads Manager o Google Marketing Platform) con selección específica de campañas y eventos
  const handleCsvUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    defaultPlatform: "Meta Ads" | "GA4" = "GA4"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || "");
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      if (lines.length < 2) {
        setErrorMsg("El archivo CSV no contiene filas de datos válidas");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const candidates: DiscoveredCampaignCandidate[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length < 2) continue;

        const getCol = (keywords: string[], fallbackIdx: number) => {
          const idx = headers.findIndex((h) =>
            keywords.some((k) => h.includes(k))
          );
          return idx >= 0 ? cols[idx] : cols[fallbackIdx] || "";
        };

        const name = getCol(
          ["campaign name", "nombre de la campaña", "campaña", "campaign", "name", "nombre"],
          0
        );
        if (!name) continue;

        const platRaw = getCol(
          ["plataforma", "platform", "source", "canal", "publisher"],
          1
        ).toUpperCase();

        const platform: "DV360" | "SA360" | "CM360" | "GA4" | "Meta Ads" =
          platRaw.includes("META") ||
          platRaw.includes("FACEBOOK") ||
          platRaw.includes("INSTAGRAM") ||
          platRaw.includes("FB") ||
          defaultPlatform === "Meta Ads"
            ? "Meta Ads"
            : platRaw.includes("DV360")
            ? "DV360"
            : platRaw.includes("SA360")
            ? "SA360"
            : platRaw.includes("CM360")
            ? "CM360"
            : "GA4";

        const spend =
          Number(
            getCol(
              ["amount spent", "importe gastado", "spend", "cost", "inversión", "costo"],
              2
            )
          ) || 0;
        const conversions =
          Number(
            getCol(
              ["results", "resultados", "leads", "lead_franquicia", "conv", "conversiones"],
              3
            )
          ) || 0;
        const roas =
          Number(getCol(["roas", "purchase roas", "retorno"], 4)) || 0;
        const clicks =
          Number(getCol(["link clicks", "clics en el enlace", "clicks", "clics"], 5)) || 0;
        const impressions =
          Number(getCol(["impressions", "impr", "impresiones"], 6)) || 0;
        const rageClicks = Number(getCol(["rage"], 7)) || 0;
        const scrollDepth = Number(getCol(["scroll"], 8)) || 0;
        const eventTypeCol = getCol(
          ["result indicator", "indicador de resultado", "event", "evento", "action_type"],
          -1
        );

        const detectedEvents = eventTypeCol
          ? [eventTypeCol.replace(/^actions:/, "")]
          : platform === "Meta Ads"
          ? metaTrackedEvents
          : ["lead_franquicia"];

        const campId = `csv-${i}-${Date.now().toString().slice(-3)}`;
        const isMatched =
          platform === "Meta Ads"
            ? matchesKeywordRule(name, campId)
            : true;

        const metricObj: CampaignMetric = {
          id: campId,
          name,
          platform,
          status: rageClicks > 10 ? "Atención UX" : "Activa",
          dailyBudget: Number((spend / 30).toFixed(2)),
          spend30d: spend,
          impressions,
          clicks,
          ctrPct:
            impressions > 0
              ? Number(((clicks / impressions) * 100).toFixed(2))
              : 0,
          conversions,
          cpaUsd:
            conversions > 0 ? Number((spend / conversions).toFixed(2)) : 0,
          roas,
          trackedEvents: detectedEvents,
          clarityRageClicksPct: rageClicks,
          clarityDeadClicksPct: 0,
          clarityScrollDepthPct: scrollDepth,
          clarityQuickbacksPct: 0,
          landingPagePath:
            getCol(["url", "landing", "page", "página"], -1) || "/",
          targetAudience:
            platform === "Meta Ads"
              ? `Meta Ads (${detectedEvents.join(", ")})`
              : "Importado desde CSV real",
          lastSyncedAt: "CSV seleccionado",
        };

        candidates.push({
          id: campId,
          name,
          platform,
          spend30d: spend,
          conversions,
          detectedEvents,
          selected: isMatched,
          rawMetric: metricObj,
        });
      }

      if (candidates.length > 0) {
        setDiscoveredCandidates(candidates);
        const approvedMetrics = candidates
          .filter((c) => c.selected)
          .map((c) => c.rawMetric);
        onSyncRealData(approvedMetrics, []);
        setStatusMsg(
          `✓ Se detectaron ${candidates.length} campañas en ${file.name} y se seleccionaron ${approvedMetrics.length} campañas específicas según tu filtro. Podés marcar o desmarcar cada una abajo.`
        );
      } else {
        setErrorMsg("No se pudieron interpretar columnas de campañas en el CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleToggleCandidate = (id: string) => {
    setDiscoveredCandidates((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, selected: !c.selected } : c
      );
      const selectedMetrics = updated
        .filter((c) => c.selected)
        .map((c) => c.rawMetric);
      onSyncRealData(selectedMetrics, []);
      return updated;
    });
  };

  const handleSelectOnlyMatchingKeywords = () => {
    setDiscoveredCandidates((prev) => {
      const updated = prev.map((c) => ({
        ...c,
        selected: matchesKeywordRule(c.name, c.id),
      }));
      onSyncRealData(
        updated.filter((c) => c.selected).map((c) => c.rawMetric),
        []
      );
      return updated;
    });
  };

  const handleFinish = () => {
    onSaveConfig({
      onboardingCompleted: true,
      gmpAccountEmail: gmpEmail.trim(),
      gmpPropertyId: gmpPropertyId.trim(),
      gmpConnectedModules:
        selectedModules.length > 0 ? selectedModules : AVAILABLE_GMP_MODULES,
      oauthAccessToken: "",
      metaAdAccountId: metaAdAccountId.trim(),
      metaAccessToken: "",
      metaPixelId: metaPixelId.trim(),
      metaOnlySpecificCampaigns: metaOnlySpecific,
      metaAllowedCampaignKeywords: metaKeywords,
      metaSelectedCampaignNames: discoveredCandidates
        .filter((c) => c.selected)
        .map((c) => c.name),
      metaTrackedEvents,
      clarityProjectId: clarityToken.trim(),
      clarityConnected: connections.clarity,
      defaultReportRecipientEmail: recipientEmail.trim() || gmpEmail.trim(),
      realtimeSyncActive: connections.ga4.connected || connections.meta || connections.clarity,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#161418]/70 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#46413F] bg-[#161418] text-[#FAF8F6]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <KolLogo variant="blanco" className="h-[32px] w-auto" />
              <span className="kol-lockup-dark">KOL FRANQUICIAS</span>
            </div>
            <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#FAF8F6]">
              Conectá tus datos reales y filtrá campañas específicas
            </h2>
            <p className="text-[14px] text-[#C9C3BE]">
              Podés conectar Google Analytics 4, Google Search, Meta Ads (eligiendo solo campañas y eventos específicos) y Microsoft Clarity
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="kol-btn-normal px-3 text-[#C9C3BE] hover:text-[#FAF8F6] kol-focus"
            aria-label="Cerrar diálogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper oficial KOL v3 de 4 pasos: número con filete de 3 px */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-4 border-b border-[#C9C3BE] bg-[#FFFFFF]">
          {(
            [
              {
                num: 1,
                title: "Google Analytics y Search",
                sub: "GA4 (372010641) y Search Console",
              },
              {
                num: 2,
                title: "Meta Ads (Inactivo)",
                sub: "Se activa con campañas de nov.",
              },
              {
                num: 3,
                title: "Microsoft Clarity",
                sub: "Proyecto y mapas de calor",
              },
              {
                num: 4,
                title: "Envío de informes",
                sub: "Destinatario de reportes",
              },
            ] as const
          ).map((item) => {
            const isCurrent = step === item.num;
            const isDone = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setStep(item.num)}
                className="text-left group kol-focus rounded-[4px]"
              >
                <div
                  className={`inline-block border-b-[3px] pb-1 ${
                    isCurrent
                      ? "border-[#C51172]"
                      : isDone
                      ? "border-[#161418]"
                      : "border-[#8C8580]"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-5 h-5 text-[#161418]" />
                  ) : (
                    <span
                      className={`font-kol-display font-extrabold text-[18px] ${
                        isCurrent ? "text-[#C51172]" : "text-[#46413F]"
                      }`}
                    >
                      {item.num}
                    </span>
                  )}
                </div>
                <div className="font-kol-display font-bold text-[15px] text-[#161418] mt-1.5">
                  {item.title}
                </div>
                <div className="text-[14px] text-[#46413F]">{item.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#A40F5F] rounded-[10px] text-[14px] text-[#A40F5F] font-medium flex items-start gap-2">
              <span className="font-bold">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3.5 bg-[#FFD9E4] border border-[#C9C3BE] rounded-[10px] text-[14px] text-[#161418] font-semibold">
              {statusMsg}
            </div>
          )}

          {/* PASO 1: GOOGLE MARKETING PLATFORM */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                    Correo de tu cuenta de Google
                  </label>
                  <input
                    type="email"
                    value={gmpEmail}
                    onChange={(e) => setGmpEmail(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                    GA4 Property ID numérico (ej. 384920192)
                  </label>
                  <input
                    type="text"
                    value={gmpPropertyId}
                    onChange={(e) => setGmpPropertyId(e.target.value)}
                    placeholder="Ej: 384920192"
                    className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                  />
                </div>
              </div>

              <div className={`p-3.5 rounded-[10px] border text-[13.5px] ${connections.ga4.connected ? "bg-[#F3F0ED] border-[#C9C3BE] text-[#161418]" : "bg-[#FAF8F6] border-[#A40F5F] text-[#161418]"}`}>
                <strong>{connections.ga4.connected ? "GA4: la clave está cargada en el servidor." : "GA4: falta conectar la clave en el servidor."}</strong>
                <p className="text-[#46413F] mt-1">
                  Por seguridad, las claves ya no se pegan en esta ventana ni se guardan en el navegador. Se cargan una sola vez en los <strong>Secrets</strong> del servidor.
                  La conexión con GA4 se hace en <strong>Campañas → Datos y archivos → Conexión con Google Analytics</strong>.
                </p>
              </div>

              <div className="p-4 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-kol-display font-bold text-[15px] text-[#161418]">
                    ¿Tenés un reporte exportado en CSV de GMP?
                  </div>
                  <p className="text-[14px] text-[#46413F]">
                    Subí tu archivo CSV real y elegí qué campañas incluir.
                  </p>
                </div>
                <label className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>Subir CSV de GMP</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCsvUpload(e, "GA4")}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-2">
                  Orígenes habilitados
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_GMP_MODULES.map((mod) => {
                    const active = selectedModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={`kol-btn-normal px-3.5 border flex items-center justify-between text-left ${
                          active
                            ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                            : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                        }`}
                      >
                        <span className="truncate">{mod}</span>
                        {active && (
                          <Check className="w-4 h-4 text-[#161418] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: META ADS (OCULTO/INACTIVO HASTA NOVIEMBRE) */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-4 bg-[#F3F0ED] border-2 border-[#161418] kol-card-12 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                    Decisión del 5/10/2026
                  </span>
                  <span className="font-kol-display font-bold text-[15px] text-[#161418]">
                    Meta Ads inactivo por ahora
                  </span>
                </div>
                <p className="text-[14px] text-[#161418] leading-relaxed">
                  No se mide Meta por ahora. <strong>Se activa con las campañas de noviembre.</strong> Podés dejar precargado tu Ad Account o token, pero el tablero no mezclará datos publicitarios hasta que comience la inversión de franquicia.
                </p>
              </div>

              {/* Credenciales Meta Marketing API o CSV de Meta Ads Manager */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                    Id. de cuenta publicitaria (Ad Account)
                  </label>
                  <input
                    type="text"
                    value={metaAdAccountId}
                    onChange={(e) => setMetaAdAccountId(e.target.value)}
                    placeholder="Ej: act_1092837465"
                    className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                    Id. del Pixel / Dataset de Meta
                  </label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="Ej: 847362910482"
                    className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                  />
                </div>

                <div className={`p-3 rounded-[10px] border text-[13px] ${connections.meta ? "bg-[#F3F0ED] border-[#C9C3BE]" : "bg-[#FAF8F6] border-[#A40F5F]"}`}>
                  <strong>{connections.meta ? "Meta: la clave está cargada en el servidor." : "Meta: falta la clave en el servidor."}</strong>
                  <p className="text-[#46413F] mt-1">Se carga en Secrets como <code>META_ACCESS_TOKEN</code>, no se pega acá.</p>
                </div>
              </div>

              {/* 1. Filtro de campañas específicas por nombre o ID */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-kol-display font-bold text-[15px] text-[#161418]">
                      1. Filtrar solo campañas específicas de Meta
                    </div>
                    <p className="text-[14px] text-[#46413F]">
                      Solo se importarán las campañas cuyo nombre o ID contenga alguno de estos términos o códigos exactos:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMetaOnlySpecific((v) => !v)}
                    className={`kol-chip-filter px-3 border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                      metaOnlySpecific
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580]"
                    }`}
                  >
                    {metaOnlySpecific && <Check className="w-3.5 h-3.5" />}
                    <span>
                      {metaOnlySpecific
                        ? "Filtro selectivo activo"
                        : "Traer todas (sin filtro)"}
                    </span>
                  </button>
                </div>

                {metaOnlySpecific && (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {metaKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="kol-chip-filter px-3 bg-[#FFFFFF] border border-[#161418] text-[#161418] flex items-center gap-2"
                        >
                          <span>{kw}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="text-[#A40F5F] hover:text-[#161418]"
                            aria-label={`Quitar filtro ${kw}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newKeywordInput}
                        onChange={(e) => setNewKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        placeholder="Escribí el nombre o ID exacto de la campaña (ej. KOL_Franquicias_Isla o 120210...)"
                        className="flex-1 h-[40px] px-3.5 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-1.5 whitespace-nowrap kol-focus"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agregar campaña / filtro</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 2. Selector de eventos específicos de Meta Pixel / CAPI */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] kol-card-12 space-y-3">
                <div>
                  <div className="font-kol-display font-bold text-[15px] text-[#161418]">
                    2. Eventos específicos de Meta Pixel / Conversions API a contabilizar
                  </div>
                  <p className="text-[14px] text-[#46413F]">
                    Marcá solo los eventos que cuentan como conversión real en tus campañas seleccionadas (ignoramos clics generales o reacciones):
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_META_EVENTS.map((ev) => {
                    const active = metaTrackedEvents.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => toggleMetaEvent(ev.id)}
                        className={`kol-btn-normal px-3.5 border flex items-center justify-between text-left ${
                          active
                            ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                            : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                        }`}
                      >
                        <span className="truncate text-[14px]">{ev.label}</span>
                        {active && (
                          <Check className="w-4 h-4 text-[#161418] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Eventos personalizados agregados por el usuario */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {metaTrackedEvents
                    .filter(
                      (ev) => !PRESET_META_EVENTS.some((p) => p.id === ev)
                    )
                    .map((customEv) => (
                      <span
                        key={customEv}
                        className="kol-chip-filter px-3 bg-[#E7E3DF] border border-[#161418] text-[#161418] flex items-center gap-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Evento custom: {customEv}</span>
                        <button
                          type="button"
                          onClick={() => toggleMetaEvent(customEv)}
                          className="text-[#A40F5F]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCustomEventInput}
                    onChange={(e) => setNewCustomEventInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomEvent();
                      }
                    }}
                    placeholder="Agregar otro evento personalizado de Pixel / CAPI (ej. lead_whatsapp_franquicia)"
                    className="flex-1 h-[40px] px-3.5 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomEvent}
                    className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-1.5 whitespace-nowrap kol-focus"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sumar evento</span>
                  </button>
                </div>
              </div>

              {/* 3. Subir CSV de Meta Ads Manager y elegir manualmente con checkboxes qué campañas incluir */}
              <div className="p-4 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-kol-display font-bold text-[15px] text-[#161418]">
                    ¿Exportaste un CSV desde el Administrador de Anuncios de Meta?
                  </div>
                  <p className="text-[14px] text-[#46413F]">
                    Subilo acá: te mostramos todas las campañas del archivo para que marques con tilde (✓) únicamente las campañas específicas que querés incluir.
                  </p>
                </div>
                <label className="kol-btn-normal px-4 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>Subir CSV de Meta Ads</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleCsvUpload(e, "Meta Ads")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Lista interactiva de campañas detectadas para tildar o destildar una por una */}
              {discoveredCandidates.length > 0 && (
                <div className="p-4 bg-[#FFFFFF] border border-[#161418] kol-card-12 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9C3BE] pb-3">
                    <div>
                      <div className="font-kol-display font-bold text-[15px] text-[#161418]">
                        Elegí manualmente qué campañas incluir ({discoveredCandidates.filter((c) => c.selected).length} de {discoveredCandidates.length} seleccionadas)
                      </div>
                      <p className="text-[14px] text-[#46413F]">
                        Las campañas sin tilde quedan descartadas y no entran al tablero ni a los reportes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectOnlyMatchingKeywords}
                      className="kol-chip-filter px-3 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] whitespace-nowrap"
                    >
                      Aplicar filtro por palabras clave
                    </button>
                  </div>

                  <div className="divide-y divide-[#C9C3BE] max-h-48 overflow-y-auto">
                    {discoveredCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-[14px]"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleCandidate(cand.id)}
                          className="flex items-center gap-3 text-left flex-1 kol-focus rounded-[4px]"
                        >
                          <span
                            className={`w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 ${
                              cand.selected
                                ? "bg-[#C51172] border-[#C51172] text-[#FFFFFF]"
                                : "bg-[#FFFFFF] border-[#8C8580]"
                            }`}
                          >
                            {cand.selected && <Check className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <div className="font-bold text-[#161418]">
                              {cand.name}
                            </div>
                            <div className="text-[#46413F]">
                              {cand.platform} · Eventos: {cand.detectedEvents.join(", ")}
                            </div>
                          </div>
                        </button>
                        <div className="text-right tabular-nums shrink-0">
                          <div className="font-semibold text-[#161418]">
                            US$ {cand.spend30d.toLocaleString("es-AR")}
                          </div>
                          <div className="text-[#46413F]">
                            {cand.conversions} conv.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: MICROSOFT CLARITY API */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F3F0ED] kol-card-12 text-[15px] text-[#161418] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#161418]">
                    Microsoft Clarity (Mapas de calor y comportamiento UX)
                  </span>
                  {connections.clarity && (
                    <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-[6px] bg-[#F3F0ED] text-[#161418] border border-[#C9C3BE]">
                      ✓ Clave cargada en el servidor
                    </span>
                  )}
                </div>
                <p className="text-[14px] text-[#46413F]">
                  Microsoft Clarity analiza mapas de calor, clics de rabia y profundidad de lectura en tu web (no gestiona campañas de pauta).
                </p>

              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5" htmlFor="clarity-project-id">
                  ID del proyecto de Clarity (no es una clave, ej. ytmpieugg9)
                </label>
                <input
                  id="clarity-project-id"
                  type="text"
                  value={clarityToken}
                  onChange={(e) => setClarityToken(e.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 20))}
                  placeholder="ytmpieugg9"
                  className="w-full h-[40px] px-3.5 text-[14px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] font-mono kol-focus"
                />
                <div className={`mt-2 p-3 rounded-[10px] border text-[13px] ${connections.clarity ? "bg-[#F3F0ED] border-[#C9C3BE]" : "bg-[#FAF8F6] border-[#A40F5F]"}`}>
                  <strong>{connections.clarity ? "Clarity: la clave de exportación está cargada en el servidor." : "Clarity: falta la clave de exportación en el servidor."}</strong>
                  <p className="text-[#46413F] mt-1">Se genera en Clarity (Settings → Data Export → Generate new API token) y se carga en Secrets como <code>CLARITY_API_TOKEN</code>. No se pega acá.</p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: ENVÍO DE INFORMES */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F3F0ED] kol-card-12 text-[15px] text-[#161418]">
                Indicá a qué correo electrónico querés que se envíen los informes periódicos de rendimiento de tus campañas seleccionadas.
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Correo destinatario para informes periódicos
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="tu-correo@empresa.com"
                  className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#C9C3BE] bg-[#FAF8F6]">
          <button
            type="button"
            onClick={handleLiveApiSync}
            disabled={isSyncingApi}
            className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 kol-focus"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncingApi ? "animate-spin" : ""}`}
            />
            <span>
              {isSyncingApi ? "Consultando APIs..." : "Sincronizar ahora"}
            </span>
          </button>

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() =>
                  setStep((s) => (s === 4 ? 3 : s === 3 ? 2 : 1))
                }
                className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#F3F0ED] kol-focus"
              >
                Anterior
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={() =>
                  setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 4))
                }
                className="kol-btn-normal px-4 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#F3F0ED] kol-focus"
              >
                Siguiente
              </button>
            )}
            <button
              type="button"
              onClick={handleFinish}
              className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] kol-focus font-bold"
            >
              Guardar configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
