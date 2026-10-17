import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ga4HasCredentials, ga4RunReport } from "./ga4Server";

/**
 * Resumen real del embudo de franquicia leído de GA4: se actualiza solo cada hora (mientras el servidor esté despierto),
 * y también al pedirlo si pasó más de una hora. Nada de lo que devuelve es inventado: si GA4 no responde, no hay datos.
 */

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), ".kol_snapshot.json");
const MAX_AGE_MS = 60 * 60 * 1000;
export const FUNNEL_EVENTS = ["page_view", "click_cta_formulario", "inicio_formulario", "lead_franquicia"] as const;

export interface FunnelCount {
  now: number;
  prev: number;
}

export interface Snapshot {
  connected: boolean;
  fetchedAt: string | null;
  periodDays: number;
  funnel: Record<(typeof FUNNEL_EVENTS)[number], FunnelCount>;
  channels: Array<{ channelGroup: string; visitors: number; leads: number }>;
  /** Una fila por página de /franquicia* (hub e hijas), leída de GA4 */
  pages: Array<{ path: string; sessions: number; users: number; bounceRatePct: number; leads: number }>;
  /** Guía descargable de los 9 pasos: personas (usuarios únicos) que hicieron cada cosa en /franquicia* */
  guide?: { clicks: number; leads: number; downloads: number };
  /** Direcciones de /franquicia* que devuelven "Página no encontrada" (404) y de dónde llegaron las visitas */
  notFound?: Array<{ path: string; sessions: number; sources: Array<{ source: string; medium: string; sessions: number }> }>;
  /** Visitas que llegaron desde asistentes de IA (ChatGPT, Perplexity, Gemini…) a las páginas de franquicia */
  aiTraffic?: Array<{ source: string; landingPage: string; sessions: number; users: number }>;
  error?: string;
}

const empty = (connected: boolean, error?: string): Snapshot => ({
  connected,
  fetchedAt: null,
  periodDays: 28,
  funnel: Object.fromEntries(FUNNEL_EVENTS.map((e) => [e, { now: 0, prev: 0 }])) as Snapshot["funnel"],
  channels: [],
  pages: [],
  guide: { clicks: 0, leads: 0, downloads: 0 },
  notFound: [],
  aiTraffic: [],
  error,
});

type Row = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };
const num = (r: Row, i: number) => Number(r.metricValues?.[i]?.value ?? 0) || 0;

/** Convierte las filas de GA4 al resumen. Exportado para poder probarlo sin llamar a Google. */
export function buildSnapshot(funnelRows: Row[], channelRows: Row[], leadRows: Row[], now = new Date(), pageRows: Row[] = [], pageLeadRows: Row[] = [], guideRows: Row[] = [], notFoundRows: Row[] = [], aiRows: Row[] = []): Snapshot {
  const snap = empty(true);
  snap.fetchedAt = now.toISOString();
  // con dos períodos GA4 agrega una dimensión final con el nombre del rango
  funnelRows.forEach((r) => {
    const d = (r.dimensionValues ?? []).map((x) => x.value ?? "");
    const ev = d[0] as (typeof FUNNEL_EVENTS)[number];
    const range = d[1] || "actual";
    if (!snap.funnel[ev]) return;
    if (range === "anterior") snap.funnel[ev].prev = num(r, 0);
    else snap.funnel[ev].now = num(r, 0);
  });
  const leadsByChannel = new Map<string, number>();
  leadRows.forEach((r) => {
    const g = r.dimensionValues?.[0]?.value || "(sin canal)";
    leadsByChannel.set(g, (leadsByChannel.get(g) || 0) + num(r, 0));
  });
  snap.channels = channelRows
    .map((r) => {
      const g = r.dimensionValues?.[0]?.value || "(sin canal)";
      return { channelGroup: g, visitors: num(r, 0), leads: leadsByChannel.get(g) || 0 };
    })
    .sort((a, b) => b.visitors - a.visitors);
  const leadsByPage = new Map<string, number>();
  pageLeadRows.forEach((r) => {
    const p = r.dimensionValues?.[0]?.value || "";
    leadsByPage.set(p, (leadsByPage.get(p) || 0) + num(r, 0));
  });
  const g = { clicks: 0, leads: 0, downloads: 0 };
  guideRows.forEach((r) => {
    const ev = r.dimensionValues?.[0]?.value;
    if (ev === "click_cta_guia") g.clicks = num(r, 0);
    if (ev === "lead_guia") g.leads = num(r, 0);
    if (ev === "descarga_pdf_guia") g.downloads = num(r, 0);
  });
  snap.guide = g;
  const nf = new Map<string, { path: string; sessions: number; sources: Array<{ source: string; medium: string; sessions: number }> }>();
  notFoundRows.forEach((r) => {
    const d = (r.dimensionValues ?? []).map((x) => x.value ?? "");
    const path = d[0] || "";
    if (!path) return;
    const item = nf.get(path) ?? { path, sessions: 0, sources: [] };
    const n = num(r, 0);
    item.sessions += n;
    item.sources.push({ source: d[1] || "(not set)", medium: d[2] || "(not set)", sessions: n });
    nf.set(path, item);
  });
  snap.aiTraffic = aiRows
    .map((r) => {
      const d = (r.dimensionValues ?? []).map((x) => x.value ?? "");
      return { source: d[0] || "(not set)", landingPage: d[1] || "", sessions: num(r, 0), users: num(r, 1) };
    })
    .filter((a) => a.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions);
  snap.notFound = Array.from(nf.values()).sort((a, b) => b.sessions - a.sessions);
  snap.pages = pageRows
    .map((r) => {
      const p = r.dimensionValues?.[0]?.value || "";
      return { path: p, sessions: num(r, 0), users: num(r, 1), bounceRatePct: Math.round(num(r, 2) * 1000) / 10, leads: leadsByPage.get(p) || 0 };
    })
    .filter((p) => p.path)
    .sort((a, b) => b.sessions - a.sessions);
  return snap;
}

let current: Snapshot = (() => {
  try {
    if (fs.existsSync(FILE)) return { pages: [], notFound: [], aiTraffic: [], guide: { clicks: 0, leads: 0, downloads: 0 }, ...JSON.parse(fs.readFileSync(FILE, "utf-8")) };
  } catch {}
  return empty(false);
})();
let refreshing: Promise<Snapshot> | null = null;

export function getCachedSnapshot(): Snapshot {
  return { ...current, connected: ga4HasCredentials() && current.connected !== false ? true : ga4HasCredentials() };
}

const pageFilter = { filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/franquicia" } } };

async function fetchFromGa4(): Promise<Snapshot> {
  const [funnelRows, channelRows, leadRows, pageRows, pageLeadRows, guideRows, notFoundRows, aiRows] = await Promise.all([
    ga4RunReport({
      dateRanges: [
        { startDate: "28daysAgo", endDate: "today", name: "actual" },
        { startDate: "56daysAgo", endDate: "29daysAgo", name: "anterior" },
      ],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "totalUsers" }],
      dimensionFilter: { andGroup: { expressions: [{ filter: { fieldName: "eventName", inListFilter: { values: [...FUNNEL_EVENTS] } } }, pageFilter] } },
      limit: 100,
    }),
    ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionPrimaryChannelGroup" }],
      metrics: [{ name: "totalUsers" }],
      dimensionFilter: { filter: { fieldName: "landingPage", stringFilter: { matchType: "CONTAINS", value: "/franquicia" } } },
      limit: 50,
    }),
    ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionPrimaryChannelGroup" }],
      metrics: [{ name: "totalUsers" }],
      dimensionFilter: { andGroup: { expressions: [{ filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "lead_franquicia" } } }, pageFilter] } },
      limit: 50,
    }),
    ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "bounceRate" }],
      dimensionFilter: pageFilter,
      limit: 50,
    }),
    ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { andGroup: { expressions: [{ filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: "lead_franquicia" } } }, pageFilter] } },
      limit: 50,
    }),
    ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "totalUsers" }],
      dimensionFilter: { andGroup: { expressions: [{ filter: { fieldName: "eventName", inListFilter: { values: ["click_cta_guia", "lead_guia", "descarga_pdf_guia"] } } }, pageFilter] } },
      limit: 10,
    }),
    // El sitio titula sus 404 "Página no encontrada · KOL": así se distinguen de las páginas reales
    (ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }, { name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: { andGroup: { expressions: [pageFilter, { filter: { fieldName: "pageTitle", stringFilter: { matchType: "CONTAINS", value: "Página no encontrada", caseSensitive: false } } }] } },
      limit: 100,
    })
    ).catch(() => [] as Row[]),
    // Asistentes de IA: la campaña "(ai-assistant)" que arma GA4, o una fuente conocida de IA
    (ga4RunReport({
      dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionSource" }, { name: "landingPage" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: "landingPage", stringFilter: { matchType: "CONTAINS", value: "/franquicia" } } },
            {
              orGroup: {
                expressions: [
                  { filter: { fieldName: "sessionCampaignName", stringFilter: { matchType: "EXACT", value: "(ai-assistant)" } } },
                  { filter: { fieldName: "sessionSource", stringFilter: { matchType: "PARTIAL_REGEXP", value: "chatgpt|openai|perplexity|gemini|claude|copilot|deepseek|grok|you\\.com|meta\\.ai" } } },
                ],
              },
            },
          ],
        },
      },
      limit: 100,
    })
    ).catch(() => [] as Row[]),
  ]);
  return buildSnapshot(funnelRows, channelRows, leadRows, new Date(), pageRows, pageLeadRows, guideRows, notFoundRows, aiRows);
}

/** Actualiza desde GA4. Si falla, se conserva lo último bueno y se informa el error. */
export function refreshSnapshot(): Promise<Snapshot> {
  if (!ga4HasCredentials()) {
    current = empty(false);
    return Promise.resolve(current);
  }
  if (refreshing) return refreshing;
  refreshing = fetchFromGa4()
    .then((s) => {
      current = s;
      try {
        fs.writeFileSync(FILE, JSON.stringify(s), "utf-8");
      } catch {}
      return s;
    })
    .catch((e) => {
      current = { ...current, connected: true, error: e instanceof Error ? e.message : "No se pudo leer GA4" };
      return current;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Devuelve lo último; si está viejo, lo actualiza antes de responder */
export async function getSnapshot(force = false): Promise<Snapshot> {
  const age = current.fetchedAt ? Date.now() - new Date(current.fetchedAt).getTime() : Infinity;
  if (force || age > MAX_AGE_MS) await refreshSnapshot();
  return getCachedSnapshot();
}

/** Programación: una lectura al arrancar y una por hora */
export function startSnapshotSchedule() {
  setTimeout(() => void refreshSnapshot(), 15_000);
  setInterval(() => void refreshSnapshot(), MAX_AGE_MS);
}
