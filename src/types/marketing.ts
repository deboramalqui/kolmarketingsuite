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

export interface GoogleSearchKeyword {
  id: string;
  keyword: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgPosition: number;
  conversions: number;
  intent: "Inversor" | "Franquicia" | "Marca" | "Informativa";
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
  avgEngagementSec: number;
  dominantFrictionIssue: string;
  linkedGmpCampaign: string;
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
