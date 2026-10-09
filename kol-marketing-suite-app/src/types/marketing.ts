export type CampaignPlatform = 'google_search' | 'google_display' | 'meta_ads';
export type CampaignStatus = 'active' | 'paused' | 'draft';

export interface KeywordItem {
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
}

export interface SitelinkItem {
  text: string;
  line1?: string;
  line2?: string;
  url?: string;
}

export interface GoogleAdData {
  headlines: string[];
  descriptions: string[];
  domain?: string;
  path1?: string;
  path2?: string;
  sitelinks?: SitelinkItem[];
  callouts?: string[];
  keywords: KeywordItem[];
  negativeKeywords?: string[];
  finalUrlSuffix?: string;
}

export interface DisplayAdData {
  shortHeadline: string;
  longHeadline: string;
  description: string;
  businessName: string;
  imageUrl: string;
}

export interface MetaAdData {
  pageName?: string;
  primaryText: string;
  headline: string;
  description: string;
  domain?: string;
  callToAction: string;
  imageUrl: string;
  avatarVariant?: 'claro' | 'oscuro';
  showSello?: boolean;
}

export interface FranchiseCampaignQualityChecklist {
  feeCorrect: boolean; // Derecho inicial US$ 3.000 sin "desde"
  noExclamation: boolean; // Sin signos de exclamación en títulos
  storeCountCorrect: boolean; // "10 locales" sin "en el país"
  noBuenosAiresMention: boolean; // Sin mencionar Buenos Aires como zona con locales
  modelTestedValidated: boolean; // "modelo probado" marcado como a validar
}

export interface FranchiseCampaignItem {
  id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  objective: string;
  budgetMonthly: number;
  spentToDate: number;
  leadsGenerated: number;
  cpl: number;
  conversionRate: number;
  targetLocations: string[];
  createdAt: string;
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    finalUrlWithUtm: string;
  };
  googleAdData?: GoogleAdData;
  displayAdData?: DisplayAdData;
  metaAdData?: MetaAdData;
  qualityChecklist: FranchiseCampaignQualityChecklist;
}
