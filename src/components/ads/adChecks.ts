// Chequeos en vivo de textos de anuncios contra los datos verificados de Kol.
// Fuente de verdad: datos-verificados-franquicia.md (derecho inicial US$ 3.000 exactos, 10 locales, etc.).

export interface AdCheck {
  id: string;
  ok: boolean;
  label: string;
  /** error: bloquea la aprobación; warn: a validar */
  severity: "error" | "warn";
}

export const GOOGLE_LIMITS = {
  headline: 30,
  description: 90,
  path: 15,
  sitelinkTitle: 25,
  sitelinkLine: 35,
  callout: 25,
  maxHeadlines: 15,
  maxDescriptions: 4,
};

export const DISPLAY_LIMITS = {
  shortHeadline: 30,
  longHeadline: 90,
  description: 90,
  businessName: 25,
  maxShortHeadlines: 5,
  maxDescriptions: 5,
};

export const META_PRIMARY_VISIBLE_CHARS = 125;

function commonChecks(allText: string): AdCheck[] {
  return [
    {
      id: "desde",
      ok: !/desde\s+(us\$|u\$s|usd)?\s*3\.?000/i.test(allText),
      label: "Derecho inicial sin “desde” (es US$ 3.000 exactos)",
      severity: "error",
    },
    {
      id: "pais",
      ok: !/locales\s+en\s+el\s+pa[ií]s/i.test(allText),
      label: "No dice “10 locales en el país” (sin verificar): decir “10 locales”",
      severity: "error",
    },
    {
      id: "siete",
      ok: !/\b7\s+(locales|sucursales)\b|sucursal/i.test(allText),
      label: "No dice “7 locales” ni “sucursales” (son 10 locales en 7 direcciones)",
      severity: "error",
    },
    {
      id: "ba",
      ok: !/buenos\s+aires|\bcaba\b|\bgba\b/i.test(allText),
      label: "No menciona Buenos Aires como zona con locales",
      severity: "error",
    },
    {
      id: "sinpub",
      ok: !/sin\s+publicidad/i.test(allText),
      label: "No dice “sin publicidad” (Kol sí invierte en publicidad de marca)",
      severity: "error",
    },
    {
      id: "probado",
      ok: !/modelo\s+probado/i.test(allText),
      label: "Sin la frase “modelo probado” (afirmación que Kol tiene que validar)",
      severity: "warn",
    },
  ];
}

export function checkMetaAd(v: {
  primaryText: string;
  headline: string;
  description: string;
  mediaUrl: string;
  /** undefined = la imagen no está en la galería (no se sabe) */
  imagePermission?: boolean;
}): AdCheck[] {
  const all = `${v.primaryText} ${v.headline} ${v.description}`;
  return [
    ...commonChecks(all),
    {
      id: "excl",
      ok: !/[!¡]/.test(all),
      label: "Sin signos de exclamación (regla de la guía de marca)",
      severity: "error",
    },
    {
      id: "img",
      ok: !!v.mediaUrl,
      label: "El anuncio tiene imagen",
      severity: "error",
    },
    ...(v.imagePermission === undefined
      ? []
      : [
          {
            id: "permiso",
            ok: v.imagePermission,
            label: "La imagen tiene permiso de uso confirmado (en Datos y archivos)",
            severity: "error" as const,
          },
        ]),
    {
      id: "corte",
      ok: v.primaryText.length <= META_PRIMARY_VISIBLE_CHARS,
      label: `El texto principal se corta a los ${META_PRIMARY_VISIBLE_CHARS} caracteres: lo más importante tiene que ir al principio`,
      severity: "warn",
    },
  ];
}

export function parseKeywords(text: string): Array<{ keyword: string; matchType: "exact" | "phrase" | "broad" }> {
  return text
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean)
    .map((kw) => {
      if (kw.startsWith("[") && kw.endsWith("]")) return { keyword: kw.slice(1, -1), matchType: "exact" as const };
      if (kw.startsWith('"') && kw.endsWith('"')) return { keyword: kw.slice(1, -1), matchType: "phrase" as const };
      return { keyword: kw, matchType: "broad" as const };
    });
}

export function stringifyKeywords(
  kws: Array<{ keyword: string; matchType: "exact" | "phrase" | "broad" }>
): string {
  return kws
    .map((k) => (k.matchType === "exact" ? `[${k.keyword}]` : k.matchType === "phrase" ? `"${k.keyword}"` : k.keyword))
    .join("\n");
}

export function checkGoogleAd(v: {
  headlines: string[];
  descriptions: string[];
  displayPath: [string, string];
  sitelinks: Array<{ title: string; line1: string; line2: string }>;
  callouts: string[];
  keywordsText: string;
}): AdCheck[] {
  const hs = v.headlines.filter((h) => h.trim());
  const ds = v.descriptions.filter((d) => d.trim());
  const all = [...hs, ...ds, ...v.sitelinks.flatMap((s) => [s.title, s.line1, s.line2]), ...v.callouts].join(" ");
  const L = GOOGLE_LIMITS;
  const over =
    v.headlines.filter((h) => h.length > L.headline).length +
    v.descriptions.filter((d) => d.length > L.description).length +
    v.displayPath.filter((p) => p.length > L.path).length +
    v.sitelinks.filter((s) => s.title.length > L.sitelinkTitle || s.line1.length > L.sitelinkLine || s.line2.length > L.sitelinkLine).length +
    v.callouts.filter((c) => c.length > L.callout).length;
  const dup = hs.length !== new Set(hs.map((h) => h.trim().toLowerCase())).size;
  const broad = parseKeywords(v.keywordsText).filter((k) => k.matchType === "broad").length;
  return [
    {
      id: "limites",
      ok: over === 0,
      label: over === 0 ? "Ningún texto pasa el límite de caracteres" : `${over} texto(s) pasan el límite de caracteres`,
      severity: "error",
    },
    { id: "min-h", ok: hs.length >= 3, label: `Al menos 3 títulos (hay ${hs.length})`, severity: "error" },
    { id: "min-d", ok: ds.length >= 2, label: `Al menos 2 descripciones (hay ${ds.length})`, severity: "error" },
    { id: "dup", ok: !dup, label: "Sin títulos repetidos", severity: "error" },
    {
      id: "excl",
      ok: !/[!¡]/.test(hs.join(" ")),
      label: "Sin signos de exclamación en los títulos (Google los rechaza)",
      severity: "error",
    },
    ...commonChecks(all),
    {
      id: "rec-h",
      ok: hs.length >= 8,
      label: `Recomendado: 8 o más títulos para que Google pueda combinarlos (hay ${hs.length})`,
      severity: "warn",
    },
    {
      id: "broad",
      ok: broad === 0,
      label: broad === 0 ? "Sin palabras clave de concordancia amplia" : `${broad} palabra(s) clave amplias: gastan más y traen menos consultas buenas`,
      severity: "warn",
    },
  ];
}

export interface DisplayAssetState {
  present: boolean;
  fitOk: boolean;
  fitReason: string;
  permission: boolean;
}

export function checkDisplayAd(v: {
  businessName: string;
  shortHeadlines: string[];
  longHeadline: string;
  descriptions: string[];
  landscape: DisplayAssetState;
  square: DisplayAssetState;
  logoSquare: DisplayAssetState;
}): AdCheck[] {
  const L = DISPLAY_LIMITS;
  const hs = v.shortHeadlines.filter((h) => h.trim());
  const ds = v.descriptions.filter((d) => d.trim());
  const all = [...hs, v.longHeadline, ...ds, v.businessName].join(" ");
  const over =
    v.shortHeadlines.filter((h) => h.length > L.shortHeadline).length +
    (v.longHeadline.length > L.longHeadline ? 1 : 0) +
    v.descriptions.filter((d) => d.length > L.description).length +
    (v.businessName.length > L.businessName ? 1 : 0);
  const slot = (name: string, a: DisplayAssetState, required: boolean): AdCheck[] => {
    if (!a.present) {
      return required
        ? [{ id: `img-${name}`, ok: false, label: `Falta la imagen ${name}`, severity: "error" }]
        : [{ id: `img-${name}`, ok: false, label: `Recomendado: sumar ${name}`, severity: "warn" }];
    }
    return [
      { id: `fit-${name}`, ok: a.fitOk, label: `Imagen ${name}: ${a.fitReason}`, severity: "error" },
      { id: `perm-${name}`, ok: a.permission, label: `Imagen ${name} con permiso de uso confirmado`, severity: "error" },
    ];
  };
  return [
    {
      id: "limites",
      ok: over === 0,
      label: over === 0 ? "Ningún texto pasa el límite de caracteres" : `${over} texto(s) pasan el límite de caracteres`,
      severity: "error",
    },
    { id: "business", ok: v.businessName.trim().length > 0, label: "Tiene nombre de empresa", severity: "error" },
    { id: "min-h", ok: hs.length >= 1, label: "Al menos 1 título corto", severity: "error" },
    { id: "long", ok: v.longHeadline.trim().length > 0, label: "Tiene título largo", severity: "error" },
    { id: "min-d", ok: ds.length >= 1, label: "Al menos 1 descripción", severity: "error" },
    { id: "excl", ok: !/[!¡]/.test(`${hs.join(" ")} ${v.longHeadline}`), label: "Sin signos de exclamación en los títulos", severity: "error" },
    ...slot("horizontal (1,91:1)", v.landscape, true),
    ...slot("cuadrada (1:1)", v.square, true),
    ...slot("logo cuadrado", v.logoSquare, false),
    ...commonChecks(all),
    { id: "rec-h", ok: hs.length >= 3, label: `Recomendado: 3 o más títulos cortos para que Google pueda combinar (hay ${hs.length})`, severity: "warn" },
  ];
}
