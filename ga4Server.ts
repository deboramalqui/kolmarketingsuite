import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Lectura de resultados de campañas desde Google Analytics 4 (Data API).
 * Credenciales SOLO en el servidor (variables de entorno); nunca en el navegador.
 *
 *   GA4_PROPERTY_ID               propiedad de GA4 (por defecto la real de Kol: 372010641)
 *   GA4_SERVICE_ACCOUNT_JSON      el JSON completo de la cuenta de servicio, o bien
 *   GA4_CLIENT_EMAIL + GA4_PRIVATE_KEY
 */

const DEFAULT_PROPERTY = "372010641";
const PAID_MEDIUMS = ["cpc", "display", "paid_social"];
export const TRACKED_EVENTS = ["lead_franquicia", "cita_agendada", "visita_franquicia"];

interface Credentials {
  clientEmail: string;
  privateKey: string;
}

function readCredentials(): Credentials | null {
  try {
    if (process.env.GA4_SERVICE_ACCOUNT_JSON) {
      const j = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON);
      if (j.client_email && j.private_key) return { clientEmail: j.client_email, privateKey: String(j.private_key).replace(/\\n/g, "\n") };
    }
  } catch {
    return null;
  }
  if (process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY) {
    return { clientEmail: process.env.GA4_CLIENT_EMAIL, privateKey: process.env.GA4_PRIVATE_KEY.replace(/\\n/g, "\n") };
  }
  return null;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

/** Arma el JWT firmado que Google pide para canjearlo por un token de acceso. Exportado para poder probarlo. */
export function buildJwt(cred: Credentials, nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: cred.clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );
  const unsigned = `${header}.${claims}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(cred.privateKey);
  return `${unsigned}.${b64url(signature)}`;
}

/* ---------- Opción B: autorización con la cuenta de Google de una persona (OAuth) ---------- */

const OAUTH_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), ".kol_ga4_oauth.json");
const OAUTH_SCOPE = "https://www.googleapis.com/auth/analytics.readonly openid email";

export const oauthClientConfigured = () => !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);

interface SavedOauth {
  refreshToken: string;
  email?: string;
  savedAt?: string;
}

function readSavedOauth(): SavedOauth | null {
  if (process.env.GA4_REFRESH_TOKEN) return { refreshToken: process.env.GA4_REFRESH_TOKEN, email: process.env.GA4_OAUTH_EMAIL };
  try {
    if (fs.existsSync(OAUTH_FILE)) return JSON.parse(fs.readFileSync(OAUTH_FILE, "utf-8"));
  } catch {}
  return null;
}

// "state" de cada intento de autorización: de un solo uso y vence a los 10 minutos
const pendingStates = new Map<string, number>();
export function newOauthState(): string {
  const st = crypto.randomBytes(16).toString("hex");
  pendingStates.set(st, Date.now() + 10 * 60_000);
  return st;
}
export function consumeOauthState(st: string | undefined): boolean {
  if (!st) return false;
  const exp = pendingStates.get(st);
  pendingStates.delete(st);
  return !!exp && exp > Date.now();
}

export function oauthAuthUrl(redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`;
}

/** Canjea el código de Google por el "refresh token" y lo guarda (solo en el servidor). */
export async function oauthExchange(code: string, redirectUri: string): Promise<{ refreshToken: string; email?: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const body = (await res.json()) as { refresh_token?: string; id_token?: string; error_description?: string; error?: string };
  if (!res.ok) throw new Error(`Google rechazó la autorización: ${body.error_description || body.error || res.status}`);
  if (!body.refresh_token) throw new Error("Google no devolvió el permiso permanente. Volvé a autorizar y aceptá todos los permisos.");
  let email: string | undefined;
  try {
    email = JSON.parse(Buffer.from((body.id_token || "").split(".")[1] || "", "base64").toString()).email;
  } catch {}
  try {
    fs.writeFileSync(OAUTH_FILE, JSON.stringify({ refreshToken: body.refresh_token, email, savedAt: new Date().toISOString() }), { mode: 0o600 });
  } catch {}
  cached = null;
  return { refreshToken: body.refresh_token, email };
}

async function accessTokenFromRefresh(saved: SavedOauth): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      refresh_token: saved.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    const expired = body.error === "invalid_grant";
    throw new Error(expired ? "La autorización de Google venció o fue revocada: volvé a tocar “Autorizar con Google”." : `Google no aceptó la autorización: ${body.error_description || res.status}`);
  }
  cached = { token: body.access_token, exp: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cached.token;
}

type Mode = { kind: "service"; cred: Credentials } | { kind: "oauth"; saved: SavedOauth } | null;

function currentMode(): Mode {
  const cred = readCredentials();
  if (cred) return { kind: "service", cred };
  const saved = readSavedOauth();
  if (saved && oauthClientConfigured()) return { kind: "oauth", saved };
  return null;
}

let cached: { token: string; exp: number } | null = null;

async function accessToken(mode: NonNullable<Mode>): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  if (mode.kind === "oauth") return accessTokenFromRefresh(mode.saved);
  const cred = mode.cred;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: buildJwt(cred) }),
  });
  const body = (await res.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`Google no aceptó la cuenta de servicio: ${body.error_description || res.status}`);
  cached = { token: body.access_token, exp: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return cached.token;
}

const propertyId = () => String(process.env.GA4_PROPERTY_ID || DEFAULT_PROPERTY).replace(/^properties\//, "").trim();

async function runReport(token: string, body: Record<string, unknown>) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId()}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>; error?: { message?: string; status?: string } };
  if (!res.ok) {
    const st = json.error?.status;
    const hint =
      st === "PERMISSION_DENIED"
        ? "la cuenta de servicio no tiene acceso a la propiedad de GA4 (agregala como Lector) o la API de Google Analytics Data no está activada en el proyecto"
        : st === "NOT_FOUND"
        ? "no se encontró la propiedad: revisá GA4_PROPERTY_ID"
        : json.error?.message || `error ${res.status}`;
    throw new Error(`GA4: ${hint}`);
  }
  return json.rows ?? [];
}

export interface CampaignRow {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  sessions: number;
  cost: number;
  clicks: number;
  events: Record<string, number>;
}

type RawRow = { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> };

/** Une el informe de tráfico con el de eventos. Exportado para poder probarlo sin llamar a Google. */
export function mergeReports(traffic: RawRow[], events: RawRow[]): CampaignRow[] {
  const map = new Map<string, CampaignRow>();
  const keyOf = (d: string[]) => d.slice(0, 4).map((x) => (x || "").toLowerCase()).join("|");
  const get = (d: string[]): CampaignRow => {
    const k = keyOf(d);
    let r = map.get(k);
    if (!r) {
      r = { campaign: (d[0] || "").toLowerCase(), source: (d[1] || "").toLowerCase(), medium: (d[2] || "").toLowerCase(), content: (d[3] || "").toLowerCase(), sessions: 0, cost: 0, clicks: 0, events: {} };
      map.set(k, r);
    }
    return r;
  };
  traffic.forEach((row) => {
    const d = (row.dimensionValues ?? []).map((x) => x.value ?? "");
    const m = (row.metricValues ?? []).map((x) => Number(x.value ?? 0));
    const r = get(d);
    r.sessions += m[0] || 0;
    r.cost += m[1] || 0;
    r.clicks += m[2] || 0;
  });
  events.forEach((row) => {
    const d = (row.dimensionValues ?? []).map((x) => x.value ?? "");
    const r = get(d);
    const ev = d[4] || "";
    r.events[ev] = (r.events[ev] || 0) + (Number(row.metricValues?.[0]?.value ?? 0) || 0);
  });
  return Array.from(map.values());
}

const baseDims = ["sessionCampaignName", "sessionSource", "sessionMedium", "sessionManualAdContent"].map((name) => ({ name }));
const mediumFilter = { filter: { fieldName: "sessionMedium", inListFilter: { values: PAID_MEDIUMS } } };

export interface Ga4StatusInfo {
  configured: boolean;
  propertyId: string;
  ok?: boolean;
  message: string;
  mode?: "service" | "oauth";
  oauthClient: boolean;
}

export async function ga4Status(test: boolean): Promise<Ga4StatusInfo> {
  const mode = currentMode();
  const oauthClient = oauthClientConfigured();
  if (!mode) {
    return {
      configured: false,
      propertyId: propertyId(),
      oauthClient,
      message: oauthClient ? "Todavía no está autorizado: tocá “Autorizar con Google” e iniciá sesión con la cuenta que tiene acceso a GA4." : "Todavía no está conectado: falta la cuenta de servicio o la autorización de Google.",
    };
  }
  const who = mode.kind === "service" ? `cuenta de servicio ${mode.cred.clientEmail}` : `autorización de ${mode.saved.email || "una cuenta de Google"}`;
  if (!test) return { configured: true, mode: mode.kind, propertyId: propertyId(), oauthClient, message: `Credenciales cargadas (${who}). Falta probar la conexión.` };
  try {
    const token = await accessToken(mode);
    await runReport(token, { dateRanges: [{ startDate: "7daysAgo", endDate: "today" }], metrics: [{ name: "sessions" }], limit: 1 });
    return { configured: true, mode: mode.kind, propertyId: propertyId(), oauthClient, ok: true, message: `Conexión correcta con ${who}: se pudo leer la propiedad de GA4.` };
  } catch (e) {
    return { configured: true, mode: mode.kind, propertyId: propertyId(), oauthClient, ok: false, message: e instanceof Error ? e.message : "No se pudo conectar" };
  }
}

export async function ga4CampaignRows(startDate: string, endDate: string): Promise<CampaignRow[]> {
  const mode = currentMode();
  if (!mode) throw new Error("GA4 no está conectado todavía");
  const token = await accessToken(mode);
  const dateRanges = [{ startDate, endDate }];
  const [traffic, events] = await Promise.all([
    runReport(token, {
      dateRanges,
      dimensions: baseDims,
      metrics: [{ name: "sessions" }, { name: "advertiserAdCost" }, { name: "advertiserAdClicks" }],
      dimensionFilter: mediumFilter,
      limit: 1000,
    }),
    runReport(token, {
      dateRanges,
      dimensions: [...baseDims, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { andGroup: { expressions: [mediumFilter, { filter: { fieldName: "eventName", inListFilter: { values: TRACKED_EVENTS } } }] } },
      limit: 1000,
    }),
  ]);
  return mergeReports(traffic, events);
}
