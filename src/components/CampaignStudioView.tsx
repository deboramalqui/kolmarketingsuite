import React, { useState } from "react";
import {
  BrandDesignGuidelines,
  ClarityPageTelemetry,
  GeneratedCampaignPackage,
  CampaignMetric,
} from "../types/marketing";
import { RefreshCw, Check, ArrowUpRight } from "lucide-react";
import { KolLogo } from "./KolLogo";

interface CampaignStudioViewProps {
  brandGuidelines: BrandDesignGuidelines;
  generatedCampaigns: GeneratedCampaignPackage[];
  onAddGeneratedCampaign: (pkg: GeneratedCampaignPackage) => void;
  onPublishToGmp: (campaign: CampaignMetric) => void;
  clarityPages: ClarityPageTelemetry[];
}

export const CampaignStudioView: React.FC<CampaignStudioViewProps> = ({
  brandGuidelines,
  generatedCampaigns,
  onAddGeneratedCampaign,
  onPublishToGmp,
  clarityPages,
}) => {
  const [briefName, setBriefName] = useState(
    "KOL_Franquicias_Captacion_Inversores_Q4"
  );
  const [platform, setPlatform] = useState<
    "Meta Ads" | "DV360" | "SA360" | "CM360"
  >("Meta Ads");
  const [targetEventName, setTargetEventName] =
    useState<string>("lead_franquicia");
  const [formatoLocal, setFormatoLocal] = useState<"isla" | "estandar">("isla");
  const [plazoRecupero, setPlazoRecupero] = useState<12 | 18 | 24>(18);
  const [dailyBudget, setDailyBudget] = useState<number>(950);
  const [targetAudience, setTargetAudience] = useState(
    "Inversores en Buenos Aires, Santa Fe, Rosario y Córdoba con vista a calculadora de recupero en GA4"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [selectedCampaignIdx, setSelectedCampaignIdx] = useState(0);

  const inversionTotalUsd = formatoLocal === "isla" ? 23000 : 35300;
  const recuperoMensualRef = Math.round(inversionTotalUsd / plazoRecupero);

  const handleGenerateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg(null);

    const objectiveText = `Captación de leads (evento ${targetEventName}) para formato ${
      formatoLocal === "isla" ? "Isla desde US$ 23.000" : "Estándar desde US$ 35.300"
    } con recupero de referencia en ${plazoRecupero} meses`;

    try {
      const response = await fetch("/api/ai/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: {
            campaignName: briefName,
            platform,
            objective: objectiveText,
            dailyBudget,
            targetAudience,
            kolData: {
              derechoInicial: "US$ 3.000 exactos, pago único",
              regalias: "0 %",
              canonPublicidad: "0 %",
              inversionTotal: `Desde US$ ${inversionTotalUsd.toLocaleString("es-AR")}`,
              plazoRecuperoMeses: plazoRecupero,
              locales: "10 locales en Argentina (5 propios y 5 en franquicia)",
            },
          },
          brandGuidelines,
          clarityInsights: clarityPages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo generar la campaña automatizada"
        );
      }

      const newPkg: GeneratedCampaignPackage = {
        id: `gen-camp-${Date.now()}`,
        campaignName: data.campaignName || briefName,
        platform: data.platform || platform,
        objective: data.objective || objectiveText,
        dailyBudget: Number(data.dailyBudget) || dailyBudget,
        targetAudience: data.targetAudience || targetAudience,
        biddingStrategy:
          data.biddingStrategy ||
          "Maximizar evento clave lead_franquicia en GA4",
        designComplianceNote:
          data.designComplianceNote ||
          "Aplicada Guía de marca v3 de KOL Franquicias: número primero, voseo rioplatense, bloque oscuro #161418 con ámbar #FFBA00 (texto negro) y tarjeta clara con magenta #C51172.",
        clarityUxAdaptation:
          data.clarityUxAdaptation ||
          "Tráfico dirigido a la calculadora interactiva con 79 % de profundidad de scroll en Clarity.",
        creatives: Array.isArray(data.creatives) ? data.creatives : [],
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      onAddGeneratedCampaign(newPkg);
      setSelectedCampaignIdx(0);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al generar la campaña"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishCampaign = (pkg: GeneratedCampaignPackage) => {
    const newGmpCampaign: CampaignMetric = {
      id: `cmp-${Date.now()}`,
      name: pkg.campaignName,
      platform: pkg.platform.includes("Meta")
        ? "Meta Ads"
        : pkg.platform.includes("SA360")
        ? "SA360"
        : pkg.platform.includes("CM360")
        ? "CM360"
        : "DV360",
      status: "Activa",
      dailyBudget: pkg.dailyBudget,
      spend30d: pkg.dailyBudget * 10,
      impressions: 320000,
      clicks: 9920,
      ctrPct: pkg.creatives[0]?.predictedCtrPct || 3.1,
      conversions: 118,
      cpaUsd: Number(((pkg.dailyBudget * 10) / 118).toFixed(2)),
      roas: 6.25,
      trackedEvents: [targetEventName],
      clarityRageClicksPct: 1.8,
      clarityDeadClicksPct: 2.1,
      clarityScrollDepthPct: 83,
      clarityQuickbacksPct: 4.4,
      landingPagePath: "/calculadora-recupero-18-24-meses",
      targetAudience: pkg.targetAudience,
      lastSyncedAt: "Sincronizado ahora",
    };

    onPublishToGmp(newGmpCampaign);
    setPublishedIds((prev) => [...prev, pkg.id]);
  };

  const activePackage =
    generatedCampaigns[selectedCampaignIdx] || generatedCampaigns[0];

  return (
    <div className="space-y-8">
      {/* Automatizador de campañas + Calculadora interactiva de referencia KOL v3 (Láminas 9.2 y 9.3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna izquierda (7 cols): Formulario de automatización de campaña */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-5">
          <div className="border-b border-[#C9C3BE] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                1
              </span>
              <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Automatizá tu campaña en Google Marketing Platform
              </h2>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Generá anuncios y pujas con las reglas de KOL Franquicias ya integradas: número primero, voseo rioplatense y pares de contraste AAA.
            </p>
          </div>

          <form onSubmit={handleGenerateCampaign} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Nombre de la campaña
                </label>
                <input
                  type="text"
                  value={briefName}
                  onChange={(e) => setBriefName(e.target.value)}
                  required
                  className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Plataforma (Meta Ads / GMP)
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(
                      e.target.value as "Meta Ads" | "DV360" | "SA360" | "CM360"
                    )
                  }
                  className="w-full h-[40px] px-3 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                >
                  <option value="Meta Ads">Meta Ads (Feed, Reels y Lead Ads)</option>
                  <option value="DV360">Display &amp; Video 360</option>
                  <option value="SA360">Search Ads 360</option>
                  <option value="CM360">Campaign Manager 360</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Evento de conversión (Protocolo único KOL Franquicias)
              </label>
              <div className="flex items-center gap-2 p-3 bg-[#FAF8F6] border border-[#8C8580] rounded-[10px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span className="font-bold text-[#161418] text-[14px]">lead_franquicia</span>
                <span className="text-[13px] text-[#46413F]">
                  · Evento único verificado. Se descarta generate_lead (retail/WhatsApp) y purchase.
                </span>
              </div>
            </div>

            {/* Grupos conectados de segmentados con 2 px entre botones (Lámina 9.2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Elegí un formato para el anuncio
                </label>
                <div className="flex items-center gap-[2px]">
                  <button
                    type="button"
                    onClick={() => setFormatoLocal("isla")}
                    className={`flex-1 kol-btn-normal px-3 border flex items-center justify-center gap-1.5 ${
                      formatoLocal === "isla"
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {formatoLocal === "isla" && <Check className="w-4 h-4 shrink-0" />}
                    <span>Isla (US$ 23.000)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatoLocal("estandar")}
                    className={`flex-1 kol-btn-normal px-3 border flex items-center justify-center gap-1.5 ${
                      formatoLocal === "estandar"
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {formatoLocal === "estandar" && <Check className="w-4 h-4 shrink-0" />}
                    <span>Estándar (US$ 35.300)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Plazo de recupero en el mensaje
                </label>
                <div className="flex items-center gap-[2px]">
                  {([12, 18, 24] as const).map((meses) => (
                    <button
                      key={meses}
                      type="button"
                      onClick={() => setPlazoRecupero(meses)}
                      className={`flex-1 kol-btn-normal px-2.5 border flex items-center justify-center gap-1 ${
                        plazoRecupero === meses
                          ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                          : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                      }`}
                    >
                      {plazoRecupero === meses && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{meses === 12 ? "12 m (casos)" : `${meses} meses`}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Segmentación de audiencia (GA4 y Clarity)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  required
                  className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                  Presupuesto diario (US$)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  required
                  className="w-full h-[40px] px-3.5 text-[15px] tabular-nums bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#A40F5F] rounded-[10px] text-[14px] text-[#A40F5F] font-medium flex items-center gap-2">
                <span className="font-bold text-[16px]">!</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#C9C3BE]">
              <p className="text-[14px] text-[#46413F]">
                Al enviar, el motor genera las creatividades con los datos oficiales de KOL y las deja listas para publicar en {platform}.
              </p>
              <button
                type="submit"
                disabled={isGenerating}
                className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] disabled:opacity-40 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 kol-focus"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
                />
                <span>
                  {isGenerating ? "Generando piezas..." : "Generar campaña KOL"}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Columna derecha (5 cols): Calculadora y desglose de inversión que alimenta los anuncios (Láminas 9.2 y 9.3) */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-[#C9C3BE] pb-4">
              <div className="flex items-center gap-3">
                <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                  2
                </span>
                <h3 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                  Datos verificados en el anuncio
                </h3>
              </div>
              <p className="text-[15px] text-[#46413F] mt-2">
                Mirá en qué se va cada dólar de la inversión y la cuenta de referencia para el recupero.
              </p>
            </div>

            {/* Aviso de énfasis en rosa #FFD9E4 con texto negro #161418 (14,20:1 AAA — Lámina 3.4 y 9.2) */}
            <div className="p-5 bg-[#FFD9E4] text-[#161418] kol-card-12 space-y-1.5">
              <div className="text-[14px] font-semibold">
                Para recuperar la inversión del formato {formatoLocal} en {plazoRecupero} meses, el local tendría que dejar unos
              </div>
              <div className="font-kol-display font-extrabold text-[32px] leading-[40px] tabular-nums text-[#161418]">
                US$ {recuperoMensualRef.toLocaleString("es-AR")}
              </div>
              <div className="text-[14px] text-[#161418]">
                netos por mes · Cuenta de referencia a partir de US$ {inversionTotalUsd.toLocaleString("es-AR")}, no es una promesa de ganancia
              </div>
            </div>

            {/* Barra con tramos (13% derecho inicial, 22% mobiliario y obra, 65% mercadería — Lámina 9.3) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-semibold text-[#161418]">
                  Inversión total estimada ({formatoLocal === "isla" ? "desde 10 m²" : "25 m²"})
                </span>
                <span className="font-kol-display font-extrabold text-[22px] text-[#EC2992] tabular-nums">
                  US$ {inversionTotalUsd.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1.5 h-[36px] text-[14px] font-bold tabular-nums">
                <div className="col-span-2 bg-[#FFD9E4] text-[#161418] border border-[#C9C3BE] rounded-[4px] flex items-center justify-center">
                  13 %
                </div>
                <div className="col-span-3 bg-[#E7E3DF] text-[#161418] rounded-[4px] flex items-center justify-center">
                  22 %
                </div>
                <div className="col-span-7 bg-[#C51172] text-[#FFFFFF] rounded-[4px] flex items-center justify-center">
                  65 % mercadería
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-[#46413F] pt-1">
                <span>✓ Derecho inicial: US$ 3.000</span>
                <span>✓ Regalías mensuales: 0 %</span>
                <span>✓ Canon de publicidad: 0 %</span>
              </div>
            </div>
          </div>

          {generatedCampaigns.length > 1 && (
            <div className="pt-4 border-t border-[#C9C3BE] flex items-center gap-2 overflow-x-auto">
              <span className="text-[14px] text-[#46413F] shrink-0">
                Campañas generadas:
              </span>
              {generatedCampaigns.map((pkg, idx) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedCampaignIdx(idx)}
                  className={`kol-chip-filter px-3 border flex items-center gap-1.5 whitespace-nowrap ${
                    selectedCampaignIdx === idx
                      ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580]"
                  }`}
                >
                  {selectedCampaignIdx === idx && <Check className="w-3.5 h-3.5" />}
                  <span>{pkg.campaignName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Piezas publicitarias generadas en acción: Sobre fondo oscuro (Hoja 28/8 con ámbar) y Sobre fondo claro (Rectángulo 12 con magenta) */}
      {activePackage && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] border-2 border-[#161418] kol-card-12 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                  Etapa 1: Borrador listo
                </span>
                <span className="text-[13px] text-[#46413F] font-semibold">
                  Regla fija: ninguna campaña se publica sin aprobación humana
                </span>
              </div>
              <h3 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418] mt-2">
                {activePackage.campaignName}
              </h3>
              <p className="text-[14px] text-[#46413F] mt-1">
                {activePackage.platform} · Presupuesto diario US$ {activePackage.dailyBudget.toLocaleString("es-AR")} · UTM completos según convención · Objetivo: lead_franquicia
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const clipText = `Campaña: ${activePackage.campaignName}\nPlataforma: ${activePackage.platform}\nObjetivo: lead_franquicia\nPresupuesto diario: US$ ${activePackage.dailyBudget}\nTitular: ${activePackage.creatives[0]?.headline || ""}\nTexto: ${activePackage.creatives[0]?.bodyCopy || ""}\nCTA: ${activePackage.creatives[0]?.ctaLabel || ""}`;
                  navigator.clipboard.writeText(clipText);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 3000);
                }}
                className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] hover:bg-[#C9C3BE] flex items-center gap-2 whitespace-nowrap kol-focus text-[13px] font-bold"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-[#C51172]" />
                    <span className="text-[#C51172]">¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <span>Copiar textos y UTMs</span>
                )}
              </button>

              {publishedIds.includes(activePackage.id) ? (
                <div className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#161418]" />
                  <span>Aprobada por equipo</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePublishCampaign(activePackage)}
                  className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap kol-focus font-bold"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprobar borrador</span>
                </button>
              )}
            </div>
          </div>

          {/* Dos piezas en paralelo en tema 100 % blanco/claro con magenta y rosa (Lámina 3.4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pieza 1: Hero en hoja clara 28/8 (#FFFFFF) con magenta #EC2992 en cifra de 24 px+ y botón #C51172 */}
            <div className="lg:col-span-7 bg-[#FFFFFF] text-[#161418] border border-[#C9C3BE] kol-hoja-anchor p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <KolLogo variant="oscuro" className="h-[28px] w-auto" />
                    <span className="kol-lockup-light">KOL FRANQUICIAS</span>
                  </div>
                  <span className="text-[14px] text-[#46413F] tabular-nums">
                    CTR estimado {activePackage.creatives[0]?.predictedCtrPct || 3.45} %
                  </span>
                </div>

                <div className="text-[14px] font-semibold text-[#C51172] pt-2">
                  Desde 2006 · 10 locales en Argentina
                </div>

                <h4 className="font-kol-display font-extrabold text-[32px] leading-[40px] text-[#161418]">
                  {activePackage.creatives[0]?.headline ||
                    "Abrí tu local con 0 % de regalías"}
                </h4>

                <div className="font-kol-display font-extrabold text-[45px] leading-[52px] text-[#EC2992] tabular-nums">
                  US$ 3.000
                </div>

                <p className="text-[16px] leading-[26px] text-[#46413F] max-w-xl">
                  {activePackage.creatives[0]?.bodyCopy ||
                    "Derecho inicial, sin canon de publicidad. Inversión total estimada desde US$ 23.000 en formato isla."}
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#C9C3BE]">
                <button
                  type="button"
                  onClick={() => handlePublishCampaign(activePackage)}
                  className="kol-btn-cta px-6 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center justify-center kol-focus"
                >
                  {activePackage.creatives[0]?.ctaLabel ||
                    "Consultar por una franquicia"}
                </button>
                <span className="text-[14px] text-[#46413F]">
                  Magenta #C51172 sobre #FFFFFF · 5,68:1 AA
                </span>
              </div>
            </div>

            {/* Pieza 2: Contexto claro — Rectángulo de 12 (#FFFFFF) con magenta #C51172 y rosa #FFD9E4 (Lámina 3.4) */}
            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[14px] text-[#46413F]">
                  <span>Tarjeta clara con magenta</span>
                  <span className="tabular-nums">
                    CTR estimado {activePackage.creatives[1]?.predictedCtrPct || 3.18} %
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-kol-display font-extrabold text-[36px] leading-[44px] text-[#EC2992] tabular-nums">
                    0 %
                  </span>
                  <span className="font-kol-display font-bold text-[22px] text-[#161418]">
                    Regalías y canon de publicidad
                  </span>
                </div>

                <h4 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                  {activePackage.creatives[1]?.headline ||
                    "Tu marca, tu local desde US$ 23.000"}
                </h4>

                <p className="text-[15px] leading-[23px] text-[#46413F]">
                  {activePackage.creatives[1]?.bodyCopy ||
                    "Recupero informado de 18 a 24 meses, con casos en 12. Al enviar tu consulta, te respondemos por el medio que elegiste."}
                </p>

                {/* Contenedor rosa de énfasis (#FFD9E4 con texto negro #161418) */}
                <div className="p-4 bg-[#FFD9E4] text-[#161418] kol-card-12">
                  <div className="text-[14px] font-medium">Derecho inicial exacto</div>
                  <div className="font-kol-display font-extrabold text-[28px] leading-[36px] tabular-nums">
                    US$ 3.000
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#C9C3BE] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handlePublishCampaign(activePackage)}
                  className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] kol-focus"
                >
                  {activePackage.creatives[1]?.ctaLabel || "Consultar"}
                </button>
                <button
                  type="button"
                  onClick={() => handlePublishCampaign(activePackage)}
                  className="text-[14px] font-semibold text-[#C51172] underline decoration-2 underline-offset-4 hover:text-[#A40F5F]"
                >
                  Ver condiciones
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
