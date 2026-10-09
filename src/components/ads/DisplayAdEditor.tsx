import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { GalleryAsset } from "../../types/marketing";
import { DisplayAdPreview } from "./DisplayAdPreview";
import { AdChecklist } from "./AdChecklist";
import { AssetPicker } from "./AssetPicker";
import { checkDisplayAd, DISPLAY_LIMITS, DisplayAssetState } from "./adChecks";
import { assetFits } from "../campaigns/assetLibrary";

export interface DisplayAdFields {
  businessName: string;
  shortHeadlines: string[];
  longHeadline: string;
  descriptions: string[];
  callToAction: string;
  landscapeAssetId?: string;
  squareAssetId?: string;
  logoSquareAssetId?: string;
  logoWideAssetId?: string;
}

interface Props {
  value: DisplayAdFields;
  onChange: (patch: Partial<DisplayAdFields>) => void;
  assets: GalleryAsset[];
  readOnly?: boolean;
  onGoToFiles?: () => void;
}

const L = DISPLAY_LIMITS;

export function displayAssetState(assets: GalleryAsset[], id: string | undefined, slot: "landscape" | "square" | "logoSquare"): DisplayAssetState {
  const a = assets.find((x) => x.id === id);
  if (!a) return { present: false, fitOk: false, fitReason: "", permission: false };
  const f = assetFits(a, slot);
  return { present: true, fitOk: f.ok, fitReason: f.reason, permission: a.permission };
}

const Field: React.FC<{
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  disabled?: boolean;
  textarea?: boolean;
  onRemove?: () => void;
}> = ({ label, value, max, onChange, disabled, textarea, onRemove }) => {
  const over = value.length > max;
  const cls = `w-full px-3 border rounded-[6px] text-[13px] text-[#161418] bg-white kol-focus disabled:bg-[#F3F0ED] ${
    over ? "border-[#A40F5F] ring-1 ring-[#A40F5F]" : "border-[#8C8580]"
  }`;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="font-bold text-[#46413F]">{label}</span>
        <span className={`tabular-nums ${over ? "text-[#A40F5F] font-bold" : "text-[#8C8580]"}`}>
          {value.length} / {max}
        </span>
      </div>
      <div className="flex gap-2">
        {textarea ? (
          <textarea rows={2} disabled={disabled} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)} className={`${cls} py-2`} />
        ) : (
          <input type="text" disabled={disabled} value={value} aria-label={label} onChange={(e) => onChange(e.target.value)} className={`${cls} h-[38px]`} />
        )}
        {onRemove && !disabled && (
          <button type="button" onClick={onRemove} aria-label={`Quitar ${label}`} className="px-2 text-[#6A6460] hover:text-[#161418] kol-focus">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const DisplayAdEditor: React.FC<Props> = ({ value, onChange, assets, readOnly, onGoToFiles }) => {
  const [format, setFormat] = useState<"nativo" | "rectangulo" | "banner">("nativo");
  const urlOf = (id?: string) => assets.find((a) => a.id === id)?.url;
  const setAt = (arr: string[], i: number, v: string) => arr.map((x, j) => (j === i ? v : x));

  const checks = checkDisplayAd({
    businessName: value.businessName,
    shortHeadlines: value.shortHeadlines,
    longHeadline: value.longHeadline,
    descriptions: value.descriptions,
    landscape: displayAssetState(assets, value.landscapeAssetId, "landscape"),
    square: displayAssetState(assets, value.squareAssetId, "square"),
    logoSquare: displayAssetState(assets, value.logoSquareAssetId, "logoSquare"),
  });

  const hs = value.shortHeadlines.filter((h) => h.trim());
  const ds = value.descriptions.filter((d) => d.trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-5">
        <div className="p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[12.5px] text-[#46413F] leading-relaxed">
          Es el <strong>anuncio de display adaptable</strong> de Google: cargás los textos, las imágenes y los logos, y Google arma solo las versiones para cada espacio.
          Por eso no hay una única vista previa: abajo ves tres aproximaciones.
        </div>

        <Field label="Nombre de la empresa" value={value.businessName} max={L.businessName} disabled={readOnly} onChange={(v) => onChange({ businessName: v })} />

        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Títulos cortos (de 1 a {L.maxShortHeadlines}, hasta {L.shortHeadline} caracteres)</span>
          {value.shortHeadlines.map((h, i) => (
            <Field
              key={i}
              label={`Título corto ${i + 1}`}
              value={h}
              max={L.shortHeadline}
              disabled={readOnly}
              onChange={(v) => onChange({ shortHeadlines: setAt(value.shortHeadlines, i, v) })}
              onRemove={value.shortHeadlines.length > 1 ? () => onChange({ shortHeadlines: value.shortHeadlines.filter((_, j) => j !== i) }) : undefined}
            />
          ))}
          {!readOnly && value.shortHeadlines.length < L.maxShortHeadlines && (
            <button type="button" onClick={() => onChange({ shortHeadlines: [...value.shortHeadlines, ""] })} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8C8580] rounded-[8px] text-[12.5px] text-[#46413F] kol-focus">
              <Plus className="w-3.5 h-3.5" /> Agregar título corto
            </button>
          )}
        </div>

        <Field label="Título largo" value={value.longHeadline} max={L.longHeadline} disabled={readOnly} onChange={(v) => onChange({ longHeadline: v })} />

        <div className="space-y-3">
          <span className="font-bold text-[14px] text-[#161418] block">Descripciones (de 1 a {L.maxDescriptions}, hasta {L.description} caracteres)</span>
          {value.descriptions.map((d, i) => (
            <Field
              key={i}
              label={`Descripción ${i + 1}`}
              value={d}
              max={L.description}
              textarea
              disabled={readOnly}
              onChange={(v) => onChange({ descriptions: setAt(value.descriptions, i, v) })}
              onRemove={value.descriptions.length > 1 ? () => onChange({ descriptions: value.descriptions.filter((_, j) => j !== i) }) : undefined}
            />
          ))}
          {!readOnly && value.descriptions.length < L.maxDescriptions && (
            <button type="button" onClick={() => onChange({ descriptions: [...value.descriptions, ""] })} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#8C8580] rounded-[8px] text-[12.5px] text-[#46413F] kol-focus">
              <Plus className="w-3.5 h-3.5" /> Agregar descripción
            </button>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="disp-cta">Botón</label>
          <select id="disp-cta" disabled={readOnly} value={value.callToAction} onChange={(e) => onChange({ callToAction: e.target.value })} className="w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] bg-white text-[#161418] kol-focus disabled:bg-[#F3F0ED]">
            <option>Automático</option>
            <option>Más información</option>
            <option>Contactar</option>
            <option>Registrarte</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[14px] text-[#161418]">Imágenes y logos (de la galería)</span>
            {onGoToFiles && (
              <button type="button" onClick={onGoToFiles} className="text-[12.5px] font-bold text-[#C51172] hover:underline">
                Subir imágenes en Datos y archivos →
              </button>
            )}
          </div>
          <AssetPicker label="Imagen horizontal" hint="1,91:1 · mín. 600×314 · recomendada 1200×628" slot="landscape" kind="foto" assets={assets} value={value.landscapeAssetId} onChange={(id) => onChange({ landscapeAssetId: id })} disabled={readOnly} required />
          <AssetPicker label="Imagen cuadrada" hint="1:1 · mín. 300×300" slot="square" kind="foto" assets={assets} value={value.squareAssetId} onChange={(id) => onChange({ squareAssetId: id })} disabled={readOnly} required />
          <AssetPicker label="Logo cuadrado" hint="1:1 · mín. 128×128 · recomendado 1200×1200" slot="logoSquare" kind="logo" assets={assets} value={value.logoSquareAssetId} onChange={(id) => onChange({ logoSquareAssetId: id })} disabled={readOnly} />
          <AssetPicker label="Logo horizontal" hint="4:1 · mín. 512×128 · recomendado 1200×300" slot="logoWide" kind="logo" assets={assets} value={value.logoWideAssetId} onChange={(id) => onChange({ logoWideAssetId: id })} disabled={readOnly} />
          <p className="text-[11.5px] text-[#6A6460]">Google acepta hasta 15 imágenes y 5 logos por anuncio. Acá se carga uno de cada tipo para empezar; las imágenes pesan hasta 5 MB.</p>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4 self-start">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-bold text-[14px] text-[#161418]">Así puede verse (aproximación)</span>
          <div role="group" aria-label="Formato" className="inline-flex border border-[#8C8580] rounded-[8px] overflow-hidden">
            {([["nativo", "Tarjeta"], ["rectangulo", "300×250"], ["banner", "728×90"]] as const).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={format === v} onClick={() => setFormat(v)} className={`px-3 py-1.5 text-[12.5px] font-semibold kol-focus ${format === v ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#161418]"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 bg-[#F3F0ED] border border-[#E7E3DF] rounded-[12px]">
          <DisplayAdPreview
            format={format}
            businessName={value.businessName}
            shortHeadline={hs[0] || ""}
            longHeadline={value.longHeadline}
            description={ds[0] || ""}
            callToAction={value.callToAction}
            landscapeUrl={urlOf(value.landscapeAssetId)}
            squareUrl={urlOf(value.squareAssetId)}
            logoUrl={urlOf(value.logoSquareAssetId)}
          />
        </div>
        <p className="text-[12px] text-[#6A6460]">
          Google combina tus textos e imágenes y decide qué mostrar según el sitio o la app. Lo que se ve acá es un ejemplo de tres espacios típicos, no una garantía de cómo saldrá.
        </p>
        <AdChecklist checks={checks} />
      </div>
    </div>
  );
};
