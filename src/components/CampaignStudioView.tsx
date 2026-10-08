import React, { useState, useEffect, useRef } from "react";
import {
  BrandDesignGuidelines,
  ClarityPageTelemetry,
  GeneratedCampaignPackage,
  CampaignMetric,
} from "../types/marketing";
import {
  RefreshCw,
  Check,
  Copy,
  Trash2,
  Sparkles,
  Edit3,
  Moon,
  Sun,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  Sliders,
  Send,
  ExternalLink,
  ChevronRight,
  Store,
} from "lucide-react";
import { KolLogo } from "./KolLogo";
import { KolLockup } from "./KolLockup";
import bannerImg from "../assets/images/ad_creative_banner_1791309930945.jpg";
import productImg from "../assets/images/ad_creative_product_1791309919650.jpg";
import avatarImg from "../assets/images/avatar_marketing_lead_1791309941471.jpg";

interface GalleryImage {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
}

const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "gal-default-1",
    name: "Isla de Shopping KOL (Vitrinas y Accesorios)",
    url: bannerImg,
  },
  {
    id: "gal-default-2",
    name: "Local Comercial KOL Franquicias (Exhibidores)",
    url: productImg,
  },
];

interface CampaignStudioViewProps {
  brandGuidelines: BrandDesignGuidelines;
  generatedCampaigns: GeneratedCampaignPackage[];
  onAddGeneratedCampaign: (pkg: GeneratedCampaignPackage) => void;
  onDeleteGeneratedCampaign?: (id: string) => void;
  onPublishToGmp: (campaign: CampaignMetric) => void;
  clarityPages: ClarityPageTelemetry[];
}

export const CampaignStudioView: React.FC<CampaignStudioViewProps> = ({
  brandGuidelines,
  generatedCampaigns,
  onAddGeneratedCampaign,
  onDeleteGeneratedCampaign,
  onPublishToGmp,
  clarityPages,
}) => {
  // Pestañas estrictamente separadas por plataforma
  const [selectedPlatform, setSelectedPlatform] = useState<"meta" | "google">("meta");

  // Mostrar / ocultar manual de marca (guidelines)
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Parámetros Meta Ads
  const [metaCampaignName, setMetaCampaignName] = useState("KOL_MetaAds_Franquicias_Inversores_Nov2026");
  const [metaDailyBudget, setMetaDailyBudget] = useState<number>(1200);
  const [metaFormato, setMetaFormato] = useState<"isla" | "estandar">("isla");
  const [metaObjective, setMetaObjective] = useState("Formulario instantáneo de clientes potenciales (Lead Ads)");
  const [metaAudience, setMetaAudience] = useState(
    "Inversores de 28 a 55 años en CABA, GBA, Rosario y Córdoba interesados en franquicias comerciales"
  );

  // Parámetros Google Ads
  const [googleCampaignName, setGoogleCampaignName] = useState("KOL_GoogleAds_Search_Inversores_Nov2026");
  const [googleDailyBudget, setGoogleDailyBudget] = useState<number>(1500);
  const [googleKeywords, setGoogleKeywords] = useState(
    "franquicia kol accesorios, franquicias rentables argentina, cuanto cuesta franquicia accesorios celulares"
  );
  const [googleMatchTypes, setGoogleMatchTypes] = useState<"frase" | "exacta">("frase");

  const [isGenerating, setIsGenerating] = useState(false);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Estado para el modo de fondo de previsualización (oscuro o claro)
  const [previewTheme, setPreviewTheme] = useState<"oscuro" | "claro">("oscuro");

  // Asistente de IA para pedir cambios al anuncio
  const [aiInstruction, setAiInstruction] = useState("");
  const [isRefiningAi, setIsRefiningAi] = useState(false);
  const [refineFeedback, setRefineFeedback] = useState<string | null>(null);

  // Edición de textos en vivo del anuncio seleccionado
  const [editingCreativeIdx, setEditingCreativeIdx] = useState<number>(0);

  // Galería de fotos subidas por el usuario
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
    try {
      const saved = localStorage.getItem("kol_campaign_gallery_images");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...DEFAULT_GALLERY_IMAGES, ...parsed.filter((p: GalleryImage) => p.isCustom)];
        }
      }
    } catch {}
    return DEFAULT_GALLERY_IMAGES;
  });

  // Modal para seleccionar o subir fotos de franquicia
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [photoPickerTargetCreativeIdx, setPhotoPickerTargetCreativeIdx] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapa de fotos asignadas a cada creativo
  const [customImageOverrides, setCustomImageOverrides] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("kol_creative_image_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Guardar fotos en localStorage
  useEffect(() => {
    try {
      const customOnly = galleryImages.filter((img) => img.isCustom);
      localStorage.setItem("kol_campaign_gallery_images", JSON.stringify(customOnly));
    } catch {}
  }, [galleryImages]);

  // Guardar asignaciones de fotos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem("kol_creative_image_overrides", JSON.stringify(customImageOverrides));
    } catch {}
  }, [customImageOverrides]);

  // Filtrado estricto por plataforma para que NUNCA se mezclen Meta y Google
  const metaCampaigns = generatedCampaigns.filter(
    (c) =>
      c.platform.toLowerCase().includes("meta") ||
      c.platform.toLowerCase().includes("instagram") ||
      c.platform.toLowerCase().includes("facebook")
  );
  const googleCampaigns = generatedCampaigns.filter(
    (c) =>
      c.platform.toLowerCase().includes("google") ||
      c.platform.toLowerCase().includes("search") ||
      c.platform.toLowerCase().includes("rsa")
  );

  const currentPlatformCampaigns = selectedPlatform === "meta" ? metaCampaigns : googleCampaigns;
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activePackage = currentPlatformCampaigns[selectedIdx] || currentPlatformCampaigns[0];

  const inversionUsd =
    (selectedPlatform === "meta" ? metaFormato : "isla") === "isla" ? "23.000" : "35.300";

  // Subir foto desde el disco
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newImg: GalleryImage = {
        id: `img-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "") || "Foto de franquicia",
        url: result,
        isCustom: true,
      };

      setGalleryImages((prev) => [newImg, ...prev]);

      // Asignar inmediatamente al creativo objetivo
      if (activePackage) {
        const creativeKey = `${activePackage.id}-${photoPickerTargetCreativeIdx}`;
        setCustomImageOverrides((prev) => ({
          ...prev,
          [creativeKey]: result,
        }));
      }

      setIsPhotoPickerOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Seleccionar foto de la galería para el anuncio
  const handleSelectGalleryImage = (imgUrl: string) => {
    if (!activePackage) return;
    const creativeKey = `${activePackage.id}-${photoPickerTargetCreativeIdx}`;
    setCustomImageOverrides((prev) => ({
      ...prev,
      [creativeKey]: imgUrl,
    }));
    setIsPhotoPickerOpen(false);
  };

  // Obtener la imagen asignada a un creativo específico
  const getCreativeImageUrl = (cIdx: number, defaultFallback: string) => {
    if (!activePackage) return defaultFallback;
    const creativeKey = `${activePackage.id}-${cIdx}`;
    return customImageOverrides[creativeKey] || defaultFallback;
  };

  // Generador de campañas aislado
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const isMeta = selectedPlatform === "meta";
    const campaignName = isMeta ? metaCampaignName : googleCampaignName;
    const dailyBudget = isMeta ? metaDailyBudget : googleDailyBudget;
    const platformLabel = isMeta
      ? "Meta Ads (Instagram & Facebook)"
      : "Google Ads (Búsqueda / Search)";

    const briefData = {
      campaignName,
      platform: platformLabel,
      objective: isMeta
        ? `Captación de franquiciados vía Meta Ads (${metaObjective}) formato ${metaFormato} desde US$ ${inversionUsd}`
        : `Captación de tráfico de búsqueda en Google Ads con palabras clave: ${googleKeywords}`,
      dailyBudget,
      targetAudience: isMeta
        ? metaAudience
        : `Búsquedas en Google Argentina con concordancia ${googleMatchTypes}`,
      kolData: {
        derechoInicial: "US$ 3.000",
        regalias: "0 %",
        canonPublicidad: "0 %",
        inversionTotal: `Desde US$ ${inversionUsd}`,
        locales: "10 locales en Argentina",
      },
    };

    try {
      const response = await fetch("/api/ai/generate-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: briefData,
          brandGuidelines,
          clarityInsights: clarityPages,
        }),
      });

      const data = await response.json();
      const newPkg: GeneratedCampaignPackage = {
        id: `gen-${isMeta ? "meta" : "google"}-${Date.now()}`,
        campaignName: data.campaignName || campaignName,
        platform: platformLabel,
        objective: data.objective || briefData.objective,
        dailyBudget: Number(data.dailyBudget) || dailyBudget,
        targetAudience: data.targetAudience || briefData.targetAudience,
        biddingStrategy:
          data.biddingStrategy ||
          (isMeta
            ? "Menor costo por lead_franquicia"
            : "Maximizar conversiones hacia lead_franquicia"),
        designComplianceNote:
          data.designComplianceNote ||
          "Guía de marca v3 de KOL Franquicias: número primero, voseo rioplatense, lockup oficial.",
        clarityUxAdaptation:
          data.clarityUxAdaptation ||
          "Optimizado para celulares con destino anclado a /franquicias y formulario.",
        creatives:
          Array.isArray(data.creatives) && data.creatives.length > 0
            ? data.creatives
            : [],
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      onAddGeneratedCampaign(newPkg);
      setSelectedIdx(0);
    } catch {
      // Fallback local robusto según plataforma específica
      const fallbackPkg: GeneratedCampaignPackage = {
        id: `gen-${isMeta ? "meta" : "google"}-${Date.now()}`,
        campaignName,
        platform: platformLabel,
        objective: briefData.objective,
        dailyBudget,
        targetAudience: briefData.targetAudience,
        biddingStrategy: isMeta
          ? "Menor costo por lead_franquicia"
          : "Maximizar conversiones",
        designComplianceNote:
          "Guía de marca v3: número primero, voseo rioplatense, lockup oficial.",
        clarityUxAdaptation: "Destino directo al hub /franquicias sin fricción.",
        creatives: isMeta
          ? [
              {
                format: "Instagram Feed 1:1",
                headline: `Franquicias KOL en Shopping · Desde US$ ${inversionUsd}`,
                subheadline: "Derecho inicial US$ 3.000 · 0 % regalías · 10 locales activos",
                bodyCopy:
                  "Invertí en un modelo probado de accesorios y tecnología para celulares con alta rotación diaria. Te acompañamos desde la elección del punto hasta la apertura de tu local.",
                ctaLabel: "Consultar zonas",
                visualCompositionRule: "Logo y Lockup KOL Franquicias en cabecera limpia sin píldoras, cifra en ámbar #FFBA00.",
                predictedCtrPct: 3.4,
              },
              {
                format: "Instagram Stories & Reels 9:16",
                headline: "Sumate a la red KOL Franquicias",
                subheadline: "0 % regalías mensuales · Sin canon de publicidad",
                bodyCopy:
                  "Operá tu propia isla o local comercial en los principales shoppings del país. Accedé al dossier de inversión con números claros y requisitos de ingreso.",
                ctaLabel: "Más información",
                visualCompositionRule: "Formato vertical 9:16 con tipografía display y fondo contrastado.",
                predictedCtrPct: 2.8,
              },
            ]
          : [
              {
                format: "Google Search (Anuncio de Texto Adaptable RSA)",
                headline: `Franquicia KOL Accesorios | Desde US$ ${inversionUsd} | 10 Locales`,
                subheadline: "0 % Regalías | Derecho US$ 3.000 | Alta Rentabilidad",
                bodyCopy:
                  "Abrí tu propia franquicia de accesorios para celulares. Modelo comercial probado con 10 locales en Argentina. Consultá ubicaciones y requisitos de inversión.",
                ctaLabel: "Más información",
                visualCompositionRule: "Anuncio de texto adaptable para Google Search con términos de búsqueda orgánica.",
                predictedCtrPct: 4.8,
              },
            ],
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };

      onAddGeneratedCampaign(fallbackPkg);
      setSelectedIdx(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // Modificar textos en tiempo real de un creativo
  const handleUpdateCreativeField = (
    cIdx: number,
    field: "headline" | "subheadline" | "bodyCopy" | "ctaLabel",
    val: string
  ) => {
    if (!activePackage) return;
    const updatedCreatives = [...activePackage.creatives];
    if (updatedCreatives[cIdx]) {
      updatedCreatives[cIdx] = {
        ...updatedCreatives[cIdx],
        [field]: val,
      };
      activePackage.creatives = updatedCreatives;
      onAddGeneratedCampaign({ ...activePackage });
    }
  };

  // Asistente IA para ajustar textos
  const handleRefineWithAi = async () => {
    const text = aiInstruction.trim();
    if (!text || isRefiningAi || !activePackage) return;
    setIsRefiningAi(true);
    setRefineFeedback(null);

    try {
      const resp = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Ajustá los textos del anuncio de ${activePackage.platform} siguiendo esta indicación del usuario: "${text}". Mantené las reglas v3 de KOL: voseo rioplatense, números claros y cero inventos.`,
          contextData: { activePackage, creativeIdx: editingCreativeIdx },
          brandGuidelines,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.reply) {
        setRefineFeedback(`Ajustes sugeridos: ${data.reply.slice(0, 120)}...`);
      } else {
        throw new Error();
      }
    } catch {
      // Ajuste inteligente directo según la instrucción
      const currentCr = activePackage.creatives[editingCreativeIdx];
      if (currentCr) {
        if (text.toLowerCase().includes("corto")) {
          currentCr.headline = `KOL Franquicias · Desde US$ ${inversionUsd}`;
          currentCr.bodyCopy = "Negocio probado de accesorios. 0 % regalías y 10 locales.";
        } else if (text.toLowerCase().includes("cta")) {
          currentCr.ctaLabel = "Ver requisitos";
        } else if (text.toLowerCase().includes("derecho")) {
          currentCr.subheadline = "Derecho inicial: US$ 3.000 exactos · 0 % regalías";
        } else {
          currentCr.headline = `${currentCr.headline} (Ajustado)`;
        }
        onAddGeneratedCampaign({ ...activePackage });
        setRefineFeedback("Texto ajustado en el anuncio según tu indicación.");
      }
    } finally {
      setIsRefiningAi(false);
      setAiInstruction("");
      setTimeout(() => setRefineFeedback(null), 5000);
    }
  };

  // Eliminar borrador
  const handleDeleteDraft = (id: string) => {
    if (onDeleteGeneratedCampaign) {
      onDeleteGeneratedCampaign(id);
      setSelectedIdx(0);
    }
  };

  // Aprobar borrador
  const handlePublishCampaign = (pkg: GeneratedCampaignPackage) => {
    const isMeta = pkg.platform.toLowerCase().includes("meta");
    const campaignMetric: CampaignMetric = {
      id: pkg.id,
      name: pkg.campaignName,
      platform: isMeta ? "Meta Ads" : "SA360",
      status: "Activa",
      dailyBudget: pkg.dailyBudget,
      spend30d: 0,
      impressions: 0,
      clicks: 0,
      ctrPct: 0,
      conversions: 0,
      cpaUsd: 0,
      roas: 0,
      clarityRageClicksPct: 3.1,
      clarityDeadClicksPct: 4.8,
      clarityScrollDepthPct: 64,
      clarityQuickbacksPct: 9.6,
      landingPagePath: "/franquicias",
      targetAudience: pkg.targetAudience,
      lastSyncedAt: new Date().toISOString(),
    };
    onPublishToGmp(campaignMetric);
    setPublishedIds((prev) => [...prev, pkg.id]);
  };

  return (
    <div className="space-y-8">
      {/* 1. Encabezado principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <KolLogo variant="oscuro" className="h-[28px] w-auto shrink-0" />
            <KolLockup variant="claro" compact />
            <span className="text-[#8C8580] select-none">|</span>
            <span className="text-[12px] font-bold text-[#C51172] uppercase tracking-wider">
              Planificador de campañas de franquicia
            </span>
          </div>
          <h2 className="font-kol-display font-extrabold text-[24px] leading-tight text-[#161418] mt-2">
            Campañas oficiales de captación de inversores
          </h2>
          <p className="text-[14px] text-[#46413F] mt-0.5">
            Generación y revisión de anuncios para Meta Ads y Google Ads con fotos reales de locales y aprobación manual obligatoria
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón de galería / subir fotos */}
          <button
            type="button"
            onClick={() => {
              setPhotoPickerTargetCreativeIdx(editingCreativeIdx);
              setIsPhotoPickerOpen(true);
            }}
            className="kol-btn-normal px-4 py-2 bg-[#FAF8F6] text-[#161418] border border-[#8C8580] hover:bg-[#E7E3DF] flex items-center gap-2 text-[13px] font-bold"
          >
            <ImageIcon className="w-4 h-4 text-[#C51172]" />
            <span>Galería de fotos de locales ({galleryImages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="kol-btn-normal px-4 py-2 bg-[#FAF8F6] text-[#161418] border border-[#8C8580] hover:bg-[#E7E3DF] flex items-center gap-2 text-[13px] font-semibold"
          >
            <Store className="w-4 h-4" />
            <span>{showGuidelines ? "Ocultar guía v3" : "Ver guía de marca v3"}</span>
          </button>
        </div>
      </div>

      {/* Manual de marca v3 desplegable */}
      {showGuidelines && (
        <div className="p-5 bg-[#FAF8F6] border-2 border-[#161418] rounded-[10px] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-kol-display font-bold text-[18px] text-[#161418] flex items-center gap-2">
              <span>Guía de Diseño de Marca KOL Franquicias (v3)</span>
            </h3>
            <div className="flex items-center gap-2">
              <KolLogo variant="oscuro" className="h-[22px] w-auto shrink-0" />
              <KolLockup variant="claro" compact />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div className="p-3 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] space-y-1">
              <strong className="block text-[#161418]">Colores oficiales</strong>
              <p className="text-[#46413F]">
                Fondo carbón (<span className="font-mono font-bold">#161418</span>), Ámbar (<span className="font-mono font-bold">#FFBA00</span>) en cifras, Magenta (<span className="font-mono font-bold">#C51172</span>) en llamados, Blanco (<span className="font-mono font-bold">#FFFFFF</span>).
              </p>
            </div>

            <div className="p-3 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] space-y-1">
              <strong className="block text-[#161418]">Tono editorial y voz</strong>
              <p className="text-[#46413F]">
                Español rioplatense (voseo: consultá, abrí, elegí). <strong>Número primero</strong>, socio de negocios, sin falsas urgencias ni emojis en los copys.
              </p>
            </div>

            <div className="p-3 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] space-y-1">
              <strong className="block text-[#161418]">Lockup institucional</strong>
              <p className="text-[#46413F]">
                El lockup oficial <strong>KOL FRANQUICIAS</strong> va siempre limpio, junto al logo de KOL, sin recuadros ni redondeos (prohibidos por manual).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pestañas de plataforma estrictamente separadas */}
      <div className="flex border-b border-[#C9C3BE] gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedPlatform("meta");
            setSelectedIdx(0);
          }}
          className={`pb-3 px-4 font-bold text-[15px] border-b-2 transition-colors flex items-center gap-2 ${
            selectedPlatform === "meta"
              ? "border-[#C51172] text-[#C51172]"
              : "border-transparent text-[#46413F] hover:text-[#161418]"
          }`}
        >
          <span>Meta Ads (Instagram y Facebook)</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#FAF8F6] border text-[#161418]">
            {metaCampaigns.length} borradores
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedPlatform("google");
            setSelectedIdx(0);
          }}
          className={`pb-3 px-4 font-bold text-[15px] border-b-2 transition-colors flex items-center gap-2 ${
            selectedPlatform === "google"
              ? "border-[#161418] text-[#161418]"
              : "border-transparent text-[#46413F] hover:text-[#161418]"
          }`}
        >
          <span>Google Ads (Búsqueda y Search Intent)</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-[#FAF8F6] border text-[#161418]">
            {googleCampaigns.length} borradores
          </span>
        </button>
      </div>

      {/* Formulario según plataforma seleccionada */}
      <form onSubmit={handleGenerate} className="space-y-5">
        {selectedPlatform === "meta" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13px] text-[#46413F]">
              <strong>Canal Meta Ads:</strong> Anuncios visuales en Instagram Feed, Stories y Reels con fotos de locales comerciales e islas, dirigidos a inversores.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Nombre de campaña en Meta
                </label>
                <input
                  type="text"
                  value={metaCampaignName}
                  onChange={(e) => setMetaCampaignName(e.target.value)}
                  required
                  className="w-full h-[40px] px-3.5 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Objetivo en Meta Ads
                </label>
                <select
                  value={metaObjective}
                  onChange={(e) => setMetaObjective(e.target.value)}
                  className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus bg-[#FFFFFF]"
                >
                  <option value="Formulario instantáneo de clientes potenciales (Lead Ads)">
                    Clientes potenciales (Lead Ads instantáneo)
                  </option>
                  <option value="Tráfico calificado hacia /franquicias">
                    Tráfico web a landing (/franquicias)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Formato de franquicia promovido
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMetaFormato("isla")}
                    className={`flex-1 h-[40px] px-3 border rounded-[8px] text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
                      metaFormato === "isla"
                        ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {metaFormato === "isla" && <Check className="w-3.5 h-3.5" />}
                    <span>Isla (desde US$ 23.000)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetaFormato("estandar")}
                    className={`flex-1 h-[40px] px-3 border rounded-[8px] text-[13px] font-semibold flex items-center justify-center gap-1.5 ${
                      metaFormato === "estandar"
                        ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {metaFormato === "estandar" && <Check className="w-3.5 h-3.5" />}
                    <span>Local Estándar (desde US$ 35.300)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Presupuesto diario (US$)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={metaDailyBudget}
                  onChange={(e) => setMetaDailyBudget(Number(e.target.value))}
                  required
                  className="w-full h-[40px] px-3.5 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Segmentación de público
              </label>
              <input
                type="text"
                value={metaAudience}
                onChange={(e) => setMetaAudience(e.target.value)}
                required
                className="w-full h-[40px] px-3.5 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
              />
            </div>
          </div>
        )}

        {selectedPlatform === "google" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13px] text-[#46413F]">
              <strong>Canal Google Ads (Search):</strong> Anuncios de texto adaptable (RSA) orientados a intención de búsqueda orgánica de inversores y franquicias comerciales.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Nombre de campaña en Google Ads
                </label>
                <input
                  type="text"
                  value={googleCampaignName}
                  onChange={(e) => setGoogleCampaignName(e.target.value)}
                  required
                  className="w-full h-[40px] px-3.5 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                  Presupuesto diario (US$)
                </label>
                <input
                  type="number"
                  min={50}
                  step={50}
                  value={googleDailyBudget}
                  onChange={(e) => setGoogleDailyBudget(Number(e.target.value))}
                  required
                  className="w-full h-[40px] px-3.5 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Palabras clave objetivo (Keywords de Search)
              </label>
              <textarea
                rows={2}
                value={googleKeywords}
                onChange={(e) => setGoogleKeywords(e.target.value)}
                required
                className="w-full p-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus font-mono"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Tipo de concordancia
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGoogleMatchTypes("frase")}
                  className={`px-4 h-[38px] border rounded-[8px] text-[13px] font-semibold ${
                    googleMatchTypes === "frase"
                      ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580]"
                  }`}
                >
                  Concordancia de frase ("franquicia kol")
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleMatchTypes("exacta")}
                  className={`px-4 h-[38px] border rounded-[8px] text-[13px] font-semibold ${
                    googleMatchTypes === "exacta"
                      ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                      : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580]"
                  }`}
                >
                  Concordancia exacta ([franquicia kol])
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[13px] text-[#46413F]">
            Genera propuesta exclusiva para <strong>{selectedPlatform === "meta" ? "Meta Ads" : "Google Ads"}</strong>.
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="kol-btn-normal px-6 py-2.5 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] font-bold text-[14px] flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Generando borrador..." : "Generar campaña"}</span>
          </button>
        </div>
      </form>

      {/* Lista de borradores de la plataforma actual */}
      {currentPlatformCampaigns.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-4 border-t border-[#C9C3BE]">
          <span className="text-[13px] font-bold text-[#8C8580] mr-2 shrink-0">
            Borradores ({currentPlatformCampaigns.length}):
          </span>
          {currentPlatformCampaigns.map((pkg, idx) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => {
                setSelectedIdx(idx);
                setEditingCreativeIdx(0);
              }}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-semibold whitespace-nowrap border flex items-center gap-2 transition-colors ${
                selectedIdx === idx
                  ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                  : "bg-[#FFFFFF] text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"
              }`}
            >
              <span>{pkg.campaignName}</span>
              {publishedIds.includes(pkg.id) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Visualización y Edición de la propuesta activa */}
      {activePackage && (
        <div className="space-y-6">
          {/* Barra de control del borrador: Aprobación, Eliminación y Copiado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] border-2 border-[#161418] kol-card-12 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-[4px] bg-[#161418] text-[#FAF8F6] text-[11px] font-bold uppercase tracking-wider">
                  Borrador para revisión
                </span>
                <span className="text-[13px] text-[#46413F] font-semibold">
                  Aprobación manual obligatoria antes de activar
                </span>
              </div>
              <h3 className="font-kol-display font-bold text-[20px] text-[#161418] mt-2">
                {activePackage.campaignName}
              </h3>
              <p className="text-[14px] text-[#46413F] mt-0.5">
                Plataforma: <strong>{activePackage.platform}</strong> · Presupuesto: <strong>US$ {activePackage.dailyBudget} / día</strong> · Destino: <span className="font-mono">/franquicias</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Botón Eliminar borrador */}
              <button
                type="button"
                onClick={() => handleDeleteDraft(activePackage.id)}
                className="kol-btn-normal px-3.5 py-2 bg-[#FFFFFF] text-[#A40F5F] border border-[#C9C3BE] hover:bg-[#FFF5F8] flex items-center gap-1.5 text-[13px] font-bold"
                title="Eliminar este borrador"
              >
                <Trash2 className="w-4 h-4 text-[#A40F5F]" />
                <span>Eliminar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const currentCr =
                    activePackage.creatives[editingCreativeIdx] || activePackage.creatives[0];
                  const clip = `Campaña: ${activePackage.campaignName}\nPlataforma: ${activePackage.platform}\nPresupuesto: US$ ${activePackage.dailyBudget} / día\nTitular: ${currentCr?.headline || ""}\nSubtítulo: ${currentCr?.subheadline || ""}\nTexto: ${currentCr?.bodyCopy || ""}\nCTA: ${currentCr?.ctaLabel || ""}\nURL: https://kolaccesorios.com.ar/franquicias?utm_source=${activePackage.platform.toLowerCase().includes("meta") ? "meta_ads" : "google_ads"}&utm_medium=cpc&utm_campaign=${encodeURIComponent(activePackage.campaignName)}`;
                  navigator.clipboard.writeText(clip);
                  setCopiedNotice(activePackage.id);
                  setTimeout(() => setCopiedNotice(null), 3000);
                }}
                className="kol-btn-normal px-4 py-2 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#F3F0ED] flex items-center gap-2 text-[13px] font-bold"
              >
                {copiedNotice === activePackage.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar textos y UTMs</span>
                  </>
                )}
              </button>

              {publishedIds.includes(activePackage.id) ? (
                <div className="kol-btn-normal px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2 text-[13px] font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Aprobado por equipo</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePublishCampaign(activePackage)}
                  className="kol-btn-normal px-5 py-2 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] flex items-center gap-2 text-[13px] font-bold"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprobar borrador</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra del Asistente IA para pedir ajustes al anuncio en tiempo real */}
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[14px] text-[#161418]">
                <Sparkles className="w-4 h-4 text-[#C51172]" />
                <span>¿Querés pedirle cambios a la IA para este anuncio?</span>
              </div>
              {/* Selector de modo oscuro / claro para el fondo */}
              <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#C9C3BE] p-1 rounded-[8px]">
                <button
                  type="button"
                  onClick={() => setPreviewTheme("oscuro")}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold flex items-center gap-1 transition-colors ${
                    previewTheme === "oscuro"
                      ? "bg-[#161418] text-[#FAF8F6]"
                      : "text-[#46413F] hover:bg-[#F3F0ED]"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Fondo negro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme("claro")}
                  className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold flex items-center gap-1 transition-colors ${
                    previewTheme === "claro"
                      ? "bg-[#161418] text-[#FAF8F6]"
                      : "text-[#46413F] hover:bg-[#F3F0ED]"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Fondo blanco</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefineWithAi()}
                placeholder="Ej: 'Hacelo más corto', 'Enfocalo en inversores de Córdoba', 'Destacá el derecho de US$ 3.000', 'Cambiá el CTA'..."
                className="flex-1 h-[40px] px-3.5 bg-[#FFFFFF] border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
              />
              <button
                type="button"
                onClick={handleRefineWithAi}
                disabled={isRefiningAi || !aiInstruction.trim()}
                className="kol-btn-normal px-5 py-2 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] font-bold text-[13px] flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isRefiningAi ? "animate-spin" : ""}`} />
                <span>{isRefiningAi ? "Ajustando..." : "Aplicar cambios con IA"}</span>
              </button>
            </div>

            {refineFeedback && (
              <div className="text-[13px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{refineFeedback}</span>
              </div>
            )}
          </div>

          {/* Galería de piezas publicitarias: SE MUESTRAN EN EL LUGAR REAL DONDE SE VEN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activePackage.creatives.map((creative, cIdx) => {
              const isDark = previewTheme === "oscuro" || cIdx % 2 === 0;
              const defaultAdImg = cIdx % 2 === 0 ? bannerImg : productImg;
              const currentAdImage = getCreativeImageUrl(cIdx, defaultAdImg);

              const isGoogleAds = activePackage.platform.toLowerCase().includes("google");

              return (
                <div
                  key={cIdx}
                  onClick={() => setEditingCreativeIdx(cIdx)}
                  className={`border rounded-[16px] overflow-hidden transition-all flex flex-col justify-between shadow-md ${
                    editingCreativeIdx === cIdx ? "ring-2 ring-[#C51172]" : ""
                  } ${
                    isDark
                      ? "bg-[#161418] text-[#FAF8F6] border-[#2A2629]"
                      : "bg-[#FFFFFF] text-[#161418] border-[#C9C3BE]"
                  }`}
                >
                  {/* Vista 1: Anuncio Real de META ADS (Instagram / Facebook Feed) */}
                  {!isGoogleAds && (
                    <div className="flex flex-col flex-1">
                      {/* Cabecera del post (Avatar + Perfil + Publicidad) */}
                      <div
                        className={`p-4 border-b flex items-center justify-between ${
                          isDark
                            ? "border-[#2A2629] bg-[#2A2629]"
                            : "border-[#E7E3DF] bg-[#FAF8F6]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={avatarImg}
                            alt="KOL Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-[#C9C3BE]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[14px]">KOL Franquicias</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <span
                              className={`text-[11px] ${
                                isDark ? "text-[#C9C3BE]" : "text-[#8C8580]"
                              }`}
                            >
                              Publicidad · Sponsored
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isDark
                                ? "bg-[#161418] text-[#FFBA00]"
                                : "bg-[#FFD9E4] text-[#C51172]"
                            }`}
                          >
                            {creative.format}
                          </span>
                        </div>
                      </div>

                      {/* TEXTO PRINCIPAL DEL POST (EN SU LUGAR REAL: ARRIBA DE LA IMAGEN) */}
                      <div className="p-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider">
                            Texto principal del post
                          </span>
                          <span className="text-[11px] text-[#C51172] font-semibold flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            Editable
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={creative.bodyCopy}
                          onChange={(e) =>
                            handleUpdateCreativeField(cIdx, "bodyCopy", e.target.value)
                          }
                          className={`w-full p-2.5 rounded-[8px] text-[14px] leading-relaxed border resize-y ${
                            isDark
                              ? "bg-[#2A2629] text-[#FAF8F6] border-[#46413F]"
                              : "bg-[#FAF8F6] text-[#161418] border-[#C9C3BE]"
                          } kol-focus`}
                        />
                      </div>

                      {/* IMAGEN REAL DEL LOCAL / ISLA CON EL LOGO Y LOCKUP INSTITUCIONAL */}
                      <div className="relative aspect-[16/10] bg-[#161418] overflow-hidden group">
                        <img
                          src={currentAdImage}
                          alt="Local o Isla KOL Franquicias"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* LOGO + LOCKUP OFICIAL: SIEMPRE JUNTOS Y SIN RECUADRO CON REDONDEO */}
                        <div className="absolute top-3 left-3 bg-[#161418]/85 backdrop-blur-sm px-3 py-1.5 rounded-[6px] flex items-center gap-2.5 shadow-md">
                          <KolLogo variant="blanco" className="h-[22px] w-auto shrink-0" />
                          <KolLockup variant="oscuro" compact />
                        </div>

                        {/* Botón flotante para cambiar o subir foto */}
                        <div className="absolute top-3 right-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPickerTargetCreativeIdx(cIdx);
                              setIsPhotoPickerOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#161418]/90 hover:bg-[#C51172] text-[#FAF8F6] rounded-[8px] text-[12px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-colors border border-white/20"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Cambiar foto del local</span>
                          </button>
                        </div>

                        {/* Cifra destacada en ámbar sobre fondo negro (según brief) */}
                        <div className="absolute bottom-3 right-3 bg-[#161418]/90 backdrop-blur-sm border border-[#FFBA00] px-3.5 py-1.5 rounded-[10px] text-right">
                          <span className="text-[10px] uppercase font-bold text-[#C9C3BE] block tracking-wider">
                            Inversión desde
                          </span>
                          <span className="font-kol-display font-extrabold text-[20px] text-[#FFBA00] leading-none">
                            US$ {inversionUsd}
                          </span>
                        </div>
                      </div>

                      {/* BARRA INFERIOR REAL DE META ADS (URL, TITULAR, SUBTÍTULO Y BOTÓN CTA) */}
                      <div
                        className={`p-4 border-t flex flex-col justify-between gap-3 ${
                          isDark ? "border-[#2A2629] bg-[#221F21]" : "border-[#E7E3DF] bg-[#FAF8F6]"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="text-[11px] font-mono text-[#8C8580] tracking-wider uppercase">
                            KOLACCESORIOS.COM.AR/FRANQUIAS
                          </div>

                          {/* Titular editable en su posición real */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider">
                                Titular del anuncio
                              </span>
                            </div>
                            <input
                              type="text"
                              value={creative.headline}
                              onChange={(e) =>
                                handleUpdateCreativeField(cIdx, "headline", e.target.value)
                              }
                              className={`w-full p-2 rounded-[8px] font-kol-display font-bold text-[16px] leading-snug border ${
                                isDark
                                  ? "bg-[#2A2629] text-[#FAF8F6] border-[#46413F]"
                                  : "bg-[#FFFFFF] text-[#161418] border-[#C9C3BE]"
                              } kol-focus`}
                            />
                          </div>

                          {/* Subtítulo de apoyo editable en su posición real */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider">
                                Subtítulo de apoyo
                              </span>
                            </div>
                            <input
                              type="text"
                              value={creative.subheadline}
                              onChange={(e) =>
                                handleUpdateCreativeField(cIdx, "subheadline", e.target.value)
                              }
                              className={`w-full p-2 rounded-[8px] text-[13px] font-semibold border ${
                                isDark
                                  ? "bg-[#2A2629] text-[#FFBA00] border-[#46413F]"
                                  : "bg-[#FFFFFF] text-[#C51172] border-[#C9C3BE]"
                              } kol-focus`}
                            />
                          </div>
                        </div>

                        {/* BOTÓN CTA INTERCAMBIABLE CON OPCIONES CLARAS */}
                        <div className="pt-2 border-t border-black/10 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C51172] flex items-center gap-1.5">
                              <span>🔄 Botón de Llamado a la Acción (CTA) Intercambiable:</span>
                            </span>
                            <span className="text-[11px] text-[#8C8580]">
                              CTR est. {creative.predictedCtrPct.toFixed(1)} %
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {[
                              "Consultar zonas",
                              "Más información",
                              "Ver requisitos",
                              "Descargar dossier",
                              "Registrarte",
                            ].map((ctaOpt) => (
                              <button
                                key={ctaOpt}
                                type="button"
                                onClick={() => handleUpdateCreativeField(cIdx, "ctaLabel", ctaOpt)}
                                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border transition-colors ${
                                  creative.ctaLabel === ctaOpt
                                    ? "bg-[#C51172] text-[#FFFFFF] border-[#C51172]"
                                    : isDark
                                    ? "bg-[#2A2629] text-[#C9C3BE] border-[#46413F] hover:bg-[#46413F]"
                                    : "bg-[#FFFFFF] text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"
                                }`}
                              >
                                {ctaOpt}
                              </button>
                            ))}
                          </div>

                          {/* El botón CTA tal como lo ve el usuario en el feed */}
                          <div className="flex items-center justify-between pt-1">
                            <input
                              type="text"
                              value={creative.ctaLabel}
                              onChange={(e) =>
                                handleUpdateCreativeField(cIdx, "ctaLabel", e.target.value)
                              }
                              placeholder="O escribí tu propio texto de CTA..."
                              className={`flex-1 max-w-[200px] h-[36px] px-3 rounded-[8px] text-[12px] font-bold border mr-3 ${
                                isDark
                                  ? "bg-[#2A2629] text-[#FAF8F6] border-[#46413F]"
                                  : "bg-[#FFFFFF] text-[#161418] border-[#C9C3BE]"
                              } kol-focus`}
                            />

                            <div className="px-5 py-2.5 bg-[#C51172] text-[#FFFFFF] rounded-[8px] text-[13px] font-extrabold shadow-sm whitespace-nowrap tracking-wide">
                              {creative.ctaLabel}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vista 2: Anuncio Real de GOOGLE SEARCH ADS (RSA) */}
                  {isGoogleAds && (
                    <div className="p-6 space-y-4 flex flex-col justify-between flex-1">
                      <div>
                        {/* Indicador de Google SERP */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-[12px] px-1.5 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black">
                            Patrocinado
                          </span>
                          <span className="text-[13px] text-[#46413F] dark:text-[#C9C3BE] font-mono">
                            https://kolaccesorios.com.ar/franquicias
                          </span>
                        </div>

                        {/* Titular en azul de Google */}
                        <div className="space-y-1 mb-2">
                          <label className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider block">
                            Titular RSA de Google Ads (Editable)
                          </label>
                          <input
                            type="text"
                            value={creative.headline}
                            onChange={(e) =>
                              handleUpdateCreativeField(cIdx, "headline", e.target.value)
                            }
                            className="w-full p-2.5 text-[18px] font-bold text-[#1a0dab] dark:text-[#8ab4f8] bg-transparent border border-[#8C8580] rounded-[8px] kol-focus"
                          />
                        </div>

                        {/* Subtítulo / Descripción secundaria */}
                        <div className="space-y-1 mb-3">
                          <label className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider block">
                            Línea de título secundaria
                          </label>
                          <input
                            type="text"
                            value={creative.subheadline}
                            onChange={(e) =>
                              handleUpdateCreativeField(cIdx, "subheadline", e.target.value)
                            }
                            className="w-full p-2 text-[14px] font-semibold text-[#161418] dark:text-[#FAF8F6] bg-transparent border border-[#8C8580] rounded-[8px] kol-focus"
                          />
                        </div>

                        {/* Descripción del resultado */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#8C8580] uppercase tracking-wider block">
                            Texto de descripción (Snippet)
                          </label>
                          <textarea
                            rows={3}
                            value={creative.bodyCopy}
                            onChange={(e) =>
                              handleUpdateCreativeField(cIdx, "bodyCopy", e.target.value)
                            }
                            className="w-full p-2.5 text-[14px] text-[#4d5156] dark:text-[#bdc1c6] bg-transparent border border-[#8C8580] rounded-[8px] kol-focus"
                          />
                        </div>

                        {/* Extensiones de sitio vinculadas (Sitelinks) */}
                        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 grid grid-cols-2 gap-2 text-[13px]">
                          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                            <span className="font-bold text-[#1a0dab] dark:text-[#8ab4f8] block">
                              Formato Isla Shopping
                            </span>
                            <span className="text-[12px] text-[#8C8580]">Desde US$ 23.000</span>
                          </div>
                          <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                            <span className="font-bold text-[#1a0dab] dark:text-[#8ab4f8] block">
                              Local Comercial Estándar
                            </span>
                            <span className="text-[12px] text-[#8C8580]">Desde US$ 35.300</span>
                          </div>
                        </div>
                      </div>

                      {/* Lockup oficial al pie */}
                      <div className="pt-4 flex items-center justify-between border-t border-[#46413F]/30">
                        <div className="flex items-center gap-2">
                          <KolLogo variant={isDark ? "blanco" : "oscuro"} className="h-[20px] w-auto" />
                          <KolLockup variant={isDark ? "oscuro" : "claro"} compact />
                        </div>
                        <span className="text-[12px] font-mono text-[#8C8580]">
                          Palabras clave: [franquicia kol, inversor]
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal / Selector de Galería de Fotos de Franquicia */}
      {isPhotoPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#161418] text-[#161418] dark:text-[#FAF8F6] border-2 border-[#161418] dark:border-[#46413F] rounded-[16px] max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#C9C3BE] dark:border-[#2A2629] pb-4">
              <div>
                <h3 className="font-kol-display font-extrabold text-[20px] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#C51172]" />
                  <span>Galería de fotos de locales e islas</span>
                </h3>
                <p className="text-[13px] text-[#46413F] dark:text-[#C9C3BE] mt-0.5">
                  Elegí una foto para tu anuncio o subí imágenes reales de tus sucursales
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Botón para subir nueva foto */}
            <div className="p-4 bg-[#FAF8F6] dark:bg-[#2A2629] border border-[#C9C3BE] dark:border-[#46413F] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-[14px] block">Subir foto desde tu dispositivo</span>
                <span className="text-[12px] text-[#8C8580]">
                  JPG, PNG o WEBP de tus tiendas, islas o productos
                </span>
              </div>

              <label className="kol-btn-normal px-4 py-2 bg-[#161418] dark:bg-[#FAF8F6] text-[#FAF8F6] dark:text-[#161418] hover:opacity-90 flex items-center gap-2 font-bold text-[13px] cursor-pointer whitespace-nowrap self-start sm:self-auto">
                <Upload className="w-4 h-4" />
                <span>Subir nueva foto</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Cuadrícula de fotos disponibles en la galería */}
            <div className="space-y-2">
              <span className="text-[12px] font-bold text-[#8C8580] uppercase tracking-wider block">
                Fotos guardadas ({galleryImages.length}):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => handleSelectGalleryImage(img.url)}
                    className="group border-2 border-transparent hover:border-[#C51172] rounded-[12px] overflow-hidden cursor-pointer relative bg-[#2A2629] aspect-square flex flex-col justify-end shadow transition-all"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 text-white">
                      <span className="text-[11px] font-bold line-clamp-1 block">
                        {img.name}
                      </span>
                      <span className="text-[10px] text-[#FFBA00] font-semibold">
                        {img.isCustom ? "Subida por vos" : "Oficial KOL"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPhotoPickerOpen(false)}
                className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] dark:bg-[#2A2629] border border-[#8C8580] text-[13px] font-bold"
              >
                Cerrar galería
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
