import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { EMPTY_GEO, GeoScope, GeoValue, PLACES_WITH_STORES, PROVINCES, REGIONS } from "./campaignModel";

interface Props {
  value: GeoValue;
  onChange: (v: GeoValue) => void;
  disabled?: boolean;
}

const Chip: React.FC<{ label: string; onRemove?: () => void }> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold">
    {label}
    {onRemove && (
      <button type="button" onClick={onRemove} aria-label={`Quitar ${label}`} className="hover:text-[#FFBA00] kol-focus rounded">
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

const ListInput: React.FC<{ items: string[]; onChange: (v: string[]) => void; placeholder: string; label: string }> = ({ items, onChange, placeholder, label }) => {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (t && !items.includes(t)) onChange([...items, t]);
    setText("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          aria-label={label}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-[38px] px-3 border border-[#8C8580] rounded-[8px] text-[13px] text-[#161418] kol-focus"
        />
        <button type="button" onClick={add} className="px-3 h-[38px] bg-white border border-[#161418] rounded-[8px] text-[12.5px] font-bold flex items-center gap-1 kol-focus">
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((c) => (
            <Chip key={c} label={c} onRemove={() => onChange(items.filter((x) => x !== c))} />
          ))}
        </div>
      )}
    </div>
  );
};

const SCOPES: Array<{ id: GeoScope; title: string; text: string }> = [
  { id: "pais", title: "Toda Argentina", text: "La campaña llega a todo el país." },
  { id: "provincias", title: "Provincias o regiones", text: "Elegís provincias una por una o una región entera." },
  { id: "ciudades", title: "Ciudades puntuales", text: "Escribís las ciudades donde querés captar inversores." },
];

/** A quién queremos llegar: de dónde captar inversores. No tiene que ver con dónde ya hay locales. */
export const GeoTargeting: React.FC<Props> = ({ value, onChange, disabled }) => {
  const set = (patch: Partial<GeoValue>) => onChange({ ...EMPTY_GEO, ...value, ...patch });
  const toggleProv = (p: string) => set({ provinces: value.provinces.includes(p) ? value.provinces.filter((x) => x !== p) : [...value.provinces, p] });
  const regionOn = (ids: string[]) => ids.every((p) => value.provinces.includes(p));
  const toggleRegion = (ids: string[]) =>
    set({ provinces: regionOn(ids) ? value.provinces.filter((p) => !ids.includes(p)) : Array.from(new Set([...value.provinces, ...ids])) });

  return (
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="text-[13px] font-bold text-[#161418] mb-1">¿Dónde querés captar inversores?</legend>
      <div role="radiogroup" aria-label="Alcance geográfico" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={value.scope === s.id}
            onClick={() => set({ scope: s.id })}
            className={`text-left p-3 rounded-[10px] border-2 kol-focus ${value.scope === s.id ? "border-[#161418] bg-[#FAF8F6]" : "border-[#C9C3BE] bg-white hover:bg-[#FAF8F6]"}`}
          >
            <div className="font-bold text-[13.5px] text-[#161418]">{s.title}</div>
            <div className="text-[12px] text-[#46413F] mt-1">{s.text}</div>
          </button>
        ))}
      </div>

      {value.scope === "provincias" && (
        <div className="space-y-3">
          <div>
            <span className="text-[12px] font-bold text-[#46413F] block mb-1.5">Regiones (atajo: marca todas sus provincias)</span>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button key={r.id} type="button" aria-pressed={regionOn(r.provinces)} onClick={() => toggleRegion(r.provinces)} className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold border kol-focus ${regionOn(r.provinces) ? "bg-[#161418] text-[#FAF8F6] border-[#161418]" : "bg-white text-[#161418] border-[#C9C3BE]"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[12px] font-bold text-[#46413F] block mb-1.5">Provincias</span>
            <div className="flex flex-wrap gap-1.5">
              {PROVINCES.map((p) => (
                <button key={p} type="button" aria-pressed={value.provinces.includes(p)} onClick={() => toggleProv(p)} className={`px-2.5 py-1 rounded-[8px] text-[12.5px] border kol-focus ${value.provinces.includes(p) ? "bg-[#161418] text-[#FAF8F6] border-[#161418] font-bold" : "bg-white text-[#161418] border-[#C9C3BE]"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {value.scope === "ciudades" && (
        <div className="space-y-1.5">
          <ListInput items={value.cities} onChange={(cities) => set({ cities })} label="Ciudad" placeholder="Escribí una ciudad y tocá Enter (ej. Rosario, Santa Fe)" />
          <p className="text-[11.5px] text-[#6A6460]">Escribilas como las busca la plataforma, con la provincia si hay otra ciudad con el mismo nombre.</p>
        </div>
      )}

      <details className="border border-[#E7E3DF] rounded-[10px] p-3 bg-[#FAF8F6]" open={value.excluded.length > 0}>
        <summary className="cursor-pointer text-[13px] font-bold text-[#161418]">Excluir lugares (opcional)</summary>
        <div className="mt-3 space-y-3">
          <p className="text-[12.5px] text-[#46413F]">Para no mostrar el anuncio en lugares donde no querés captar inversores. Por ejemplo, donde Kol ya tiene locales:</p>
          <div className="flex flex-wrap gap-2">
            {PLACES_WITH_STORES.map((p) => (
              <button key={p} type="button" aria-pressed={value.excluded.includes(p)} onClick={() => set({ excluded: value.excluded.includes(p) ? value.excluded.filter((x) => x !== p) : [...value.excluded, p] })} className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-bold border kol-focus ${value.excluded.includes(p) ? "bg-[#161418] text-[#FAF8F6] border-[#161418]" : "bg-white text-[#161418] border-[#C9C3BE]"}`}>
                {value.excluded.includes(p) ? "✓ " : "+ "}
                {p}
              </button>
            ))}
          </div>
          <ListInput items={value.excluded.filter((e) => !PLACES_WITH_STORES.includes(e))} onChange={(extra) => set({ excluded: [...value.excluded.filter((e) => PLACES_WITH_STORES.includes(e)), ...extra] })} label="Lugar a excluir" placeholder="Otro lugar a excluir" />
        </div>
      </details>
    </fieldset>
  );
};
