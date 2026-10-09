import { CampaignAd, FranchiseCampaignItem } from "../../types/marketing";
import { stringifyKeywords } from "../ads/adChecks";
import { GalleryAsset } from "../../types/marketing";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";
import { buildUtm, getAds, getConversions, eventLabel, utmNameOf, REMARKETING_SEGMENTS } from "./campaignModel";
import { metaFormatInfo } from "./assetLibrary";

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
  const ads = getAds(c);
  const multi = ads.length > 1;
  const nm = (id?: string) => assets.find((a) => a.id === id)?.name || "—";
  const tag = (ad: CampaignAd) => (multi ? `${ad.label} · ` : "");

  const common: PackageStep = {
    title: "Presupuesto, fechas y ubicaciones",
    note: "Cargá el presupuesto diario y dejá la campaña con fecha de fin: así no se gasta de más.",
    items: [
      { label: "Presupuesto diario (ARS)", value: ars(c.budget.dailyBudget), copy: c.budget.dailyBudget ? String(c.budget.dailyBudget) : "" },
      { label: "Tope total de la campaña (ARS)", value: ars(c.budget.totalCap), copy: String(c.budget.totalCap) },
      { label: "Fechas", value: `${c.dates.startDate} al ${c.dates.endDate || "sin fecha de fin"}` },
      { label: "Ubicaciones a incluir", value: c.targetLocations.join(", "), copy: c.targetLocations.join("\n"), multiline: true },
      ...(c.geo?.excluded?.length ? [{ label: "Ubicaciones a excluir", value: c.geo.excluded.join(", "), copy: c.geo.excluded.join("\n"), multiline: true }] : []),
      { label: "Idioma", value: "Español" },
    ],
  };
  const conv = getConversions(c);
  const conversion: PackageStep = {
    title: "Conversiones",
    note: "Las principales son las que la plataforma usa para optimizar. Las secundarias solo se miran, no guían el gasto (en Google Ads: acción secundaria). Nunca importar generate_lead ni purchase.",
    items: [
      { label: "Principal (optimizar)", value: conv.primary.map((e) => `${eventLabel(e)} · ${e}`).join("\n"), copy: conv.primary.join("\n"), multiline: true },
      ...(conv.secondary.length ? [{ label: "Secundarias (solo observar)", value: conv.secondary.map((e) => `${eventLabel(e)} · ${e}`).join("\n"), copy: conv.secondary.join("\n"), multiline: true }] : []),
    ],
  };
  const audience: PackageStep[] =
    c.audience?.type === "remarketing"
      ? [
          {
            title: "Público de remarketing",
            note: "La lista se arma en Google Analytics 4 (Audiencias) y se comparte con Google Ads. Tiene que tener al menos 100 personas activas en 30 días para que el anuncio se muestre.",
            items: [{ label: "Quiénes entran en la lista", value: (c.audience.segments ?? []).map((id) => REMARKETING_SEGMENTS.find((x) => x.id === id)?.label ?? id).join("\n"), multiline: true }],
          },
        ]
      : [];
  const urls: PackageStep = {
    title: c.platform === "meta_instagram" ? "Parámetros de URL de cada anuncio" : "Sufijo de URL final de cada anuncio",
    note: `Cada anuncio lleva su propio utm_content, así en GA4 se ve cuál trajo más consultas. Pegalo en ${c.platform === "meta_instagram" ? "“Parámetros de URL” de cada anuncio" : "“Sufijo de URL final” de cada anuncio (no de la campaña)"}. Lo que va entre llaves lo reemplaza la plataforma.`,
    items: [...ads.map((ad) => ({ label: `${ad.label}`, value: buildUtm(c.platform, utmNameOf(c), ad.utmContent).suffix })), { label: "Página de destino", value: SITE_FRANQUICIA_URL }],
  };

  if (c.platform === "google_search") {
    const g0 = ads[0]?.googleAdData;
    return [
      { title: "Crear la campaña en Google Ads", items: [{ label: "Nombre", value: c.name }, { label: "Objetivo", value: "Clientes potenciales (leads)" }, { label: "Tipo de campaña", value: "Búsqueda" }] },
      conversion,
      ...audience,
      common,
      {
        title: "Palabras clave (las mismas para todos los anuncios)",
        items: [
          { label: "Positivas", value: (g0 ? stringifyKeywords(g0.keywords) : "") || "—", multiline: true },
          { label: "Negativas", value: (g0?.negativeKeywords ?? []).join("\n") || "—", copy: (g0?.negativeKeywords ?? []).join("\n"), multiline: true },
        ],
      },
      ...ads.flatMap((ad): PackageStep[] => {
        const g = ad.googleAdData;
        if (!g) return [];
        const steps: PackageStep[] = [
          {
            title: `${tag(ad)}Anuncio de búsqueda adaptable`,
            items: [
              { label: "Títulos (uno por línea)", value: g.headlines.filter(Boolean).join("\n"), multiline: true },
              { label: "Descripciones (una por línea)", value: g.descriptions.filter(Boolean).join("\n"), multiline: true },
              { label: "Ruta que se muestra", value: (g.displayPath ?? []).filter(Boolean).join(" / ") || "—", copy: (g.displayPath ?? []).filter(Boolean).join("\n") },
              { label: "URL final", value: SITE_FRANQUICIA_URL },
            ],
          },
        ];
        if (g.sitelinks?.length || g.callouts?.length)
          steps.push({
            title: `${tag(ad)}Recursos del anuncio`,
            items: [
              ...(g.sitelinks?.length ? [{ label: "Enlaces de sitio", value: g.sitelinks.map((x) => [x.title, x.line1, x.line2].filter(Boolean).join(" | ")).join("\n"), multiline: true }] : []),
              ...(g.callouts?.length ? [{ label: "Destacados", value: g.callouts.join("\n"), multiline: true }] : []),
            ],
          });
        return steps;
      }),
      urls,
    ];
  }

  if (c.platform === "google_display") {
    return [
      { title: "Crear la campaña en Google Ads", items: [{ label: "Nombre", value: c.name }, { label: "Objetivo", value: "Clientes potenciales (leads)" }, { label: "Tipo de campaña", value: "Display" }] },
      conversion,
      ...audience,
      common,
      ...ads.flatMap((ad): PackageStep[] => {
        const d = ad.displayAdData;
        if (!d) return [];
        return [
          {
            title: `${tag(ad)}Anuncio de display adaptable`,
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
            title: `${tag(ad)}Imágenes y logos a subir`,
            note: "Subilos desde tu computadora; están en la galería de Datos y archivos (nombre de cada archivo).",
            items: [
              { label: "Imagen horizontal 1,91:1", value: nm(d.landscapeAssetId) },
              { label: "Imagen cuadrada 1:1", value: nm(d.squareAssetId) },
              { label: "Logo cuadrado", value: nm(d.logoSquareAssetId) },
              { label: "Logo horizontal 4:1", value: nm(d.logoWideAssetId) },
            ],
          },
        ];
      }),
      urls,
    ];
  }

  return [
    {
      title: "Crear la campaña en Meta Ads Manager",
      note: "Meta no mide conversiones por ahora: el resultado se mide en GA4 con lead_franquicia. Elegí el objetivo que prefieran (por ejemplo, Tráfico hacia el sitio) y confirmalo con Kol.",
      items: [{ label: "Nombre", value: c.name }, { label: "Ubicaciones del anuncio", value: "Instagram y Facebook (feed e historias, según el formato de cada anuncio)" }],
    },
    ...audience,
    common,
    ...ads.flatMap((ad): PackageStep[] => {
      const m = ad.metaAdData;
      if (!m) return [];
      return [
        {
          title: `${tag(ad)}Anuncio`,
          items: [
            { label: "Nombre del anuncio en Meta", value: ad.utmContent },
            { label: "Formato", value: metaFormatInfo(m.format).label },
            { label: "Nombre de la página o cuenta", value: m.pageName || "—" },
            { label: "Texto principal", value: m.primaryText, multiline: true },
            { label: "Título (se ve en Facebook)", value: m.headline },
            { label: "Descripción (se ve en Facebook)", value: m.description },
            { label: "Botón", value: m.callToAction },
            { label: "Sitio web", value: SITE_FRANQUICIA_URL },
            { label: "Imagen a subir", value: nm(m.mediaAssetId) },
          ],
        },
      ];
    }),
    urls,
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
