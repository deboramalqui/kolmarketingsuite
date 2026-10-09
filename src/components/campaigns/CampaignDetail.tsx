import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, Send } from "lucide-react";
import { FranchiseCampaignItem, GalleryAsset, CampaignApprovalRecord } from "../../types/marketing";
import { formatMoney, platformLabel, todayISO, dayNumber } from "./campaignModel";
import { checkCampaign, hasErrors } from "./campaignChecks";
import { buildPackage, PRE_ACTIVATION } from "./publishPackage";
import { StatusBadge } from "./StatusBadge";
import { useCopy } from "./useCopy";
import { CopyButton } from "./CopyButton";
import { AdChecklist } from "../ads/AdChecklist";
import { CampaignAdsTab } from "../ads/CampaignAdsTab";

type Tab = "resumen" | "anuncios" | "medicion" | "revision" | "paquete" | "resultados";

interface Props {
  campaign: FranchiseCampaignItem;
  assets: GalleryAsset[];
  initialTab?: Tab;
  onBack: () => void;
  onGoToFiles: () => void;
  onSave: (c: FranchiseCampaignItem) => void;
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "anuncios", label: "Anuncios y creativos" },
  { id: "medicion", label: "Medición UTM" },
  { id: "revision", label: "Revisión y aprobación" },
  { id: "paquete", label: "Paquete de publicación" },
  { id: "resultados", label: "Resultados y aprendizaje" },
];

const Row: React.FC<{ k: string; v: React.ReactNode }> = ({ k, v }) => (
  <div className="flex justify-between gap-4 border-b border-[#E7E3DF] pb-1.5 last:border-0 text-[13px]">
    <span className="text-[#46413F]">{k}</span>
    <strong className="text-[#161418] text-right">{v}</strong>
  </div>
);

export const CampaignDetail: React.FC<Props> = ({ campaign: c, assets, initialTab = "resumen", onBack, onGoToFiles, onSave }) => {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { copiedKey, copy } = useCopy();
  const checks = useMemo(() => checkCampaign(c, assets), [c, assets]);
  const errors = checks.filter((x) => !x.ok && x.severity === "error").length;
  const pkg = useMemo(() => buildPackage(c, assets), [c, assets]);
  const utm = c.utmParams;

  // revisión
  const [approver, setApprover] = useState("");
  const [role, setRole] = useState<CampaignApprovalRecord["role"]>("consultora");
  const [comment, setComment] = useState("");
  // paquete
  const [ticked, setTicked] = useState<boolean[]>(PRE_ACTIVATION[c.platform].map(() => false));
  const [platformId, setPlatformId] = useState(c.publication?.platformCampaignId || "");
  // resultados
  const [spend, setSpend] = useState<number | "">(c.livePerformance?.spend ?? "");
  const [clicks, setClicks] = useState<number | "">(c.livePerformance?.clicks ?? "");
  const [consultas, setConsultas] = useState<number | "">(c.livePerformance?.consultas ?? "");
  const [notes, setNotes] = useState(c.learningsNotes || "");
  const [savedNote, setSavedNote] = useState(false);

  const set = (patch: Partial<FranchiseCampaignItem>) => onSave({ ...c, ...patch, updatedAt: todayISO() });
  const now = () => new Date().toISOString().replace("T", " ").slice(0, 16);

  const addApproval = (status: CampaignApprovalRecord["status"]) => {
    const rec: CampaignApprovalRecord = { id: `appr-${Date.now()}`, date: now(), user: approver.trim(), role, status, comment: comment.trim() || undefined };
    set({ approvalHistory: [rec, ...c.approvalHistory], status: status === "aprobado" ? "lista_para_publicar" : "devuelta" });
    setComment("");
    if (status === "aprobado") setTab("paquete");
  };

  const publish = () =>
    set({
      status: "en_vivo",
      publication: { platformCampaignId: platformId.trim() || undefined, publishedAt: todayISO(), publishedBy: undefined },
    });

  const saveResults = () => {
    const sp = Number(spend) || 0;
    const cons = Number(consultas) || 0;
    const days = c.publication?.publishedAt ? dayNumber(c.publication.publishedAt) : 0;
    set({
      livePerformance: {
        spend: sp,
        clicks: Number(clicks) || 0,
        consultas: cons,
        costPerConsulta: cons > 0 ? Math.round(sp / cons) : 0,
        daysRunning: days,
        source: "manual",
        updatedAt: todayISO(),
      },
    });
  };

  const daysRunning = c.publication?.publishedAt ? dayNumber(c.publication.publishedAt) : 0;

  const headerAction = () => {
    switch (c.status) {
      case "borrador":
      case "devuelta":
        return (
          <button type="button" disabled={errors > 0} onClick={() => { set({ status: "en_revision" }); setTab("revision"); }} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12.5px] disabled:opacity-40" title={errors ? "Corregí los puntos marcados antes de pedir la revisión" : ""}>
            Pedir revisión{errors > 0 ? ` (${errors} para corregir)` : ""}
          </button>
        );
      case "en_revision":
        return <button type="button" onClick={() => setTab("revision")} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12.5px]">Ir a revisión y aprobación</button>;
      case "lista_para_publicar":
        return <button type="button" onClick={() => setTab("paquete")} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12.5px]">Ir al paquete de publicación</button>;
      case "en_vivo":
        return <button type="button" onClick={() => { if (window.confirm("¿Cerrar esta campaña? Después solo queda para consultar.")) set({ status: "cerrada" }); }} className="kol-btn-normal px-4 py-2 bg-white border border-[#161418] text-[#161418] font-bold text-[12.5px]">Cerrar campaña</button>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white border border-[#C9C3BE] rounded-[14px] space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onBack} aria-label="Volver al listado" className="p-1 mt-1 text-[#46413F] hover:text-[#161418] kol-focus rounded"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-kol-display font-extrabold text-[20px] text-[#161418]">{c.name}</h2>
              <StatusBadge status={c.status} />
            </div>
            <div className="text-[12.5px] text-[#46413F] mt-1">
              {platformLabel(c)} · Modo {c.mode} · Tope {formatMoney(c.budget.totalCap, c.budget.currency)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(c.status === "en_revision" || c.status === "lista_para_publicar") && (
            <button type="button" onClick={() => set({ status: "borrador" })} className="kol-btn-normal px-3 py-2 bg-white border border-[#C9C3BE] text-[#161418] font-bold text-[12.5px]">Volver a borrador</button>
          )}
          {headerAction()}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#C9C3BE] overflow-x-auto pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 text-[13px] font-bold rounded-[8px] whitespace-nowrap kol-focus ${tab === t.id ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#46413F] hover:bg-[#FAF8F6] border border-[#C9C3BE]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2.5">
            <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">Alcance y presupuesto</span>
            <Row k="Tipo" v={platformLabel(c)} />
            <Row k="Modo" v={<span className="capitalize">{c.mode}</span>} />
            <Row k="Fechas" v={`${c.dates.startDate} al ${c.dates.endDate || "sin fecha de fin"}`} />
            <Row k="Presupuesto diario" v={formatMoney(c.budget.dailyBudget, c.budget.currency)} />
            <Row k="Tope total" v={formatMoney(c.budget.totalCap, c.budget.currency)} />
            <Row k="Costo máx. por consulta" v={formatMoney(c.budget.maxCpaTarget, c.budget.currency)} />
            <Row k="Ciudades" v={c.targetLocations.join(", ") || "—"} />
            <Row k="Objetivo medido" v={<code>lead_franquicia</code>} />
          </div>
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
            <span className="text-[12px] uppercase font-bold text-[#8C8580] tracking-wider block">Estado del control de calidad</span>
            <p className="text-[13px] text-[#161418]">{errors ? `Hay ${errors} punto(s) para corregir antes de pedir la revisión.` : "Todo en orden para pedir la revisión."}</p>
            <div className="flex gap-3 flex-wrap pt-2">
              <button type="button" onClick={() => setTab("anuncios")} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold">Ver y editar anuncios</button>
              <button type="button" onClick={() => setTab("revision")} className="kol-btn-normal px-4 py-2 bg-white border border-[#C9C3BE] text-[#161418] text-[12px] font-bold">Ver el chequeo</button>
            </div>
          </div>
        </div>
      )}

      {tab === "anuncios" && <CampaignAdsTab key={`${c.id}-${c.status}`} campaign={c} assets={assets} onGoToFiles={onGoToFiles} onSaveCampaign={onSave} />}

      {tab === "medicion" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 text-[13px]">
            {([["utm_source", utm.source], ["utm_medium", utm.medium], ["utm_campaign", utm.campaign], ...(utm.term ? [["utm_term", utm.term]] : []), ["utm_content", utm.content || ""]] as Array<[string, string]>).map(([k, v]) => (
              <div key={k} className="p-2.5 bg-white border border-[#C9C3BE] rounded-[6px] flex justify-between gap-3"><span className="text-[#8C8580]">{k}</span><strong className="font-mono break-all text-right">{v}</strong></div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-[12px] font-bold text-[#46413F]">Enlace final de ejemplo</span><CopyButton text={utm.finalUrlWithUtm} id="utm-full" copiedKey={copiedKey} onCopy={copy} /></div>
            <div className="p-2.5 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[6px] text-[12px] font-mono break-all">{utm.finalUrlWithUtm}</div>
            <p className="text-[12px] text-[#6A6460]">Cada consulta llega al mail con su origen (campaña, fuente y palabra clave) y a GA4 con el evento <code>lead_franquicia</code>. GA4 tarda 24 a 48 h en mostrarlo.</p>
          </div>
        </div>
      )}

      {tab === "revision" && (
        <div className="space-y-6">
          <AdChecklist checks={checks} />
          <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-4">
            <span className="font-bold text-[14px] text-[#161418] block">Historial de aprobaciones</span>
            {c.approvalHistory.length === 0 ? (
              <p className="text-[13px] text-[#8C8580]">Todavía no hay aprobaciones registradas.</p>
            ) : (
              <ul className="space-y-2">
                {c.approvalHistory.map((a) => (
                  <li key={a.id} className="p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[6px] text-[13px] flex justify-between gap-3">
                    <div>
                      <strong>{a.user}</strong> <span className="text-[11px] text-[#8C8580]">({a.role === "consultora" ? "consultora" : "responsable del gasto"})</span>{" "}
                      <span className={`px-2 rounded text-[11px] font-bold ${a.status === "aprobado" ? "bg-[#161418] text-[#FAF8F6]" : "bg-[#F3F0ED] text-[#A40F5F] border border-[#A40F5F]"}`}>{a.status === "aprobado" ? "APROBADO" : "CAMBIOS PEDIDOS"}</span>
                      {a.comment && <p className="text-[#46413F] mt-1">{a.comment}</p>}
                    </div>
                    <span className="text-[11px] text-[#8C8580] tabular-nums whitespace-nowrap">{a.date}</span>
                  </li>
                ))}
              </ul>
            )}

            {c.status === "en_revision" ? (
              <div className="pt-3 border-t border-[#E7E3DF] space-y-3">
                <span className="font-bold text-[13px] text-[#161418] block">Registrar la decisión</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] font-bold mb-1" htmlFor="ap-name">Quién decide</label>
                    <input id="ap-name" value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="Nombre y apellido" className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] kol-focus" />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-bold mb-1" htmlFor="ap-role">En qué rol</label>
                    <select id="ap-role" value={role} onChange={(e) => setRole(e.target.value as CampaignApprovalRecord["role"])} className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] bg-white kol-focus">
                      <option value="consultora">Consultora (marca y datos)</option>
                      <option value="responsable_gasto">Responsable del gasto (Kol)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold mb-1" htmlFor="ap-comment">Comentario (obligatorio si pedís cambios)</label>
                  <textarea id="ap-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2.5 border border-[#8C8580] rounded-[6px] text-[13px] kol-focus" />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" disabled={errors > 0 || !approver.trim()} onClick={() => addApproval("aprobado")} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12.5px] flex items-center gap-2 disabled:opacity-40">
                    <Check className="w-3.5 h-3.5 text-[#FFBA00]" /> Aprobar
                  </button>
                  <button type="button" disabled={!approver.trim() || !comment.trim()} onClick={() => addApproval("cambios_pedidos")} className="kol-btn-normal px-4 py-2 bg-white border border-[#161418] text-[#161418] font-bold text-[12.5px] disabled:opacity-40">
                    Pedir cambios
                  </button>
                </div>
                {(errors > 0 || !approver.trim()) && <p className="text-[12px] text-[#6A6460]">{errors > 0 ? "No se puede aprobar mientras haya puntos para corregir. " : ""}{!approver.trim() ? "Escribí quién decide." : ""}</p>}
              </div>
            ) : (
              <p className="text-[12.5px] text-[#6A6460] pt-2 border-t border-[#E7E3DF]">La aprobación se registra cuando la campaña está “En revisión”. {c.status === "borrador" || c.status === "devuelta" ? "Primero pedí la revisión desde arriba." : ""}</p>
            )}
          </div>
        </div>
      )}

      {tab === "paquete" && (
        <div className="space-y-5">
          <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13px] text-[#46413F]">
            Esta herramienta <strong>no publica sola</strong>: te deja todo listo para copiar y pegar en {c.platform === "meta_instagram" ? "Meta Ads Manager" : "Google Ads"}, en el orden que lo pide la plataforma.
            {c.status !== "lista_para_publicar" && c.status !== "en_vivo" && c.status !== "cerrada" && <strong> Para publicar, primero la campaña tiene que estar aprobada.</strong>}
          </div>
          {pkg.map((step, i) => (
            <div key={step.title} className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-3">
              <div className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-[#161418] text-[#FAF8F6] grid place-items-center text-[12px] font-bold">{i + 1}</span><span className="font-bold text-[14px] text-[#161418]">{step.title}</span></div>
              {step.note && <p className="text-[12.5px] text-[#46413F]">{step.note}</p>}
              <div className="space-y-2">
                {step.items.map((it) => (
                  <div key={it.label} className="p-2.5 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[6px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11.5px] font-bold text-[#8C8580] uppercase tracking-wide">{it.label}</span>
                      <CopyButton text={it.copy ?? it.value} id={`${step.title}-${it.label}`} copiedKey={copiedKey} onCopy={copy} />
                    </div>
                    <pre className="text-[13px] text-[#161418] whitespace-pre-wrap break-words font-sans mt-1">{it.value}</pre>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-4 bg-white border-2 border-[#161418] rounded-[10px] space-y-3">
            <span className="font-bold text-[14px] text-[#161418] block">Antes de activar en la plataforma</span>
            {PRE_ACTIVATION[c.platform].map((t, i) => (
              <label key={t} className="flex items-start gap-2 text-[13px] cursor-pointer">
                <input type="checkbox" checked={ticked[i]} onChange={(e) => setTicked(ticked.map((x, j) => (j === i ? e.target.checked : x)))} className="mt-0.5" />
                <span>{t}</span>
              </label>
            ))}
            {c.status === "lista_para_publicar" && (
              <div className="pt-3 border-t border-[#E7E3DF] space-y-3">
                <div>
                  <label className="block text-[12.5px] font-bold mb-1" htmlFor="pf-id">ID de la campaña en la plataforma (opcional, cuando ya la creaste)</label>
                  <input id="pf-id" value={platformId} onChange={(e) => setPlatformId(e.target.value)} placeholder="Lo copiás de Google Ads o Meta" className="w-full max-w-md h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] kol-focus" />
                </div>
                <button type="button" disabled={!ticked.every(Boolean)} onClick={publish} className="kol-btn-normal px-5 py-2.5 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] flex items-center gap-2 disabled:opacity-40">
                  <Send className="w-4 h-4 text-[#FFBA00]" /> Ya la publiqué en la plataforma
                </button>
                {!ticked.every(Boolean) && <p className="text-[12px] text-[#6A6460]">Tildá todos los puntos para poder marcarla como publicada.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "resultados" && (
        <div className="space-y-6">
          {c.status !== "en_vivo" && c.status !== "cerrada" ? (
            <div className="p-5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13.5px] text-[#46413F]">Todavía no hay resultados: la campaña no está publicada. Cuando la publiques y la marques como publicada, acá cargás los números.</div>
          ) : (
            <>
              <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13px] text-[#161418]">
                <strong>Día {daysRunning} de la campaña.</strong>{" "}
                {daysRunning <= 3 ? "Todavía es temprano para decidir: las plataformas están aprendiendo y GA4 tarda 24 a 48 h en mostrar las consultas." : "Ya podés mirar el costo por consulta contra el tope que fijaste."}
                {c.publication?.platformCampaignId && <span className="block text-[12.5px] text-[#46413F] mt-1">ID en la plataforma: <code>{c.publication.platformCampaignId}</code></span>}
              </div>
              <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-3">
                <span className="font-bold text-[14px] block">Números (los cargás a mano desde Google Ads o Meta y GA4)</span>
                <p className="text-[12.5px] text-[#6A6460]">Cuando se conecte GA4, las consultas se van a leer solas con el nombre de campaña del UTM: <code>{utm.campaign}</code>.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([["Gasto (ARS)", spend, setSpend], ["Clics", clicks, setClicks], ["Consultas (lead_franquicia)", consultas, setConsultas]] as Array<[string, number | "", (v: number | "") => void]>).map(([l, v, setter]) => (
                    <div key={l}>
                      <label className="block text-[12.5px] font-bold mb-1">{l}</label>
                      <input type="number" min={0} value={v} onChange={(e) => setter(e.target.value === "" ? "" : Number(e.target.value))} className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] kol-focus" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <button type="button" onClick={saveResults} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[12.5px]">Guardar números</button>
                  {c.livePerformance && (
                    <span className="text-[12.5px] text-[#46413F]">
                      Último guardado: {c.livePerformance.updatedAt} · gasto {formatMoney(c.livePerformance.spend)} de un tope de {formatMoney(c.budget.totalCap)} · costo por consulta {c.livePerformance.consultas > 0 ? formatMoney(c.livePerformance.costPerConsulta) : "—"}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
          <div className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] space-y-2">
            <label className="font-bold text-[14px] block" htmlFor="learn">Qué aprendimos</label>
            <textarea id="learn" rows={4} value={notes} onChange={(e) => { setNotes(e.target.value); setSavedNote(false); }} placeholder="Qué anuncio o palabra funcionó, qué cortaríamos, qué probaríamos en la próxima." className="w-full p-2.5 border border-[#8C8580] rounded-[6px] text-[13px] kol-focus" />
            <button type="button" onClick={() => { set({ learningsNotes: notes }); setSavedNote(true); }} className="kol-btn-normal px-4 py-2 bg-white border border-[#161418] text-[#161418] font-bold text-[12.5px]">Guardar aprendizaje</button>
            {savedNote && <span className="text-[12.5px] text-[#46413F] ml-3">Guardado.</span>}
          </div>
        </div>
      )}
    </div>
  );
};
