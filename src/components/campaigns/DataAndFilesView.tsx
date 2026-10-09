import React, { useRef, useState } from "react";
import { ShieldCheck, Upload, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { GalleryAsset } from "../../types/marketing";
import { VERIFIED_BRAND_FACTS, VERIFIED_LOCATIONS, SITE_FRANQUICIA_URL } from "../../data/initialMarketingData";
import { assetFits, fileToAsset, META_FORMATS, ratioLabel } from "./assetLibrary";
import { useCopy } from "./useCopy";
import { CopyButton } from "./CopyButton";

interface Props {
  assets: GalleryAsset[];
  onChange: (next: GalleryAsset[]) => boolean;
}

const Fit: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-[4px] border ${ok ? "bg-white text-[#46413F] border-[#C9C3BE]" : "bg-[#F3F0ED] text-[#8C8580] border-[#E7E3DF] line-through"}`}>
    {ok && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
    {label}
  </span>
);

/** Datos que se toman como verdad para publicar + galería de fotos y logos */
export const DataAndFilesView: React.FC<Props> = ({ assets, onChange }) => {
  const { copiedKey, copy } = useCopy();
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null, kind: "foto" | "logo") => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const created: GalleryAsset[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        created.push(await fileToAsset(f, kind));
      }
      const ok = onChange([...created, ...assets]);
      if (!ok) setError("No se pudo guardar: el navegador se quedó sin espacio. Borrá imágenes que no uses o subí archivos más livianos.");
    } catch {
      setError("No se pudo leer alguna de las imágenes. Probá con otro archivo (JPG o PNG).");
    } finally {
      setBusy(false);
      if (photoInput.current) photoInput.current.value = "";
      if (logoInput.current) logoInput.current.value = "";
    }
  };

  const update = (id: string, patch: Partial<GalleryAsset>) => onChange(assets.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (a: GalleryAsset) => {
    if (window.confirm(`¿Borrar “${a.name}” de la galería? Las campañas que la usen van a quedar sin imagen.`)) onChange(assets.filter((x) => x.id !== a.id));
  };

  const extra = [
    { id: "ciudades", label: "Dónde ya hay locales", text: VERIFIED_LOCATIONS.join(", "), rule: "Sirve para tenerlo presente o para excluir esos lugares de una campaña. No se limita la campaña a estos lugares." },
    { id: "utm", label: "Convención de UTM", text: "minúsculas, sin tildes ni espacios, con guiones", rule: "Se arma sola al crear la campaña, según la guía de UTM." },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#161418]" />
          <h2 className="font-kol-display font-bold text-[18px] text-[#161418]">Datos verificados (la fuente de verdad)</h2>
        </div>
        <p className="text-[13px] text-[#46413F] max-w-3xl">
          Todo lo que se publica sale de acá. Copiá el texto exacto para pegarlo en un anuncio; el chequeo de cada campaña marca cualquier cifra que no coincida.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...VERIFIED_BRAND_FACTS, ...extra].map((f) => (
            <div key={f.id} className="p-4 bg-white border border-[#C9C3BE] rounded-[10px] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-bold text-[#8C8580] tracking-wide">{f.label}</span>
                  <CopyButton text={f.text} id={f.id} copiedKey={copiedKey} onCopy={copy} />
                </div>
                <p className="text-[14px] font-bold text-[#161418] mt-1.5 break-words">{f.text}</p>
              </div>
              <p className="text-[11.5px] text-[#46413F] bg-[#F3F0ED] p-2 rounded-[6px]">Regla: {f.rule}</p>
            </div>
          ))}
        </div>
        <div className="p-3 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[8px] flex items-center justify-between gap-3">
          <span className="text-[12.5px] text-[#46413F] break-all">Destino de todas las campañas: <strong>{SITE_FRANQUICIA_URL}</strong></span>
          <CopyButton text={SITE_FRANQUICIA_URL} id="dest" copiedKey={copiedKey} onCopy={copy} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-kol-display font-bold text-[18px] text-[#161418]">Galería de fotos y logos</h2>
            <p className="text-[13px] text-[#46413F] max-w-3xl mt-1">
              Subí acá las imágenes reales de Kol. Para usarlas en un anuncio hay que confirmar que tenemos permiso. Cada imagen muestra para qué espacios sirve.
            </p>
          </div>
          <div className="flex gap-2">
            <label className={`kol-btn-normal px-3.5 py-2 bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
              <Upload className="w-3.5 h-3.5" /> Subir fotos
              <input ref={photoInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files, "foto")} />
            </label>
            <label className={`kol-btn-normal px-3.5 py-2 bg-white border border-[#161418] text-[#161418] text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
              <Upload className="w-3.5 h-3.5" /> Subir logos
              <input ref={logoInput} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files, "logo")} />
            </label>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 bg-[#F3F0ED] border border-[#A40F5F] rounded-[8px] text-[13px] text-[#A40F5F] font-bold">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {assets.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-[#C9C3BE] rounded-[12px] bg-[#FAF8F6] text-[#46413F] text-[13.5px]">
            Todavía no hay imágenes. Subí fotos reales de los locales y el logo, así las podés elegir al armar los anuncios.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((a) => (
              <div key={a.id} className="bg-white border border-[#C9C3BE] rounded-[10px] overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-[#F3F0ED] grid place-items-center">
                  <img src={a.url} alt={a.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-3 space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Nombre de la imagen"
                      value={a.name}
                      onChange={(e) => update(a.id, { name: e.target.value })}
                      className="flex-1 min-w-0 h-[32px] px-2 border border-[#C9C3BE] rounded-[6px] text-[13px] font-bold text-[#161418] kol-focus"
                    />
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-[4px] bg-[#E7E3DF] text-[#46413F]">{a.kind === "foto" ? "Foto" : "Logo"}</span>
                  </div>
                  <div className="text-[12px] text-[#6A6460] tabular-nums">
                    {a.width}×{a.height} px · {ratioLabel(a)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.kind === "foto" ? (
                      <>
                        <Fit ok={assetFits(a, "landscape").ok} label="Display horizontal" />
                        <Fit ok={assetFits(a, "square").ok} label="Display cuadrada" />
                        {META_FORMATS.map((f) => (
                          <Fit key={f.id} ok={assetFits(a, f.slot).ok} label={`Meta ${f.ratio.replace(" / ", ":").replace("1.91", "1,91")}`} />
                        ))}
                      </>
                    ) : (
                      <>
                        <Fit ok={assetFits(a, "logoSquare").ok} label="Logo 1:1" />
                        <Fit ok={assetFits(a, "logoWide").ok} label="Logo 4:1" />
                      </>
                    )}
                  </div>
                  <label className="flex items-start gap-2 text-[12.5px] text-[#161418] cursor-pointer">
                    <input type="checkbox" checked={a.permission} onChange={(e) => update(a.id, { permission: e.target.checked })} className="mt-0.5" />
                    <span>Tenemos permiso para usarla en anuncios</span>
                  </label>
                </div>
                <div className="px-3 pb-3 flex justify-end">
                  <button type="button" onClick={() => remove(a)} className="text-[12px] text-[#6A6460] hover:text-[#A40F5F] flex items-center gap-1 kol-focus rounded">
                    <Trash2 className="w-3.5 h-3.5" /> Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11.5px] text-[#6A6460]">
          Las imágenes se guardan en este navegador (se reducen a un máximo de 1600 px para que entren). Más adelante van a guardarse en el servidor para que las vea todo el equipo.
        </p>
      </section>
    </div>
  );
};
