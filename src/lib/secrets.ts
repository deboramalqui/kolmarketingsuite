import { useEffect, useState } from "react";
import { ConnectedAccountsConfig } from "../types/marketing";

/**
 * Las claves (tokens de GA4, Meta, Clarity, Gmail) NO se guardan en el navegador ni se mandan al servidor desde acá:
 * viven en los Secrets del servidor. Esta función las saca de cualquier configuración antes de guardarla o enviarla.
 */
export function stripSecrets(cfg: ConnectedAccountsConfig): ConnectedAccountsConfig {
  // Un "ID de proyecto de Clarity" largo o con puntos es en realidad un token pegado en el campo equivocado
  const cid = String(cfg.clarityProjectId ?? "");
  const looksLikeToken = cid.length > 24 || cid.includes(".");
  return {
    ...cfg,
    oauthAccessToken: "",
    metaAccessToken: "",
    clarityApiToken: "",
    clarityProjectId: looksLikeToken ? "" : cid,
  };
}

export interface ConnectionsStatus {
  ga4: { connected: boolean; propertyId: string };
  meta: boolean;
  clarity: boolean;
}

const EMPTY: ConnectionsStatus = { ga4: { connected: false, propertyId: "" }, meta: false, clarity: false };

/** Qué conexiones tienen su clave cargada en el servidor (solo sí o no) */
export function useConnectionsStatus(): ConnectionsStatus {
  const [st, setSt] = useState<ConnectionsStatus>(EMPTY);
  useEffect(() => {
    fetch("/api/connections/status")
      .then((r) => (r.ok ? r.json() : EMPTY))
      .then(setSt)
      .catch(() => setSt(EMPTY));
  }, []);
  return st;
}

/**
 * Una sola vez: borra del navegador datos de ejemplo que versiones anteriores guardaron como si fueran reales
 * (lista de palabras clave de muestra, páginas de Clarity de muestra, estado simulado de las fuentes).
 */
export function purgeSampleData() {
  try {
    if (localStorage.getItem("kol_purged_samples_v1")) return;
    const kw = localStorage.getItem("kol_marketing_keywords");
    if (kw) {
      const parsed = JSON.parse(kw);
      if (Array.isArray(parsed)) localStorage.setItem("kol_marketing_keywords", JSON.stringify(parsed.filter((k: { id?: string }) => !String(k.id || "").startsWith("kw-"))));
    }
    localStorage.removeItem("kol_marketing_clarity_pages");
    localStorage.removeItem("kol_data_status_state_v3");
    localStorage.setItem("kol_purged_samples_v1", "1");
  } catch {}
}
