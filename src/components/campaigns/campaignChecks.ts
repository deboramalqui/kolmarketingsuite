import { FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";
import { AdCheck, checkDisplayAd, checkGoogleAd, checkMetaAd, stringifyKeywords } from "../ads/adChecks";
import { assetFits, metaFormatInfo } from "./assetLibrary";
import { getAds } from "./campaignModel";
import { displayAssetState } from "../ads/DisplayAdEditor";

/** Chequeos reales de una campaña: textos de los anuncios + datos de la campaña. Nada se da por bueno de antemano. */
export function checkCampaign(c: FranchiseCampaignItem, assets: GalleryAsset[]): AdCheck[] {
  const out: AdCheck[] = [];

  const ads = getAds(c);
  if (ads.length === 0) out.push({ id: "sin-anuncio", ok: false, label: "La campaña no tiene anuncios cargados", severity: "error" });
  const firstKeywords = ads[0]?.googleAdData ? stringifyKeywords(ads[0].googleAdData.keywords) : "";
  ads.forEach((ad, i) => {
    let list: AdCheck[] = [];
    if (ad.googleAdData) {
      const g = ad.googleAdData;
      list = checkGoogleAd({
        headlines: g.headlines,
        descriptions: g.descriptions,
        displayPath: g.displayPath ?? ["", ""],
        sitelinks: g.sitelinks ?? [],
        callouts: g.callouts ?? [],
        keywordsText: firstKeywords,
      });
      if (i > 0) list = list.filter((x) => x.id !== "broad");
    } else if (ad.displayAdData) {
      const d = ad.displayAdData;
      list = checkDisplayAd({
        businessName: d.businessName,
        shortHeadlines: d.shortHeadlines,
        longHeadline: d.longHeadline,
        descriptions: d.descriptions,
        landscape: displayAssetState(assets, d.landscapeAssetId, "landscape"),
        square: displayAssetState(assets, d.squareAssetId, "square"),
        logoSquare: displayAssetState(assets, d.logoSquareAssetId, "logoSquare"),
      });
    } else if (ad.metaAdData) {
      const m = ad.metaAdData;
      const a = assets.find((x) => x.id === m.mediaAssetId);
      list = checkMetaAd({
        primaryText: m.primaryText,
        headline: m.headline,
        description: m.description,
        mediaUrl: a?.url || "",
        imagePermission: a ? a.permission : undefined,
        imageFit: a ? assetFits(a, metaFormatInfo(m.format).slot) : undefined,
      });
    }
    out.push(...(ads.length > 1 ? list.map((x) => ({ ...x, id: `${ad.id}-${x.id}`, label: `${ad.label}: ${x.label}` })) : list));
  });

  const g = c.geo;
  const hasTarget = g ? g.scope === "pais" || (g.scope === "provincias" ? g.provinces.length > 0 : g.cities.length > 0) : c.targetLocations.length > 0;
  out.push(
    {
      id: "ubicacion",
      ok: hasTarget,
      label: hasTarget ? "Tiene definido dónde se muestra la campaña" : "Falta definir dónde se muestra la campaña (todo el país, provincias o ciudades)",
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
