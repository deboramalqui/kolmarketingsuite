import {
  ClarityPageTelemetry,
  BrandDesignGuidelines,
  ConnectedAccountsConfig,
  GoogleSearchKeyword,
  FranchiseFunnelStep,
  AcquisitionChannel,
  FranchiseCampaignItem,
} from "../types/marketing";



// Configuración de conexiones de KOL Franquicias
export const INITIAL_CONNECTED_ACCOUNTS: ConnectedAccountsConfig = {
  onboardingCompleted: true,
  gmpAccountEmail: "",
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
  defaultReportRecipientEmail: "",
  realtimeSyncActive: false,
};

// Embudo verificado de 4 pasos de KOL Franquicias (75 visitas hub últimas 4 semanas)
// Sin datos de ejemplo: el embudo y los canales se leen de GA4 (ver src/lib/liveData.ts).
export const INITIAL_FRANCHISE_FUNNEL: FranchiseFunnelStep[] = [];
export const INITIAL_ACQUISITION_CHANNELS: AcquisitionChannel[] = [];

// Sin lista de ejemplo: se carga subiendo un CSV de Search Console.
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

// Campañas pagas inactivas hasta noviembre (decisión del 5/10/2026)

// Páginas medidas en Clarity (proyecto ytmpieugg9) con métricas reales del hub
// Sin datos de ejemplo: Clarity se lee con la clave CLARITY_API_TOKEN del servidor.
export const INITIAL_CLARITY_PAGES: ClarityPageTelemetry[] = [];





// Ciudades verificadas con locales y presencia real de KOL
export const VERIFIED_LOCATIONS: string[] = [
  "Santa Fe",
  "Santo Tomé",
  "Córdoba Capital",
];

// Banco de datos verificados de KOL Franquicias (para inserción y chequeo automático)
export const VERIFIED_BRAND_FACTS = [
  {
    id: "derecho_inicial",
    label: "Derecho inicial",
    text: "US$ 3.000 exactos (pago único)",
    value: "US$ 3.000",
    rule: "Nunca decir 'desde US$ 3.000', es un valor fijo exacto.",
  },
  {
    id: "regalias",
    label: "Regalías y canon",
    text: "0 % regalías mensuales y 0 % canon de publicidad",
    value: "0 %",
    rule: "No decir 'sin publicidad'; Kol sí invierte en publicidad de marca nacional.",
  },
  {
    id: "locales",
    label: "Locales activos",
    text: "10 locales (5 propios y 5 franquicias) en 7 direcciones",
    value: "10 locales",
    rule: "Nunca '7 locales' ni 'sucursales'; son 10 locales en 7 direcciones físicas.",
  },
  {
    id: "recupero",
    label: "Plazo de recupero",
    text: "Recupero estimado de 18 a 24 meses, con casos en 12",
    value: "18 a 24 meses",
    rule: "Siempre como referencia estadística real, nunca como promesa de ganancia.",
  },
  {
    id: "inversion_isla",
    label: "Inversión formato isla",
    text: "Inversión total estimada desde US$ 23.000 (desde 10 m²)",
    value: "desde US$ 23.000",
    rule: "La inversión total sí lleva 'desde', a diferencia del derecho inicial.",
  },
  {
    id: "destino_canonica",
    label: "Destino oficial",
    text: "https://kolaccesorios.com/franquicia/",
    value: "/franquicia/",
    rule: "Todo enlace de campaña debe apuntar a la ruta canónica del hub con UTM.",
  },
];

// Sin campañas de ejemplo: las campañas de franquicia empiezan en noviembre de 2026.
export const INITIAL_FRANCHISE_CAMPAIGNS: FranchiseCampaignItem[] = [];

// Dominio del sitio de Kol usado en avisos y enlaces de campañas (el de GA4 y Search Console).
export const SITE_DOMAIN = "kolaccesorios.com";
export const SITE_FRANQUICIA_URL = `https://${SITE_DOMAIN}/franquicia/`;
