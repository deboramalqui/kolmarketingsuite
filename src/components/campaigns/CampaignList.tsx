import React, { useMemo, useState } from "react";
import { Plus, Search as SearchIcon, Sparkles, Trash2, Info } from "lucide-react";
import { CampaignLifecycleStatus, CampaignPlatform, FranchiseCampaignItem } from "../../types/marketing";
import { formatMoney, PLATFORM_INFO, platformLabel, statusLabel } from "./campaignModel";
import { StatusBadge } from "./StatusBadge";
import { InitiativesView } from "./InitiativesView";

interface Props {
  campaigns: FranchiseCampaignItem[];
  onNew: () => void;
  onNewSuggested: () => void;
  onOpen: (id: string, tab?: "resumen" | "anuncios" | "paquete") => void;
  onUpdate: (c: FranchiseCampaignItem) => void;
  onDelete: (id: string) => void;
  onLoadSamples: () => void;
  onRemoveSamples: () => void;
  hasSamples: boolean;
  onLoadDemo: () => void;
  onRemoveDemo: () => void;
  hasDemo: boolean;
}

const STATUS_FILTERS: Array<"todas" | CampaignLifecycleStatus> = ["todas", "borrador", "en_revision", "lista_para_publicar", "en_vivo", "cerrada"];

const Kpi: React.FC<{ label: string; value: string; note: string }> = ({ label, value, note }) => (
  <div className="p-4 bg-white border border-[#C9C3BE] rounded-[12px]">
    <div className="text-[12px] uppercase tracking-wide font-bold text-[#8C8580]">{label}</div>
    <div className="font-kol-display font-extrabold text-[26px] text-[#161418] mt-1 tabular-nums">{value}</div>
    <div className="text-[12px] text-[#6A6460] mt-1">{note}</div>
  </div>
);

export const CampaignList: React.FC<Props> = ({ campaigns, onNew, onNewSuggested, onOpen, onUpdate, onDelete, onLoadSamples, onRemoveSamples, hasSamples, onLoadDemo, onRemoveDemo, hasDemo }) => {
  const [view, setView] = useState<"lista" | "paraguas">("lista");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"todas" | CampaignPlatform>("todas");
  const [status, setStatus] = useState<"todas" | CampaignLifecycleStatus>("todas");

  const filtered = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          (type === "todas" || c.platform === type) &&
          (status === "todas" || c.status === status) &&
          c.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [campaigns, type, status, query]
  );

  // Las tarjetas cuentan solo campañas reales: la demo tiene números inventados
  const real = campaigns.filter((c) => !c.id.startsWith("demo-"));
  const live = real.filter((c) => c.status === "en_vivo");
  const committed = real.filter((c) => c.status === "lista_para_publicar" || c.status === "en_vivo").reduce((s, c) => s + (c.budget.totalCap || 0), 0);
  const withResults = real.filter((c) => c.livePerformance && !!c.livePerformance.source);
  const consultas = withResults.reduce((s, c) => s + (c.livePerformance?.consultas || 0), 0);

  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-10 text-center bg-[#FAF8F6] border border-[#C9C3BE] rounded-[14px] space-y-4">
          <h2 className="font-kol-display font-extrabold text-[22px] text-[#161418]">Todavía no hay campañas</h2>
          <p className="text-[14px] text-[#46413F] max-w-xl mx-auto">
            Las campañas de franquicia empiezan en noviembre de 2026. Podés ir dejando armadas las primeras: se guardan como borrador, se revisan y quedan listas para publicar.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onNew} className="kol-btn-normal px-5 py-2.5 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FFBA00]" /> Crear la primera campaña
            </button>
            <button type="button" onClick={onNewSuggested} className="kol-btn-normal px-5 py-2.5 bg-white border border-[#161418] text-[#161418] font-bold text-[13px] flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Empezar con la sugerencia de arranque
            </button>
            <button type="button" onClick={onLoadSamples} className="kol-btn-normal px-5 py-2.5 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]">
              Cargar campañas de prueba (borradores)
            </button>
            <button type="button" onClick={onLoadDemo} className="kol-btn-normal px-5 py-2.5 bg-[#FAF8F6] border border-dashed border-[#A40F5F] text-[#161418] font-bold text-[13px]">
              Ver demo con datos inventados
            </button>
          </div>
          <p className="text-[12px] text-[#6A6460]">Las de prueba quedan en borrador y dicen [PRUEBA]. La demo muestra resultados con números inventados y dice [DEMO]. Se borran todas juntas.</p>
        </div>
        <div className="p-4 bg-white border border-[#C9C3BE] rounded-[12px] flex gap-3 text-[13px] text-[#46413F]">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Sugerencia de arranque:</strong> una campaña de prueba en Meta de 14 días con un tope total en pesos que se define con Kol. Al 5/10/2026, Instagram es la fuente que más visitas trae al hub (dato de GA4, muestra chica).
            Es una pista, no una conclusión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Campañas" value={String(real.length)} note={`${real.filter((c) => c.status === "borrador").length} en borrador${real.length !== campaigns.length ? " · la demo no se cuenta" : ""}`} />
        <Kpi label="En vivo" value={String(live.length)} note={live.length ? "Publicadas en la plataforma" : "Ninguna publicada todavía"} />
        <Kpi label="Tope comprometido" value={committed ? formatMoney(committed) : "—"} note="Suma de topes de las listas y en vivo (ARS)" />
        <Kpi label="Consultas cargadas" value={withResults.length ? String(consultas) : "—"} note="Las cargás a mano en Resultados hasta conectar GA4" />
      </div>

      <div role="tablist" aria-label="Vista" className="flex gap-2">
        {([["lista", "Lista de campañas"], ["paraguas", "Por campaña paraguas"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold border kol-focus ${view === id ? "bg-[#161418] text-[#FAF8F6] border-[#161418]" : "bg-white text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"}`}>{label}</button>
        ))}
      </div>

      {view === "paraguas" && <InitiativesView campaigns={campaigns} onOpen={onOpen} onUpdate={onUpdate} />}

      {view === "lista" && (
      <>
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="relative lg:w-80">
          <SearchIcon className="w-4 h-4 text-[#8C8580] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar campaña por nombre"
            aria-label="Buscar campaña por nombre"
            className="w-full h-[40px] pl-9 pr-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] kol-focus"
          />
        </div>
        <div role="group" aria-label="Filtrar por tipo" className="flex gap-1.5 flex-wrap">
          {([{ id: "todas", label: "Todos los tipos" }, ...PLATFORM_INFO.map((p) => ({ id: p.id, label: p.label }))] as Array<{ id: "todas" | CampaignPlatform; label: string }>).map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={type === t.id}
              onClick={() => setType(t.id)}
              className={`px-3 py-1.5 text-[12.5px] font-bold rounded-[8px] border kol-focus ${type === t.id ? "bg-[#161418] text-[#FAF8F6] border-[#161418]" : "bg-white text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#C9C3BE]" role="group" aria-label="Filtrar por estado">
        {STATUS_FILTERS.map((s) => {
          const n = s === "todas" ? campaigns.length : campaigns.filter((c) => c.status === s).length;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-[13px] font-bold rounded-[8px] flex items-center gap-2 whitespace-nowrap kol-focus ${status === s ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#46413F] hover:bg-[#FAF8F6] border border-[#C9C3BE]"}`}
            >
              {s === "todas" ? "Todas" : statusLabel[s]}
              <span className={`px-1.5 rounded-full text-[11px] tabular-nums ${status === s ? "bg-[#2A2629]" : "bg-[#F3F0ED] text-[#161418]"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="border border-[#C9C3BE] rounded-[12px] overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-[#E7E3DF] text-[#161418] text-[13px] font-bold">
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Campaña</th>
              <th className="py-3 px-3">Tipo</th>
              <th className="py-3 px-3">Modo</th>
              <th className="py-3 px-3">Tope total</th>
              <th className="py-3 px-3 text-right">Consultas</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#8C8580]">
                  Ninguna campaña coincide con la búsqueda o los filtros.
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => (
                <tr key={c.id} className={`border-t border-[#C9C3BE] ${i % 2 ? "bg-[#FAF8F6]" : "bg-white"}`}>
                  <td className="py-3.5 px-4"><StatusBadge status={c.status} /></td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#161418]">{c.name}</div>
                    <div className="text-[12px] text-[#46413F] mt-0.5">{c.targetLocations.join(", ") || "Sin ciudades"}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-[13px]">{platformLabel(c)}</td>
                  <td className="py-3.5 px-3 text-[13px] capitalize">{c.mode}</td>
                  <td className="py-3.5 px-3 whitespace-nowrap tabular-nums text-[13px]">{formatMoney(c.budget.totalCap, c.budget.currency)}</td>
                  <td className="py-3.5 px-3 text-right tabular-nums text-[13px]">{!!c.livePerformance?.source ? c.livePerformance.consultas : "—"}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => onOpen(c.id, "resumen")} className="px-3 py-1 bg-[#FAF8F6] border border-[#C9C3BE] hover:bg-[#E7E3DF] text-[#161418] rounded-[6px] text-[12px] font-bold kol-focus">Ver ficha</button>
                      <button type="button" onClick={() => onOpen(c.id, "anuncios")} className="px-3 py-1 bg-white border border-[#161418] hover:bg-[#E7E3DF] text-[#161418] rounded-[6px] text-[12px] font-bold kol-focus">Anuncios</button>
                      <button
                        type="button"
                        aria-label={`Eliminar ${c.name}`}
                        title="Eliminar campaña"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la campaña “${c.name}”? No se puede deshacer.`)) onDelete(c.id);
                        }}
                        className="p-1 text-[#8C8580] hover:text-[#A40F5F] rounded kol-focus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      </>
      )}

      <div className="flex items-center justify-end gap-4 text-[12.5px]">
        {hasDemo ? (
          <button type="button" onClick={onRemoveDemo} className="text-[#6A6460] hover:text-[#A40F5F] underline kol-focus rounded">Borrar la demo</button>
        ) : (
          <button type="button" onClick={onLoadDemo} className="text-[#6A6460] hover:text-[#161418] underline kol-focus rounded">Ver demo con datos inventados</button>
        )}
        {hasSamples ? (
          <button type="button" onClick={onRemoveSamples} className="text-[#6A6460] hover:text-[#A40F5F] underline kol-focus rounded">Borrar las campañas de prueba</button>
        ) : (
          <button type="button" onClick={onLoadSamples} className="text-[#6A6460] hover:text-[#161418] underline kol-focus rounded">Cargar campañas de prueba</button>
        )}
      </div>
    </div>
  );
};
