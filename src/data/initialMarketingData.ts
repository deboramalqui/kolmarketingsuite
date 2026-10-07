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
} from "../types/marketing";

import productCreativeImg from "../assets/images/ad_creative_product_1791309919650.jpg";
import bannerCreativeImg from "../assets/images/ad_creative_banner_1791309930945.jpg";
import avatarMarketingLeadImg from "../assets/images/avatar_marketing_lead_1791309941471.jpg";

export const STUDIO_ASSETS = {
  productCreativeImg,
  bannerCreativeImg,
  avatarMarketingLeadImg,
};

// Estado inicial limpio
export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountsConfig = {
  onboardingCompleted: false,
  gmpAccountEmail: "",
  gmpPropertyId: "",
  gmpConnectedModules: [
    "Google Analytics 4 (Data API v1beta)",
    "Google Search (Términos y palabras clave)",
  ],
  oauthAccessToken: "",
  metaAdAccountId: "",
  metaAccessToken: "",
  metaPixelId: "",
  metaOnlySpecificCampaigns: true,
  metaAllowedCampaignKeywords: ["franquicia", "inversor"],
  metaSelectedCampaignNames: [],
  metaTrackedEvents: ["lead_franquicia", "Lead", "Contact"],
  clarityProjectId: "",
  clarityConnected: false,
  defaultReportRecipientEmail: "",
  realtimeSyncActive: false,
};

export const INITIAL_SEARCH_KEYWORDS: GoogleSearchKeyword[] = [];

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

// Sin campañas ni cifras inventadas antes de recibir datos reales
export const INITIAL_CAMPAIGNS: CampaignMetric[] = [];

export const INITIAL_CLARITY_PAGES: ClarityPageTelemetry[] = [];

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
