import { AcquisitionChannel, FranchiseFunnelStep } from "../types/marketing";

/** Resumen real del embudo, leído de GA4 por el servidor. Nada de esto es de ejemplo. */
export interface Snapshot {
  connected: boolean;
  fetchedAt: string | null;
  periodDays: number;
  funnel: Record<"page_view" | "click_cta_formulario" | "inicio_formulario" | "lead_franquicia", { now: number; prev: number }>;
  channels: Array<{ channelGroup: string; visitors: number; leads: number }>;
  error?: string;
}

export const EMPTY_SNAPSHOT: Snapshot = {
  connected: false,
  fetchedAt: null,
  periodDays: 28,
  funnel: {
    page_view: { now: 0, prev: 0 },
    click_cta_formulario: { now: 0, prev: 0 },
    inicio_formulario: { now: 0, prev: 0 },
    lead_franquicia: { now: 0, prev: 0 },
  },
  channels: [],
};

export async function fetchSnapshot(force = false): Promise<Snapshot> {
  try {
    const r = await fetch(force ? "/api/snapshot/refresh" : "/api/snapshot", { method: force ? "POST" : "GET" });
    if (!r.ok) return { ...EMPTY_SNAPSHOT, error: "No se pudo consultar el servidor." };
    return await r.json();
  } catch {
    return { ...EMPTY_SNAPSHOT, error: "No se pudo consultar el servidor." };
  }
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

/** Si hay datos de GA4 (aunque sean ceros) */
export const hasData = (s: Snapshot) => s.connected && !!s.fetchedAt;

export function funnelFromSnapshot(s: Snapshot): FranchiseFunnelStep[] {
  const f = s.funnel;
  const v = f.page_view.now;
  const c = f.click_cta_formulario.now;
  const i = f.inicio_formulario.now;
  const l = f.lead_franquicia.now;
  const days = s.periodDays;
  return [
    { stepNumber: 1, id: "visita_hub", name: "Entra al hub", eventName: "page_view (franquicia)", source: "GA4", count: v, conversionRateFromStartPct: v > 0 ? 100 : 0, dropoffRateFromPreviousPct: 0, plainLanguageExplanation: `Personas que visitaron las páginas de franquicia en los últimos ${days} días.` },
    { stepNumber: 2, id: "click_cta_formulario", name: "Toca el botón del formulario", eventName: "click_cta_formulario", source: "GA4", count: c, conversionRateFromStartPct: pct(c, v), dropoffRateFromPreviousPct: v > 0 ? 100 - pct(c, v) : 0, plainLanguageExplanation: `De ${v} que entraron, ${c} tocaron el botón para ir al formulario.` },
    { stepNumber: 3, id: "inicio_formulario", name: "Empieza el formulario", eventName: "inicio_formulario", source: "GA4", count: i, conversionRateFromStartPct: pct(i, v), dropoffRateFromPreviousPct: c > 0 ? 100 - pct(i, c) : 0, plainLanguageExplanation: `De los ${c} que tocaron el botón, ${i} empezaron a completar el formulario.` },
    { stepNumber: 4, id: "lead_franquicia", name: "Envía consulta", eventName: "lead_franquicia", source: "GA4", count: l, conversionRateFromStartPct: pct(l, v), dropoffRateFromPreviousPct: i > 0 ? 100 - pct(l, i) : 0, plainLanguageExplanation: `${l} completaron el formulario y enviaron sus datos de contacto.` },
  ];
}

const CHANNEL_NOTES: Record<string, string> = {
  "Organic Social": "Redes sociales sin pauta (por ejemplo, Instagram)",
  "Organic Search": "Resultados de búsqueda sin pauta",
  Direct: "Dirección escrita o marcadores",
  Referral: "Enlaces desde otros sitios",
  "Paid Search": "Anuncios de búsqueda",
  "Paid Social": "Anuncios en redes",
};

export function channelsFromSnapshot(s: Snapshot): AcquisitionChannel[] {
  return s.channels.map((c) => ({
    channelGroup: c.channelGroup,
    detail: CHANNEL_NOTES[c.channelGroup] || "",
    visitors: c.visitors,
    leadsFranquicia: c.leads,
    conversionPct: pct(c.leads, c.visitors),
    isAiChannel: /\bIA\b|\bAI\b/i.test(c.channelGroup),
  }));
}

/** Qué cambió entre dos lecturas (solo diferencias reales) */
export function diffSnapshots(before: Snapshot, after: Snapshot): string[] {
  if (!hasData(before) || !hasData(after)) return [];
  const out: string[] = [];
  const d = (a: number, b: number) => b - a;
  const dl = d(before.funnel.lead_franquicia.now, after.funnel.lead_franquicia.now);
  const dv = d(before.funnel.page_view.now, after.funnel.page_view.now);
  if (dl !== 0) out.push(`${dl > 0 ? "+" : ""}${dl} consulta${Math.abs(dl) === 1 ? "" : "s"} (ahora ${after.funnel.lead_franquicia.now})`);
  if (dv !== 0) out.push(`${dv > 0 ? "+" : ""}${dv} visita${Math.abs(dv) === 1 ? "" : "s"} al hub (ahora ${after.funnel.page_view.now})`);
  return out;
}

export function minutesAgo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function agoLabel(iso: string | null): string {
  const m = minutesAgo(iso);
  if (m === null) return "sin lectura";
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.floor(h / 24)} d`;
}
