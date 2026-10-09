import { CampaignAd, CampaignPlatform, FranchiseCampaignItem, CampaignLifecycleStatus, GalleryAsset } from "../../types/marketing";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";

export const PLATFORM_INFO: Array<{ id: CampaignPlatform; label: string; short: string; description: string }> = [
  {
    id: "google_search",
    label: "Google Búsqueda",
    short: "Búsqueda",
    description: "Anuncios de solo texto que aparecen cuando alguien busca algo como “franquicia de accesorios”. Es la gente que ya está buscando.",
  },
  {
    id: "google_display",
    label: "Google Display",
    short: "Display",
    description: "Anuncios con imagen y logo en sitios, apps y videos de la red de Google. Llegan a gente que todavía no buscó, sirven para darse a conocer.",
  },
  {
    id: "meta_instagram",
    label: "Instagram y Facebook (Meta)",
    short: "Meta",
    description: "Anuncios con foto en el feed de Instagram y Facebook. Se arma una sola campaña y se ve la vista previa de las dos.",
  },
];

export const statusLabel: Record<CampaignLifecycleStatus, string> = {
  idea: "Idea",
  borrador: "Borrador",
  en_revision: "En revisión",
  lista_para_publicar: "Lista para publicar",
  en_vivo: "En vivo",
  cerrada: "Cerrada",
  devuelta: "Devuelta",
};

/** Anuncios de la campaña. Si es una campaña vieja con un solo anuncio, se lo convierte en "Anuncio A". */
export function getAds(c: FranchiseCampaignItem): CampaignAd[] {
  if (c.ads && c.ads.length) return c.ads;
  if (!c.googleAdData && !c.displayAdData && !c.metaAdData) return [];
  return [{ id: `${c.id}-a`, label: "Anuncio A", utmContent: "anuncio-a", googleAdData: c.googleAdData, displayAdData: c.displayAdData, metaAdData: c.metaAdData }];
}

export function metaPlacementOf(c: FranchiseCampaignItem): "instagram" | "facebook" {
  const first = getAds(c)[0]?.metaAdData;
  return /facebook/i.test(first?.feedPlacement || "") ? "facebook" : "instagram";
}

/** utm_content único dentro de la campaña, a partir del nombre del anuncio */
export function uniqueUtmContent(label: string, taken: string[]): string {
  const base = utmSlug(label) || "anuncio";
  let out = base;
  let n = 2;
  while (taken.includes(out)) out = `${base}-${n++}`;
  return out;
}

export function platformLabel(c: FranchiseCampaignItem): string {
  if (c.platform === "google_search") return "Google Búsqueda";
  if (c.platform === "google_display") return "Google Display";
  return metaPlacementOf(c) === "facebook" ? "Meta Facebook" : "Meta Instagram";
}

/** Minúsculas, sin tildes ni espacios, con guiones (guia-utm-campanas.md) */
export function utmSlug(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface UtmBuild {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content: string;
  /** Texto para pegar en la plataforma (sufijo de URL final / parámetros de URL) */
  suffix: string;
  /** Ejemplo de enlace completo; las llaves {…} las reemplaza la plataforma */
  finalUrl: string;
}

/** Convención de guia-utm-campanas.md */
export function buildUtm(platform: CampaignPlatform, name: string, contentOverride?: string): UtmBuild {
  // `name` es el nombre de la campaña paraguas si tiene; si no, el de la campaña
  const campaign = utmSlug(name) || "franquicia-campana";
  let source = "google";
  let medium = "cpc";
  let term: string | undefined = "{keyword}";
  let content = "{creative}";
  if (platform === "google_display") {
    medium = "display";
    term = undefined;
  } else if (platform === "meta_instagram") {
    source = "facebook";
    medium = "paid_social";
    term = "{{adset.name}}";
    content = "{{ad.name}}";
  }
  if (contentOverride) content = contentOverride;
  const parts = [
    `utm_source=${source}`,
    `utm_medium=${medium}`,
    `utm_campaign=${campaign}`,
    ...(term ? [`utm_term=${term}`] : []),
    `utm_content=${content}`,
  ];
  const suffix = parts.join("&");
  return { source, medium, campaign, term, content, suffix, finalUrl: `${SITE_FRANQUICIA_URL}?${suffix}` };
}

/** Fecha de hoy según la hora local (AAAA-MM-DD) */
export const todayISO = () => new Date().toLocaleDateString("en-CA");

/** Días transcurridos desde una fecha AAAA-MM-DD, contando el primero como día 1 */
export const dayNumber = (fromISO: string) => Math.max(1, Math.round((Date.parse(todayISO()) - Date.parse(fromISO)) / 86400000) + 1);

/** Completa campos que no existían en campañas guardadas por versiones anteriores */
export function normalizeCampaign(c: FranchiseCampaignItem): FranchiseCampaignItem {
  return {
    ...c,
    ads: getAds(c),
    googleAdData: undefined,
    displayAdData: undefined,
    metaAdData: undefined,
    approvalHistory: c.approvalHistory ?? [],
    targetLocations: c.targetLocations ?? [],
    budget: { ...(c.budget ?? {}), currency: c.budget?.currency ?? "ARS", totalCap: c.budget?.totalCap ?? 0 },
    dates: c.dates ?? { startDate: "" },
  };
}

export function assetById(assets: GalleryAsset[], id?: string): GalleryAsset | undefined {
  return id ? assets.find((a) => a.id === id) : undefined;
}

export function formatMoney(n: number | undefined, currency = "ARS"): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  const prefix = currency === "ARS" ? "$" : "US$ ";
  return `${prefix}${Math.round(n).toLocaleString("es-AR")}`;
}

/** Transiciones permitidas entre estados */
export const NEXT_STATUS: Record<CampaignLifecycleStatus, CampaignLifecycleStatus[]> = {
  idea: ["borrador"],
  borrador: ["en_revision"],
  devuelta: ["borrador", "en_revision"],
  en_revision: ["lista_para_publicar", "devuelta", "borrador"],
  lista_para_publicar: ["en_vivo", "borrador"],
  en_vivo: ["cerrada"],
  cerrada: [],
};

export type GeoScope = "pais" | "provincias" | "ciudades";
export interface GeoValue {
  scope: GeoScope;
  provinces: string[];
  cities: string[];
  excluded: string[];
}

export const EMPTY_GEO: GeoValue = { scope: "pais", provinces: [], cities: [], excluded: [] };

export const PROVINCES = [
  "Ciudad de Buenos Aires",
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export const REGIONS: Array<{ id: string; label: string; provinces: string[] }> = [
  { id: "amba", label: "Buenos Aires y CABA", provinces: ["Ciudad de Buenos Aires", "Buenos Aires"] },
  { id: "centro", label: "Centro", provinces: ["Córdoba", "Santa Fe", "Entre Ríos"] },
  { id: "cuyo", label: "Cuyo", provinces: ["Mendoza", "San Juan", "San Luis"] },
  { id: "noa", label: "Noroeste", provinces: ["Jujuy", "Salta", "Tucumán", "Catamarca", "La Rioja", "Santiago del Estero"] },
  { id: "nea", label: "Noreste", provinces: ["Formosa", "Chaco", "Corrientes", "Misiones"] },
  { id: "patagonia", label: "Patagonia", provinces: ["La Pampa", "Neuquén", "Río Negro", "Chubut", "Santa Cruz", "Tierra del Fuego"] },
];

/** Lugares donde Kol ya tiene locales: sirven para excluirlos si no se quiere captar inversores ahí */
export const PLACES_WITH_STORES = ["Santa Fe (ciudad)", "Santo Tomé", "Córdoba (ciudad)"];

/** Lista legible de ubicaciones para mostrar y copiar */
export function geoToLocations(g: GeoValue): string[] {
  if (g.scope === "pais") return ["Toda Argentina"];
  return g.scope === "provincias" ? g.provinces : g.cities;
}

export function hasGeoTarget(g: GeoValue): boolean {
  return g.scope === "pais" || (g.scope === "provincias" ? g.provinces.length > 0 : g.cities.length > 0);
}

/** Nombre que se usa para el utm_campaign: el de la campaña paraguas si existe */
export const utmNameOf = (c: Pick<FranchiseCampaignItem, "name" | "initiative">) => (c.initiative && c.initiative.trim()) || c.name;

/* ---- Conversiones ---- */
export interface MeasurementEvent {
  id: string;
  label: string;
  /** Qué es, en simple */
  what: string;
  /** Cómo se crea si todavía no existe */
  howTo: string;
}

export const MEASUREMENT_EVENTS: MeasurementEvent[] = [
  {
    id: "lead_franquicia",
    label: "Dejó sus datos en el formulario",
    what: "Se dispara cuando se envía el formulario de franquicia. Es la conversión principal.",
    howTo: "Ya está creado y verificado en GA4 (propiedad kolaccesorios - GA4).",
  },
  {
    id: "visita_franquicia",
    label: "Llegó a franquicias desde un anuncio",
    what: "Se dispara cuando alguien entra a /franquicia/ viniendo de un anuncio pago (utm_medium cpc, display o paid_social). Se mira, no se optimiza.",
    howTo: "Hay que crearlo en GA4: un evento que se active en las páginas /franquicia/ cuando la visita viene de un anuncio, y marcarlo como evento clave.",
  },
  {
    id: "cita_agendada",
    label: "Agendó una cita",
    what: "Se dispara cuando alguien reserva un horario para hablar con Kol. Es la conversión del remarketing.",
    howTo: "Hace falta primero un calendario de citas en el sitio, y que al confirmarse dispare este evento en GA4.",
  },
];

export const eventLabel = (id: string) => MEASUREMENT_EVENTS.find((e) => e.id === id)?.label ?? id;

const EVENTS_KEY = "kol_measurement_events_v1";
export type EventStatus = Record<string, boolean>;

export function loadEventStatus(): EventStatus {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) return { lead_franquicia: true, ...JSON.parse(raw) };
  } catch {}
  return { lead_franquicia: true };
}
export function saveEventStatus(s: EventStatus) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(s));
  } catch {}
}

export function defaultConversions(type: "nuevos" | "remarketing"): { primary: string[]; secondary: string[] } {
  return type === "remarketing"
    ? { primary: ["lead_franquicia", "cita_agendada"], secondary: ["visita_franquicia"] }
    : { primary: ["lead_franquicia"], secondary: ["visita_franquicia"] };
}

export const REMARKETING_SEGMENTS = [
  { id: "visito_hub", label: "Visitaron /franquicia/ y no dejaron sus datos (últimos 30 días)" },
  { id: "visito_inversion", label: "Entraron a Inversión inicial y no dejaron sus datos" },
  { id: "dejo_datos_sin_cita", label: "Dejaron sus datos y no agendaron una cita" },
];

export const getConversions = (c: FranchiseCampaignItem) => c.conversions ?? defaultConversions(c.audience?.type ?? "nuevos");
