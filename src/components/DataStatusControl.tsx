import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, ArrowRight } from "lucide-react";
import { Snapshot, agoLabel, minutesAgo } from "../lib/liveData";
import { ConnectionsStatus } from "../lib/secrets";

interface Props {
  snapshot: Snapshot;
  connections: ConnectionsStatus;
  isSyncing: boolean;
  lastChanges: string[] | null;
  canRefresh: boolean;
  onRefresh: () => Promise<void> | void;
  onOpenConnections: () => void;
}

type Status = "sin_conexion" | "actualizando" | "error" | "viejo" | "ok";

/** Estado REAL de los datos: sale de la última lectura de GA4 hecha por el servidor. Nada simulado. */
export const DataStatusControl: React.FC<Props> = ({ snapshot, connections, isSyncing, lastChanges, canRefresh, onRefresh, onOpenConnections }) => {
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => popRef.current && !popRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const mins = minutesAgo(snapshot.fetchedAt);
  const status: Status = isSyncing
    ? "actualizando"
    : !snapshot.connected && !connections.ga4.connected
    ? "sin_conexion"
    : snapshot.error && !snapshot.fetchedAt
    ? "error"
    : snapshot.error
    ? "error"
    : mins !== null && mins > 180
    ? "viejo"
    : snapshot.fetchedAt
    ? "ok"
    : "sin_conexion";

  const text =
    status === "actualizando"
      ? "Actualizando…"
      : status === "sin_conexion"
      ? "Sin conexión con GA4"
      : status === "error"
      ? "GA4 no respondió · tocá para ver"
      : status === "viejo"
      ? `Datos de ${agoLabel(snapshot.fetchedAt)} · actualizar`
      : `Datos al día · ${agoLabel(snapshot.fetchedAt)}`;

  const dot = status === "ok" ? "bg-[#7FD6A4]" : status === "actualizando" ? "bg-[#C9C3BE] animate-pulse" : status === "viejo" ? "bg-[#FFBA00]" : status === "error" ? "bg-[#F056A9]" : "bg-[#8C8580]";

  return (
    <div className="relative" ref={popRef}>
      <div className="inline-flex items-stretch border border-[#46413F] bg-[#2A2629] rounded-[12px] min-h-[40px]">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} className="inline-flex items-center gap-2.5 px-3.5 text-[14px] text-[#FAF8F6] hover:bg-[#46413F] rounded-l-[12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6]">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
          <span aria-live="polite">{text}</span>
        </button>
        <button
          type="button"
          onClick={() => onRefresh()}
          disabled={isSyncing || !canRefresh || status === "sin_conexion"}
          aria-label="Actualizar datos ahora"
          title={!canRefresh ? "Tu usuario puede ver los datos, pero no actualizarlos" : status === "sin_conexion" ? "Primero hay que conectar GA4" : "Actualizar datos ahora"}
          className="w-[42px] border-l border-[#46413F] text-[#FAF8F6] grid place-items-center hover:bg-[#46413F] rounded-r-[12px] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6]"
        >
          <RotateCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {open && (
        <div role="dialog" aria-label="Estado de los datos" className="absolute right-0 top-[calc(100%+8px)] z-40 w-[min(380px,92vw)] bg-[#2A2629] border border-[#46413F] rounded-[14px] p-4 shadow-2xl text-[#FAF8F6]">
          <h3 className="font-kol-display font-bold text-[14px]">
            {status === "ok" ? "Los datos están al día" : status === "sin_conexion" ? "GA4 todavía no está conectado" : status === "error" ? "Una fuente no respondió" : status === "actualizando" ? "Actualizando ahora" : "Los datos están viejos"}
          </h3>
          <p className="text-[14px] text-[#C9C3BE] mt-1 mb-3">
            {snapshot.fetchedAt ? `Última lectura de GA4: ${agoLabel(snapshot.fetchedAt)}. Se actualiza sola cada hora.` : "Todavía no hay ninguna lectura de GA4."}
          </p>

          <div className="space-y-0 text-[14px]">
            {[
              { name: "GA4 (visitas y consultas)", ok: snapshot.connected && !!snapshot.fetchedAt && !snapshot.error, note: snapshot.error ? snapshot.error : snapshot.fetchedAt ? agoLabel(snapshot.fetchedAt) : connections.ga4.connected ? "conectado, sin lectura todavía" : "sin conectar" },
              { name: "Search Console", ok: false, note: "se ve en GA4 · lectura propia pendiente" },
              { name: "Clarity (fricción)", ok: connections.clarity, note: connections.clarity ? "clave cargada" : "sin clave en el servidor" },
              { name: "Meta Ads", ok: connections.meta, note: connections.meta ? "clave cargada" : "se activa en noviembre" },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-2.5 py-2 border-t border-[#46413F]">
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.ok ? "bg-[#7FD6A4]" : "bg-[#8C8580]"}`} />
                <span className="flex-1">{r.name}</span>
                <span className="text-[14px] text-[#C9C3BE] text-right max-w-[55%]">{r.note}</span>
              </div>
            ))}
          </div>

          {lastChanges && (
            <div className="mt-3 p-2.5 bg-[#161418] rounded-[10px] text-[14px] leading-relaxed">
              <strong className="text-[#FFBA00]">Qué cambió desde la lectura anterior:</strong>
              <br />
              {lastChanges.length ? lastChanges.map((c, i) => <div key={i}>• {c}</div>) : "Sin cambios."}
            </div>
          )}

          <button type="button" onClick={() => { setOpen(false); onOpenConnections(); }} className="mt-3 text-[14px] underline flex items-center gap-1 hover:text-[#FFBA00]">
            Administrar conexiones <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
