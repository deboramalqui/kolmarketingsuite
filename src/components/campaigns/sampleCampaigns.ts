import { FranchiseCampaignItem } from "../../types/marketing";
import { createDefaultAd } from "../ads/adDefaults";
import { buildUtm, todayISO } from "./campaignModel";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";

export const SAMPLE_PREFIX = "prueba-";

export const isSampleCampaign = (c: FranchiseCampaignItem) => c.id.startsWith(SAMPLE_PREFIX);

function base(id: string, name: string, platform: FranchiseCampaignItem["platform"], geo: FranchiseCampaignItem["geo"], adJoin: FranchiseCampaignItem["ads"]): FranchiseCampaignItem {
  const utm = buildUtm(platform, name, adJoin?.[0]?.utmContent);
  return {
    id,
    name,
    platform,
    mode: "prueba",
    status: "borrador",
    createdAt: todayISO(),
    updatedAt: todayISO(),
    dates: { startDate: "2026-11-01", endDate: "2026-11-15" },
    // Montos de ejemplo solo para probar la herramienta: no son un presupuesto real de Kol
    budget: { currency: "ARS", dailyBudget: 5000, totalCap: 70000 },
    targetLocations: geo!.scope === "pais" ? ["Toda Argentina"] : geo!.scope === "provincias" ? geo!.provinces : geo!.cities,
    geo,
    format: "isla",
    objective: "lead_franquicia",
    landingPageUrl: SITE_FRANQUICIA_URL,
    utmParams: { source: utm.source, medium: utm.medium, campaign: utm.campaign, term: utm.term, content: utm.content, finalUrlWithUtm: utm.finalUrl },
    ads: adJoin,
    approvalHistory: [],
    learningsNotes: "",
  };
}

/** Tres campañas en borrador para probar la herramienta. Se pueden borrar todas juntas. Usan solo textos verificados. */
export function buildSampleCampaigns(): FranchiseCampaignItem[] {
  const s = createDefaultAd("google_search", "prueba-s-a", "Anuncio A", "anuncio-a");
  const sB = createDefaultAd("google_search", "prueba-s-b", "Anuncio B", "anuncio-b");
  sB.googleAdData!.headlines = ["Abrí tu franquicia KOL", "Derecho inicial US$ 3.000", "0 % regalías · 0 % canon"];
  sB.googleAdData!.descriptions = [
    "Franquicia KOL: derecho inicial de US$ 3.000 y 0 % de regalías. Consultá condiciones.",
    "KOL tiene 10 locales. Recupero estimado de 18 a 24 meses, con casos en 12. Consultanos.",
  ];

  const d = createDefaultAd("google_display", "prueba-d-a", "Anuncio A", "anuncio-a");
  const dB = createDefaultAd("google_display", "prueba-d-b", "Anuncio B", "anuncio-b");
  dB.displayAdData!.shortHeadlines = ["Derecho inicial US$ 3.000"];

  const m = createDefaultAd("meta_instagram", "prueba-m-a", "Anuncio A", "anuncio-a");
  const mB = createDefaultAd("meta_instagram", "prueba-m-b", "Anuncio B", "anuncio-b");
  mB.metaAdData!.format = "stories_9x16";
  mB.metaAdData!.primaryText = "Derecho inicial US$ 3.000, 0 % de regalías y 0 % de canon publicitario. KOL tiene 10 locales.";

  return [
    base(`${SAMPLE_PREFIX}search`, "[PRUEBA] Franquicia Nov · Búsqueda Google", "google_search", { scope: "pais", provinces: [], cities: [], excluded: [] }, [s, sB]),
    base(`${SAMPLE_PREFIX}display`, "[PRUEBA] Franquicia Nov · Display Google", "google_display", { scope: "provincias", provinces: ["Mendoza", "San Juan", "San Luis"], cities: [], excluded: [] }, [d, dB]),
    base(`${SAMPLE_PREFIX}meta`, "[PRUEBA] Franquicia Nov · Instagram y Facebook", "meta_instagram", { scope: "ciudades", provinces: [], cities: ["Rosario, Santa Fe", "Mar del Plata"], excluded: ["Santa Fe (ciudad)"] }, [m, mB]),
  ];
}
