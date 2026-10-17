import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { getSnapshot, startSnapshotSchedule } from "./ga4Snapshot";
import { gscKeywords } from "./gscServer";
import { authMiddleware, registerAuthRoutes } from "./auth";
import { serviceAccountEmail, ga4AccessTokenOrNull, ga4HasCredentials, ga4PropertyIdValue, ga4Status, ga4CampaignRows, oauthClientConfigured, oauthClientHint, oauthAuthUrl, oauthExchange, oauthFinishManual, newOauthState, consumeOauthState, MANUAL_REDIRECT_URI } from "./ga4Server";

dotenv.config();

/** Claves que NUNCA se guardan en el navegador ni en archivos: viven en los Secrets del servidor */
const SENSITIVE_KEYS = ["oauthAccessToken", "metaAccessToken", "clarityApiToken", "oauthToken", "accessToken", "refreshToken", "clientSecret"];
const cleanEnv = (v: string | undefined) => (v || "").replace(/\s+/g, "").replace(/^["']+|["']+$/g, "");
const metaTokenFromEnv = () => cleanEnv(process.env.META_ACCESS_TOKEN);
const clarityTokenFromEnv = () => cleanEnv(process.env.CLARITY_API_TOKEN).replace(/^Bearer/i, "");

/** Saca de una configuración cualquier clave. Un "ID de proyecto de Clarity" largo con puntos es en realidad un token: también se saca. */
function stripSecrets(cfg: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(cfg && typeof cfg === "object" ? (cfg as Record<string, unknown>) : {}) };
  SENSITIVE_KEYS.forEach((k) => {
    if (k in out) out[k] = "";
  });
  const cid = String(out.clarityProjectId ?? "");
  if (cid.length > 24 || cid.includes(".")) out.clarityProjectId = "";
  return out;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set("trust proxy", true);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));
  registerAuthRoutes(app);
  app.use(authMiddleware);

  const CONFIG_STORE_PATH = path.join(__dirname, ".kol_accounts_config.json");

  // Configuración compartida del equipo: SOLO datos no sensibles (IDs de cuentas, opciones). Las claves van en Secrets.
  try {
    if (fs.existsSync(CONFIG_STORE_PATH)) {
      const existing = JSON.parse(fs.readFileSync(CONFIG_STORE_PATH, "utf-8"));
      fs.writeFileSync(CONFIG_STORE_PATH, JSON.stringify(stripSecrets(existing), null, 2), "utf-8");
    }
  } catch {}

  app.get("/api/accounts/config", (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_STORE_PATH)) {
        return res.json(stripSecrets(JSON.parse(fs.readFileSync(CONFIG_STORE_PATH, "utf-8"))));
      }
    } catch (e) {
      console.warn("No se pudo leer la configuración del servidor");
    }
    res.json(null);
  });

  app.post("/api/accounts/config", (req, res) => {
    try {
      fs.writeFileSync(CONFIG_STORE_PATH, JSON.stringify(stripSecrets(req.body), null, 2), "utf-8");
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (e) {
      console.error("Error guardando la configuración del servidor");
      res.status(500).json({ error: "Error al persistir configuración en servidor" });
    }
  });

  // Qué conexiones tienen su clave cargada en el servidor (solo sí o no, nunca el valor)
  app.get("/api/connections/status", (_req, res) => {
    res.json({
      ga4: { connected: ga4HasCredentials(), propertyId: ga4PropertyIdValue() },
      meta: !!metaTokenFromEnv(),
      clarity: !!clarityTokenFromEnv(),
    });
  });

  // Prueba REAL de cada conexión (no lee un cartel: consulta a cada servicio). Nunca devuelve claves.
  app.get("/api/connections/check", async (req, res) => {
    type St = { state: "ok" | "error" | "sin_configurar" | "clave_cargada"; message: string };
    const out: Record<string, St> = {};
    try {
      const g = await ga4Status(true);
      out.ga4 = !g.configured ? { state: "sin_configurar", message: g.message } : g.ok ? { state: "ok", message: g.message } : { state: "error", message: g.message };
    } catch (e) {
      out.ga4 = { state: "error", message: e instanceof Error ? e.message : "No se pudo probar GA4" };
    }
    try {
      const r = await gscKeywords();
      out.gsc = r.connected
        ? { state: "ok", message: `Propiedad ${r.site}: ${r.keywords.length} consultas de /franquicia en el período.` }
        : { state: /autorizaci[oó]n con cuenta de Google/i.test(r.message || "") ? "sin_configurar" : "error", message: r.message || "No se pudo leer Search Console" };
    } catch (e) {
      out.gsc = { state: "error", message: e instanceof Error ? e.message : "No se pudo probar Search Console" };
    }
    const metaToken = metaTokenFromEnv();
    const act = String(req.query.metaAdAccountId || "").replace(/^act_/, "").replace(/\D/g, "");
    if (!metaToken) out.meta = { state: "sin_configurar", message: "Falta cargar META_ACCESS_TOKEN en los Secrets del servidor." };
    else if (!act) out.meta = { state: "clave_cargada", message: "La clave está cargada, pero falta el ID de la cuenta publicitaria." };
    else {
      try {
        const r = await fetch(`https://graph.facebook.com/v21.0/act_${act}?fields=name,account_status,currency`, { headers: { Authorization: `Bearer ${metaToken}` } });
        const j = (await r.json()) as { name?: string; currency?: string; error?: { message?: string } };
        out.meta = r.ok ? { state: "ok", message: `Cuenta publicitaria “${j.name}” (${j.currency}) leída correctamente.` } : { state: "error", message: `Meta respondió: ${(j.error?.message || String(r.status)).slice(0, 200)}` };
      } catch (e) {
        out.meta = { state: "error", message: e instanceof Error ? e.message : "No se pudo probar Meta" };
      }
    }
    // Clarity limita las consultas por día: no se gasta cupo en una prueba, solo se informa si la clave está cargada
    out.clarity = clarityTokenFromEnv()
      ? { state: "clave_cargada", message: "La clave está cargada. No se prueba acá para no gastar el cupo diario de consultas de Clarity." }
      : { state: "sin_configurar", message: "Falta cargar CLARITY_API_TOKEN en los Secrets del servidor." };
    res.json({ checkedAt: new Date().toISOString(), serviceAccount: serviceAccountEmail(), ...out });
  });

  // Resultados de campañas desde GA4 (las credenciales viven solo en el servidor)
  app.get("/api/ga4/status", async (req, res) => {
    res.json(await ga4Status(req.query.test === "1"));
  });

  // Resumen real del embudo (GA4), con lectura programada cada hora
  app.get("/api/snapshot", async (_req, res) => {
    res.json(await getSnapshot(false));
  });
  app.post("/api/snapshot/refresh", async (_req, res) => {
    res.json(await getSnapshot(true));
  });
  startSnapshotSchedule();

  // Autorización de GA4 con una cuenta de Google (opción B: no requiere ser administrador de GA4)
  const redirectUriOf = (req: express.Request) => {
    if (process.env.GA4_OAUTH_REDIRECT_URI) return process.env.GA4_OAUTH_REDIRECT_URI;
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
    const host = String(req.headers["x-forwarded-host"] || req.get("host")).split(",")[0];
    return `${proto}://${host}/api/ga4/oauth/callback`;
  };

  app.get("/api/ga4/oauth/info", (req, res) => {
    res.json({ clientConfigured: oauthClientConfigured(), redirectUri: redirectUriOf(req), client: oauthClientHint() });
  });

  app.get("/api/ga4/oauth/start", (req, res) => {
    if (!oauthClientConfigured()) {
      return res.status(400).send("Falta cargar GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en los Secrets del servidor.");
    }
    res.redirect(oauthAuthUrl(redirectUriOf(req), newOauthState()));
  });

  // Autorización manual (sirve cuando volver a la app da error 403 por tener varias cuentas de Google abiertas)
  app.get("/api/ga4/oauth/manual-start", (_req, res) => {
    if (!oauthClientConfigured()) return res.status(400).json({ error: "Falta cargar GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en los Secrets." });
    res.json({ url: oauthAuthUrl(MANUAL_REDIRECT_URI, newOauthState()), redirectUri: MANUAL_REDIRECT_URI });
  });

  app.post("/api/ga4/oauth/manual-finish", async (req, res) => {
    try {
      const out = await oauthFinishManual(String(req.body?.pasted || ""));
      res.json({ ok: true, email: out.email, refreshToken: out.refreshToken });
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : "No se pudo completar la autorización" });
    }
  });

  app.get("/api/ga4/oauth/callback", async (req, res) => {
    const page = (title: string, body: string) =>
      res.type("html").send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:Roboto,system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#161418"><h1 style="font-size:22px">${title}</h1>${body}<p><a href="/" style="color:#C51172;font-weight:700">Volver a la app</a></p></body></html>`);
    try {
      if (req.query.error) return page("No se autorizó", `<p>Google informó: ${String(req.query.error).replace(/[<>&]/g, "")}. Podés volver a intentarlo desde Campañas → Datos y archivos.</p>`);
      if (!consumeOauthState(String(req.query.state || ""))) return page("Intento no válido", "<p>El pedido de autorización venció o no corresponde a esta app. Volvé a tocar “Autorizar con Google” desde la app.</p>");
      const { refreshToken, email } = await oauthExchange(String(req.query.code || ""), redirectUriOf(req));
      return page(
        "Listo: GA4 quedó autorizado",
        `<p>Autorizaste con <strong>${(email || "tu cuenta de Google").replace(/[<>&]/g, "")}</strong>. La app ya puede leer los resultados de GA4.</p>
         <p><strong>Un paso más, para que no se pierda cuando el servidor se reinicie:</strong> copiá este código y guardalo en el panel <em>Secrets</em> de AI Studio con el nombre <code>GA4_REFRESH_TOKEN</code>. Es una llave: no la compartas ni la subas a GitHub.</p>
         <textarea readonly rows="4" style="width:100%;font-family:monospace;padding:10px;border:1px solid #8C8580;border-radius:8px" onclick="this.select()">${refreshToken}</textarea>`
      );
    } catch (e) {
      return page("No se pudo autorizar", `<p>${(e instanceof Error ? e.message : "Error desconocido").replace(/[<>&]/g, "")}</p>`);
    }
  });

  app.post("/api/ga4/campaign-results", async (req, res) => {
    try {
      const { startDate = "28daysAgo", endDate = "today" } = req.body || {};
      const rows = await ga4CampaignRows(String(startDate), String(endDate));
      res.json({ rows, fetchedAt: new Date().toISOString() });
    } catch (e) {
      res.status(502).json({ error: e instanceof Error ? e.message : "No se pudieron leer los resultados de GA4" });
    }
  });

  // 0. Real Google Marketing Platform (GA4 Data API v1beta), Selective Meta Ads Graph API & Microsoft Clarity Export API Sync
  app.post("/api/gmp/sync", async (req, res) => {
    try {
      const {
        ga4PropertyId: bodyPropertyId,
        metaAdAccountId,
        metaOnlySpecificCampaigns = true,
        metaAllowedCampaignKeywords = [],
        metaSelectedCampaignNames = [],
        metaTrackedEvents = ["lead_franquicia", "Lead", "Contact"],
      } = req.body;

      // Las claves se leen SIEMPRE del servidor (Secrets): lo que mande el navegador se ignora
      const ga4PropertyId = bodyPropertyId || ga4PropertyIdValue();
      const oauthAccessToken = await ga4AccessTokenOrNull();
      const metaAccessToken = metaTokenFromEnv();
      const clarityApiToken = clarityTokenFromEnv();

      const fetchedCampaigns: Array<Record<string, unknown>> = [];
      const discoveredCampaigns: Array<Record<string, unknown>> = [];
      const fetchedClarityPages: Array<Record<string, unknown>> = [];
      const errors: string[] = [];

      const normalizedKeywords: string[] = Array.isArray(metaAllowedCampaignKeywords)
        ? metaAllowedCampaignKeywords
            .map((k: unknown) => String(k).trim().toLowerCase())
            .filter(Boolean)
        : [];

      const normalizedSelectedNames: string[] = Array.isArray(metaSelectedCampaignNames)
        ? metaSelectedCampaignNames
            .map((n: unknown) => String(n).trim().toLowerCase())
            .filter(Boolean)
        : [];

      const normalizedTrackedEvents: string[] = Array.isArray(metaTrackedEvents)
        ? metaTrackedEvents
            .map((ev: unknown) => String(ev).trim().toLowerCase())
            .filter(Boolean)
        : ["lead_franquicia", "lead"];

      const matchesSelectiveFilter = (campaignName: string, campaignId: string): boolean => {
        if (!metaOnlySpecificCampaigns) return true;
        const nameLower = campaignName.toLowerCase();
        const idLower = campaignId.toLowerCase();

        // Si el usuario tildó campañas específicas por nombre/ID, respetar esa selección exacta
        if (normalizedSelectedNames.length > 0) {
          return normalizedSelectedNames.some(
            (sel) => sel === nameLower || sel === idLower || nameLower.includes(sel)
          );
        }

        // Si definió palabras clave/IDs permitidos (ej. "franquicia", "inversor"), incluir solo las que coincidan
        if (normalizedKeywords.length > 0) {
          return normalizedKeywords.some(
            (kw) => nameLower.includes(kw) || idLower.includes(kw)
          );
        }

        return true;
      };

      // 1) Consulta real a Google Analytics Data API v1beta si hay Property ID y OAuth Access Token
      if (ga4PropertyId && oauthAccessToken) {
        const cleanPropId = String(ga4PropertyId).replace(/^properties\//, "").trim();
        const gaRes = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${oauthAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
              dimensions: [
                { name: "sessionCampaignName" },
                { name: "sessionSourceMedium" },
                { name: "landingPagePlusQueryString" },
              ],
              metrics: [
                { name: "sessions" },
                { name: "conversions" },
                { name: "advertiserAdCost" },
                { name: "advertiserAdClicks" },
                { name: "advertiserAdImpressions" },
                { name: "returnOnAdSpend" },
              ],
              limit: 40,
            }),
          }
        );

        if (!gaRes.ok) {
          const errBody = await gaRes.text();
          errors.push(`GA4 Data API (${gaRes.status}): verificá el Property ID y el token OAuth. Detalle: ${errBody.slice(0, 180)}`);
        } else {
          const gaData = await gaRes.json();
          const rows = Array.isArray(gaData.rows) ? gaData.rows : [];
          rows.forEach((row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }, idx: number) => {
            const campaignName = row.dimensionValues?.[0]?.value || `(not set ${idx + 1})`;
            const sourceMedium = row.dimensionValues?.[1]?.value || "GA4";
            const landingPage = row.dimensionValues?.[2]?.value || "/";
            const sessions = Number(row.metricValues?.[0]?.value || 0);
            const conversions = Number(row.metricValues?.[1]?.value || 0);
            const cost = Number(row.metricValues?.[2]?.value || 0);
            const clicks = Number(row.metricValues?.[3]?.value || sessions);
            const impressions = Number(row.metricValues?.[4]?.value || 0);
            const roas = Number(row.metricValues?.[5]?.value || 0);

            const isMetaSource =
              sourceMedium.toLowerCase().includes("meta") ||
              sourceMedium.toLowerCase().includes("facebook") ||
              sourceMedium.toLowerCase().includes("instagram") ||
              sourceMedium.toLowerCase().includes("fb") ||
              sourceMedium.toLowerCase().includes("ig");

            const resolvedPlatform = isMetaSource
              ? "Meta Ads"
              : sourceMedium.toLowerCase().includes("dv360")
              ? "DV360"
              : sourceMedium.toLowerCase().includes("sa360") || sourceMedium.toLowerCase().includes("cpc")
              ? "SA360"
              : sourceMedium.toLowerCase().includes("cm360")
              ? "CM360"
              : "GA4";

            const campObj = {
              id: `ga4-real-${idx}`,
              name: campaignName,
              platform: resolvedPlatform,
              status: "Activa",
              dailyBudget: Number((cost / 30).toFixed(2)),
              spend30d: Number(cost.toFixed(2)),
              impressions,
              clicks,
              ctrPct: impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
              conversions,
              cpaUsd: conversions > 0 ? Number((cost / conversions).toFixed(2)) : 0,
              roas: Number(roas.toFixed(2)),
              trackedEvents: ["lead_franquicia"],
              clarityRageClicksPct: 0,
              clarityDeadClicksPct: 0,
              clarityScrollDepthPct: 0,
              clarityQuickbacksPct: 0,
              landingPagePath: landingPage,
              targetAudience: sourceMedium,
              lastSyncedAt: new Date().toTimeString().slice(0, 5),
            };

            discoveredCampaigns.push(campObj);
            if (!isMetaSource || matchesSelectiveFilter(campaignName, campObj.id)) {
              fetchedCampaigns.push(campObj);
            }
          });

          // Palabras clave: no se inventan. Vendrán de Search Console cuando esté conectado.
        }
      }

      // 2) Consulta real a Meta Marketing API v21.0 con filtro de campañas y eventos específicos
      if (metaAdAccountId && metaAccessToken) {
        const cleanActId = String(metaAdAccountId).replace(/^act_/, "").trim();
        const metaUrl = `https://graph.facebook.com/v21.0/act_${cleanActId}/insights?level=campaign&date_preset=last_30d&fields=campaign_id,campaign_name,objective,spend,impressions,clicks,ctr,actions,purchase_roas&limit=100`;
        const metaRes = await fetch(metaUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${metaAccessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!metaRes.ok) {
          const errBody = await metaRes.text();
          errors.push(`Meta Marketing API (${metaRes.status}): verificá el Ad Account ID (act_${cleanActId}) y el Access Token de Meta. Detalle: ${errBody.slice(0, 180)}`);
        } else {
          const metaJson = await metaRes.json();
          const metaRows = Array.isArray(metaJson.data) ? metaJson.data : [];

          metaRows.forEach((row: Record<string, unknown>, idx: number) => {
            const campId = String(row.campaign_id || `meta-${idx}`);
            const campName = String(row.campaign_name || `Campaña Meta ${idx + 1}`);
            const spend = Number(row.spend || 0);
            const impressions = Number(row.impressions || 0);
            const clicks = Number(row.clicks || 0);
            const ctrPct = Number(Number(row.ctr || (impressions > 0 ? (clicks / impressions) * 100 : 0)).toFixed(2));

            // Filtrar exclusivamente los eventos específicos elegidos por el usuario (ej. lead_franquicia, Lead, Contact)
            const rawActions = Array.isArray(row.actions)
              ? (row.actions as Array<{ action_type?: string; value?: string }>)
              : [];

            let specificConversions = 0;
            const matchedEventNames: string[] = [];

            rawActions.forEach((act) => {
              const actType = String(act.action_type || "");
              const actLower = actType.toLowerCase();
              const val = Number(act.value || 0);

              const isTrackedEvent = normalizedTrackedEvents.some(
                (targetEv) =>
                  actLower === targetEv ||
                  actLower.endsWith(`.${targetEv}`) ||
                  actLower.includes(targetEv)
              );

              if (isTrackedEvent && val > 0) {
                specificConversions += val;
                const cleanEvName = actType.replace(/^offsite_conversion\.fb_pixel_custom\./, "").replace(/^offsite_conversion\.fb_pixel_/, "");
                if (!matchedEventNames.includes(cleanEvName)) {
                  matchedEventNames.push(cleanEvName);
                }
              }
            });

            const roasArr = Array.isArray(row.purchase_roas)
              ? (row.purchase_roas as Array<{ value?: string }>)
              : [];
            const roasVal = Number(roasArr[0]?.value || 0);

            const metaCampaignObj = {
              id: `meta-${campId}`,
              campaignExternalId: campId,
              name: campName,
              platform: "Meta Ads",
              status: "Activa",
              dailyBudget: Number((spend / 30).toFixed(2)),
              spend30d: Number(spend.toFixed(2)),
              impressions,
              clicks,
              ctrPct,
              conversions: specificConversions,
              cpaUsd:
                specificConversions > 0
                  ? Number((spend / specificConversions).toFixed(2))
                  : 0,
              roas: Number(roasVal.toFixed(2)),
              trackedEvents:
                matchedEventNames.length > 0
                  ? matchedEventNames
                  : metaTrackedEvents,
              clarityRageClicksPct: 0,
              clarityDeadClicksPct: 0,
              clarityScrollDepthPct: 0,
              clarityQuickbacksPct: 0,
              landingPagePath: "/",
              targetAudience: `Meta Objective: ${String(row.objective || "OUTCOME_LEADS")}`,
              lastSyncedAt: new Date().toTimeString().slice(0, 5),
            };

            discoveredCampaigns.push(metaCampaignObj);

            // Solo incorporar si pasa el filtro de campañas específicas
            if (matchesSelectiveFilter(campName, campId)) {
              fetchedCampaigns.push(metaCampaignObj);
            }
          });
        }
      }

      // 2) Consulta real a Microsoft Clarity Export API v1 si hay API Token
      if (clarityApiToken && String(clarityApiToken).trim()) {
        const cleanToken = String(clarityApiToken).replace(/^Bearer\s+/i, "").trim();
        try {
          const clarityRes = await fetch(
            "https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays=3&dimension1=URL",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${cleanToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!clarityRes.ok) {
            const errText = await clarityRes.text();
            if (clarityRes.status === 401 || clarityRes.status === 403) {
              errors.push(`Microsoft Clarity API (${clarityRes.status}): el token no fue aceptado. Verificá que sea el token JWT generado en Settings > Data Export de Clarity.`);
            } else if (clarityRes.status === 429) {
              errors.push(`Microsoft Clarity API (429): se alcanzó el límite diario de 10 peticiones del proyecto.`);
            } else {
              errors.push(`Microsoft Clarity API (${clarityRes.status}): ${errText.slice(0, 160)}`);
            }
          } else {
            const clarityData = await clarityRes.json();
            const entries = Array.isArray(clarityData)
              ? clarityData
              : Array.isArray((clarityData as Record<string, unknown>)?.result)
              ? ((clarityData as Record<string, unknown>).result as Record<string, unknown>[])
              : Array.isArray((clarityData as Record<string, unknown>)?.data)
              ? ((clarityData as Record<string, unknown>).data as Record<string, unknown>[])
              : [clarityData];

            const urlMap: Map<string, {
              url: string;
              sessions: number;
              scrollDepth: number;
              rageClicks: number;
              deadClicks: number;
              engagementSec: number;
              issue: string;
            }> = new Map();

            entries.forEach((entry: Record<string, unknown>) => {
              const metricName = String(entry.metricName || entry.name || "").toLowerCase();
              const infoList = Array.isArray(entry.information)
                ? entry.information
                : Array.isArray(entry.data)
                ? entry.data
                : [];

              infoList.forEach((row: Record<string, unknown>) => {
                const rawUrl = String(
                  row.URL || row.Url || row.url || row.Dimension1 || row.dimension1 || row.Page || row.page || "/"
                );
                if (!rawUrl || rawUrl === "/") return;

                if (!urlMap.has(rawUrl)) {
                  urlMap.set(rawUrl, {
                    url: rawUrl,
                    sessions: 0,
                    scrollDepth: 0,
                    rageClicks: 0,
                    deadClicks: 0,
                    engagementSec: 0,
                    issue: "Sin señales de fricción en los datos leídos",
                  });
                }
                const item = urlMap.get(rawUrl)!;
                if (row.totalSessionCount) item.sessions = Math.max(item.sessions, Number(row.totalSessionCount) || 0);
                if (row.averageScrollDepth) item.scrollDepth = Number(row.averageScrollDepth) || 0;
                if (row.activeTime) item.engagementSec = Number(row.activeTime) || 0;
                if (metricName.includes("rage") || row.rageClick) {
                  item.rageClicks = Number(row.subTotal || row.rate || row.rageClick || 0);
                  item.issue = "Clics reiterados de frustración (Rage clicks)";
                }
                if (metricName.includes("dead") || row.deadClick) {
                  item.deadClicks = Number(row.subTotal || row.deadClick || 0);
                  item.issue = "Clics en elementos no interactivos (Dead clicks)";
                }
              });
            });

            if (urlMap.size > 0) {
              Array.from(urlMap.values()).forEach((item, idx) => {
                fetchedClarityPages.push({
                  id: `clr-real-${idx}`,
                  pageUrl: item.url,
                  sessions: item.sessions,
                  rageClicksPct: item.rageClicks,
                  deadClicksPct: item.deadClicks,
                  avgScrollDepthPct: item.scrollDepth,
                  quickbacksPct: 0,
                  avgEngagementSec: item.engagementSec,
                  dominantFrictionIssue: item.issue,
                  linkedGmpCampaign: "Sincronizado desde Clarity API",
                });
              });
            } else if (entries.length > 0) {
              entries.slice(0, 10).forEach((entry: Record<string, unknown>, i: number) => {
                const infoList = Array.isArray(entry.information) ? entry.information : [];
                const firstInfo = (infoList[0] as Record<string, unknown>) || {};
                fetchedClarityPages.push({
                  id: `clr-real-${i}`,
                  pageUrl: String(firstInfo.URL || firstInfo.Url || entry.metricName || "/"),
                  sessions: Number(firstInfo.totalSessionCount || 0),
                  rageClicksPct: Number(firstInfo.subTotal || 0),
                  deadClicksPct: 0,
                  avgScrollDepthPct: Number(firstInfo.averageScrollDepth || 0),
                  quickbacksPct: 0,
                  avgEngagementSec: Number(firstInfo.activeTime || 0),
                  dominantFrictionIssue: `Métrica Clarity: ${String(entry.metricName || "Live Insight")}`,
                  linkedGmpCampaign: "Sincronizado desde Clarity API",
                });
              });
            }
          }
        } catch (cErr: unknown) {
          errors.push(`Clarity: error de conexión (${cErr instanceof Error ? cErr.message : "Fallo de red"})`);
        }
      }

      // Search Console: consultas reales de /franquicia (si no está conectado, no se completa nada)
      const gsc = await gscKeywords().catch((e: unknown) => ({
        connected: false,
        keywords: [],
        message: `Search Console: ${e instanceof Error ? e.message : "error de red"}`,
      }));

      res.json({
        campaigns: fetchedCampaigns,
        discoveredCampaigns,
        clarityPages: fetchedClarityPages,
        searchKeywords: gsc.keywords,
        gsc: { connected: gsc.connected, site: (gsc as { site?: string }).site, period: (gsc as { period?: unknown }).period, message: gsc.message },
        errors,
        syncedAt: new Date().toTimeString().slice(0, 8),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Error al sincronizar con APIs";
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KOL Marketing Suite server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
