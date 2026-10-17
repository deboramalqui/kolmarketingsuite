import { useCallback, useEffect, useState } from "react";

/** Resultado de la prueba REAL de una conexión (la hace el servidor, no es un cartel fijo) */
export type ConnState = "ok" | "error" | "sin_configurar" | "clave_cargada";
export interface ConnResult {
  state: ConnState;
  message: string;
}
export interface ConnectionCheck {
  checkedAt: string | null;
  /** Correo de la cuenta de servicio (no es secreto) o null si no hay una cargada */
  serviceAccount: string | null;
  ga4: ConnResult | null;
  gsc: ConnResult | null;
  meta: ConnResult | null;
  clarity: ConnResult | null;
}

const EMPTY: ConnectionCheck = { checkedAt: null, serviceAccount: null, ga4: null, gsc: null, meta: null, clarity: null };

export function useConnectionCheck(metaAdAccountId: string) {
  const [check, setCheck] = useState<ConnectionCheck>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setFailed(null);
    try {
      const r = await fetch(`/api/connections/check?metaAdAccountId=${encodeURIComponent(metaAdAccountId || "")}`);
      if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
      setCheck(await r.json());
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "No se pudo consultar el servidor");
    } finally {
      setLoading(false);
    }
  }, [metaAdAccountId]);

  useEffect(() => {
    void run();
    // solo al abrir la pantalla; después, con el botón
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { check, loading, failed, run };
}
