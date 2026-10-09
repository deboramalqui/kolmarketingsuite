import { CampaignPlatform, FranchiseCampaignItem, CampaignLifecycleStatus, GalleryAsset } from "../../types/marketing";
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

export function metaPlacementOf(c: FranchiseCampaignItem): "instagram" | "facebook" {
  return /facebook/i.test(c.metaAdData?.feedPlacement || "") ? "facebook" : "instagram";
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
export function buildUtm(platform: CampaignPlatform, name: string): UtmBuild {
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
