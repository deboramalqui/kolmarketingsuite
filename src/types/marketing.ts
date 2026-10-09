export type GMPPlatform =
  | "GA4"
  | "Google Search"
  | "Meta Ads"
  | "Google Analytics"
  | "DV360"
  | "SA360"
  | "CM360"
  | "GMP + Meta + Clarity"
  | "GMP + Clarity"
  | "Clarity UX";

export interface FranchiseFunnelStep {
  stepNumber: number;
  id: "visita_hub" | "click_cta_formulario" | "inicio_formulario" | "lead_franquicia";
  name: string;
  eventName: string;
  source: "GA4";
  count: number;
  conversionRateFromStartPct: number;
  dropoffRateFromPreviousPct: number;
  plainLanguageExplanation: string;
}

export interface AcquisitionChannel {
  channelGroup: "Instagram" | "Google Orgánico" | "Canales con IA" | "Directo" | "Otros";
  detail: string;
  visitors: number;
  leadsFranquicia: number;
  conversionPct: number;
  isAiChannel?: boolean;
}

export interface GoogleSearchKeyword {
  id: string;
  keyword: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgPosition: number;
  conversions: number;
  intent: "Inversor" | "Franquicia" | "Marca" | "Informativa";
  landingPage?: string;
  date?: string;
}

export interface CampaignMetric {
  id: string;
  name: string;
  platform: "DV360" | "SA360" | "CM360" | "GA4" | "Meta Ads";
  status: "Activa" | "Optimización IA" | "Atención UX";
  dailyBudget: number;
  spend30d: number;
  impressions: number;
  clicks: number;
  ctrPct: number;
  conversions: number;
  cpaUsd: number;
  roas: number;
  // Eventos específicos contabilizados en esta campaña (ej. lead_franquicia, Lead, Contact)
  trackedEvents?: string[];
  campaignExternalId?: string;
  // Microsoft Clarity correlated UX metrics for this campaign's landing page
  clarityRageClicksPct: number;
  clarityDeadClicksPct: number;
  clarityScrollDepthPct: number;
  clarityQuickbacksPct: number;
  landingPagePath: string;
  targetAudience: string;
  lastSyncedAt: string;
}

export interface DiscoveredCampaignCandidate {
  id: string;
  name: string;
  platform: "Meta Ads" | "GA4" | "DV360" | "SA360" | "CM360";
  spend30d: number;
  conversions: number;
  detectedEvents: string[];
  selected: boolean;
  rawMetric: CampaignMetric;
}

export interface ClarityPageTelemetry {
  id: string;
  pageUrl: string;
  sessions: number;
  rageClicksPct: number;
  deadClicksPct: number;
  avgScrollDepthPct: number;
  quickbacksPct: number;
  avgEngagementSec?: number;
  dominantFrictionIssue: string;
  linkedGmpCampaign?: string;
}

export interface CustomReport {
  id: string;
  title: string;
  sourcePlatform: string;
  metrics: string[];
  dateRange: string;
  createdAt: string;
  createdBy: string;
  summaryInsight: string;
  rowCount: number;
}

export interface ScheduledEmailReport {
  id: string;
  name: string;
  recipientEmail: string;
  frequency: "Diaria" | "Semanal" | "Mensual";
  format: "PDF Ejecutivo" | "HTML Interactivo" | "CSV Tabular";
  metrics: string[];
  active: boolean;
  lastSentAt: string | null;
  nextRunLabel: string;
}

export interface DispatchedEmailLog {
  id: string;
  scheduleName: string;
  recipientEmail: string;
  frequency: string;
  format: string;
  dispatchedAt: string;
  deliveryStatus: string;
  emailSubject: string;
  executiveHeadline: string;
  executiveSummary: string;
  keyHighlights: string[];
  clarityBehavioralAlert: string;
  recommendedNextSteps: string[];
}

export interface PredictiveRecommendation {
  id: string;
  category: "Segmentación" | "Presupuesto" | "Creativos";
  targetCampaign: string;
  title: string;
  evidenceSignal: string;
  concreteAction: string;
  expectedImpact: string;
  budgetShiftUsd: number;
  roasLift: number;
  applied?: boolean;
}

export interface PredictiveForecastResult {
  summaryForecast: string;
  projectedRoas: number;
  projectedConversionsDeltaPct: number;
  projectedCpaReductionPct: number;
  confidenceScore: number;
  recommendations: PredictiveRecommendation[];
}

export interface BrandDesignGuidelines {
  brandName: string;
  primaryColorHex: string;
  secondaryColorHex: string;
  accentColorHex: string;
  headingFont: string;
  bodyFont: string;
  toneOfVoice: string;
  visualCompositionRules: string;
  mandatoryCtaStyle: string;
  prohibitedElements: string;
}

export interface GeneratedAdCreative {
  format: string;
  headline: string;
  subheadline: string;
  bodyCopy: string;
  ctaLabel: string;
  visualCompositionRule: string;
  predictedCtrPct: number;
}

export interface GeneratedCampaignPackage {
  id: string;
  campaignName: string;
  platform: string;
  objective: string;
  dailyBudget: number;
  targetAudience: string;
  biddingStrategy: string;
  designComplianceNote: string;
  clarityUxAdaptation: string;
  creatives: GeneratedAdCreative[];
  createdAt: string;
}

export type CampaignLifecycleStatus =
  | "idea"
  | "borrador"
  | "en_revision"
  | "lista_para_publicar"
  | "en_vivo"
  | "cerrada"
  | "devuelta";

export type CampaignLifecycleMode = "prueba" | "escala";

export interface FranchiseCampaignQualityChecklist {
  derechoInicialExacto: boolean; // US$ 3.000 exactos, nunca "desde"
  localesVerificados: boolean; // 10 locales (5 propios y 5 franquicias)
  recuperoVerificado: boolean; // 18 a 24 meses, casos en 12
  regaliasCanonCero: boolean; // 0% regalías y 0% canon
  ciudadesVerificadas: boolean; // Solo Santa Fe, Santo Tomé, Córdoba
  destinoCanonica: boolean; // https://kolaccesorios.com/franquicia/
  utmValidos: boolean; // minúsculas, sin tildes, con guiones
  eventoConversionUnico: boolean; // lead_franquicia únicamente
}

export interface CampaignApprovalRecord {
  id: string;
  date: string;
  user: string;
  role: "consultora" | "responsable_gasto";
  status: "aprobado" | "cambios_pedidos";
  comment?: string;
}

export type CampaignPlatform = "google_search" | "google_display" | "meta_instagram";

/** Foto o logo de la galería de "Datos y archivos" */
export interface GalleryAsset {
  id: string;
  name: string;
  url: string;
  kind: "foto" | "logo";
  width: number;
  height: number;
  /** La persona confirmó que Kol tiene permiso para usar la imagen en anuncios */
  permission: boolean;
  addedAt: string;
}

export interface FranchiseCampaignItem {
  id: string;
  name: string;
  platform: CampaignPlatform;
  mode: CampaignLifecycleMode;
  status: CampaignLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  dates: {
    startDate: string;
    endDate?: string;
  };
  budget: {
    currency: "USD" | "ARS";
    dailyBudget?: number;
    totalCap: number;
    maxCpaTarget?: number;
  };
  targetLocations: string[];
  format: "isla" | "estandar" | "ambos";
  objective: "lead_franquicia";
  landingPageUrl: string;
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    finalUrlWithUtm: string;
  };
  googleAdData?: {
    headlines: string[];
    descriptions: string[];
    keywords: Array<{ keyword: string; matchType: "exact" | "phrase" | "broad" }>;
    finalUrlSuffix: string;
    // Opcionales (vista previa realista de Google Búsqueda)
    displayPath?: [string, string];
    sitelinks?: Array<{ title: string; line1: string; line2: string }>;
    callouts?: string[];
    negativeKeywords?: string[];
  };
  displayAdData?: {
    businessName: string;
    shortHeadlines: string[];
    longHeadline: string;
    descriptions: string[];
    callToAction: string;
    landscapeAssetId?: string;
    squareAssetId?: string;
    logoSquareAssetId?: string;
    logoWideAssetId?: string;
    finalUrlSuffix?: string;
  };
  metaAdData?: {
    primaryText: string;
    headline: string;
    description: string;
    callToAction: string;
    mediaUrl: string;
    /** Imagen elegida de la galería (tiene prioridad sobre mediaUrl) */
    mediaAssetId?: string;
    feedPlacement: string;
    // Opcionales (vista previa realista de Instagram / Facebook)
    pageName?: string;
    avatarTheme?: "claro" | "oscuro";
    showSeal?: boolean;
    sealVariant?: "claro" | "oscuro";
  };
  /** Obsoleto: el chequeo ahora se calcula en vivo; no se guarda */
  qualityChecklist?: FranchiseCampaignQualityChecklist;
  approvalHistory: CampaignApprovalRecord[];
  livePerformance?: {
    spend: number;
    impressions?: number;
    clicks: number;
    consultas: number;
    costPerConsulta: number;
    daysRunning: number;
    statusMessage?: string;
    /** Siempre "manual" por ahora: la persona carga los números desde la plataforma */
    source?: "manual";
    updatedAt?: string;
  };
  learningsNotes?: string;
  /** Datos de publicación cargados a mano después de crear la campaña en la plataforma */
  publication?: {
    platformCampaignId?: string;
    publishedAt?: string;
    publishedBy?: string;
  };
}

export interface ConnectedAccountsConfig {
  onboardingCompleted: boolean;
  gmpAccountEmail: string;
  gmpPropertyId: string;
  gmpConnectedModules: string[];
  oauthAccessToken: string;
  // Configuración selectiva de Meta Ads (solo campañas y eventos específicos)
  metaAdAccountId: string;
  metaAccessToken: string;
  metaPixelId: string;
  metaOnlySpecificCampaigns: boolean;
  metaAllowedCampaignKeywords: string[];
  metaSelectedCampaignNames: string[];
  metaTrackedEvents: string[];
  // Configuración de Microsoft Clarity y correo
  clarityProjectId: string;
  clarityConnected: boolean;
  clarityApiToken?: string;
  defaultReportRecipientEmail: string;
  realtimeSyncActive: boolean;
}

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  executedActions?: Array<{
    toolName: string;
    summary: string;
  }>;
}
