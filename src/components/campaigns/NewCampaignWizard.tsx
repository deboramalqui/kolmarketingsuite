import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Check, Target, Search, Image as ImageIcon, Instagram } from "lucide-react";
import { CampaignAd, CampaignLifecycleMode, CampaignPlatform, FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { SITE_FRANQUICIA_URL, VERIFIED_BRAND_FACTS } from "../../data/initialMarketingData";
import { buildUtm, PLATFORM_INFO, todayISO, platformLabel, EMPTY_GEO, GeoValue, geoToLocations, hasGeoTarget } from "./campaignModel";
import { GeoTargeting } from "./GeoTargeting";
import { checkCampaign, hasErrors } from "./campaignChecks";
import { AdChecklist } from "../ads/AdChecklist";
import { AdVariantsEditor } from "../ads/AdVariantsEditor";
import { createDefaultAd } from "../ads/adDefaults";
import { useCopy } from "./useCopy";
import { CopyButton } from "./CopyButton";

interface Props {
  assets: GalleryAsset[];
  suggested?: boolean;
  onCancel: () => void;
  onGoToFiles: () => void;
  onSave: (c: FranchiseCampaignItem) => void;
}

const STEPS = ["Tipo y presupuesto", "Mensaje y anuncios", "Medición", "Revisión"];

export const NewCampaignWizard: React.FC<Props> = ({ assets, suggested, onCancel, onGoToFiles, onSave }) => {
  const { copiedKey, copy } = useCopy();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [chosen, setChosen] = useState<CampaignPlatform | null>(suggested ? "meta_instagram" : null);
  const platform: CampaignPlatform = chosen ?? "google_search";
  const newAds = (p: CampaignPlatform): CampaignAd[] => [createDefaultAd(p, `ad-${Date.now().toString(36)}`, "Anuncio A", "anuncio-a")];
  const [ads, setAds] = useState<CampaignAd[]>(() => (suggested ? newAds("meta_instagram") : []));
  const setPlatform = (p: CampaignPlatform) => {
    if (p !== chosen) setAds(newAds(p));
    setChosen(p);
  };
  const [placement, setPlacement] = useState<"instagram" | "facebook">("instagram");
  const [name, setName] = useState(suggested ? "Franquicia Nov · Instagram (prueba)" : "");
  const [mode, setMode] = useState<CampaignLifecycleMode>("prueba");
  const [start, setStart] = useState("2026-11-01");
  const [end, setEnd] = useState("2026-11-15");
  const [daily, setDaily] = useState<number | "">("");
  const [cap, setCap] = useState<number | "">("");
  const [maxCpa, setMaxCpa] = useState<number | "">("");
  const [geo, setGeo] = useState<GeoValue>(EMPTY_GEO);
  const locations = geoToLocations(geo);
  const [format, setFormat] = useState<"isla" | "estandar" | "ambos">("isla");
  const utm = useMemo(() => buildUtm(platform, name, ads[0]?.utmContent), [platform, name, ads]);

  const draft: FranchiseCampaignItem = useMemo(() => {
    const id = `cmp-${Date.now().toString(36)}`;
    return {
      id,
      name: name.trim() || "Campaña sin nombre",
      platform,
      mode,
      status: "borrador",
      createdAt: todayISO(),
      updatedAt: todayISO(),
      dates: { startDate: start, endDate: end || undefined },
      budget: { currency: "ARS", dailyBudget: Number(daily) || undefined, totalCap: Number(cap) || 0, maxCpaTarget: Number(maxCpa) || undefined },
      targetLocations: locations,
      geo,
      format,
      objective: "lead_franquicia",
      landingPageUrl: SITE_FRANQUICIA_URL,
      utmParams: { source: utm.source, medium: utm.medium, campaign: utm.campaign, term: utm.term, content: utm.content, finalUrlWithUtm: utm.finalUrl },
      ads: ads.map((a) => ({
        ...a,
        metaAdData: a.metaAdData ? { ...a.metaAdData, feedPlacement: placement === "facebook" ? "Facebook Feed" : "Instagram Feed & Explorar" } : undefined,
        googleAdData: a.googleAdData ? { ...a.googleAdData, finalUrlSuffix: buildUtm(platform, name, a.utmContent).suffix } : undefined,
        displayAdData: a.displayAdData ? { ...a.displayAdData, finalUrlSuffix: buildUtm(platform, name, a.utmContent).suffix } : undefined,
      })),
      approvalHistory: [],
      learningsNotes: "",
    };
  }, [name, platform, placement, mode, start, end, daily, cap, maxCpa, geo, format, utm, ads]);

  const checks = useMemo(() => checkCampaign(draft, assets), [draft, assets]);
  const step1Ok = !!chosen && name.trim().length > 0 && Number(cap) > 0 && hasGeoTarget(geo);
  const info = PLATFORM_INFO.find((p) => p.id === platform)!;

  const inputCls = "w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] bg-white kol-focus";
  const labelCls = "block text-[13px] font-bold text-[#161418] mb-1";

  const icon = (id: CampaignPlatform) => (id === "google_search" ? <Search className="w-5 h-5" /> : id === "google_display" ? <ImageIcon className="w-5 h-5" /> : <Instagram className="w-5 h-5" />);

  return (
    <div className="bg-white border border-[#C9C3BE] rounded-[14px] p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} aria-label="Cancelar y volver" className="p-1 text-[#46413F] hover:text-[#161418] kol-focus rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-kol-display font-extrabold text-[22px] text-[#161418]">Nueva campaña de franquicia</h2>
            <p className="text-[13px] text-[#46413F]">Paso {step} de 4 · Sin valores inventados: lo que no cargues queda vacío</p>
          </div>
        </div>
        <ol className="flex items-center gap-3 text-[12.5px]" aria-label="Pasos">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = step > n;
            const on = step === n;
            return (
              <li key={s} className={`flex items-center gap-1.5 ${on ? "font-bold text-[#161418]" : "text-[#8C8580]"}`} aria-current={on ? "step" : undefined}>
                <span className={`w-6 h-6 rounded-full grid place-items-center text-[12px] ${on ? "bg-[#161418] text-[#FAF8F6]" : done ? "bg-[#161418] text-[#FAF8F6]" : "bg-[#E7E3DF]"}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </span>
                <span className="hidden md:inline">{s}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <span className={labelCls}>¿Qué querés hacer?</span>
            <div role="radiogroup" aria-label="Tipo de campaña" className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PLATFORM_INFO.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={platform === p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`text-left p-4 rounded-[12px] border-2 kol-focus transition-colors ${platform === p.id ? "border-[#161418] bg-[#FAF8F6]" : "border-[#C9C3BE] bg-white hover:bg-[#FAF8F6]"}`}
                >
                  <div className="flex items-center gap-2 font-bold text-[15px] text-[#161418]">
                    {icon(p.id)} {p.label}
                    {platform === p.id && <Check className="w-4 h-4 ml-auto" />}
                  </div>
                  <p className="text-[12.5px] text-[#46413F] mt-2 leading-relaxed">{p.description}</p>
                </button>
              ))}
            </div>
            {platform === "meta_instagram" && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="text-[13px] text-[#46413F]">Empezar con la vista previa de:</span>
                <div role="group" aria-label="Ubicación" className="inline-flex border border-[#8C8580] rounded-[8px] overflow-hidden">
                  {(["instagram", "facebook"] as const).map((pl) => (
                    <button key={pl} type="button" aria-pressed={placement === pl} onClick={() => setPlacement(pl)} className={`px-3 py-1.5 text-[12.5px] font-semibold kol-focus ${placement === pl ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#161418]"}`}>
                      {pl === "instagram" ? "Instagram" : "Facebook"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!chosen && (
            <p className="text-[13px] text-[#6A6460] border border-dashed border-[#C9C3BE] rounded-[10px] p-4 bg-[#FAF8F6]">
              Elegí un tipo de campaña para seguir: después te pedimos el nombre, el presupuesto y dónde querés llegar.
            </p>
          )}

          {chosen && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className={labelCls} htmlFor="c-name">Nombre de la campaña</label>
                <input id="c-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Franquicia Nov · Búsqueda Google (Santa Fe y Córdoba)" />
                <p className="text-[11.5px] text-[#6A6460] mt-1">Es el nombre que va a llevar en Google o Meta y en el UTM: así sabés qué campaña trajo cada consulta.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="c-mode">Modo</label>
                  <select id="c-mode" className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as CampaignLifecycleMode)}>
                    <option value="prueba">Prueba (poco gasto, aprender)</option>
                    <option value="escala">Escala (ya sabemos qué funciona)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-format">Formato de local</label>
                  <select id="c-format" className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as "isla" | "estandar" | "ambos")}>
                    <option value="isla">Isla</option>
                    <option value="estandar">Estándar</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-start">Empieza</label>
                  <input id="c-start" type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-end">Termina</label>
                  <input id="c-end" type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-daily">Presupuesto diario (ARS)</label>
                  <input id="c-daily" type="number" min={0} className={inputCls} value={daily} onChange={(e) => setDaily(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Lo define Kol" />
                </div>
                <div>
                  <label className={labelCls} htmlFor="c-cap">Tope total de gasto (ARS) *</label>
                  <input id="c-cap" type="number" min={0} className={inputCls} value={cap} onChange={(e) => setCap(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Obligatorio" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="c-cpa">Costo máximo aceptable por consulta (ARS, opcional)</label>
                  <input id="c-cpa" type="number" min={0} className={inputCls} value={maxCpa} onChange={(e) => setMaxCpa(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Para saber cuándo cortar" />
                </div>
              </div>

              <GeoTargeting value={geo} onChange={setGeo} />
            </div>

            <aside className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[12px] space-y-3 h-fit">
              <span className="text-[12px] font-bold uppercase tracking-wide text-[#8C8580]">Resumen</span>
              <div className="text-[13px] space-y-2">
                <div className="flex justify-between gap-3"><span className="text-[#46413F]">Objetivo único</span><strong className="font-mono">lead_franquicia</strong></div>
                <div className="flex justify-between gap-3"><span className="text-[#46413F]">Tipo</span><strong>{info.label}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-[#46413F]">Moneda</span><strong>Pesos argentinos</strong></div>
                <div className="flex justify-between gap-3"><span className="text-[#46413F]">Tope total</span><strong className="tabular-nums">{cap ? `$ ${Number(cap).toLocaleString("es-AR")}` : "—"}</strong></div>
                <div className="flex justify-between gap-3"><span className="text-[#46413F]">Dónde</span><strong className="text-right">{hasGeoTarget(geo) ? locations.join(", ") : "—"}</strong></div>
              </div>
              <p className="text-[12px] text-[#46413F] bg-white border border-[#E7E3DF] rounded-[8px] p-2.5 leading-relaxed">
                <Target className="inline w-3.5 h-3.5 mr-1" />
                Solo se mide <strong>lead_franquicia</strong> (el envío del formulario de franquicia). No se usa <code>generate_lead</code> ni <code>purchase</code>, que mezclan la tienda.
              </p>
            </aside>
          </div>
          )}

          {chosen && (
          <div className="flex justify-end pt-2">
            <button type="button" disabled={!step1Ok} onClick={() => setStep(2)} className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] disabled:opacity-40 flex items-center gap-2">
              Siguiente: Mensaje y anuncios <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          )}
          {chosen && !step1Ok && <p className="text-[12px] text-[#6A6460] text-right">Faltan: {[!name.trim() && "el nombre", !(Number(cap) > 0) && "el tope total", !hasGeoTarget(geo) && "dónde querés llegar"].filter(Boolean).join(", ")}.</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-2">
            <span className="text-[12px] font-bold text-[#161418] block">Datos verificados para copiar (la fuente de verdad)</span>
            <div className="flex flex-wrap gap-2">
              {VERIFIED_BRAND_FACTS.map((f) => (
                <button key={f.id} type="button" title={f.rule} onClick={() => copy(f.text, `w-${f.id}`)} className="px-2.5 py-1 bg-white border border-[#C9C3BE] hover:border-[#161418] rounded-[6px] text-[12px] text-[#161418] font-bold kol-focus">
                  {copiedKey === `w-${f.id}` ? "Copiado" : `Copiar: ${f.label}`}
                </button>
              ))}
            </div>
          </div>
          <AdVariantsEditor platform={platform} ads={ads} assets={assets} onGoToFiles={onGoToFiles} defaultPlacement={placement} onChange={setAds} />
          <div className="flex justify-between border-t border-[#C9C3BE] pt-4">
            <button type="button" onClick={() => setStep(1)} className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]">← Volver al paso 1</button>
            <button type="button" onClick={() => setStep(3)} className="kol-btn-normal px-6 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] flex items-center gap-2">Siguiente: Medición <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px]">
            <div className="flex items-center gap-2 font-bold text-[14px] text-[#161418]"><Target className="w-4 h-4" /> Los UTM se arman solos, según la guía de etiquetado</div>
            <p className="text-[13px] text-[#46413F] mt-1">En minúsculas, sin tildes ni espacios. Así cada consulta llega al mail y a GA4 con su campaña, y después se sabe qué anuncio la trajo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-[13px]">
              {[["utm_source", utm.source], ["utm_medium", utm.medium], ["utm_campaign", utm.campaign], ...(utm.term ? [["utm_term", utm.term]] : []), ["utm_content", utm.content]].map(([k, v]) => (
                <div key={k} className="p-2.5 bg-white border border-[#C9C3BE] rounded-[6px] flex justify-between gap-3">
                  <span className="text-[#8C8580]">{k}</span>
                  <strong className="font-mono text-[#161418] break-all text-right">{v}</strong>
                </div>
              ))}
              <p className="text-[11.5px] text-[#6A6460]">Lo que está entre llaves ({"{ }"}) lo reemplaza la plataforma al publicar el anuncio.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2.5">
                <span className="text-[12px] font-bold text-[#46413F] block">Enlace de cada anuncio</span>
                {ads.map((ad) => {
                  const u = buildUtm(platform, name, ad.utmContent);
                  return (
                    <div key={ad.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[#161418] font-bold">{ad.label}</span>
                        <CopyButton text={u.finalUrl} id={`w-url-${ad.id}`} copiedKey={copiedKey} onCopy={copy} />
                      </div>
                      <div className="p-2.5 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[6px] text-[12px] font-mono break-all text-[#161418]">{u.finalUrl}</div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-[#2A2629] text-[#FAF8F6] rounded-[10px] space-y-2 font-mono text-[12px]">
                <div className="font-bold">Así llega el origen en el mail de cada consulta (ejemplo)</div>
                <div className="border-t border-[#46413F] pt-2 text-[#C9C3BE]">
                  <div>ORIGEN DEL CONTACTO</div>
                  <div>Campaña: {utm.campaign}</div>
                  <div>Fuente: {utm.source} · {utm.medium}</div>
                  <div>Página de entrada: /franquicia/</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-[#C9C3BE] pt-4">
            <button type="button" onClick={() => setStep(2)} className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]">← Volver al paso 2</button>
            <button type="button" onClick={() => setStep(4)} className="kol-btn-normal px-6 py-2 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] flex items-center gap-2">Siguiente: Revisión <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 max-w-3xl">
          <div className="space-y-2 p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[13px]">
            {[["Nombre", draft.name], ["Tipo", platformLabel(draft)], ["Anuncios", ads.map((a) => a.label).join(", ")], ["Modo", draft.mode], ["Fechas", `${draft.dates.startDate} al ${draft.dates.endDate || "sin corte"}`], ["Tope total", `$ ${draft.budget.totalCap.toLocaleString("es-AR")} (ARS)`], ["Dónde", draft.targetLocations.join(", ")], ["Excluye", (draft.geo?.excluded ?? []).join(", ") || "Nada"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-[#E7E3DF] pb-1.5 last:border-0"><span className="text-[#46413F]">{k}</span><strong className="text-right capitalize-first">{v}</strong></div>
            ))}
          </div>
          <AdChecklist checks={checks} />
          <p className="text-[12.5px] text-[#46413F]">
            Se guarda como <strong>borrador</strong>. {hasErrors(checks) ? "Hay puntos para corregir: podés guardar igual y arreglarlos después, pero no se puede pedir la revisión hasta que estén resueltos." : "Está todo en orden para pedir la revisión."} Publicar en Google o Meta se hace a mano con el paquete de publicación; esta herramienta no publica sola.
          </p>
          <div className="flex justify-between border-t border-[#C9C3BE] pt-4">
            <button type="button" onClick={() => setStep(3)} className="kol-btn-normal px-5 py-2 bg-[#FAF8F6] border border-[#C9C3BE] text-[#161418] font-bold text-[13px]">← Volver al paso 3</button>
            <button type="button" onClick={() => onSave(draft)} className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] font-bold text-[13px] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#FFBA00]" /> Guardar como borrador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
