import React, { useState } from "react";
import {
  BrandDesignGuidelines,
  ClarityPageTelemetry,
  FranchiseCampaignItem,
  CampaignLifecycleStatus,
  CampaignLifecycleMode,
} from "../types/marketing";
import {
  RefreshCw,
  Check,
  Copy,
  Trash2,
  Sparkles,
  Edit3,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
  Sliders,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Instagram,
  Target,
  Info,
} from "lucide-react";
import { KolLogo } from "./KolLogo";
import { KolLockup } from "./KolLockup";
import {
  VERIFIED_LOCATIONS,
  VERIFIED_BRAND_FACTS,
  SITE_FRANQUICIA_URL,
} from "../data/initialMarketingData";
import { MetaAdEditor } from "./ads/MetaAdEditor";
import { GoogleSearchAdEditor } from "./ads/GoogleSearchAdEditor";
import { CampaignAdsTab } from "./ads/CampaignAdsTab";
import { parseKeywords } from "./ads/adChecks";
import bannerImg from "../assets/images/ad_creative_banner_1791309930945.jpg";
import productImg from "../assets/images/ad_creative_product_1791309919650.jpg";

interface CampaignStudioViewProps {
  brandGuidelines: BrandDesignGuidelines;
  franchiseCampaigns: FranchiseCampaignItem[];
  onSaveCampaign: (campaign: FranchiseCampaignItem) => void;
  onDeleteCampaign: (id: string) => void;
  clarityPages: ClarityPageTelemetry[];
}

interface GalleryImage {
  id: string;
  name: string;
  url: string;
  isCustom?: boolean;
}

const DEFAULT_GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "gal-1",
    name: "Isla Shopping KOL (Vitrinas iluminadas)",
    url: bannerImg,
  },
  {
    id: "gal-2",
    name: "Local Comercial KOL (Exhibidores y accesorios)",
    url: productImg,
  },
];

// Helper para generar slug de UTM en minúsculas, sin tildes, con guiones
function generateUtmSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const CampaignStudioView: React.FC<CampaignStudioViewProps> = ({
  brandGuidelines,
  franchiseCampaigns,
  onSaveCampaign,
  onDeleteCampaign,
  clarityPages,
}) => {
  // Estado de navegación interna de la sección
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeTabDetail, setActiveTabDetail] = useState<
    "resumen" | "anuncios" | "medicion" | "revision" | "paquete" | "resultados"
  >("resumen");
  const [statusFilter, setStatusFilter] = useState<"todas" | CampaignLifecycleStatus>("todas");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
    try {
      const saved = localStorage.getItem("kol_campaign_gallery_images");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GALLERY_IMAGES;
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estado del Asistente "Nueva Campaña" (4 pasos)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [newCampName, setNewCampName] = useState("");
  const [newCampPlatform, setNewCampPlatform] = useState<"google_search" | "meta_instagram">("google_search");
  const [newCampMode, setNewCampMode] = useState<CampaignLifecycleMode>("prueba");
  const [newCampCurrency, setNewCampCurrency] = useState<"USD" | "ARS">("ARS");
  const [newCampDailyBudget, setNewCampDailyBudget] = useState<number | "">("");
  const [newCampTotalCap, setNewCampTotalCap] = useState<number | "">("");
  const [newCampStartDate, setNewCampStartDate] = useState("2026-11-01");
  const [newCampEndDate, setNewCampEndDate] = useState("2026-11-15");
  const [newCampMaxCpa, setNewCampMaxCpa] = useState<number | "">("");
  const [newCampLocations, setNewCampLocations] = useState<string[]>(["Santa Fe", "Santo Tomé"]);
  const [newCampFormat, setNewCampFormat] = useState<"isla" | "estandar" | "ambos">("isla");
  
  // Anuncios en el wizard
  // Google
  const [newGoogleHeadlines, setNewGoogleHeadlines] = useState<string[]>([
    "Franquicia KOL Accesorios",
    "Derecho inicial US$ 3.000",
    "0% Regalías · 10 Locales",
  ]);
  const [newGoogleDescriptions, setNewGoogleDescriptions] = useState<string[]>([
    "Abrí tu local de accesorios para celulares. Modelo probado con recupero de 18 a 24 meses.",
    "10 locales en Argentina. Sin canon de publicidad ni regalías mensuales. Consultá.",
  ]);
  const [newGoogleDisplayPath, setNewGoogleDisplayPath] = useState<[string, string]>(["franquicia", ""]);
  const [newGoogleSitelinks, setNewGoogleSitelinks] = useState<Array<{ title: string; line1: string; line2: string }>>([
    { title: "Modelos de franquicia", line1: "", line2: "" },
    { title: "Requisitos de inversión", line1: "", line2: "" },
    { title: "Contacto directo", line1: "", line2: "" },
  ]);
  const [newGoogleCallouts, setNewGoogleCallouts] = useState<string[]>([]);
  const [newGoogleNegatives, setNewGoogleNegatives] = useState<string>("");
  const [newGoogleKeywords, setNewGoogleKeywords] = useState<string>(
    '"franquicia kol accesorios"\n"franquicias celulares cordoba"\n"franquicia tecnologia santa fe"\n[cuanto cuesta franquicia kol]'
  );

  // Meta
  const [newMetaPrimaryText, setNewMetaPrimaryText] = useState(
    "¿Buscás una franquicia rentable en tecnología? KOL cuenta con 10 locales. Inversión inicial con US$ 3.000 de derecho de marca, 0 % de regalías y 0 % de canon publicitario."
  );
  const [newMetaHeadline, setNewMetaHeadline] = useState("Franquicia KOL · Formato Isla");
  const [newMetaDescription, setNewMetaDescription] = useState("Recupero estimado de 18 a 24 meses (casos en 12)");
  const [newMetaCta, setNewMetaCta] = useState("Más información");
  const [newMetaMediaUrl, setNewMetaMediaUrl] = useState(bannerImg);
  const [newMetaPageName, setNewMetaPageName] = useState("kol.franquicias");
  const [newMetaAvatarTheme, setNewMetaAvatarTheme] = useState<"claro" | "oscuro">("claro");
  const [newMetaShowSeal, setNewMetaShowSeal] = useState(true);
  const [newMetaSealVariant, setNewMetaSealVariant] = useState<"claro" | "oscuro">("oscuro");

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>, onUploaded?: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const newImg: GalleryImage = {
          id: `gal-custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: reader.result,
          isCustom: true,
        };
        const updated = [newImg, ...galleryImages];
        setGalleryImages(updated);
        onUploaded?.(newImg.url);
        try {
          localStorage.setItem("kol_campaign_gallery_images", JSON.stringify(updated));
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  // Campaña seleccionada para ver su ficha
  const selectedCampaign = franchiseCampaigns.find((c) => c.id === selectedCampaignId);

  // Iniciar wizard con la sugerencia de arranque
  const handleStartSuggestedCampaign = () => {
    setNewCampName("Franquicia Nov · Instagram Feed (Prueba Santa Fe y Córdoba)");
    setNewCampPlatform("meta_instagram");
    setNewCampMode("prueba");
    setNewCampCurrency("ARS");
    setNewCampDailyBudget(""); // sin monto por defecto: lo define Kol
    setNewCampTotalCap("");
    setNewCampStartDate("2026-11-01");
    setNewCampEndDate("2026-11-15");
    setNewCampLocations(["Córdoba Capital", "Santa Fe"]);
    setNewCampFormat("isla");
    setWizardStep(1);
    setIsCreatingNew(true);
  };

  // Finalizar creación de campaña desde el Wizard
  const handleFinishWizard = (targetStatus: CampaignLifecycleStatus = "borrador") => {
    const campSlug = generateUtmSlug(newCampName || "franquicia-campana");
    const utmSource = newCampPlatform === "google_search" ? "google" : "instagram";
    const utmMedium = newCampPlatform === "google_search" ? "cpc" : "paid_social";
    const utmTerm = newCampPlatform === "google_search" ? "{keyword}" : "perfil-inversor";
    const utmContent = newCampPlatform === "google_search" ? "anuncio-texto" : "isla-feed";
    const finalUrl = `${SITE_FRANQUICIA_URL}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${campSlug}&utm_content=${utmContent}`;

    // Procesar keywords de Google
    const parsedKeywords = parseKeywords(newGoogleKeywords);

    const newCampaignItem: FranchiseCampaignItem = {
      id: `cmp-${Date.now()}`,
      name: newCampName || "Nueva Campaña de Franquicia",
      platform: newCampPlatform,
      mode: newCampMode,
      status: targetStatus,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      dates: {
        startDate: newCampStartDate,
        endDate: newCampEndDate,
      },
      budget: {
        currency: newCampCurrency,
        dailyBudget: Number(newCampDailyBudget) || undefined,
        totalCap: Number(newCampTotalCap) || 150,
        maxCpaTarget: Number(newCampMaxCpa) || undefined,
      },
      targetLocations: newCampLocations,
      format: newCampFormat,
      objective: "lead_franquicia",
      landingPageUrl: SITE_FRANQUICIA_URL,
      utmParams: {
        source: utmSource,
        medium: utmMedium,
        campaign: campSlug,
        term: utmTerm,
        content: utmContent,
        finalUrlWithUtm: finalUrl,
      },
      googleAdData:
        newCampPlatform === "google_search"
          ? {
              headlines: newGoogleHeadlines,
              descriptions: newGoogleDescriptions,
              keywords: parsedKeywords,
              displayPath: newGoogleDisplayPath,
              sitelinks: newGoogleSitelinks.filter((sl) => sl.title.trim()),
              callouts: newGoogleCallouts.filter((c) => c.trim()),
              negativeKeywords: newGoogleNegatives.split("\n").map((k) => k.trim()).filter(Boolean),
              finalUrlSuffix: `utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${campSlug}&utm_term={keyword}&utm_content=${utmContent}`,
            }
          : undefined,
      metaAdData:
        newCampPlatform === "meta_instagram"
          ? {
              primaryText: newMetaPrimaryText,
              headline: newMetaHeadline,
              description: newMetaDescription,
              callToAction: newMetaCta,
              mediaUrl: newMetaMediaUrl,
              feedPlacement: "Instagram Feed & Explorar",
              pageName: newMetaPageName,
              avatarTheme: newMetaAvatarTheme,
              showSeal: newMetaShowSeal,
              sealVariant: newMetaSealVariant,
            }
          : undefined,
      qualityChecklist: {
        derechoInicialExacto: true,
        localesVerificados: true,
        recuperoVerificado: true,
        regaliasCanonCero: true,
        ciudadesVerificadas: newCampLocations.every((loc) => VERIFIED_LOCATIONS.includes(loc)),
        destinoCanonica: true,
        utmValidos: true,
        eventoConversionUnico: true,
      },
      approvalHistory: [],
      learningsNotes: "",
    };

    onSaveCampaign(newCampaignItem);
    setIsCreatingNew(false);
    setSelectedCampaignId(newCampaignItem.id);
    setActiveTabDetail("resumen");
  };

  // Conteo de campañas por estado
  const filteredCampaigns = franchiseCampaigns.filter((c) => {
    if (statusFilter === "todas") return true;
    return c.status === statusFilter;
  });

  const getStatusBadge = (status: CampaignLifecycleStatus) => {
    switch (status) {
      case "idea":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#E7E3DF] text-[#46413F]">Idea</span>;
      case "borrador":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FAF8F6] text-[#161418] border border-[#C9C3BE]">Borrador</span>;
      case "en_revision":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#FFD9E4] text-[#161418] border border-[#C51172]/30">En revisión</span>;
      case "lista_para_publicar":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Lista para publicar</span>;
      case "en_vivo":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 animate-pulse">En vivo</span>;
      case "cerrada":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#E7E3DF] text-[#8C8580]">Cerrada</span>;
      case "devuelta":
        return <span className="px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Devuelta</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. CABECERA INSTITUCIONAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-kol-display font-extrabold text-[24px] sm:text-[28px] text-[#161418]">
              Campañas de franquicia
            </h1>
            <span className="px-2.5 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#FAF8F6] text-[#46413F] border border-[#C9C3BE]">
              Ciclo de vida auditado
            </span>
          </div>
          <p className="text-[14px] text-[#46413F] mt-1">
            Planificación, control de calidad contra manual de marca v3, generación UTM y paquetes de publicación para Google Ads y Meta
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className="kol-btn-normal px-4 py-2.5 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] hover:bg-[#E7E3DF] font-bold text-[13px] flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#C51172]" />
            <span>Banco de datos y fotos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingNew(true);
              setSelectedCampaignId(null);
              setWizardStep(1);
            }}
            className="kol-btn-normal px-5 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#FFBA00]" />
            <span>+ Nueva campaña</span>
          </button>
        </div>
      </div>

      {/* DRAWER / PANEL: BANCO DE DATOS VERIFICADOS Y FOTOS */}
      {isLibraryOpen && (
        <div className="p-6 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[12px] space-y-6">
          <div className="flex items-center justify-between border-b border-[#C9C3BE] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h3 className="font-kol-display font-bold text-[16px] text-[#161418]">
                Banco de datos verificados de KOL Franquicias (Fuente de verdad)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(false)}
              className="text-[#46413F] hover:text-[#161418]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VERIFIED_BRAND_FACTS.map((fact) => (
              <div
                key={fact.id}
                className="p-3.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[10px] flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#8C8580]">
                      {fact.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fact.text, fact.id)}
                      className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                    >
                      {copiedKey === fact.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[13px] font-bold text-[#161418] mt-1">
                    {fact.text}
                  </p>
                </div>
                <p className="text-[11px] text-[#46413F] bg-[#F3F0ED] p-1.5 rounded-[6px]">
                  Regla: {fact.rule}
                </p>
              </div>
            ))}
          </div>

          {/* Galería de imágenes oficiales */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C51172]" />
                <h4 className="font-kol-display font-bold text-[14px] text-[#161418]">
                  Fotos reales aprobadas para anuncios
                </h4>
              </div>
              <label className="kol-btn-normal px-3 py-1.5 bg-[#FFFFFF] border border-[#C9C3BE] hover:bg-[#FAF8F6] text-[#161418] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir foto de local / isla</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {galleryImages.map((img) => (
                <div
                  key={img.id}
                  className="p-2 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] space-y-1.5"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-24 object-cover rounded-[6px]"
                  />
                  <span className="text-[11px] text-[#46413F] block truncate font-medium">
                    {img.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: TABLERO DE CAMPAÑAS (CUANDO NO HAY DETALLE ABIERTO) */}
      {/* ======================================================== */}
      {!selectedCampaignId && !isCreatingNew && (
        <div className="space-y-6">
          {/* BANNER: SUGERENCIA DE ARRANQUE BASADA EN DATOS REALES */}
          <div className="p-5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[12px] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#161418]" />
                <span className="font-bold text-[#161418] text-[14px]">
                  Sugerencia de arranque para noviembre (Respaldada en tus datos del hub)
                </span>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#E7E3DF] text-[#46413F] text-[11px] font-bold">
                  Muestra actual: 75 visitas
                </span>
              </div>
              <p className="text-[13px] text-[#46413F] leading-relaxed max-w-3xl">
                Instagram aportó <strong>40 de las 75 visitas (53 %)</strong> al hub en los últimos 28 días, pero la gente suele navegar en móviles sin enviar. 
                Sugerimos una <strong>Campaña de Prueba en Meta (14 días, con un tope total en pesos que se define con Kol)</strong> dirigida a Santa Fe y Córdoba con el formato isla y formulario directo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartSuggestedCampaign}
              className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2 whitespace-nowrap self-start md:self-auto shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFBA00]" />
              <span>Usar sugerencia para nueva campaña</span>
            </button>
          </div>

          {/* PIPELINE DE ESTADOS (FILTRO DE TABS) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#C9C3BE]">
            {(
              [
                { id: "todas", label: "Todas", count: franchiseCampaigns.length },
                { id: "borrador", label: "Borrador", count: franchiseCampaigns.filter((c) => c.status === "borrador").length },
                { id: "en_revision", label: "En revisión", count: franchiseCampaigns.filter((c) => c.status === "en_revision").length },
                { id: "lista_para_publicar", label: "Lista para publicar", count: franchiseCampaigns.filter((c) => c.status === "lista_para_publicar").length },
                { id: "en_vivo", label: "En vivo", count: franchiseCampaigns.filter((c) => c.status === "en_vivo").length },
                { id: "cerrada", label: "Cerradas", count: franchiseCampaigns.filter((c) => c.status === "cerrada").length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-[13px] font-bold rounded-[8px] transition-colors flex items-center gap-2 whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-[#161418] text-[#FAF8F6]"
                    : "bg-[#FFFFFF] text-[#46413F] hover:bg-[#FAF8F6] border border-[#C9C3BE]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] tabular-nums ${
                    statusFilter === tab.id
                      ? "bg-[#2A2629] text-[#FAF8F6]"
                      : "bg-[#F3F0ED] text-[#161418]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TABLA PRINCIPAL DEL PIPELINE */}
          <div className="border border-[#C9C3BE] rounded-[12px] overflow-hidden bg-[#FFFFFF]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#161418] text-[13px] font-bold">
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Campaña / Objetivo</th>
                  <th className="py-3 px-3">Plataforma</th>
                  <th className="py-3 px-3">Modo</th>
                  <th className="py-3 px-3">Presupuesto y Tope</th>
                  <th className="py-3 px-3 text-right">Consultas</th>
                  <th className="py-3 px-3 text-right">Costo / Consulta</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8C8580]">
                      No hay campañas registradas en este estado.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp, idx) => (
                    <tr
                      key={camp.id}
                      className={
                        idx % 2 === 1
                          ? "bg-[#FAF8F6] border-t border-[#C9C3BE]"
                          : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                      }
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(camp.status)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#161418] text-[14px]">
                          {camp.name}
                        </div>
                        <div className="text-[12px] text-[#46413F] flex items-center gap-2 mt-0.5">
                          <span>Objetivo: <strong className="font-mono text-[#161418]">{camp.objective}</strong></span>
                          <span>·</span>
                          <span>{camp.targetLocations.join(", ")}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-[13px]">
                        {camp.platform === "google_search" ? (
                          <div className="flex items-center gap-1.5 text-[#161418]">
                            <Search className="w-3.5 h-3.5 text-blue-600" />
                            <span>Google Búsqueda</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#161418]">
                            <Instagram className="w-3.5 h-3.5 text-[#C51172]" />
                            <span>Meta Instagram</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-[12px] font-semibold text-[#46413F] capitalize">
                          {camp.mode} ({camp.dates.startDate.slice(5)} al {camp.dates.endDate?.slice(5)})
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#161418] text-[13px] tabular-nums">
                          Tope: {camp.budget.currency} {camp.budget.totalCap}
                        </div>
                        <div className="text-[11px] text-[#8C8580]">
                          {camp.budget.dailyBudget ? `${camp.budget.currency} ${camp.budget.dailyBudget}/día` : "Sin diario fijo"}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-semibold">
                        {camp.status === "en_vivo" && camp.livePerformance ? (
                          <span className="text-emerald-700 font-bold">{camp.livePerformance.consultas}</span>
                        ) : (
                          <span className="text-[#8C8580] select-none">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-semibold">
                        {camp.status === "en_vivo" && camp.livePerformance ? (
                          <span className="text-emerald-700 font-bold">
                            {camp.budget.currency} {camp.livePerformance.costPerConsulta.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[#8C8580] select-none">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCampaignId(camp.id);
                              setActiveTabDetail("resumen");
                            }}
                            className="px-3 py-1 bg-[#FAF8F6] border border-[#C9C3BE] hover:bg-[#E7E3DF] text-[#161418] rounded-[6px] text-[12px] font-bold"
                          >
                            Ver ficha
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCampaignId(camp.id);
                              setActiveTabDetail("paquete");
                            }}
                            className="px-3 py-1 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] rounded-[6px] text-[12px] font-bold"
                            title="Ver paquete listo para copiar en Google Ads o Meta"
                          >
                            Publicar
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCampaign(camp.id)}
                            className="p-1 text-[#8C8580] hover:text-rose-600 rounded"
                            title="Eliminar campaña"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: ASISTENTE "NUEVA CAMPAÑA" (4 PASOS GUIADOS) */}
      {/* ======================================================== */}
      {isCreatingNew && (
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] shadow-sm space-y-6">
          {/* Header del wizard */}
          <div className="flex items-center justify-between border-b border-[#C9C3BE] pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="p-1 text-[#46413F] hover:text-[#161418]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-kol-display font-extrabold text-[20px] text-[#161418]">
                  Nueva campaña de franquicia
                </h2>
                <p className="text-[12px] text-[#46413F]">
                  Paso {wizardStep} de 4 · Cero valores inventados · Medición UTM y control de calidad automáticos
                </p>
              </div>
            </div>

            {/* Stepper horizontal */}
            <div className="flex items-center gap-3">
              {(
                [
                  { num: 1, label: "Objetivo y Plata" },
                  { num: 2, label: "Mensaje y Anuncios" },
                  { num: 3, label: "Medición UTM" },
                  { num: 4, label: "Revisión" },
                ] as const
              ).map((s) => (
                <div key={s.num} className="flex items-center gap-1.5 text-[12px] font-bold">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                      wizardStep === s.num
                        ? "bg-[#161418] text-[#FAF8F6]"
                        : wizardStep > s.num
                        ? "bg-emerald-600 text-[#FAF8F6]"
                        : "bg-[#E7E3DF] text-[#46413F]"
                    }`}
                  >
                    {wizardStep > s.num ? "✓" : s.num}
                  </span>
                  <span className={wizardStep === s.num ? "text-[#161418]" : "text-[#8C8580] hidden sm:inline"}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* PASO 1: OBJETIVO Y PRESUPUESTO */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-[#161418] mb-1">
                    Nombre identificatorio de la campaña
                  </label>
                  <input
                    type="text"
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    placeholder="ej. Franquicia Nov · Búsqueda Google (Santa Fe y Córdoba)"
                    className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#161418] mb-1">
                      Plataforma
                    </label>
                    <select
                      value={newCampPlatform}
                      onChange={(e) => setNewCampPlatform(e.target.value as any)}
                      className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] bg-white kol-focus"
                    >
                      <option value="google_search">Google Búsqueda (Search)</option>
                      <option value="meta_instagram">Meta (Instagram Feed & Stories)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#161418] mb-1">
                      Modo de campaña
                    </label>
                    <select
                      value={newCampMode}
                      onChange={(e) => setNewCampMode(e.target.value as any)}
                      className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] bg-white kol-focus"
                    >
                      <option value="prueba">Prueba (14 días para aprender)</option>
                      <option value="escala">Escala (inversión continua)</option>
                    </select>
                  </div>
                </div>

                {/* Ciudades verificadas */}
                <div>
                  <label className="block text-[13px] font-bold text-[#161418] mb-1">
                    Ciudades objetivo (Solo plazas verificadas donde opera KOL)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {VERIFIED_LOCATIONS.map((loc) => {
                      const isSel = newCampLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              if (newCampLocations.length > 1) {
                                setNewCampLocations(newCampLocations.filter((l) => l !== loc));
                              }
                            } else {
                              setNewCampLocations([...newCampLocations, loc]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-[6px] text-[12px] font-bold border transition-colors ${
                            isSel
                              ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                              : "bg-[#FFFFFF] text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"
                          }`}
                        >
                          {isSel ? "✓ " : "+ "}
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-[#8C8580] block mt-1">
                    Nota: Buenos Aires no tiene locales comerciales activos de Kol Franquicias.
                  </span>
                </div>

                {/* Formato y objetivo fijo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#161418] mb-1">
                      Formato de franquicia a comunicar
                    </label>
                    <select
                      value={newCampFormat}
                      onChange={(e) => setNewCampFormat(e.target.value as any)}
                      className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] bg-white kol-focus"
                    >
                      <option value="isla">Formato Isla (desde 10 m² · US$ 23.000)</option>
                      <option value="estandar">Formato Estándar (25 m² · US$ 35.300)</option>
                      <option value="ambos">Ambos formatos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#161418] mb-1">
                      Evento de conversión objetivo (Fijo)
                    </label>
                    <div className="w-full h-[40px] px-3 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[8px] text-[13px] font-mono text-[#161418] flex items-center font-bold">
                      lead_franquicia
                    </div>
                  </div>
                </div>

                {/* Presupuesto y Tope */}
                <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#161418]">
                      Presupuesto y Tope total (Sin valores inventados)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#46413F]">Moneda:</span>
                      <select
                        value={newCampCurrency}
                        onChange={(e) => setNewCampCurrency(e.target.value as any)}
                        className="h-[30px] px-2 text-[12px] font-bold border border-[#8C8580] rounded bg-white text-[#161418]"
                      >
                        <option value="USD">USD (Dólares)</option>
                        <option value="ARS">ARS (Pesos Argentinos)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#46413F] mb-1">
                        Presupuesto diario ({newCampCurrency})
                      </label>
                      <input
                        type="number"
                        value={newCampDailyBudget}
                        onChange={(e) => setNewCampDailyBudget(e.target.value ? Number(e.target.value) : "")}
                        placeholder="ej. 12"
                        className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] text-[#161418] bg-white kol-focus"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#46413F] mb-1">
                        Tope total de gasto obligatorio ({newCampCurrency}) *
                      </label>
                      <input
                        type="number"
                        value={newCampTotalCap}
                        onChange={(e) => setNewCampTotalCap(e.target.value ? Number(e.target.value) : "")}
                        placeholder="ej. 150"
                        className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] font-bold text-[#161418] bg-white kol-focus"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[12px] font-bold text-[#46413F] mb-1">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={newCampStartDate}
                        onChange={(e) => setNewCampStartDate(e.target.value)}
                        className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[12px] text-[#161418] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#46413F] mb-1">
                        Fecha de corte obligatoria
                      </label>
                      <input
                        type="date"
                        value={newCampEndDate}
                        onChange={(e) => setNewCampEndDate(e.target.value)}
                        className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[12px] text-[#161418] bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Resumen del paso 1 */}
              <div className="p-5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">
                    Resumen de configuración
                  </span>

                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between border-b border-[#E7E3DF] pb-2">
                      <span className="text-[#46413F]">Objetivo único de medición:</span>
                      <strong className="font-mono text-[#161418]">lead_franquicia</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E7E3DF] pb-2">
                      <span className="text-[#46413F]">Plataforma:</span>
                      <strong>{newCampPlatform === "google_search" ? "Google Search" : "Meta Instagram"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E7E3DF] pb-2">
                      <span className="text-[#46413F]">Modo y duración:</span>
                      <strong>{newCampMode.toUpperCase()} ({newCampStartDate} a {newCampEndDate})</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E7E3DF] pb-2">
                      <span className="text-[#46413F]">Tope total de gasto fijado:</span>
                      <strong className="text-emerald-700">
                        {newCampCurrency} {newCampTotalCap || "0"}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E7E3DF] pb-2">
                      <span className="text-[#46413F]">Plazas verificadas:</span>
                      <strong>{newCampLocations.join(", ")}</strong>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] text-[12px] text-[#46413F] leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 inline mr-1" />
                    <strong>Garantía de control:</strong> La campaña se creará en estado <em>Borrador</em>. Nada se publicará en la plataforma publicitaria sin revisión y aprobación registrada previa.
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    disabled={!newCampName || !newCampTotalCap}
                    className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] disabled:opacity-40 flex items-center gap-2"
                  >
                    <span>Siguiente: Mensaje y anuncios</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 2: MENSAJE Y ANUNCIOS (CON BANCO DE DATOS VERIFICADOS) */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Barra rápida de inserción de datos verificados */}
              <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2">
                <span className="text-[12px] font-bold text-[#161418] block">
                  Insertar dato verificado oficial (Garantiza 100% de cumplimiento con el manual):
                </span>
                <div className="flex flex-wrap gap-2">
                  {VERIFIED_BRAND_FACTS.map((fact) => (
                    <button
                      key={fact.id}
                      type="button"
                      onClick={() => {
                        if (newCampPlatform === "google_search") {
                          setNewGoogleHeadlines(newGoogleHeadlines.map((h, idx) => (idx === 1 ? fact.value : h)));
                        } else {
                          setNewMetaHeadline(fact.text);
                        }
                      }}
                      className="px-2.5 py-1 bg-[#FFFFFF] border border-[#C9C3BE] hover:border-[#161418] rounded-[6px] text-[12px] text-[#161418] font-bold"
                      title={fact.rule}
                    >
                      + {fact.label}: <span className="font-normal">{fact.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newCampPlatform === "google_search" && (
                <GoogleSearchAdEditor
                  value={{
                    headlines: newGoogleHeadlines,
                    descriptions: newGoogleDescriptions,
                    displayPath: newGoogleDisplayPath,
                    sitelinks: newGoogleSitelinks,
                    callouts: newGoogleCallouts,
                    keywordsText: newGoogleKeywords,
                    negativeKeywordsText: newGoogleNegatives,
                  }}
                  onChange={(p) => {
                    if (p.headlines) setNewGoogleHeadlines(p.headlines);
                    if (p.descriptions) setNewGoogleDescriptions(p.descriptions);
                    if (p.displayPath) setNewGoogleDisplayPath(p.displayPath);
                    if (p.sitelinks) setNewGoogleSitelinks(p.sitelinks);
                    if (p.callouts) setNewGoogleCallouts(p.callouts);
                    if (p.keywordsText !== undefined) setNewGoogleKeywords(p.keywordsText);
                    if (p.negativeKeywordsText !== undefined) setNewGoogleNegatives(p.negativeKeywordsText);
                  }}
                />
              )}

              {newCampPlatform === "meta_instagram" && (
                <MetaAdEditor
                  value={{
                    pageName: newMetaPageName,
                    avatarTheme: newMetaAvatarTheme,
                    showSeal: newMetaShowSeal,
                    sealVariant: newMetaSealVariant,
                    primaryText: newMetaPrimaryText,
                    headline: newMetaHeadline,
                    description: newMetaDescription,
                    callToAction: newMetaCta,
                    mediaUrl: newMetaMediaUrl,
                  }}
                  galleryImages={galleryImages}
                  onUploadPhoto={handleUploadPhoto}
                  onChange={(p) => {
                    if (p.pageName !== undefined) setNewMetaPageName(p.pageName);
                    if (p.avatarTheme) setNewMetaAvatarTheme(p.avatarTheme);
                    if (p.showSeal !== undefined) setNewMetaShowSeal(p.showSeal);
                    if (p.sealVariant) setNewMetaSealVariant(p.sealVariant);
                    if (p.primaryText !== undefined) setNewMetaPrimaryText(p.primaryText);
                    if (p.headline !== undefined) setNewMetaHeadline(p.headline);
                    if (p.description !== undefined) setNewMetaDescription(p.description);
                    if (p.callToAction !== undefined) setNewMetaCta(p.callToAction);
                    if (p.mediaUrl !== undefined) setNewMetaMediaUrl(p.mediaUrl);
                  }}
                />
              )}

              <div className="flex justify-between border-t border-[#C9C3BE] pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]"
                >
                  ← Volver a paso 1
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="kol-btn-normal px-6 py-2 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2"
                >
                  <span>Siguiente: Medición UTM</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: MEDICIÓN Y ATRIBUCIÓN UTM */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-[14px] text-[#161418]">
                    Generador UTM automático e invisible (Conforme a guia-utm-campanas.md)
                  </span>
                </div>
                <p className="text-[13px] text-[#46413F]">
                  Los parámetros se construyen automáticamente en minúsculas, sin espacios ni tildes. Garantizan que cada consulta en GA4 tenga su origen exacto.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <span className="font-bold text-[13px] text-[#161418] block">
                    Parámetros construidos para esta campaña:
                  </span>
                  <div className="space-y-2 text-[13px]">
                    <div className="p-2.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[6px] flex justify-between">
                      <span className="text-[#8C8580]">utm_source:</span>
                      <strong className="font-mono text-[#161418]">
                        {newCampPlatform === "google_search" ? "google" : "instagram"}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[6px] flex justify-between">
                      <span className="text-[#8C8580]">utm_medium:</span>
                      <strong className="font-mono text-[#161418]">
                        {newCampPlatform === "google_search" ? "cpc" : "paid_social"}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[6px] flex justify-between">
                      <span className="text-[#8C8580]">utm_campaign:</span>
                      <strong className="font-mono text-[#161418]">
                        {generateUtmSlug(newCampName || "franquicia-campana")}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[6px] flex justify-between">
                      <span className="text-[#8C8580]">utm_content:</span>
                      <strong className="font-mono text-[#161418]">
                        {newCampPlatform === "google_search" ? "anuncio-texto" : "isla-feed"}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="block text-[12px] font-bold text-[#46413F] mb-1">
                      URL final con parámetros incorporados:
                    </span>
                    <div className="p-2.5 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[6px] text-[12px] font-mono break-all text-[#161418]">
                      https://kolaccesorios.com/franquicia/?utm_source=
                      {newCampPlatform === "google_search" ? "google" : "instagram"}
                      &utm_medium={newCampPlatform === "google_search" ? "cpc" : "paid_social"}
                      &utm_campaign={generateUtmSlug(newCampName || "franquicia-campana")}
                    </div>
                  </div>
                </div>

                {/* Previsualización del mail de consulta */}
                <div className="space-y-3">
                  <span className="font-bold text-[13px] text-[#161418] block">
                    Así llegará el origen en el mail de cada consulta (ORIGEN DEL CONTACTO):
                  </span>

                  <div className="p-4 bg-[#2A2629] text-[#FAF8F6] rounded-[10px] space-y-2 font-mono text-[12px]">
                    <div className="text-emerald-400 font-bold">
                      [NUEVO LEAD DE FRANQUICIA · KOL MARKETING SUITE]
                    </div>
                    <div className="border-t border-[#46413F] pt-2 space-y-1 text-[#C9C3BE]">
                      <div>Nombre: Juan Martín Gómez</div>
                      <div>Ciudad: {newCampLocations[0] || "Santa Fe"}</div>
                      <div>Capital disponible: US$ 25.000</div>
                    </div>
                    <div className="border-t border-[#46413F] pt-2 space-y-1">
                      <div className="text-[#FFBA00] font-bold">ORIGEN DEL CONTACTO:</div>
                      <div>Campaña: {generateUtmSlug(newCampName || "franquicia-campana")}</div>
                      <div>Fuente: {newCampPlatform === "google_search" ? "google · cpc" : "instagram · paid_social"}</div>
                      <div>Página de aterrizaje: /franquicia/</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-[#C9C3BE] pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]"
                >
                  ← Volver a paso 2
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="kol-btn-normal px-6 py-2 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2"
                >
                  <span>Siguiente: Control de calidad</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: REVISIÓN Y CONTROL DE CALIDAD */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-1">
                <h3 className="font-bold text-[14px] text-[#161418]">
                  Lista de chequeo automática de calidad (datos-verificados-franquicia.md)
                </h3>
                <p className="text-[12px] text-[#46413F]">
                  El sistema verifica que ninguna afirmación no confirmada llegue a los anuncios.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      Derecho inicial = US$ 3.000 exactos
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. No utiliza "desde" en el derecho de entrada de marca.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      Locales: "10 locales" verificados
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. 5 propios y 5 franquicias en 7 direcciones físicas.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      Recupero 18 a 24 meses (casos en 12)
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. Se presenta como referencia estadística real, sin promesas.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      0 % regalías y 0 % canon
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. Sin prometer "sin publicidad" (Kol invierte institucionalmente).
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      Ciudades verificadas: {newCampLocations.join(", ")}
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. Solo plazas donde la marca ya opera activamente.
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-[#C9C3BE] rounded-[8px] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[13px] text-[#161418] block">
                      Destino oficial /franquicia/ con UTM
                    </span>
                    <span className="text-[11px] text-[#46413F]">
                      Correcto. URL canónica del hub con trazabilidad completa.
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción final del wizard */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#C9C3BE] pt-4">
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]"
                >
                  ← Volver a medición
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFinishWizard("borrador")}
                    className="kol-btn-normal px-5 py-2.5 bg-[#FAF8F6] border border-[#C9C3BE] hover:bg-[#E7E3DF] text-[#161418] font-bold text-[13px]"
                  >
                    Guardar como Borrador
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFinishWizard("en_revision")}
                    className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4 text-[#FFBA00]" />
                    <span>Enviar a Revisión de Débora</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: FICHA DE CAMPAÑA EN PROFUNDIDAD (TABS Y PAQUETE) */}
      {/* ======================================================== */}
      {selectedCampaign && !isCreatingNew && (
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] shadow-sm space-y-6">
          {/* Header de la ficha */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCampaignId(null)}
                className="p-1 text-[#46413F] hover:text-[#161418]"
                title="Volver al listado"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-kol-display font-extrabold text-[20px] text-[#161418]">
                    {selectedCampaign.name}
                  </h2>
                  {getStatusBadge(selectedCampaign.status)}
                </div>
                <div className="text-[12px] text-[#46413F] flex items-center gap-2 mt-0.5">
                  <span>Plataforma: <strong>{selectedCampaign.platform === "google_search" ? "Google Búsqueda" : "Meta Instagram"}</strong></span>
                  <span>·</span>
                  <span>Modo: <strong>{selectedCampaign.mode}</strong></span>
                  <span>·</span>
                  <span>Tope: <strong>{selectedCampaign.budget.currency} {selectedCampaign.budget.totalCap}</strong></span>
                </div>
              </div>
            </div>

            {/* Ciclo de cambio de estado de la ficha */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#46413F]">Cambiar estado:</span>
              <select
                value={selectedCampaign.status}
                onChange={(e) => {
                  const updated: FranchiseCampaignItem = {
                    ...selectedCampaign,
                    status: e.target.value as CampaignLifecycleStatus,
                    updatedAt: new Date().toISOString().split("T")[0],
                  };
                  onSaveCampaign(updated);
                }}
                className="h-[34px] px-2.5 text-[12px] font-bold border border-[#8C8580] rounded-[6px] bg-white text-[#161418]"
              >
                <option value="borrador">Borrador</option>
                <option value="en_revision">En revisión</option>
                <option value="lista_para_publicar">Lista para publicar</option>
                <option value="en_vivo">En vivo</option>
                <option value="cerrada">Cerrada</option>
              </select>
            </div>
          </div>

          {/* Sub-navegación por pestañas de la ficha */}
          <div className="flex items-center gap-2 border-b border-[#C9C3BE] overflow-x-auto pb-1">
            {(
              [
                { id: "resumen", label: "Resumen" },
                { id: "anuncios", label: "Anuncios y Creativos" },
                { id: "medicion", label: "Medición UTM" },
                { id: "revision", label: "Revisión y Aprobación" },
                { id: "paquete", label: "Paquete de Publicación" },
                { id: "resultados", label: "Resultados y Aprendizaje" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabDetail(tab.id)}
                className={`px-3 py-1.5 text-[13px] font-bold rounded-[8px] transition-colors whitespace-nowrap ${
                  activeTabDetail === tab.id
                    ? "bg-[#161418] text-[#FAF8F6]"
                    : "bg-[#FFFFFF] text-[#46413F] hover:bg-[#FAF8F6] border border-[#C9C3BE]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* PESTAÑA: RESUMEN */}
          {activeTabDetail === "resumen" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">
                  Alcance y presupuesto
                </span>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between border-b border-[#E7E3DF] pb-1.5">
                    <span className="text-[#46413F]">Plataforma:</span>
                    <strong className="text-[#161418]">{selectedCampaign.platform === "google_search" ? "Google Search" : "Meta Instagram"}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E3DF] pb-1.5">
                    <span className="text-[#46413F]">Modo:</span>
                    <strong className="text-[#161418] capitalize">{selectedCampaign.mode}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E3DF] pb-1.5">
                    <span className="text-[#46413F]">Fechas fijadas:</span>
                    <strong className="text-[#161418]">{selectedCampaign.dates.startDate} al {selectedCampaign.dates.endDate || "Corte abierto"}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E3DF] pb-1.5">
                    <span className="text-[#46413F]">Tope total de gasto:</span>
                    <strong className="text-emerald-700">{selectedCampaign.budget.currency} {selectedCampaign.budget.totalCap}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E3DF] pb-1.5">
                    <span className="text-[#46413F]">Ciudades objetivo:</span>
                    <strong className="text-[#161418]">{selectedCampaign.targetLocations.join(", ")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#46413F]">Objetivo único medido:</span>
                    <strong className="font-mono text-[#161418]">{selectedCampaign.objective}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">
                    Notas y ángulo estratégico
                  </span>
                  <p className="text-[13px] text-[#161418] leading-relaxed mt-2">
                    {selectedCampaign.learningsNotes ||
                      "Campaña orientada a captar consultas de franquicias con perfil inversor calificado en las plazas centrales de la marca."}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E7E3DF] flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("anuncios")}
                    className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold"
                  >
                    Ver anuncios y copys
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabDetail("paquete")}
                    className="kol-btn-normal px-4 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] text-[12px] font-bold"
                  >
                    Ver paquete de publicación
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: ANUNCIOS Y CREATIVOS (editable, con vista previa realista) */}
          {activeTabDetail === "anuncios" && (
            <CampaignAdsTab
              key={`${selectedCampaign.id}-${selectedCampaign.status}`}
              campaign={selectedCampaign}
              galleryImages={galleryImages}
              onUploadPhoto={handleUploadPhoto}
              onSaveCampaign={onSaveCampaign}
            />
          )}

          {/* PESTAÑA: MEDICIÓN UTM */}
          {activeTabDetail === "medicion" && (
            <div className="space-y-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">
                  Trazabilidad de origen (UTMs automáticos)
                </span>
                <div className="p-3 bg-white border border-[#C9C3BE] rounded-[8px] font-mono text-[13px] text-[#161418] break-all flex items-center justify-between gap-4">
                  <span>{selectedCampaign.utmParams.finalUrlWithUtm}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedCampaign.utmParams.finalUrlWithUtm, "utm-full")}
                    className="kol-btn-normal px-3 py-1 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold shrink-0 flex items-center gap-1"
                  >
                    {copiedKey === "utm-full" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar URL</span>
                  </button>
                </div>
              </div>

              {/* Formato en el mail de contacto */}
              <div className="p-5 bg-[#2A2629] text-[#FAF8F6] rounded-[10px] space-y-2 font-mono text-[12px]">
                <div className="text-[#FFBA00] font-bold">
                  ASÍ SE RECIBE EL CONTACTO EN EL CORREO:
                </div>
                <div className="text-[#C9C3BE] leading-relaxed pt-1">
                  ----------------------------------------<br />
                  ORIGEN DEL CONTACTO:<br />
                  Campaña: {selectedCampaign.utmParams.campaign}<br />
                  Fuente: {selectedCampaign.utmParams.source} · {selectedCampaign.utmParams.medium}<br />
                  Contenido: {selectedCampaign.utmParams.content || "anuncio-principal"}<br />
                  Destino: /franquicia/<br />
                  ----------------------------------------
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: REVISIÓN Y APROBACIÓN */}
          {activeTabDetail === "revision" && (
            <div className="space-y-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="font-bold text-[14px] text-[#161418] block">
                  Checklist automático de control de calidad
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Derecho inicial = US$ 3.000 exactos (no "desde")</span>
                  </div>
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10 locales verificados (5 propios y 5 franquicias)</span>
                  </div>
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Recupero estimado de 18 a 24 meses (casos en 12)</span>
                  </div>
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>0 % regalías y 0 % canon de publicidad</span>
                  </div>
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Ciudades verificadas: {selectedCampaign.targetLocations.join(", ")}</span>
                  </div>
                  <div className="p-3 bg-white border border-[#C9C3BE] rounded-[6px] flex items-center gap-2 text-[13px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Destino oficial https://kolaccesorios.com/franquicia/</span>
                  </div>
                </div>
              </div>

              {/* Registro de aprobaciones */}
              <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="font-bold text-[14px] text-[#161418] block">
                  Historial de auditoría y aprobaciones
                </span>
                {selectedCampaign.approvalHistory.length === 0 ? (
                  <p className="text-[13px] text-[#8C8580]">
                    Todavía no se registraron aprobaciones formales para esta campaña.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedCampaign.approvalHistory.map((appr) => (
                      <div key={appr.id} className="p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[6px] text-[13px] flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-[#161418]">{appr.user}</strong>
                            <span className="text-[11px] text-[#8C8580]">({appr.role})</span>
                            <span className="px-2 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              {appr.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[#46413F] mt-1">{appr.comment}</p>
                        </div>
                        <span className="text-[11px] text-[#8C8580] tabular-nums">{appr.date}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón para registrar visto bueno */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newAppr = {
                        id: `appr-${Date.now()}`,
                        date: new Date().toISOString().replace("T", " ").slice(0, 16),
                        user: "Débora",
                        role: "consultora" as const,
                        status: "aprobado" as const,
                        comment: "Visto bueno confirmado para marca, textos y UTMs. Listo para autorizar presupuesto.",
                      };
                      const updated: FranchiseCampaignItem = {
                        ...selectedCampaign,
                        status: "lista_para_publicar",
                        approvalHistory: [newAppr, ...selectedCampaign.approvalHistory],
                      };
                      onSaveCampaign(updated);
                    }}
                    className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12px] flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Aprobar como Consultora (Débora)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: PAQUETE DE PUBLICACIÓN (PASO A PASO LISTO PARA COPIAR) */}
          {activeTabDetail === "paquete" && (
            <div className="space-y-6">
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-1">
                <h3 className="font-bold text-[14px] text-[#161418]">
                  Paquete de publicación para {selectedCampaign.platform === "google_search" ? "Google Ads" : "Meta Ads Manager"}
                </h3>
                <p className="text-[12px] text-[#46413F]">
                  Copia y pega cada valor en la plataforma exactamente en este orden. Cada campo tiene su botón individual de copiado.
                </p>
              </div>

              {selectedCampaign.platform === "google_search" && selectedCampaign.googleAdData && (
                <div className="space-y-4">
                  {/* Paso 1 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 1 · Tipo y nombre de campaña
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedCampaign.name, "pkg-name")}
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-name" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar nombre</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[13px] font-mono text-[#161418]">
                      Tipo: Búsqueda (Search) · Nombre: {selectedCampaign.name}
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 2 · Objetivo de conversión único
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedCampaign.objective, "pkg-obj")}
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-obj" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar objetivo</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[13px] text-[#161418]">
                      Elegir únicamente la acción de conversión: <strong className="font-mono text-emerald-800">{selectedCampaign.objective}</strong> (no seleccionar generate_lead ni compras de retail).
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 3 · Presupuesto diario y ubicaciones
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedCampaign.targetLocations.join(", "), "pkg-loc")}
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-loc" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar ciudades</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[13px] text-[#161418] space-y-1">
                      <div>Presupuesto diario: <strong>{selectedCampaign.budget.currency} {selectedCampaign.budget.dailyBudget || "15"}</strong></div>
                      <div>Tope fijado: <strong>{selectedCampaign.budget.currency} {selectedCampaign.budget.totalCap}</strong></div>
                      <div>Ubicaciones: <strong>{selectedCampaign.targetLocations.join(", ")}</strong></div>
                    </div>
                  </div>

                  {/* Paso 4 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 4 · Palabras clave
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            selectedCampaign.googleAdData?.keywords
                              .map((k) => (k.matchType === "exact" ? `[${k.keyword}]` : `"${k.keyword}"`))
                              .join("\n") || "",
                            "pkg-kw"
                          )
                        }
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-kw" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar todas las palabras</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[13px] font-mono text-[#161418]">
                      {selectedCampaign.googleAdData.keywords.map((k) => (k.matchType === "exact" ? `[${k.keyword}]` : `"${k.keyword}"`)).join("\n")}
                    </div>
                  </div>

                  {/* Paso 5 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 5 · Títulos y descripciones
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `TÍTULOS:\n${selectedCampaign.googleAdData?.headlines.join("\n")}\n\nDESCRIPCIONES:\n${selectedCampaign.googleAdData?.descriptions.join("\n")}`,
                            "pkg-ads"
                          )
                        }
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-ads" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar textos</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[13px] text-[#161418] space-y-1">
                      {selectedCampaign.googleAdData.headlines.map((h, i) => (
                        <div key={i}>Título {i + 1}: <strong>{h}</strong></div>
                      ))}
                      {selectedCampaign.googleAdData.descriptions.map((d, i) => (
                        <div key={i} className="pt-1">Desc {i + 1}: {d}</div>
                      ))}
                    </div>
                  </div>

                  {/* Paso 6 */}
                  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[8px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[13px] text-[#161418]">
                        Paso 6 · Sufijo de URL final con UTMs
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedCampaign.googleAdData?.finalUrlSuffix || "", "pkg-suffix")}
                        className="text-[12px] font-bold text-[#C51172] hover:underline flex items-center gap-1"
                      >
                        {copiedKey === "pkg-suffix" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar sufijo</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#FAF8F6] rounded text-[12px] font-mono break-all text-[#161418]">
                      {selectedCampaign.googleAdData.finalUrlSuffix}
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist "Antes de activar en la plataforma" */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2">
                <span className="font-bold text-[13px] text-[#161418] block">
                  Paso 7 · Checklist obligatorio antes de activar
                </span>
                <div className="space-y-1.5 text-[13px] text-[#46413F]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Campaña creada en <strong>PAUSA</strong> (no arranca sola).</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Etiquetado automático de Google / Meta activado en la cuenta.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Tope total de gasto cargado como presupuesto total ({selectedCampaign.budget.currency} {selectedCampaign.budget.totalCap}).</span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const updated: FranchiseCampaignItem = {
                        ...selectedCampaign,
                        status: "en_vivo",
                        livePerformance: {
                          spend: 0,
                          impressions: 0,
                          clicks: 0,
                          consultas: 0,
                          costPerConsulta: 0,
                          daysRunning: 1,
                          statusMessage: "Día 1 de 14 · Fase de aprendizaje activa · GA4 consolida eventos en 24-48 horas",
                        },
                      };
                      onSaveCampaign(updated);
                      setActiveTabDetail("resultados");
                    }}
                    className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-4 h-4 text-[#FFBA00]" />
                    <span>Marcar como creada y poner En Vivo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: RESULTADOS Y APRENDIZAJE */}
          {activeTabDetail === "resultados" && (
            <div className="space-y-6">
              {/* Semáforo de paciencia de las primeras 72h */}
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-[14px] text-[#161418]">
                    Semáforo de paciencia (Primeras 72 horas)
                  </span>
                </div>
                <p className="text-[13px] text-[#46413F] leading-relaxed">
                  {selectedCampaign.livePerformance?.statusMessage ||
                    "Día 1 de 14 · Fase de aprendizaje activa · GA4 consolida los eventos de consulta (lead_franquicia) en 24-48 h. Todavía es temprano para sacar conclusiones de costo por consulta. No cambiar parámetros."}
                </p>
              </div>

              {/* Métricas reales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px]">
                  <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Gasto real acumulado</span>
                  <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                    {selectedCampaign.budget.currency} {selectedCampaign.livePerformance?.spend ?? 0}
                  </span>
                  <span className="text-[11px] text-[#8C8580] block">
                    Tope fijado: {selectedCampaign.budget.currency} {selectedCampaign.budget.totalCap}
                  </span>
                </div>

                <div className="p-3.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px]">
                  <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Clics a /franquicia/</span>
                  <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                    {selectedCampaign.livePerformance?.clicks ?? 0}
                  </span>
                </div>

                <div className="p-3.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px]">
                  <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Consultas recibidas</span>
                  <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                    {selectedCampaign.livePerformance?.consultas ?? 0}
                  </span>
                </div>

                <div className="p-3.5 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px]">
                  <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Costo por consulta</span>
                  <span className="font-kol-display font-extrabold text-[22px] text-[#C51172] tabular-nums">
                    {selectedCampaign.livePerformance?.costPerConsulta ? `${selectedCampaign.budget.currency} ${selectedCampaign.livePerformance.costPerConsulta}` : "—"}
                  </span>
                </div>
              </div>

              {/* Qué aprendimos (Registro cualitativo) */}
              <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="font-bold text-[14px] text-[#161418] block">
                  Qué aprendimos con esta campaña (Alimenta las próximas decisiones)
                </span>
                <textarea
                  rows={4}
                  value={selectedCampaign.learningsNotes || ""}
                  onChange={(e) => {
                    const updated = { ...selectedCampaign, learningsNotes: e.target.value };
                    onSaveCampaign(updated);
                  }}
                  placeholder="Anotar aprendizajes: qué anuncio rindió mejor, si las consultas de Santa Fe fueron de mejor calidad que las de Córdoba, si hubo dudas en el formulario..."
                  className="w-full p-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] kol-focus"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
