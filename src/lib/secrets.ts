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
