import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Inicio de sesión con Google y roles.
 * - Quién puede entrar y con qué rol se define en el secret APP_USERS (formato: "persona@gmail.com:admin, otra@gmail.com:editor").
 * - Si APP_USERS está vacío, el inicio de sesión está APAGADO (la app queda abierta, como hasta ahora).
 * - No se guardan contraseñas: cada persona entra con su cuenta de Google (y la verificación en dos pasos de Google).
 */

export type Role = "viewer" | "editor" | "admin";
const RANK: Record<Role, number> = { viewer: 1, editor: 2, admin: 3 };
export const ROLE_LABEL: Record<Role, string> = { viewer: "Ve", editor: "Hace campañas y ve", admin: "Sincroniza, hace campañas y ve" };

const clean = (v: string | undefined) => (v || "").trim();

/** "a@x.com:admin, b@x.com:editor"  o  {"a@x.com":"admin"} */
export function parseUsers(raw: string | undefined): Record<string, Role> {
  const out: Record<string, Role> = {};
  const txt = clean(raw);
  if (!txt) return out;
  const add = (email: string, role: string) => {
    const e = email.trim().toLowerCase();
    const r = role.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && (r === "admin" || r === "editor" || r === "viewer")) out[e] = r as Role;
  };
  if (txt.startsWith("{")) {
    try {
      Object.entries(JSON.parse(txt) as Record<string, string>).forEach(([e, r]) => add(e, String(r)));
    } catch {}
    return out;
  }
  txt.split(/[,;\n]+/).forEach((p) => {
    const [e, r] = p.split(":");
    if (e && r) add(e, r);
  });
  return out;
}

const users = () => parseUsers(process.env.APP_USERS);
const oauthId = () => clean(process.env.GOOGLE_OAUTH_CLIENT_ID).replace(/\s+/g, "");
const oauthSecret = () => clean(process.env.GOOGLE_OAUTH_CLIENT_SECRET).replace(/\s+/g, "");

export function authStatus(): { enabled: boolean; reason?: string; userCount: number } {
  const n = Object.keys(users()).length;
  if (n === 0) return { enabled: false, reason: "No hay usuarios cargados en APP_USERS: la app está abierta.", userCount: 0 };
  if (!oauthId() || !oauthSecret()) return { enabled: false, reason: "Hay usuarios cargados pero falta el cliente de Google (GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET): el inicio de sesión no se enciende para no dejarte afuera.", userCount: n };
  return { enabled: true, userCount: n };
}

/* ---------- cookie firmada ---------- */
const SECRET = (() => {
  const s = clean(process.env.SESSION_SECRET);
  return s.length >= 16 ? s : crypto.randomBytes(32).toString("hex"); // sin SESSION_SECRET, las sesiones se reinician con cada arranque
})();
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (payload: string) => crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

export function makeToken(data: Record<string, unknown>): string {
  const p = b64(JSON.stringify(data));
  return `${p}.${sign(p)}`;
}
export function readToken<T = Record<string, unknown>>(tok: string | undefined): T | null {
  if (!tok) return null;
  const [p, s] = tok.split(".");
  if (!p || !s) return null;
  const good = sign(p);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try {
    const data = JSON.parse(Buffer.from(p, "base64url").toString()) as { exp?: number } & T;
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const i = c.indexOf("=");
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
const isHttps = (req: Request) => (req.headers["x-forwarded-proto"] || req.protocol) === "https";
function setCookie(req: Request, res: Response, name: string, value: string, maxAgeSec: number) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSec}`];
  if (isHttps(req)) parts.push("Secure");
  const prev = res.getHeader("Set-Cookie");
  res.setHeader("Set-Cookie", [...(Array.isArray(prev) ? prev : prev ? [String(prev)] : []), parts.join("; ")]);
}

/** Dirección pública de la app. Fuera de localhost siempre es https (Google no acepta http para apps en producción). */
const origin = (req: Request) => {
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = local ? (req.headers["x-forwarded-proto"] as string) || req.protocol : "https";
  return `${proto}://${host}`;
};
export const callbackUrl = (req: Request) => `${origin(req)}/auth/callback`;

/** Usuario de la sesión actual (el rol se vuelve a leer de APP_USERS en cada pedido: si se saca a alguien, pierde el acceso) */
export function currentUser(req: Request): { email: string; role: Role } | null {
  const s = readToken<{ email: string }>(cookies(req).kol_session);
  if (!s?.email) return null;
  const role = users()[s.email.toLowerCase()];
  return role ? { email: s.email.toLowerCase(), role } : null;
}

/* ---------- permisos por ruta (server) ---------- */
const VIEWER_GET = [/^\/api\/snapshot$/, /^\/api\/connections\/status$/, /^\/api\/accounts\/config$/, /^\/api\/ga4\/status$/];
export function requiredRole(method: string, path: string): Role | "public" {
  if (path === "/api/me" || path.startsWith("/auth/")) return "public";
  if (method === "GET" && VIEWER_GET.some((r) => r.test(path))) return "viewer";
  if (method === "POST" && path === "/api/ga4/campaign-results") return "viewer"; // leer resultados de campañas es "ver"
  if (path.startsWith("/api/")) return "admin"; // lo demás (sincronizar, conexiones, ajustes, usuarios) es del rol que sincroniza
  return "public"; // la página y sus archivos no contienen datos
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!authStatus().enabled) return next();
  const need = requiredRole(req.method, req.path);
  if (need === "public") return next();
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: "Tenés que iniciar sesión.", login: true });
  if (RANK[u.role] < RANK[need]) return res.status(403).json({ error: "Tu rol no permite esto." });
  next();
}

const page = (title: string, body: string) =>
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;font-family:Roboto,system-ui,sans-serif;background:#FAF8F6;color:#161418"><main style="max-width:480px;margin:12vh auto;padding:0 20px"><h1 style="font-family:Montserrat,system-ui,sans-serif;font-size:22px">${title}</h1>${body}<p><a href="/" style="color:#C51172;font-weight:700">Volver al inicio</a></p></main></body></html>`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function registerAuthRoutes(app: import("express").Express) {
  app.get("/api/me", (req, res) => {
    const st = authStatus();
    const u = currentUser(req);
    res.json({
      authEnabled: st.enabled,
      reason: st.reason,
      user: st.enabled ? u : { email: "", role: "admin" as Role }, // sin inicio de sesión, todo está abierto
    });
  });

  app.get("/api/users", (req, res) => {
    const st = authStatus();
    if (st.enabled && currentUser(req)?.role !== "admin") return res.status(403).json({ error: "Solo el rol que sincroniza puede ver los usuarios." });
    res.json({
      enabled: st.enabled,
      reason: st.reason,
      callbackUrl: callbackUrl(req),
      sessionSecretSet: clean(process.env.SESSION_SECRET).length >= 16,
      users: Object.entries(users()).map(([email, role]) => ({ email, role })),
    });
  });

  app.get("/auth/login", (req, res) => {
    if (!authStatus().enabled) return res.redirect("/");
    const state = crypto.randomBytes(16).toString("hex");
    setCookie(req, res, "kol_state", makeToken({ state, exp: Date.now() + 10 * 60_000 }), 600);
    const q = new URLSearchParams({ client_id: oauthId(), redirect_uri: callbackUrl(req), response_type: "code", scope: "openid email", state, prompt: "select_account" });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`);
  });

  app.get("/auth/callback", async (req, res) => {
    try {
      const st = readToken<{ state: string }>(cookies(req).kol_state);
      if (!st || !req.query.state || st.state !== String(req.query.state)) return res.status(400).send(page("No pudimos verificar el inicio de sesión", "<p>El intento venció o no coincide. Volvé a intentar.</p>"));
      if (req.query.error) return res.status(400).send(page("Inicio de sesión cancelado", `<p>Google respondió: ${esc(String(req.query.error))}.</p>`));
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code: String(req.query.code || ""), client_id: oauthId(), client_secret: oauthSecret(), redirect_uri: callbackUrl(req), grant_type: "authorization_code" }),
      });
      const j = (await r.json()) as { id_token?: string; error_description?: string; error?: string };
      if (!r.ok || !j.id_token) return res.status(400).send(page("Google no aceptó el inicio de sesión", `<p>${esc(j.error_description || j.error || String(r.status))}</p><p>Si dice "redirect_uri_mismatch", falta agregar <code>${esc(callbackUrl(req))}</code> en los URI de redireccionamiento autorizados del cliente de Google.</p>`));
      const claims = JSON.parse(Buffer.from(j.id_token.split(".")[1] || "", "base64url").toString()) as { email?: string; email_verified?: boolean; aud?: string };
      const email = (claims.email || "").toLowerCase();
      if (claims.aud !== oauthId() || !email || claims.email_verified === false) return res.status(403).send(page("No se pudo verificar tu cuenta", "<p>Google no confirmó el correo de esta cuenta.</p>"));
      if (!users()[email]) return res.status(403).send(page("Esta cuenta no tiene acceso", `<p>Entraste con <strong>${esc(email)}</strong>, pero esa cuenta no está autorizada. Pedile acceso a quien administra la app.</p>`));
      setCookie(req, res, "kol_session", makeToken({ email, exp: Date.now() + 7 * 86400_000 }), 7 * 86400);
      setCookie(req, res, "kol_state", "", 0);
      res.redirect("/");
    } catch (e) {
      res.status(500).send(page("Algo falló al iniciar sesión", `<p>${esc(e instanceof Error ? e.message : "Error desconocido")}</p>`));
    }
  });

  app.post("/auth/logout", (req, res) => {
    setCookie(req, res, "kol_session", "", 0);
    res.json({ ok: true });
  });
}
