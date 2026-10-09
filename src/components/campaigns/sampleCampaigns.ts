import { CampaignAd, FranchiseCampaignItem } from "../../types/marketing";
import { createDefaultAd } from "../ads/adDefaults";
import { buildUtm, defaultConversions, todayISO } from "./campaignModel";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";

export const SAMPLE_PREFIX = "prueba-";
export const DEMO_PREFIX = "demo-";

export const isSampleCampaign = (c: FranchiseCampaignItem) => c.id.startsWith(SAMPLE_PREFIX);
export const isDemoCampaign = (c: FranchiseCampaignItem) => c.id.startsWith(DEMO_PREFIX);

interface Opts {
  id: string;
  name: string;
  platform: FranchiseCampaignItem["platform"];
  initiative: string;
  initiativeSlug: string;
  geo: NonNullable<FranchiseCampaignItem["geo"]>;
  ads: CampaignAd[];
  remarketing?: boolean;
  status?: FranchiseCampaignItem["status"];
}

function make(o: Opts): FranchiseCampaignItem {
  const utm = buildUtm(o.platform, o.initiativeSlug, o.ads[0]?.utmContent);
  return {
    id: o.id,
    name: o.name,
    platform: o.platform,
    mode: "prueba",
    status: o.status ?? "borrador",
    createdAt: todayISO(),
    updatedAt: todayISO(),
    dates: { startDate: "2026-11-01", endDate: "2026-11-15" },
    // Montos de ejemplo solo para probar la herramienta: no son un presupuesto real de Kol
    budget: { currency: "ARS", dailyBudget: 5000, totalCap: 70000 },
    targetLocations: o.geo.scope === "pais" ? ["Toda Argentina"] : o.geo.scope === "provincias" ? o.geo.provinces : o.geo.cities,
    geo: o.geo,
    format: "isla",
    objective: "lead_franquicia",
    initiative: o.initiative,
    audience: o.remarketing ? { type: "remarketing", segments: ["visito_hub", "visito_inversion"] } : { type: "nuevos", segments: [] },
    conversions: defaultConversions(o.remarketing ? "remarketing" : "nuevos"),
    landingPageUrl: SITE_FRANQUICIA_URL,
    utmParams: { source: utm.source, medium: utm.medium, campaign: utm.campaign, term: utm.term, content: utm.content, finalUrlWithUtm: utm.finalUrl },
    ads: o.ads,
    approvalHistory: [],
    learningsNotes: "",
  };
}

function adsFor(prefix: string, platform: FranchiseCampaignItem["platform"]): CampaignAd[] {
  const a = createDefaultAd(platform, `${prefix}-a`, "Anuncio A", "anuncio-a");
  const b = createDefaultAd(platform, `${prefix}-b`, "Anuncio B", "anuncio-b");
  if (platform === "google_search") {
    b.googleAdData!.headlines = ["Abrí tu franquicia KOL", "Derecho inicial US$ 3.000", "0 % regalías · 0 % canon"];
    b.googleAdData!.descriptions = [
      "Franquicia KOL: derecho inicial de US$ 3.000 y 0 % de regalías. Consultá condiciones.",
      "KOL tiene 10 locales. Recupero estimado de 18 a 24 meses, con casos en 12. Consultanos.",
    ];
  } else if (platform === "google_display") {
    b.displayAdData!.shortHeadlines = ["Derecho inicial US$ 3.000"];
  } else {
    b.metaAdData!.format = "stories_9x16";
    b.metaAdData!.primaryText = "Derecho inicial US$ 3.000, 0 % de regalías y 0 % de canon publicitario. KOL tiene 10 locales.";
  }
  return [a, b];
}

const SAMPLE_INITIATIVE = "[PRUEBA] Franquicia Nov 2026";

/** Cuatro campañas en borrador bajo una misma campaña paraguas, para probar la herramienta. Usan solo textos verificados. */
export function buildSampleCampaigns(): FranchiseCampaignItem[] {
  const slug = "franquicia-nov-2026";
  return [
    make({ id: `${SAMPLE_PREFIX}search`, name: "[PRUEBA] Búsqueda Google", platform: "google_search", initiative: SAMPLE_INITIATIVE, initiativeSlug: slug, geo: { scope: "pais", provinces: [], cities: [], excluded: [] }, ads: adsFor("prueba-s", "google_search") }),
    make({ id: `${SAMPLE_PREFIX}display`, name: "[PRUEBA] Display Google", platform: "google_display", initiative: SAMPLE_INITIATIVE, initiativeSlug: slug, geo: { scope: "provincias", provinces: ["Mendoza", "San Juan", "San Luis"], cities: [], excluded: [] }, ads: adsFor("prueba-d", "google_display") }),
    make({ id: `${SAMPLE_PREFIX}meta`, name: "[PRUEBA] Instagram y Facebook", platform: "meta_instagram", initiative: SAMPLE_INITIATIVE, initiativeSlug: slug, geo: { scope: "ciudades", provinces: [], cities: ["Rosario, Santa Fe", "Mar del Plata"], excluded: ["Santa Fe (ciudad)"] }, ads: adsFor("prueba-m", "meta_instagram") }),
    make({ id: `${SAMPLE_PREFIX}remarketing`, name: "[PRUEBA] Remarketing Display", platform: "google_display", initiative: SAMPLE_INITIATIVE, initiativeSlug: slug, remarketing: true, geo: { scope: "pais", provinces: [], cities: [], excluded: [] }, ads: adsFor("prueba-r", "google_display") }),
  ];
}

const DEMO_INITIATIVE = "[DEMO] Franquicia Nov 2026";

type Res = Array<[spend: number, clicks: number, visits: number, consultas: number, citas: number]>;

/** DEMO: campañas "en vivo" con números INVENTADOS, solo para entender cómo se ve la vista de resultados. */
export function buildDemoCampaigns(): FranchiseCampaignItem[] {
  const slug = "franquicia-nov-2026";
  const specs: Array<{ key: string; name: string; platform: FranchiseCampaignItem["platform"]; remarketing?: boolean; res: Res; geo: NonNullable<FranchiseCampaignItem["geo"]> }> = [
    { key: "search", name: "[DEMO] Búsqueda Google", platform: "google_search", res: [[12000, 90, 80, 3, 0], [9000, 50, 45, 2, 0]], geo: { scope: "pais", provinces: [], cities: [], excluded: [] } },
    { key: "display", name: "[DEMO] Display Google", platform: "google_display", res: [[8000, 130, 95, 1, 0], [6000, 90, 70, 0, 0]], geo: { scope: "provincias", provinces: ["Mendoza", "San Juan", "San Luis"], cities: [], excluded: [] } },
    { key: "meta", name: "[DEMO] Instagram y Facebook", platform: "meta_instagram", res: [[14000, 150, 120, 1, 0], [11000, 160, 130, 3, 0]], geo: { scope: "ciudades", provinces: [], cities: ["Rosario, Santa Fe", "Mar del Plata"], excluded: [] } },
    { key: "remarketing", name: "[DEMO] Remarketing Display", platform: "google_display", remarketing: true, res: [[5000, 40, 38, 1, 1], [3000, 20, 18, 1, 0]], geo: { scope: "pais", provinces: [], cities: [], excluded: [] } },
  ];
  return specs.map((sp) => {
    const ads = adsFor(`demo-${sp.key}`, sp.platform);
    const c = make({ id: `${DEMO_PREFIX}${sp.key}`, name: sp.name, platform: sp.platform, initiative: DEMO_INITIATIVE, initiativeSlug: slug, geo: sp.geo, ads, remarketing: sp.remarketing, status: "en_vivo" });
    const byAd = ads.map((ad, i) => ({ adId: ad.id, spend: sp.res[i][0], clicks: sp.res[i][1], visits: sp.res[i][2], consultas: sp.res[i][3], citas: sp.res[i][4] }));
    const sum = (k: "spend" | "clicks" | "visits" | "consultas" | "citas") => byAd.reduce((s, r) => s + r[k], 0);
    return {
      ...c,
      publication: { platformCampaignId: "DEMO", publishedAt: "2026-11-01" },
      livePerformance: {
        spend: sum("spend"),
        clicks: sum("clicks"),
        visits: sum("visits"),
        consultas: sum("consultas"),
        citas: sum("citas"),
        costPerConsulta: sum("consultas") > 0 ? Math.round(sum("spend") / sum("consultas")) : 0,
        daysRunning: 10,
        source: "manual" as const,
        updatedAt: "2026-11-10",
        byAd,
      },
    };
  });
}
