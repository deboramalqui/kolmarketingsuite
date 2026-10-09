import { FranchiseCampaignItem } from "../../types/marketing";
import { getAds, todayISO } from "./campaignModel";

export interface Ga4Status {
  configured: boolean;
  propertyId: string;
  ok?: boolean;
  message: string;
  mode?: "service" | "oauth";
  oauthClient?: boolean;
}

export async function fetchOauthInfo(): Promise<{ clientConfigured: boolean; redirectUri: string }> {
  try {
    return await (await fetch("/api/ga4/oauth/info")).json();
  } catch {
    return { clientConfigured: false, redirectUri: "" };
  }
}

export interface Ga4Row {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  sessions: number;
  cost: number;
  clicks: number;
  events: Record<string, number>;
}

export async function fetchGa4Status(test = false): Promise<Ga4Status> {
  try {
    const r = await fetch(`/api/ga4/status${test ? "?test=1" : ""}`);
    return await r.json();
  } catch {
    return { configured: false, propertyId: "", message: "No se pudo consultar el servidor." };
  }
}

export async function fetchGa4Rows(startDate = "28daysAgo"): Promise<Ga4Row[]> {
  const r = await fetch("/api/ga4/campaign-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate: "today" }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || "No se pudieron leer los resultados de GA4");
  return body.rows as Ga4Row[];
}

/**
 * Pasa a la campaña lo que GA4 registró para cada anuncio (por utm_campaign, utm_medium y utm_content).
 * Devuelve null si GA4 no tiene nada de esta campaña todavía.
 * Los gastos y clics de GA4 solo se usan si GA4 los tiene (hace falta Google Ads vinculado); si no, queda lo cargado a mano.
 */
export function applyGa4Rows(c: FranchiseCampaignItem, rows: Ga4Row[]): FranchiseCampaignItem | null {
  const slug = (c.utmParams.campaign || "").toLowerCase();
  const medium = (c.utmParams.medium || "").toLowerCase();
  const mine = rows.filter((r) => r.campaign === slug && r.medium === medium);
  if (mine.length === 0) return null;

  const prev = c.livePerformance?.byAd ?? [];
  const byAd = getAds(c).map((ad) => {
    const rs = mine.filter((r) => r.content === ad.utmContent.toLowerCase());
    const old = prev.find((p) => p.adId === ad.id);
    const sum = (f: (r: Ga4Row) => number) => rs.reduce((s, r) => s + f(r), 0);
    const cost = sum((r) => r.cost);
    const clicks = sum((r) => r.clicks);
    return {
      adId: ad.id,
      spend: cost > 0 ? Math.round(cost) : old?.spend ?? 0,
      clicks: clicks > 0 ? clicks : old?.clicks ?? 0,
      visits: sum((r) => r.sessions),
      consultas: sum((r) => r.events.lead_franquicia || 0),
      citas: sum((r) => r.events.cita_agendada || 0),
    };
  });
  const t = byAd.reduce((a, r) => ({ spend: a.spend + r.spend, clicks: a.clicks + r.clicks, visits: a.visits + r.visits, consultas: a.consultas + r.consultas, citas: a.citas + r.citas }), { spend: 0, clicks: 0, visits: 0, consultas: 0, citas: 0 });
  return {
    ...c,
    updatedAt: todayISO(),
    livePerformance: {
      ...c.livePerformance,
      ...t,
      costPerConsulta: t.consultas > 0 ? Math.round(t.spend / t.consultas) : 0,
      daysRunning: c.livePerformance?.daysRunning ?? 0,
      source: "ga4",
      updatedAt: todayISO(),
      byAd,
    },
  };
}
