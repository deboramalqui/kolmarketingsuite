import { oauthAccessTokenOrNull, serviceAccessTokenForScope, serviceAccountEmail } from "./ga4Server";

/**
 * Google Search Console (solo lectura). Usa la misma autorización de Google que GA4:
 * hace falta que la cuenta autorizada tenga acceso a la propiedad en Search Console
 * y que, al autorizar, haya quedado tildado el permiso de Search Console.
 * Todo lo que devuelve viene de Google: no se completa ni se estima nada.
 */

export interface GscKeyword {
  id: string;
  keyword: string;
  clicks: number;
  impressions: number;
  ctrPct: number;
  avgPosition: number;
  conversions: null; // Search Console no mide conversiones
  intent: "Inversor" | "Franquicia" | "Marca" | "Informativa";
  landingPage: string;
  date: string;
}

export interface GscResult {
  connected: boolean;
  site?: string;
  period?: { start: string; end: string };
  keywords: GscKeyword[];
  message?: string;
}

const API = "https://www.googleapis.com/webmasters/v3";

const fmt = (d: Date) => d.toISOString().slice(0, 10);

/** Texto accionable a partir del error de Google */
function explain(status: number, body: string): string {
  const txt = body.replace(/\s+/g, " ").slice(0, 300);
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(txt)) {
    return "La API de Search Console no está activada en el proyecto de Google Cloud. Activala en https://console.cloud.google.com/apis/library/searchconsole.googleapis.com y esperá un par de minutos.";
  }
  if (/insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(txt)) {
    return "Falta el permiso de Search Console en la autorización de Google. Volvé a tocar “Autorizar con Google” y dejá tildada la casilla de Search Console.";
  }
  if (status === 403) return `La cuenta de Google autorizada no tiene acceso a la propiedad en Search Console. Detalle de Google: ${txt}`;
  return `Search Console respondió ${status}: ${txt}`;
}

function intentOf(q: string): GscKeyword["intent"] {
  const k = q.toLowerCase();
  if (k.includes("invers")) return "Inversor";
  if (k.includes("kol")) return "Marca";
  if (k.includes("franquicia")) return "Franquicia";
  return "Informativa";
}

async function pickSite(token: string): Promise<{ site?: string; message?: string }> {
  const forced = (process.env.GSC_SITE_URL || "").trim();
  if (forced) return { site: forced };
  const res = await fetch(`${API}/sites`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) return { message: explain(res.status, text) };
  const entries: Array<{ siteUrl?: string }> = (JSON.parse(text).siteEntry as Array<{ siteUrl?: string }>) || [];
  const urls = entries.map((e) => e.siteUrl || "").filter(Boolean);
  const mine = urls.filter((u) => u.includes("kolaccesorios"));
  const site = mine.find((u) => u.startsWith("sc-domain:")) || mine[0];
  if (!site) {
    return {
      message: urls.length
        ? `La cuenta autorizada ve ${urls.length} propiedad(es) en Search Console, pero ninguna es de kolaccesorios.com.`
        : "La cuenta autorizada no tiene ninguna propiedad en Search Console.",
    };
  }
  return { site };
}

/** Consultas de búsqueda de las páginas /franquicia de los últimos 28 días (Google entrega con 2 a 3 días de demora) */
async function gscWithToken(token: string): Promise<GscResult> {
  const picked = await pickSite(token);
  if (!picked.site) return { connected: false, keywords: [], message: picked.message };

  const end = new Date(Date.now() - 3 * 86400_000);
  const start = new Date(end.getTime() - 27 * 86400_000);
  const res = await fetch(`${API}/sites/${encodeURIComponent(picked.site)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: fmt(start),
      endDate: fmt(end),
      dimensions: ["query", "page"],
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/franquicia" }] }],
      rowLimit: 50,
    }),
  });
  const text = await res.text();
  if (!res.ok) return { connected: false, site: picked.site, keywords: [], message: explain(res.status, text) };

  const rows = (JSON.parse(text).rows as Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>) || [];
  const keywords: GscKeyword[] = rows.map((r, i) => {
    const q = r.keys?.[0] || "";
    let page = r.keys?.[1] || "";
    try {
      page = new URL(page).pathname;
    } catch {}
    return {
      id: `gsc-api-${i}`,
      keyword: q,
      clicks: Number(r.clicks || 0),
      impressions: Number(r.impressions || 0),
      ctrPct: Number(((r.ctr || 0) * 100).toFixed(1)),
      avgPosition: Number((r.position || 0).toFixed(1)),
      conversions: null,
      intent: intentOf(q),
      landingPage: page,
      date: fmt(end),
    };
  });
  return {
    connected: true,
    site: picked.site,
    period: { start: fmt(start), end: fmt(end) },
    keywords,
    message: keywords.length ? undefined : "Search Console está conectado pero todavía no hay consultas para las páginas /franquicia en este período.",
  };
}

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/**
 * Prueba primero con la cuenta de servicio (no vence nunca; hay que agregarla como usuaria en Search Console)
 * y después con la autorización de una persona de Google (puede vencer).
 */
export async function gscKeywords(): Promise<GscResult> {
  const tries: Array<{ label: string; token: string }> = [];
  const notes: string[] = [];
  const svc = await serviceAccessTokenForScope(GSC_SCOPE);
  if (svc.token) tries.push({ label: "cuenta de servicio", token: svc.token });
  else if (svc.error && !/no hay cuenta de servicio/.test(svc.error)) notes.push(`Cuenta de servicio: ${svc.error}`);
  const oauth = await oauthAccessTokenOrNull();
  if (oauth) tries.push({ label: "autorización de Google", token: oauth });
  if (tries.length === 0) {
    return { connected: false, keywords: [], message: "Search Console necesita la cuenta de servicio (recomendado) o la autorización con cuenta de Google. Ver Configuración." };
  }
  for (const t of tries) {
    const r = await gscWithToken(t.token);
    if (r.connected) return r;
    notes.push(`${t.label[0].toUpperCase()}${t.label.slice(1)}: ${r.message ?? "no respondió"}`);
  }
  const email = serviceAccountEmail();
  return {
    connected: false,
    keywords: [],
    message: notes.join(" · ") + (email ? ` — Para que no se desconecte: agregá ${email} como usuaria en Search Console.` : ""),
  };
}
