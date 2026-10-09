import React, { useState } from "react";
import { Plus, X, RefreshCw } from "lucide-react";
import { GoogleSearchAdPreview } from "./AdPreviews";
import { AdChecklist } from "./AdChecklist";
import { checkGoogleAd, GOOGLE_LIMITS, parseKeywords } from "./adChecks";
import { SITE_DOMAIN } from "../../data/initialMarketingData";

export interface GoogleAdFields {
  headlines: string[];
  descriptions: string[];
  displayPath: [string, string];
  sitelinks: Array<{ title: string; line1: string; line2: string }>;
  callouts: string[];
  keywordsText: string;
  negativeKeywordsText: string;
}

interface Props {
  value: GoogleAdFields;
  onChange: (patch: Partial<GoogleAdFields>) => void;
  readOnly?: boolean;
}

const L = GOOGLE_LIMITS;

const Field: React.FC<{
  label?: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  disabled?: boolean;
  textarea?: boolean;
  placeholder?: string;
  onRemove?: () => void;
}> = ({ label, value, max, onChange, disabled, textarea, placeholder, onRemove }) => {
  const over = value.length > max;
  const cls = `w-full px-3 border rounded-[6px] text-[13px] text-[#161418] bg-white kol-focus disabled:bg-[#F3F0ED] ${
    over ? "border-[#A40F5F] ring-1 ring-[#A40F5F]" : "border-[#8C8580]"
  }`;
  return (
    <div>
      <div className="flex justify-between items-center text-[12px] mb-1">
        {label ? <span className="font-bold text-[#46413F]">{label}</span> : <span />}
        <span className={`tabular-nums ${over ? "text-[#A40F5F] font-bold" : "text-[#8C8580]"}`}>
          {value.length} / {max}
        </span>
      </div>
      <div className="flex gap-2">
        {textarea ? (
          <textarea rows={2} disabled={disabled} value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} className={`${cls} py-2`} />
        ) : (
          <input type="text" disabled={disabled} value={value} placeholder={placeholder} aria-label={label} onChange={(e) => onChange(e.target.value)} className={`${cls} h-[38px]`} />
        )}
        {onRemove && !disabled && (
          <button type="button" onClick={onRemove} aria-label={`Quitar ${label || "texto"}`} className="px-2 text-[#6A6460] hover:text-[#161418] kol-focus">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const GoogleSearchAdEditor: React.FC<Props> = ({ value, onChange, readOnly }) => {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [seed, setSeed] = useState(0);
  const checks = checkGoogleAd(value);
  const kws = parseKeywords(value.keywordsText);
  const nF = kws.filter((k) => k.matchType === "phrase").length;
  const nE = kws.filter((k) => k.matchType === "exact").length;

  const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));
  const sl = [...value.sitelinks];
  while (sl.length < 4) sl.push({ title: "", line1: "", line2: "" });
  const co = [...value.callouts];
  while (co.length < 4) co.push("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Títulos (hasta {L.maxHeadlines}, {L.headline} caracteres cada uno, mínimo 3)</span>
          {value.headlines.map((h, i) => (
            <Field
              key={i}
              label={`Título ${i + 1}`}
              value={h}
              max={L.headline}
              disabled={readOnly}
              onChange={(v) => onChange({ headlines: setAt(value.headlines, i, v) })}
              onRemove={value.headlines.length > 3 ? () => onChange({ headlines: value.headlines.filter((_, j) => j !== i) }) : undefined}
            />
          ))}
          {!readOnly && value.headlines.length < L.maxHeadlines && (
            <button type="button" onClick={() => onChange({ headlines: [...value.headlines, ""] })} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8C8580] rounded-[8px] text-[12.5px] text-[#46413F] kol-focus">
              <Plus className="w-3.5 h-3.5" /> Agregar título
            </button>
          )}
        </div>

        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Descripciones (hasta {L.maxDescriptions}, {L.description} caracteres cada una, mínimo 2)</span>
          {value.descriptions.map((d, i) => (
            <Field
              key={i}
              label={`Descripción ${i + 1}`}
              value={d}
              max={L.description}
              textarea
              disabled={readOnly}
              onChange={(v) => onChange({ descriptions: setAt(value.descriptions, i, v) })}
              onRemove={value.descriptions.length > 2 ? () => onChange({ descriptions: value.descriptions.filter((_, j) => j !== i) }) : undefined}
            />
          ))}
          {!readOnly && value.descriptions.length < L.maxDescriptions && (
            <button type="button" onClick={() => onChange({ descriptions: [...value.descriptions, ""] })} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8C8580] rounded-[8px] text-[12.5px] text-[#46413F] kol-focus">
              <Plus className="w-3.5 h-3.5" /> Agregar descripción
            </button>
          )}
        </div>

        <div>
          <span className="font-bold text-[14px] text-[#161418] block mb-2">Ruta que se muestra después del dominio</span>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ruta 1" value={value.displayPath[0]} max={L.path} disabled={readOnly} onChange={(v) => onChange({ displayPath: [v, value.displayPath[1]] })} />
            <Field label="Ruta 2 (opcional)" value={value.displayPath[1]} max={L.path} disabled={readOnly} onChange={(v) => onChange({ displayPath: [value.displayPath[0], v] })} />
          </div>
          <p className="text-[11.5px] text-[#6A6460] mt-1">Es solo lo que se ve. La página real es la dirección final con UTM.</p>
        </div>

        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Enlaces de sitio (título {L.sitelinkTitle}, líneas {L.sitelinkLine})</span>
          {sl.map((s, i) => (
            <div key={i} className="space-y-1.5 p-3 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[8px]">
              <Field label={`Enlace ${i + 1}`} value={s.title} max={L.sitelinkTitle} disabled={readOnly} onChange={(v) => onChange({ sitelinks: setAt(sl, i, { ...s, title: v }) })} />
              <div className="grid grid-cols-2 gap-2">
                <Field value={s.line1} max={L.sitelinkLine} placeholder="Línea 1 (opcional)" disabled={readOnly} onChange={(v) => onChange({ sitelinks: setAt(sl, i, { ...s, line1: v }) })} />
                <Field value={s.line2} max={L.sitelinkLine} placeholder="Línea 2 (opcional)" disabled={readOnly} onChange={(v) => onChange({ sitelinks: setAt(sl, i, { ...s, line2: v }) })} />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Destacados (hasta {L.callout} caracteres)</span>
          <div className="grid grid-cols-2 gap-3">
            {co.map((c, i) => (
              <Field key={i} value={c} max={L.callout} placeholder={`Destacado ${i + 1}`} disabled={readOnly} onChange={(v) => onChange({ callouts: setAt(co, i, v) })} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="g-kw">
            Palabras clave (una por línea: "frase", [exacta], amplia)
          </label>
          <textarea
            id="g-kw"
            rows={5}
            disabled={readOnly}
            value={value.keywordsText}
            onChange={(e) => onChange({ keywordsText: e.target.value })}
            className="w-full p-2.5 border border-[#8C8580] rounded-[6px] text-[13px] font-mono kol-focus disabled:bg-[#F3F0ED]"
          />
          <p className="text-[11.5px] text-[#6A6460] mt-1 leading-relaxed">
            {kws.length} palabras clave: {nF} de frase, {nE} exactas, {kws.length - nF - nE} amplias. Frase: la búsqueda tiene que incluirla. Exacta: solo esa búsqueda o muy parecida.
            Amplia (sin símbolos): Google la muestra en búsquedas relacionadas y suele gastar más.
          </p>
          <label className="block text-[13px] font-bold text-[#161418] mt-3 mb-1" htmlFor="g-neg">Palabras que NO queremos (negativas, una por línea)</label>
          <textarea
            id="g-neg"
            rows={3}
            disabled={readOnly}
            value={value.negativeKeywordsText}
            onChange={(e) => onChange({ negativeKeywordsText: e.target.value })}
            placeholder="ej. gratis"
            className="w-full p-2.5 border border-[#8C8580] rounded-[6px] text-[13px] font-mono kol-focus disabled:bg-[#F3F0ED]"
          />
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4 self-start">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-bold text-[14px] text-[#161418]">Así se ve en Google (solo texto, sin imagen)</span>
          <div className="flex gap-2">
            <div role="group" aria-label="Dispositivo" className="inline-flex border border-[#8C8580] rounded-[8px] overflow-hidden">
              {([["desktop", "Computadora"], ["mobile", "Celular"]] as const).map(([v, t]) => (
                <button key={v} type="button" aria-pressed={device === v} onClick={() => setDevice(v)} className={`px-3 py-1.5 text-[12.5px] font-semibold kol-focus ${device === v ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#161418]"}`}>
                  {t}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSeed((s) => s + 1 + Math.floor(Math.random() * 5))} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#8C8580] rounded-[8px] text-[12.5px] font-semibold bg-white kol-focus">
              <RefreshCw className="w-3.5 h-3.5" /> Otra combinación
            </button>
          </div>
        </div>
        <GoogleSearchAdPreview
          domain={SITE_DOMAIN}
          path1={value.displayPath[0]}
          path2={value.displayPath[1]}
          headlines={value.headlines}
          descriptions={value.descriptions}
          sitelinks={value.sitelinks}
          callouts={value.callouts}
          device={device}
          seed={seed}
        />
        <p className="text-[12px] text-[#6A6460]">
          Google nunca muestra más de 3 títulos y 2 descripciones a la vez, y los combina distinto en cada búsqueda. Cuantas más opciones cargues, más puede probar.
        </p>
        <AdChecklist checks={checks} />
      </div>
    </div>
  );
};
