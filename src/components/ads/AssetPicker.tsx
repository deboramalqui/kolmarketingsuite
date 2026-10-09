import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { GalleryAsset } from "../../types/marketing";
import { Upload } from "lucide-react";
import { assetFits, AssetActions, AssetSlot, ratioLabel } from "../campaigns/assetLibrary";

interface Props {
  label: string;
  hint: string;
  slot: AssetSlot;
  kind: "foto" | "logo";
  assets: GalleryAsset[];
  value?: string;
  onChange: (assetId?: string) => void;
  disabled?: boolean;
  required?: boolean;
  actions?: AssetActions;
}

/** Elige una imagen de la galería y dice al instante si cumple lo que pide la plataforma. */
export const AssetPicker: React.FC<Props> = ({ label, hint, slot, kind, assets, value, onChange, disabled, required, actions }) => {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const upload = async (file?: File | null) => {
    if (!file || !actions) return;
    setBusy(true);
    setErr(null);
    try {
      const { asset, saved } = await actions.add(file, kind);
      onChange(asset.id);
      if (!saved) setErr("Se usa en esta pantalla, pero el navegador no tiene espacio para guardarla. Borrá imágenes que no uses.");
    } catch {
      setErr("No se pudo leer la imagen. Probá con un JPG o PNG.");
    } finally {
      setBusy(false);
    }
  };
  const options = assets.filter((a) => a.kind === kind);
  const chosen = assets.find((a) => a.id === value);
  const fit = chosen ? assetFits(chosen, slot) : undefined;
  return (
    <div className="p-3 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[10px] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-bold text-[#161418]" htmlFor={`pick-${slot}`}>
          {label}
          {required && <span className="text-[#A40F5F]"> *</span>}
        </label>
        <span className="text-[11.5px] text-[#6A6460]">{hint}</span>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-16 h-16 shrink-0 rounded-[8px] overflow-hidden bg-[#E7E3DF] border border-[#C9C3BE] grid place-items-center">
          {chosen ? <img src={chosen.url} alt="" className="w-full h-full object-contain bg-white" /> : <span className="text-[10px] text-[#6A6460] text-center px-1">Sin imagen</span>}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <select
            id={`pick-${slot}`}
            disabled={disabled}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full h-[36px] px-2.5 border border-[#8C8580] rounded-[6px] text-[13px] text-[#161418] bg-white kol-focus disabled:bg-[#F3F0ED]"
          >
            <option value="">{options.length ? "Elegir de la galería…" : "No hay imágenes de este tipo en la galería"}</option>
            {options.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.width}×{a.height} ({ratioLabel(a)})
              </option>
            ))}
          </select>
          {!disabled && actions && (
            <div className="flex flex-wrap items-center gap-3">
              <label className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#161418] rounded-[6px] text-[12px] font-bold cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
                <Upload className="w-3.5 h-3.5" /> {busy ? "Subiendo…" : kind === "logo" ? "Subir logo" : "Subir imagen"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {chosen && actions && (
                <label className="inline-flex items-center gap-1.5 text-[12px] text-[#161418] cursor-pointer">
                  <input type="checkbox" checked={chosen.permission} onChange={(e) => actions.update(chosen.id, { permission: e.target.checked })} />
                  Tenemos permiso para usarla en anuncios
                </label>
              )}
            </div>
          )}
          {err && <div role="alert" className="text-[12px] text-[#A40F5F] font-bold">{err}</div>}
          {chosen && fit && (
            <div className={`flex items-center gap-1.5 text-[12px] ${fit.ok ? "text-[#46413F]" : "text-[#A40F5F] font-bold"}`}>
              {fit.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{fit.reason}</span>
              {!chosen.permission && <span className="text-[#A40F5F] font-bold"> · sin permiso de uso</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
