import { CampaignAd, CampaignPlatform } from "../../types/marketing";

/** Texto inicial de cada tipo de anuncio: solo usa datos verificados (derecho inicial, regalías, locales, recupero). */
export function createDefaultAd(platform: CampaignPlatform, id: string, label: string, utmContent: string, feedPlacement = "Instagram Feed & Explorar"): CampaignAd {
  if (platform === "google_search") {
    return {
      id,
      label,
      utmContent,
      googleAdData: {
        headlines: ["Franquicia KOL Accesorios", "Derecho inicial US$ 3.000", "0 % regalías · 10 locales"],
        descriptions: [
          "Abrí tu local KOL. Derecho inicial US$ 3.000, 0 % de regalías y 0 % de canon publicitario.",
          "10 locales en funcionamiento. Recupero estimado de 18 a 24 meses, con casos en 12.",
        ],
        keywords: [{ keyword: "franquicia kol accesorios", matchType: "phrase" }],
        displayPath: ["franquicia", ""],
        sitelinks: [],
        callouts: [],
        negativeKeywords: [],
        finalUrlSuffix: "",
      },
    };
  }
  if (platform === "google_display") {
    return {
      id,
      label,
      utmContent,
      displayAdData: {
        businessName: "KOL Accesorios",
        shortHeadlines: ["Franquicia KOL Accesorios"],
        longHeadline: "Abrí tu franquicia KOL: derecho inicial de US$ 3.000 y 0 % de regalías",
        descriptions: ["Derecho inicial US$ 3.000, 0 % regalías y 0 % de canon de publicidad. Consultá."],
        callToAction: "Automático",
      },
    };
  }
  return {
    id,
    label,
    utmContent,
    metaAdData: {
      pageName: "kol.franquicias",
      avatarTheme: "claro",
      showSeal: true,
      sealVariant: "oscuro",
      primaryText: "¿Buscás una franquicia con bajo costo fijo en tecnología? KOL cuenta con 10 locales. Derecho inicial de US$ 3.000, 0 % de regalías y 0 % de canon publicitario.",
      headline: "Franquicia KOL · Formato Isla",
      description: "Recupero estimado de 18 a 24 meses (casos en 12)",
      callToAction: "Más información",
      mediaUrl: "",
      format: "feed_1x1",
      feedPlacement,
    },
  };
}
