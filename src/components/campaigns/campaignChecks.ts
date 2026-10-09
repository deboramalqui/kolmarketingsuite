import { FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { VERIFIED_LOCATIONS, SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";
import { AdCheck, checkDisplayAd, checkGoogleAd, checkMetaAd, stringifyKeywords } from "../ads/adChecks";
import { displayAssetState } from "../ads/DisplayAdEditor";

/** Chequeos reales de una campaña: textos de los anuncios + datos de la campaña. Nada se da por bueno de antemano. */
export function checkCampaign(c: FranchiseCampaignItem, assets: GalleryAsset[]): AdCheck[] {
  const out: AdCheck[] = [];

  if (c.platform === "google_search" && c.googleAdData) {
    const g = c.googleAdData;
    out.push(
      ...checkGoogleAd({
        headlines: g.headlines,
        descriptions: g.descriptions,
        displayPath: g.displayPath ?? ["", ""],
        sitelinks: g.sitelinks ?? [],
        callouts: g.callouts ?? [],
        keywordsText: stringifyKeywords(g.keywords),
      })
    );
  } else if (c.platform === "google_display" && c.displayAdData) {
    const d = c.displayAdData;
    out.push(
      ...checkDisplayAd({
        businessName: d.businessName,
        shortHeadlines: d.shortHeadlines,
        longHeadline: d.longHeadline,
        descriptions: d.descriptions,
        landscape: displayAssetState(assets, d.landscapeAssetId, "landscape"),
        square: displayAssetState(assets, d.squareAssetId, "square"),
        logoSquare: displayAssetState(assets, d.logoSquareAssetId, "logoSquare"),
      })
    );
  } else if (c.platform === "meta_instagram" && c.metaAdData) {
    const m = c.metaAdData;
    const a = assets.find((x) => x.id === m.mediaAssetId);
    out.push(
      ...checkMetaAd({
        primaryText: m.primaryText,
        headline: m.headline,
        description: m.description,
        mediaUrl: a?.url || "",
        imagePermission: a ? a.permission : undefined,
      })
    );
  } else {
    out.push({ id: "sin-anuncio", ok: false, label: "La campaña no tiene anuncio cargado", severity: "error" });
  }

  const badLocations = c.targetLocations.filter((l) => !VERIFIED_LOCATIONS.includes(l));
  out.push(
    {
      id: "ciudades",
      ok: c.targetLocations.length > 0 && badLocations.length === 0,
      label:
        c.targetLocations.length === 0
          ? "Elegí al menos una ciudad objetivo"
          : badLocations.length
          ? `Ciudades no verificadas: ${badLocations.join(", ")}`
          : "Ciudades objetivo verificadas",
      severity: "error",
    },
    {
      id: "tope",
      ok: !!c.budget.totalCap && c.budget.totalCap > 0,
      label: "Tiene tope total de gasto en pesos",
      severity: "error",
    },
    {
      id: "fechas",
      ok: !!c.dates.startDate && (!c.dates.endDate || c.dates.endDate >= c.dates.startDate),
      label: "Fechas de inicio y fin válidas",
      severity: "error",
    },
    {
      id: "utm",
      ok: !!(c.utmParams?.source && c.utmParams?.medium && c.utmParams?.campaign),
      label: "Parámetros UTM completos (fuente, medio y campaña)",
      severity: "error",
    },
    {
      id: "destino",
      ok: (c.landingPageUrl || "").startsWith(SITE_FRANQUICIA_URL),
      label: `Destino oficial ${SITE_FRANQUICIA_URL}`,
      severity: "error",
    },
    {
      id: "objetivo",
      ok: c.objective === "lead_franquicia",
      label: "Objetivo de conversión único: lead_franquicia",
      severity: "error",
    }
  );
  return out;
}

export const hasErrors = (checks: AdCheck[]) => checks.some((c) => !c.ok && c.severity === "error");
