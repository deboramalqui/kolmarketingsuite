import React, { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { CampaignAd, CampaignPlatform, GalleryAsset } from "../../types/marketing";
import { MetaAdEditor, MetaAdFields } from "./MetaAdEditor";
import { GoogleSearchAdEditor, GoogleAdFields } from "./GoogleSearchAdEditor";
import { DisplayAdEditor, DisplayAdFields } from "./DisplayAdEditor";
import { parseKeywords, stringifyKeywords } from "./adChecks";
import { uniqueUtmContent } from "../campaigns/campaignModel";
import { AssetActions } from "../campaigns/assetLibrary";

/* ---- conversión entre el anuncio guardado y los campos del editor ---- */
const metaFields = (ad: CampaignAd): MetaAdFields => {
  const m = ad.metaAdData!;
  return {
    pageName: m.pageName ?? "kol.franquicias",
    avatarTheme: m.avatarTheme ?? "claro",
    showSeal: m.showSeal ?? true,
    sealVariant: m.sealVariant ?? "oscuro",
    primaryText: m.primaryText,
    headline: m.headline,
    description: m.description,
    callToAction: m.callToAction,
    mediaAssetId: m.mediaAssetId,
    format: m.format ?? "feed_1x1",
  };
};
const googleFields = (ad: CampaignAd): GoogleAdFields => {
  const g = ad.googleAdData!;
  return {
    headlines: g.headlines,
    descriptions: g.descriptions,
    displayPath: g.displayPath ?? ["franquicia", ""],
    sitelinks: g.sitelinks ?? [],
    callouts: g.callouts ?? [],
    keywordsText: stringifyKeywords(g.keywords),
    negativeKeywordsText: (g.negativeKeywords ?? []).join("\n"),
  };
};
const displayFields = (ad: CampaignAd): DisplayAdFields => ({ ...ad.displayAdData! });

const applyMeta = (ad: CampaignAd, f: MetaAdFields): CampaignAd => ({ ...ad, metaAdData: { ...ad.metaAdData!, ...f, mediaUrl: "" } });
const applyGoogle = (ad: CampaignAd, f: GoogleAdFields): CampaignAd => ({
  ...ad,
  googleAdData: {
    ...ad.googleAdData!,
    headlines: f.headlines,
    descriptions: f.descriptions,
    displayPath: f.displayPath,
    sitelinks: f.sitelinks,
    callouts: f.callouts,
    keywords: parseKeywords(f.keywordsText),
    negativeKeywords: f.negativeKeywordsText.split("\n").map((k) => k.trim()).filter(Boolean),
  },
});
const applyDisplay = (ad: CampaignAd, f: DisplayAdFields): CampaignAd => ({ ...ad, displayAdData: { ...ad.displayAdData!, ...f } });

interface Props {
  platform: CampaignPlatform;
  ads: CampaignAd[];
  onChange: (ads: CampaignAd[]) => void;
  assets: GalleryAsset[];
  readOnly?: boolean;
  actions?: AssetActions;
  defaultPlacement?: "instagram" | "facebook";
}

const MAX_ADS = 5;

/** Varios anuncios (variantes A, B, C) dentro de la misma campaña. Cada uno con su propio utm_content. */
export const AdVariantsEditor: React.FC<Props> = ({ platform, ads, onChange, assets, readOnly, actions, defaultPlacement }) => {
  const [activeId, setActiveId] = useState(ads[0]?.id);
  const index = Math.max(0, ads.findIndex((a) => a.id === activeId));
  const ad = ads[index];
  if (!ad) return null;

  const replace = (next: CampaignAd) => onChange(ads.map((a) => (a.id === next.id ? next : a)));

  const addVariant = () => {
    const used = ads.map((a) => a.label);
    let n = ads.length;
    let label = `Anuncio ${String.fromCharCode(65 + n)}`;
    while (used.includes(label)) label = `Anuncio ${String.fromCharCode(65 + ++n)}`;
    const copy: CampaignAd = JSON.parse(JSON.stringify(ad));
    copy.id = `ad-${Date.now().toString(36)}`;
    copy.label = label;
    copy.utmContent = uniqueUtmContent(label, ads.map((a) => a.utmContent));
    onChange([...ads, copy]);
    setActiveId(copy.id);
  };

  const removeActive = () => {
    if (ads.length <= 1) return;
    if (!window.confirm(`¿Quitar “${ad.label}”?`)) return;
    const next = ads.filter((a) => a.id !== ad.id);
    onChange(next);
    setActiveId(next[0].id);
  };

  const rename = (label: string) =>
    replace({ ...ad, label, utmContent: uniqueUtmContent(label, ads.filter((a) => a.id !== ad.id).map((a) => a.utmContent)) });

  return (
    <div className="space-y-5">
      <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="font-bold text-[14px] text-[#161418]">Anuncios de esta campaña</span>
            <p className="text-[12.5px] text-[#46413F] mt-0.5">Cargá 2 o 3 versiones del mismo anuncio y dejalas correr unos días: después cortás la que menos consultas trae.</p>
          </div>
          {!readOnly && ads.length < MAX_ADS && (
            <button type="button" onClick={addVariant} className="kol-btn-normal px-3.5 py-2 bg-white border border-[#161418] text-[#161418] text-[12.5px] font-bold flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Agregar otra versión (copia de {ad.label})
            </button>
          )}
        </div>
        <div role="tablist" aria-label="Anuncios" className="flex flex-wrap gap-2">
          {ads.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={a.id === ad.id} onClick={() => setActiveId(a.id)} className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-bold border kol-focus ${a.id === ad.id ? "bg-[#161418] text-[#FAF8F6] border-[#161418]" : "bg-white text-[#161418] border-[#C9C3BE] hover:bg-[#F3F0ED]"}`}>
              {a.label}
            </button>
          ))}
          {!readOnly && ads.length < MAX_ADS && (
            <button type="button" onClick={addVariant} aria-label="Agregar otra versión" className="px-2.5 py-1.5 rounded-[8px] border border-dashed border-[#8C8580] text-[#46413F] kol-focus">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-[12px] font-bold text-[#46413F] mb-1" htmlFor="ad-label">Nombre del anuncio</label>
            <input id="ad-label" disabled={readOnly} value={ad.label} onChange={(e) => rename(e.target.value)} className="h-[34px] px-2.5 border border-[#8C8580] rounded-[6px] text-[13px] bg-white kol-focus disabled:bg-[#F3F0ED]" />
          </div>
          <div className="text-[12px] text-[#46413F] pb-1.5">
            En GA4 aparece como <code className="bg-white border border-[#E7E3DF] px-1.5 py-0.5 rounded">utm_content={ad.utmContent}</code>
          </div>
          {!readOnly && ads.length > 1 && (
            <button type="button" onClick={removeActive} className="ml-auto text-[12px] text-[#6A6460] hover:text-[#A40F5F] flex items-center gap-1 pb-1.5 kol-focus rounded">
              <Trash2 className="w-3.5 h-3.5" /> Quitar este anuncio
            </button>
          )}
        </div>
      </div>

      {platform === "meta_instagram" && ad.metaAdData && (
        <MetaAdEditor key={ad.id} defaultPlacement={defaultPlacement} value={metaFields(ad)} readOnly={readOnly} assets={assets} actions={actions} onChange={(p) => replace(applyMeta(ad, { ...metaFields(ad), ...p }))} />
      )}
      {platform === "google_search" && ad.googleAdData && (
        <GoogleSearchAdEditor
          key={ad.id}
          value={googleFields(ad)}
          readOnly={readOnly}
          showKeywords={index === 0}
          onChange={(p) => {
            const next = applyGoogle(ad, { ...googleFields(ad), ...p });
            if (index === 0 && (p.keywordsText !== undefined || p.negativeKeywordsText !== undefined)) {
              // las palabras clave son del grupo: se copian a las demás versiones para mantenerlas iguales
              onChange(ads.map((a, i) => (i === 0 ? next : { ...a, googleAdData: { ...a.googleAdData!, keywords: next.googleAdData!.keywords, negativeKeywords: next.googleAdData!.negativeKeywords } })));
            } else replace(next);
          }}
        />
      )}
      {platform === "google_display" && ad.displayAdData && (
        <DisplayAdEditor key={ad.id} value={displayFields(ad)} readOnly={readOnly} assets={assets} actions={actions} onChange={(p) => replace(applyDisplay(ad, { ...displayFields(ad), ...p }))} />
      )}
    </div>
  );
};
