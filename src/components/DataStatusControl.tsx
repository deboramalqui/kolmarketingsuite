import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, ArrowRight } from "lucide-react";

export interface SourceSyncState {
  ga4: {
    lastSync: number;
    ok: boolean;
  };
  gsc: {
    lastSync: number;
    ok: boolean;
  };
  clarity: {
    lastSync: number;
    ok: boolean;
  };
  meta: {
    tag: string;
  };
  globalStatus: "ok" | "updating" | "error" | "stale";
  lastSyncTs: number;
  updateCount: number;
  lastChangesList: string[];
}

interface DataStatusControlProps {
  isSyncing: boolean;
  onRefresh: () => Promise<void> | void;
  onOpenConnections: () => void;
  onRetrySource?: (source: "ga4" | "gsc" | "clarity") => void;
  simMode?: "ok" | "err" | "stale";
  onSetSimMode?: (mode: "ok" | "err" | "stale") => void;
}

const STORAGE_KEY = "kol_data_status_state_v3";

export const DataStatusControl: React.FC<DataStatusControlProps> = ({
  isSyncing,
  onRefresh,
  onOpenConnections,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [simMode, setSimMode] = useState<"ok" | "err" | "stale">("ok");
  const popoverRef = useRef<HTMLDivElement>(null);
  const infoBtnRef = useRef<HTMLButtonElement>(null);

  // Inicialización con "hace 12 min" según el prototipo oficial
  const [state, setState] = useState<SourceSyncState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    const twelveMinAgo = Date.now() - 12 * 60 * 1000;
    return {
      ga4: { lastSync: twelveMinAgo, ok: true },
      gsc: { lastSync: twelveMinAgo, ok: true },
      clarity: { lastSync: twelveMinAgo, ok: true },
      meta: { tag: "Se activa en noviembre" },
      globalStatus: "ok",
      lastSyncTs: twelveMinAgo,
      updateCount: 0,
      lastChangesList: [
        "+1 consulta nueva (ahora 3)",
        "+3 visitas al hub (ahora 78)",
        "Clarity: 3 sesiones nuevas",
      ],
    };
  });

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Actualizar timer de tiempo relativo
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  // Manejo de clicks afuera y Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        infoBtnRef.current?.focus();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Manejar modo simulador (ok, err, stale)
  const applySimMode = (mode: "ok" | "err" | "stale") => {
    setSimMode(mode);
    const now = Date.now();
    if (mode === "stale") {
      const old = now - 26 * 3600 * 1000; // 26 horas atrás
      setState((prev) => ({
        ...prev,
        globalStatus: "stale",
        lastSyncTs: old,
        ga4: { lastSync: old, ok: true },
        gsc: { lastSync: old, ok: true },
        clarity: { lastSync: old, ok: true },
      }));
    } else if (mode === "err") {
      const threeHoursAgo = now - 3 * 3600 * 1000;
      setState((prev) => ({
        ...prev,
        globalStatus: "error",
        ga4: { lastSync: threeHoursAgo, ok: false },
        gsc: { lastSync: now, ok: true },
        clarity: { lastSync: now, ok: true },
      }));
    } else {
      const twelveMinAgo = now - 12 * 60 * 1000;
      setState((prev) => ({
        ...prev,
        globalStatus: "ok",
        lastSyncTs: twelveMinAgo,
        ga4: { lastSync: twelveMinAgo, ok: true },
        gsc: { lastSync: twelveMinAgo, ok: true },
        clarity: { lastSync: twelveMinAgo, ok: true },
      }));
    }
  };

  // Cálculo de tiempo relativo idéntico al prototipo
  const ago = (ts: number) => {
    const m = Math.round((currentTime - ts) / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
  };

  // Ejecutar actualización
  const handleTriggerRefresh = async () => {
    if (isSyncing || state.globalStatus === "updating") return;

    setState((prev) => ({ ...prev, globalStatus: "updating" }));

    try {
      await onRefresh();
      const now = Date.now();

      if (simMode === "err") {
        setState((prev) => ({
          ...prev,
          globalStatus: "error",
          lastSyncTs: now,
          gsc: { lastSync: now, ok: true },
          clarity: { lastSync: now, ok: true },
          ga4: { lastSync: prev.ga4.lastSync, ok: false },
        }));
        return;
      }

      setState((prev) => {
        const nextCount = prev.updateCount + 1;
        const changes =
          nextCount === 1
            ? [
                "+1 consulta nueva (ahora 3)",
                "+3 visitas al hub (ahora 78)",
                "Clarity: 3 sesiones nuevas",
              ]
            : [];

        return {
          ...prev,
          updateCount: nextCount,
          globalStatus: "ok",
          lastSyncTs: now,
          ga4: { lastSync: now, ok: true },
          gsc: { lastSync: now, ok: true },
          clarity: { lastSync: now, ok: true },
          lastChangesList: changes,
        };
      });
      setSimMode("ok");
    } catch {
      setState((prev) => ({
        ...prev,
        globalStatus: "error",
        ga4: { ...prev.ga4, ok: false },
      }));
    }
  };

  // Reintentar solo GA4
  const handleRetryGa4 = () => {
    setSimMode("ok");
    handleTriggerRefresh();
  };

  // Textos y estados de visualización según prototipo
  const isUpdating = isSyncing || state.globalStatus === "updating";
  let dotClass = "bg-[#7FD6A4]"; // verde ok
  let dotAnimation = "";
  let chipText = `Datos al día · ${ago(state.lastSyncTs)}`;
  let popTitle = "Los datos están al día";
  let popSub = `Última actualización ${ago(state.lastSyncTs)}. Se actualiza sola cada hora.`;

  if (isUpdating) {
    dotClass = "bg-[#C9C3BE]";
    dotAnimation = "animate-pulse";
    chipText = "Actualizando…";
    popTitle = "Actualizando ahora";
    popSub = "Puede tardar unos segundos.";
  } else if (state.globalStatus === "error" || !state.ga4.ok) {
    dotClass = "bg-[#F056A9]"; // magenta error
    chipText = "Falta GA4 · tocá para ver";
    popTitle = "Una fuente no respondió";
    popSub = `Los números de GA4 son de ${ago(state.ga4.lastSync)}. El resto está al día.`;
  } else if (state.globalStatus === "stale") {
    dotClass = "bg-[#FFBA00]"; // ámbar advertencia
    chipText = `Datos de ${ago(state.lastSyncTs)} · actualizar`;
    popTitle = "Los datos están viejos";
    popSub = `La última actualización fue ${ago(state.lastSyncTs)}. Conviene actualizar antes de decidir algo.`;
  }

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* Control unificado: Chip con texto + botón ↻ */}
      <div className="inline-flex items-stretch border border-[#46413F] bg-[#2A2629] rounded-[12px] min-h-[40px] shadow-sm overflow-hidden">
        {/* Chip interactivo */}
        <button
          ref={infoBtnRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="data-status-popover"
          className="inline-flex items-center gap-2.5 px-3.5 bg-transparent text-[#FAF8F6] hover:bg-[#46413F] text-[13px] font-normal transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
        >
          <span
            className={`w-[9px] h-[9px] rounded-full shrink-0 ${dotClass} ${dotAnimation}`}
          />
          <span className="font-medium whitespace-nowrap" aria-live="polite">
            {chipText}
          </span>
        </button>

        {/* Separador vertical */}
        <div className="w-[1px] bg-[#46413F]" />

        {/* Botón ↻ de actualización manual */}
        <button
          type="button"
          onClick={handleTriggerRefresh}
          disabled={isUpdating}
          aria-label="Actualizar datos ahora"
          title="Actualizar datos ahora"
          className="w-[42px] flex items-center justify-center bg-transparent text-[#FAF8F6] hover:bg-[#46413F] disabled:cursor-progress disabled:opacity-80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Popover desplegable con estado por fuente */}
      {isOpen && (
        <div
          id="data-status-popover"
          role="dialog"
          aria-label="Estado de los datos"
          className="absolute right-0 top-[calc(100%+8px)] w-[min(380px,92vw)] bg-[#2A2629] border border-[#46413F] rounded-[14px] p-4 text-[#FAF8F6] shadow-2xl z-50 animate-in fade-in duration-150"
        >
          <h3 className="font-kol-display font-bold text-[14px] leading-tight text-[#FAF8F6] m-0 mb-1">
            {popTitle}
          </h3>
          <p className="text-[12px] text-[#C9C3BE] m-0 mb-3 leading-normal">
            {popSub}
          </p>

          {/* Lista de fuentes oficiales */}
          <div className="space-y-0 text-[13px] border-t border-[#46413F]">
            {/* GA4 */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#46413F]/60">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isUpdating
                    ? "bg-[#C9C3BE] animate-pulse"
                    : state.ga4.ok
                    ? "bg-[#7FD6A4]"
                    : "bg-[#F056A9]"
                }`}
              />
              <span className="flex-1 text-[#FAF8F6] font-medium text-[13px]">
                GA4 (consultas y visitas)
              </span>
              {isUpdating ? (
                <span className="text-[12px] text-[#C9C3BE]">actualizando…</span>
              ) : state.ga4.ok ? (
                <span className="text-[12px] text-[#C9C3BE]">
                  {ago(state.ga4.lastSync)}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#F056A9]">sin conexión</span>
                  <button
                    type="button"
                    onClick={handleRetryGa4}
                    className="border border-[#8C8580] text-[#FAF8F6] hover:bg-[#46413F] rounded-[8px] px-2 py-0.5 text-[12px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6]"
                  >
                    Reintentar
                  </button>
                </div>
              )}
            </div>

            {/* Google Search Console */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#46413F]/60">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isUpdating ? "bg-[#C9C3BE] animate-pulse" : "bg-[#7FD6A4]"
                }`}
              />
              <span className="flex-1 text-[#FAF8F6] font-medium text-[13px]">
                Search Console (búsquedas)
              </span>
              <span className="text-[12px] text-[#C9C3BE]">
                {isUpdating ? "actualizando…" : ago(state.gsc.lastSync)}
              </span>
            </div>

            {/* Microsoft Clarity */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#46413F]/60">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isUpdating ? "bg-[#C9C3BE] animate-pulse" : "bg-[#7FD6A4]"
                }`}
              />
              <span className="flex-1 text-[#FAF8F6] font-medium text-[13px]">
                Clarity (fricción)
              </span>
              <span className="text-[12px] text-[#C9C3BE]">
                {isUpdating ? "actualizando…" : ago(state.clarity.lastSync)}
              </span>
            </div>

            {/* Meta Ads */}
            <div className="flex items-center gap-2.5 py-2.5 border-b border-[#46413F]/60">
              <span className="w-2 h-2 rounded-full shrink-0 bg-[#8C8580]" />
              <span className="flex-1 text-[#FAF8F6] font-medium text-[13px]">
                Meta Ads
              </span>
              <span className="text-[11px] text-[#C9C3BE]">
                Se activa en noviembre
              </span>
            </div>
          </div>

          {/* Bloque Qué cambió */}
          <div className="mt-3 p-2.5 bg-[#161418] rounded-[10px] text-[12.5px] leading-relaxed border border-[#46413F]">
            {state.globalStatus === "error" || !state.ga4.ok ? (
              <div>
                <strong className="text-[#F056A9]">Qué pasó:</strong> Search
                Console y Clarity se actualizaron. GA4 quedó con los datos
                anteriores.
              </div>
            ) : state.lastChangesList.length > 0 ? (
              <div className="space-y-1">
                <strong className="text-[#FFBA00] block mb-1">
                  Qué cambió:
                </strong>
                {state.lastChangesList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[#FAF8F6]">
                    <span className="text-[#FFBA00]">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[#C9C3BE]">
                Sin cambios desde la última actualización.
              </div>
            )}
            <div className="mt-2 text-[11px] text-[#8C8580] pt-1.5 border-t border-[#46413F]/40">
              * GA4 completa los últimos 2 días en 24 a 48 h.
            </div>
          </div>

          {/* Selector de simulación (útil para verificar los 3 estados requeridos) */}
          <div className="mt-3 pt-2.5 border-t border-[#46413F] flex items-center justify-between text-[11.5px] text-[#C9C3BE]">
            <span>Probar estado:</span>
            <div className="inline-flex rounded-[6px] border border-[#46413F] overflow-hidden bg-[#161418]">
              <button
                type="button"
                onClick={() => applySimMode("ok")}
                className={`px-2 py-0.5 text-[11px] ${
                  simMode === "ok" && state.globalStatus === "ok"
                    ? "bg-[#46413F] text-[#FAF8F6] font-bold"
                    : "text-[#C9C3BE] hover:text-[#FAF8F6]"
                }`}
              >
                Al día
              </button>
              <button
                type="button"
                onClick={() => applySimMode("err")}
                className={`px-2 py-0.5 text-[11px] border-l border-[#46413F] ${
                  simMode === "err" || !state.ga4.ok
                    ? "bg-[#F056A9] text-[#161418] font-bold"
                    : "text-[#C9C3BE] hover:text-[#FAF8F6]"
                }`}
              >
                Falta GA4
              </button>
              <button
                type="button"
                onClick={() => applySimMode("stale")}
                className={`px-2 py-0.5 text-[11px] border-l border-[#46413F] ${
                  simMode === "stale"
                    ? "bg-[#FFBA00] text-[#161418] font-bold"
                    : "text-[#C9C3BE] hover:text-[#FAF8F6]"
                }`}
              >
                +24 h
              </button>
            </div>
          </div>

          {/* Enlace Administrar conexiones */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenConnections();
            }}
            className="w-full text-left mt-3 pt-2 border-t border-[#46413F] bg-transparent text-[#FAF8F6] hover:text-[#FFBA00] text-[13px] font-semibold underline decoration-1 underline-offset-4 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6]"
          >
            <span>Administrar conexiones →</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
