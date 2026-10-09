import React, { useState } from "react";
import { Upload } from "lucide-react";
import { MetaAdPreview } from "./AdPreviews";
import { AdChecklist } from "./AdChecklist";
import { checkMetaAd, META_PRIMARY_VISIBLE_CHARS } from "./adChecks";
import { SITE_DOMAIN } from "../../data/initialMarketingData";

export interface MetaAdFields {
  pageName: string;
  avatarTheme: "claro" | "oscuro";
  showSeal: boolean;
  sealVariant: "claro" | "oscuro";
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  mediaUrl: string;
}

interface Props {
  value: MetaAdFields;
  onChange: (patch: Partial<MetaAdFields>) => void;
  galleryImages: Array<{ id: string; name: string; url: string }>;
  onUploadPhoto?: (e: React.ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void) => void;
  readOnly?: boolean;
  defaultPlacement?: "instagram" | "facebook";
}

const inputCls =
  "w-full h-[38px] px-3 border border-[#8C8580] rounded-[6px] text-[13px] text-[#161418] bg-white kol-focus disabled:bg-[#F3F0ED]";

const Seg: React.FC<{ options: Array<[string, string]>; value: string; onPick: (v: string) => void; disabled?: boolean; label: string }> = ({
  options,
  value,
  onPick,
  disabled,
  label,
}) => (
  <div role="group" aria-label={label} className="inline-flex border border-[#8C8580] rounded-[8px] overflow-hidden">
    {options.map(([v, t]) => (
      <button
        key={v}
        type="button"
        disabled={disabled}
        aria-pressed={value === v}
        onClick={() => onPick(v)}
        className={`px-3 py-1.5 text-[12.5px] font-semibold kol-focus ${value === v ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#161418]"} disabled:opacity-60`}
      >
        {t}
      </button>
    ))}
  </div>
);

export const MetaAdEditor: React.FC<Props> = ({ value, onChange, galleryImages, onUploadPhoto, readOnly, defaultPlacement = "instagram" }) => {
  const [placement, setPlacement] = useState<"instagram" | "facebook">(defaultPlacement);
  const checks = checkMetaAd(value);
  const len = value.primaryText.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="meta-page">
            Nombre de la página o cuenta
          </label>
          <input id="meta-page" className={inputCls} disabled={readOnly} value={value.pageName} onChange={(e) => onChange({ pageName: e.target.value })} />
          <p className="text-[11.5px] text-[#6A6460] mt-1">
            Es el de la cuenta que publica, no se cambia por anuncio. A confirmar con Kol: usuario real de Instagram de franquicia.
          </p>
        </div>

        <div>
          <span className="block text-[13px] font-bold text-[#161418] mb-1">Foto de perfil (círculo con la hoja de KOL)</span>
          <Seg
            label="Foto de perfil"
            disabled={readOnly}
            value={value.avatarTheme}
            onPick={(v) => onChange({ avatarTheme: v as "claro" | "oscuro" })}
            options={[["claro", "Hoja sobre blanco"], ["oscuro", "Hoja sobre negro"]]}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[13px] font-bold text-[#161418]" htmlFor="meta-primary">Texto principal</label>
            <span className={`text-[12px] tabular-nums ${len > META_PRIMARY_VISIBLE_CHARS ? "text-[#6A6460] font-bold" : "text-[#8C8580]"}`}>
              {len} car. · se ven {META_PRIMARY_VISIBLE_CHARS} antes de “más”
            </span>
          </div>
          <textarea
            id="meta-primary"
            rows={4}
            disabled={readOnly}
            value={value.primaryText}
            onChange={(e) => onChange({ primaryText: e.target.value })}
            className="w-full p-2.5 border border-[#8C8580] rounded-[6px] text-[13px] text-[#161418] kol-focus disabled:bg-[#F3F0ED]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="meta-head">Título (se ve en Facebook, debajo de la imagen)</label>
          <input id="meta-head" className={inputCls} disabled={readOnly} value={value.headline} onChange={(e) => onChange({ headline: e.target.value })} />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="meta-desc">Descripción (solo Facebook)</label>
          <input id="meta-desc" className={inputCls} disabled={readOnly} value={value.description} onChange={(e) => onChange({ description: e.target.value })} />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#161418] mb-1" htmlFor="meta-cta">Botón</label>
          <select id="meta-cta" className={inputCls} disabled={readOnly} value={value.callToAction} onChange={(e) => onChange({ callToAction: e.target.value })}>
            <option>Más información</option>
            <option>Contactar</option>
            <option>Registrarte</option>
            <option>Enviar mensaje</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-[#161418]" htmlFor="meta-img">Imagen del anuncio</label>
          <select id="meta-img" className={inputCls} disabled={readOnly} value={value.mediaUrl} onChange={(e) => onChange({ mediaUrl: e.target.value })}>
            {galleryImages.map((g) => (
              <option key={g.id} value={g.url}>{g.name}</option>
            ))}
          </select>
          {!readOnly && onUploadPhoto && (
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#161418] text-[#FAF8F6] rounded-[8px] text-[12.5px] font-semibold cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Subir una imagen
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onUploadPhoto(e, (url) => onChange({ mediaUrl: url }))} />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-[13px] text-[#161418]">
              <input type="checkbox" disabled={readOnly} checked={value.showSeal} onChange={(e) => onChange({ showSeal: e.target.checked })} />
              Sello KOL FRANQUICIAS sobre la imagen
            </label>
            {value.showSeal && (
              <Seg
                label="Color del sello"
                disabled={readOnly}
                value={value.sealVariant}
                onPick={(v) => onChange({ sealVariant: v as "claro" | "oscuro" })}
                options={[["oscuro", "Blanco roto"], ["claro", "Negro"]]}
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="font-bold text-[14px] text-[#161418]">Así se ve en el feed</span>
          <Seg
            label="Plataforma"
            value={placement}
            onPick={(v) => setPlacement(v as "instagram" | "facebook")}
            options={[["instagram", "Instagram"], ["facebook", "Facebook"]]}
          />
        </div>
        <MetaAdPreview
          placement={placement}
          pageName={value.pageName}
          avatarTheme={value.avatarTheme}
          primaryText={value.primaryText}
          headline={value.headline}
          description={value.description}
          callToAction={value.callToAction}
          domain={SITE_DOMAIN}
          mediaUrl={value.mediaUrl}
          showSeal={value.showSeal}
          sealVariant={value.sealVariant}
        />
        <p className="text-[12px] text-[#6A6460] max-w-[420px] mx-auto text-center">
          {placement === "instagram"
            ? "En Instagram no se ven el título ni la descripción: se leen la imagen, el texto principal y el botón."
            : "En Facebook el texto va arriba de la imagen y se corta con “Ver más”; debajo se ven dominio, título y descripción."}
        </p>
        <AdChecklist checks={checks} />
      </div>
    </div>
  );
};
