import { FranchiseCampaignItem } from "../../types/marketing";
import { stringifyKeywords } from "../ads/adChecks";
import { GalleryAsset } from "../../types/marketing";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";
import { buildUtm } from "./campaignModel";

export interface PackageItem {
  label: string;
  value: string;
  /** texto que se copia; por defecto el mismo value */
  copy?: string;
  multiline?: boolean;
}
export interface PackageStep {
  title: string;
  note?: string;
  items: PackageItem[];
}

const ars = (n?: number) => (n ? `$ ${n.toLocaleString("es-AR")}` : "—");

/** Paso a paso, en el orden que pide cada plataforma, con todo listo para copiar. */
export function buildPackage(c: FranchiseCampaignItem, assets: GalleryAsset[]): PackageStep[] {
  const utm = buildUtm(c.platform, c.name);
  const common: PackageStep[] = [
    {
      title: "Presupuesto, fechas y ubicaciones",
      note: "Cargá el presupuesto diario y dejá la campaña con fecha de fin: así no se gasta de más.",
      items: [
        { label: "Presupuesto diario (ARS)", value: ars(c.budget.dailyBudget), copy: c.budget.dailyBudget ? String(c.budget.dailyBudget) : "" },
        { label: "Tope total de la campaña (ARS)", value: ars(c.budget.totalCap), copy: String(c.budget.totalCap) },
        { label: "Fechas", value: `${c.dates.startDate} al ${c.dates.endDate || "sin fecha de fin"}` },
        { label: "Ubicaciones", value: c.targetLocations.join(", "), copy: c.targetLocations.join(", ") },
        { label: "Idioma", value: "Español" },
      ],
    },
  ];
  const conversion: PackageStep = {
    title: "Conversión",
    note: "Optimizar solo por el formulario de franquicia. No importar generate_lead ni purchase para esta campaña.",
    items: [{ label: "Único evento de conversión", value: "lead_franquicia" }],
  };
  const suffix: PackageStep = {
    title: c.platform === "meta_instagram" ? "Parámetros de URL del anuncio" : "Sufijo de URL final (a nivel campaña)",
    note: "Copiar tal cual. Lo que va entre llaves lo reemplaza la plataforma.",
    items: [{ label: "Parámetros UTM", value: utm.suffix }, { label: "Página de destino", value: SITE_FRANQUICIA_URL }],
  };

  if (c.platform === "google_search" && c.googleAdData) {
    const g = c.googleAdData;
    return [
      {
        title: "Crear la campaña en Google Ads",
        items: [
          { label: "Nombre", value: c.name },
          { label: "Objetivo", value: "Clientes potenciales (leads)" },
          { label: "Tipo de campaña", value: "Búsqueda" },
        ],
      },
      conversion,
      ...common,
      {
        title: "Palabras clave",
        items: [
          { label: "Positivas", value: stringifyKeywords(g.keywords) || "—", multiline: true },
          { label: "Negativas", value: (g.negativeKeywords ?? []).join("\n") || "—", copy: (g.negativeKeywords ?? []).join("\n"), multiline: true },
        ],
      },
      {
        title: "Anuncio de búsqueda adaptable",
        items: [
          { label: "Títulos (uno por línea)", value: g.headlines.filter(Boolean).join("\n"), multiline: true },
          { label: "Descripciones (una por línea)", value: g.descriptions.filter(Boolean).join("\n"), multiline: true },
          { label: "Ruta que se muestra", value: (g.displayPath ?? []).filter(Boolean).join(" / ") || "—", copy: (g.displayPath ?? []).filter(Boolean).join("\n") },
          { label: "URL final", value: SITE_FRANQUICIA_URL },
        ],
      },
      ...(g.sitelinks?.length || g.callouts?.length
        ? [
            {
              title: "Recursos del anuncio",
              items: [
                ...(g.sitelinks?.length ? [{ label: "Enlaces de sitio", value: g.sitelinks.map((s) => [s.title, s.line1, s.line2].filter(Boolean).join(" | ")).join("\n"), multiline: true }] : []),
                ...(g.callouts?.length ? [{ label: "Destacados", value: g.callouts.join("\n"), multiline: true }] : []),
              ],
            } as PackageStep,
          ]
        : []),
      suffix,
    ];
  }

  if (c.platform === "google_display" && c.displayAdData) {
    const d = c.displayAdData;
    const nm = (id?: string) => assets.find((a) => a.id === id)?.name || "—";
    return [
      {
        title: "Crear la campaña en Google Ads",
        items: [
          { label: "Nombre", value: c.name },
          { label: "Objetivo", value: "Clientes potenciales (leads)" },
          { label: "Tipo de campaña", value: "Display" },
        ],
      },
      conversion,
      ...common,
      {
        title: "Anuncio de display adaptable",
        items: [
          { label: "Nombre de la empresa", value: d.businessName },
          { label: "Títulos cortos (uno por línea)", value: d.shortHeadlines.filter(Boolean).join("\n"), multiline: true },
          { label: "Título largo", value: d.longHeadline },
          { label: "Descripciones (una por línea)", value: d.descriptions.filter(Boolean).join("\n"), multiline: true },
          { label: "Botón", value: d.callToAction },
          { label: "URL final", value: SITE_FRANQUICIA_URL },
        ],
      },
      {
        title: "Imágenes y logos a subir",
        note: "Subilos desde tu computadora, están en la galería de Datos y archivos (nombre de cada archivo).",
        items: [
          { label: "Imagen horizontal 1,91:1", value: nm(d.landscapeAssetId) },
          { label: "Imagen cuadrada 1:1", value: nm(d.squareAssetId) },
          { label: "Logo cuadrado", value: nm(d.logoSquareAssetId) },
          { label: "Logo horizontal 4:1", value: nm(d.logoWideAssetId) },
        ],
      },
      suffix,
    ];
  }

  const m = c.metaAdData!;
  return [
    {
      title: "Crear la campaña en Meta Ads Manager",
      note: "Meta no mide conversiones por ahora: el resultado se mide en GA4 con lead_franquicia. Elegí el objetivo que prefieran (por ejemplo, Tráfico hacia el sitio) y confirmalo con Kol.",
      items: [
        { label: "Nombre", value: c.name },
        { label: "Ubicaciones del anuncio", value: "Instagram (feed) y Facebook (feed)" },
      ],
    },
    ...common,
    {
      title: "Anuncio",
      items: [
        { label: "Nombre de la página o cuenta", value: m.pageName || "—" },
        { label: "Texto principal", value: m.primaryText, multiline: true },
        { label: "Título (se ve en Facebook)", value: m.headline },
        { label: "Descripción (se ve en Facebook)", value: m.description },
        { label: "Botón", value: m.callToAction },
        { label: "Sitio web", value: SITE_FRANQUICIA_URL },
        { label: "Imagen a subir", value: assets.find((a) => a.id === m.mediaAssetId)?.name || "—" },
      ],
    },
    suffix,
    conversion,
  ];
}

export const PRE_ACTIVATION: Record<FranchiseCampaignItem["platform"], string[]> = {
  google_search: [
    "La conversión elegida es solo lead_franquicia",
    "El etiquetado automático está activado en la cuenta",
    "El presupuesto diario y la fecha de fin están cargados",
    "La campaña queda en pausa hasta que alguien la active a propósito",
  ],
  google_display: [
    "La conversión elegida es solo lead_franquicia",
    "El etiquetado automático está activado en la cuenta",
    "Las imágenes y logos subidos son los de la galería, con permiso de uso",
    "El presupuesto diario y la fecha de fin están cargados",
  ],
  meta_instagram: [
    "Los parámetros de URL están pegados en el anuncio",
    "La imagen subida es la de la galería, con permiso de uso",
    "El presupuesto y la fecha de fin están cargados",
    "La cuenta publicitaria está en pesos argentinos",
  ],
};
