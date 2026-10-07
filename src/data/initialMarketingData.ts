import {
  CampaignMetric,
  ClarityPageTelemetry,
  CustomReport,
  ScheduledEmailReport,
  PredictiveForecastResult,
  BrandDesignGuidelines,
  GeneratedCampaignPackage,
  ConnectedAccountsConfig,
  GoogleSearchKeyword,
  FranchiseFunnelStep,
  AcquisitionChannel,
} from "../types/marketing";

import productCreativeImg from "../assets/images/ad_creative_product_1791309919650.jpg";
import bannerCreativeImg from "../assets/images/ad_creative_banner_1791309930945.jpg";
import avatarMarketingLeadImg from "../assets/images/avatar_marketing_lead_1791309941471.jpg";

export const STUDIO_ASSETS = {
  productCreativeImg,
  bannerCreativeImg,
  avatarMarketingLeadImg,
};

// Configuración de conexiones de KOL Franquicias
export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountsConfig = {
  onboardingCompleted: true,
  gmpAccountEmail: "marketing@kolfranquicias.com.ar",
  gmpPropertyId: "372010641",
  gmpConnectedModules: [
    "Google Analytics 4 (Data API v1beta)",
    "Google Search Console",
  ],
  oauthAccessToken: "",
  metaAdAccountId: "",
  metaAccessToken: "",
  metaPixelId: "",
  metaOnlySpecificCampaigns: true,
  metaAllowedCampaignKeywords: ["franquicia", "inversor"],
  metaSelectedCampaignNames: [],
  metaTrackedEvents: ["lead_franquicia"],
  clarityProjectId: "ytmpieugg9",
  clarityConnected: true,
  defaultReportRecipientEmail: "socios@kolaccesorios.com.ar",
  realtimeSyncActive: false,
};

// Embudo verificado de 4 pasos de KOL Franquicias (75 visitas hub últimas 4 semanas)
export const INITIAL_FRANCHISE_FUNNEL: FranchiseFunnelStep[] = [
  {
    stepNumber: 1,
    id: "visita_hub",
    name: "Entra al hub",
    eventName: "page_view (franquicias)",
    source: "GA4",
    count: 75,
    conversionRateFromStartPct: 100,
    dropoffRateFromPreviousPct: 0,
    plainLanguageExplanation: "Total de personas que visitaron la página principal de franquicias en los últimos 28 días.",
  },
  {
    stepNumber: 2,
    id: "click_cta_formulario",
    name: "Toca el botón del formulario",
    eventName: "click_cta_formulario",
    source: "GA4",
    count: 4,
    conversionRateFromStartPct: 5.3,
    dropoffRateFromPreviousPct: 94.7,
    plainLanguageExplanation: "De 75 que entraron al hub, 4 tocaron el botón para abrir o ir al formulario.",
  },
  {
    stepNumber: 3,
    id: "inicio_formulario",
    name: "Empieza el formulario",
    eventName: "inicio_formulario",
    source: "GA4",
    count: 3,
    conversionRateFromStartPct: 4.0,
    dropoffRateFromPreviousPct: 25.0,
    plainLanguageExplanation: "De los 4 que tocaron el botón, 3 empezaron a completar los primeros campos.",
  },
  {
    stepNumber: 4,
    id: "lead_franquicia",
    name: "Envía consulta",
    eventName: "lead_franquicia",
    source: "GA4",
    count: 2,
    conversionRateFromStartPct: 2.7,
    dropoffRateFromPreviousPct: 33.3,
    plainLanguageExplanation: "2 completaron todos los campos y enviaron sus datos de contacto de franquicia.",
  },
];

// Canales reales verificados (muestra 75 visitas al hub)
export const INITIAL_ACQUISITION_CHANNELS: AcquisitionChannel[] = [
  {
    channelGroup: "Instagram",
    detail: "Perfil, historias y enlaces directos en biografía",
    visitors: 40,
    leadsFranquicia: 1,
    conversionPct: 2.5,
  },
  {
    channelGroup: "Google Orgánico",
    detail: "Resultados de búsqueda orgánica (Search Console)",
    visitors: 16,
    leadsFranquicia: 1,
    conversionPct: 6.25,
  },
  {
    channelGroup: "Canales con IA",
    detail: "Respuestas y citas en ChatGPT, Perplexity y Gemini",
    visitors: 7,
    leadsFranquicia: 0,
    conversionPct: 0,
    isAiChannel: true,
  },
  {
    channelGroup: "Directo",
    detail: "URL escrita en navegador / marcadores",
    visitors: 9,
    leadsFranquicia: 0,
    conversionPct: 0,
  },
  {
    channelGroup: "Otros",
    detail: "Referidos y canales residuales",
    visitors: 3,
    leadsFranquicia: 0,
    conversionPct: 0,
  },
];

export const INITIAL_SEARCH_KEYWORDS: GoogleSearchKeyword[] = [
  {
    id: "kw-kol-1",
    keyword: "franquicia kol accesorios",
    intent: "Inversor",
    impressions: 210,
    clicks: 14,
    ctrPct: 6.7,
    avgPosition: 1.2,
    conversions: 1,
    landingPage: "/franquicias",
    date: "2026-10-06",
  },
  {
    id: "kw-kol-2",
    keyword: "cuanto cuesta franquicia accesorios celulares",
    intent: "Inversor",
    impressions: 145,
    clicks: 8,
    ctrPct: 5.5,
    avgPosition: 2.1,
    conversions: 1,
    landingPage: "/franquicias/modelos-isla",
    date: "2026-10-05",
  },
  {
    id: "kw-kol-3",
    keyword: "franquicias rentables argentina 2026",
    intent: "Inversor",
    impressions: 98,
    clicks: 5,
    ctrPct: 5.1,
    avgPosition: 3.4,
    conversions: 0,
    landingPage: "/franquicias",
    date: "2026-10-04",
  },
  {
    id: "kw-kol-4",
    keyword: "kol franquicias requisitos",
    intent: "Inversor",
    impressions: 44,
    clicks: 3,
    ctrPct: 6.8,
    avgPosition: 1.1,
    conversions: 0,
    landingPage: "/franquicias",
    date: "2026-10-03",
  },
  {
    id: "kw-kol-5",
    keyword: "inversion isla shopping accesorios",
    intent: "Inversor",
    impressions: 38,
    clicks: 2,
    ctrPct: 5.3,
    avgPosition: 2.8,
    conversions: 0,
    landingPage: "/franquicias/modelos-isla",
    date: "2026-10-02",
  },
];

export const KOL_V3_BRAND_GUIDELINES: BrandDesignGuidelines = {
  brandName: "KOL Franquicias (Guía v3)",
  primaryColorHex: "#FFFFFF",
  secondaryColorHex: "#FAF8F6",
  accentColorHex: "#C51172",
  headingFont: "Montserrat 700 / 800 (Sentence case)",
  bodyFont: "Roboto 400 / 500 (Piso 14 px)",
  toneOfVoice:
    "Español rioplatense (voseo: consultá, abrí, elegí), socio de negocios, número primero, sin urgencia falsa, sin emojis ni signos de exclamación. Solo el lockup KOL FRANQUICIAS va en mayúsculas.",
  visualCompositionRules:
    "Cabecera superior y las 4 tarjetas principales en modo oscuro (#161418 / #2A2629 con cifra y filete en ámbar #FFBA00). El menú y el resto de la aplicación van en tema blanco (#FFFFFF / #FAF8F6) con acento magenta #C51172 y énfasis en rosa #FFD9E4 con texto #161418.",
  mandatoryCtaStyle:
    "Rectángulo con radio del 25 % del alto (10 px en 40 px de alto, 14 px en 56 px); al presionar se cierra a 4 px.",
  prohibitedElements:
    "Números inventados antes de conectar la fuente real, píldoras, números dentro de círculos o cajas, etiquetas de una línea junto al lockup, ámbar sobre fondo claro.",
};

// Campañas pagas inactivas hasta noviembre (decisión del 5/10/2026)
export const INITIAL_CAMPAIGNS: CampaignMetric[] = [];

// Páginas medidas en Clarity (proyecto ytmpieugg9) con métricas reales del hub
export const INITIAL_CLARITY_PAGES: ClarityPageTelemetry[] = [
  {
    id: "clr-hub",
    pageUrl: "/franquicias",
    sessions: 52,
    rageClicksPct: 3.1,
    deadClicksPct: 4.8,
    avgScrollDepthPct: 64,
    quickbacksPct: 9.6,
    dominantFrictionIssue: "Rage clicks en móviles sobre el acordeón de requisitos de inversión y derecho inicial de US$ 3.000.",
  },
  {
    id: "clr-form",
    pageUrl: "/franquicias/formulario",
    sessions: 15,
    rageClicksPct: 1.2,
    deadClicksPct: 2.1,
    avgScrollDepthPct: 82,
    quickbacksPct: 4.0,
    dominantFrictionIssue: "Duda o pausa de ~35 segundos en el campo de selección de provincia / capital disponible.",
  },
  {
    id: "clr-isla",
    pageUrl: "/franquicias/modelos-isla",
    sessions: 8,
    rageClicksPct: 0.0,
    deadClicksPct: 1.5,
    avgScrollDepthPct: 71,
    quickbacksPct: 6.2,
    dominantFrictionIssue: "Excelente lectura de desglose de obra (22%) y mercadería (65%) para formato Isla 10 m².",
  },
];

export const INITIAL_CUSTOM_REPORTS: CustomReport[] = [];

export const INITIAL_SCHEDULED_EMAILS: ScheduledEmailReport[] = [];

export const INITIAL_PREDICTIVE_FORECAST: PredictiveForecastResult = {
  summaryForecast: "",
  projectedRoas: 0,
  projectedConversionsDeltaPct: 0,
  projectedCpaReductionPct: 0,
  confidenceScore: 0,
  recommendations: [],
};

export const INITIAL_GENERATED_CAMPAIGNS: GeneratedCampaignPackage[] = [];
