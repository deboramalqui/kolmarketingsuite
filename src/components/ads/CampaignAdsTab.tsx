import React, { useState } from "react";
import { FranchiseCampaignItem } from "../../types/marketing";
import { MetaAdEditor, MetaAdFields } from "./MetaAdEditor";
import { GoogleSearchAdEditor, GoogleAdFields } from "./GoogleSearchAdEditor";
import { parseKeywords, stringifyKeywords } from "./adChecks";

const EDITABLE: FranchiseCampaignItem["status"][] = ["idea", "borrador", "devuelta"];

export function metaFieldsFrom(c: FranchiseCampaignItem): MetaAdFields {
  const m = c.metaAdData!;
  return {
    pageName: m.pageName ?? "kol.franquicias",
    avatarTheme: m.avatarTheme ?? "claro",
    showSeal: m.showSeal ?? true,
    sealVariant: m.sealVariant ?? "oscuro",
    primaryText: m.primaryText,
    headline: m.headline,
    description: m.description,
    callToAction: m.callToAction,
    mediaUrl: m.mediaUrl,
  };
}

export function googleFieldsFrom(c: FranchiseCampaignItem): GoogleAdFields {
  const g = c.googleAdData!;
  return {
    headlines: g.headlines,
    descriptions: g.descriptions,
    displayPath: g.displayPath ?? ["franquicia", ""],
    sitelinks: g.sitelinks ?? [],
    callouts: g.callouts ?? [],
    keywordsText: stringifyKeywords(g.keywords),
    negativeKeywordsText: (g.negativeKeywords ?? []).join("\n"),
  };
}

interface Props {
  campaign: FranchiseCampaignItem;
  galleryImages: Array<{ id: string; name: string; url: string }>;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void) => void;
  onSaveCampaign: (c: FranchiseCampaignItem) => void;
}

/** Pestaña "Anuncios y creativos" de la ficha: editable en el lugar, con vista previa realista. */
export const CampaignAdsTab: React.FC<Props> = ({ campaign, galleryImages, onUploadPhoto, onSaveCampaign }) => {
  const isMeta = campaign.platform === "meta_instagram";
  const [meta, setMeta] = useState<MetaAdFields | null>(isMeta && campaign.metaAdData ? metaFieldsFrom(campaign) : null);
  const [google, setGoogle] = useState<GoogleAdFields | null>(!isMeta && campaign.googleAdData ? googleFieldsFrom(campaign) : null);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const editable = EDITABLE.includes(campaign.status);
  const today = new Date().toISOString().split("T")[0];

  const save = () => {
    if (meta && campaign.metaAdData) {
      onSaveCampaign({ ...campaign, updatedAt: today, metaAdData: { ...campaign.metaAdData, ...meta } });
    } else if (google && campaign.googleAdData) {
      onSaveCampaign({
        ...campaign,
        updatedAt: today,
        googleAdData: {
          ...campaign.googleAdData,
          headlines: google.headlines,
          descriptions: google.descriptions,
          displayPath: google.displayPath,
          sitelinks: google.sitelinks.filter((s) => s.title.trim()),
          callouts: google.callouts.filter((c) => c.trim()),
          keywords: parseKeywords(google.keywordsText),
          negativeKeywords: google.negativeKeywordsText.split("\n").map((k) => k.trim()).filter(Boolean),
        },
      });
    }
    setDirty(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const discard = () => {
    if (isMeta && campaign.metaAdData) setMeta(metaFieldsFrom(campaign));
    if (!isMeta && campaign.googleAdData) setGoogle(googleFieldsFrom(campaign));
    setDirty(false);
  };

  const backToDraft = () => onSaveCampaign({ ...campaign, status: "borrador", updatedAt: today });

  return (
    <div className="space-y-5">
      {editable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px]">
          <span className="text-[13px] text-[#46413F]">
            {dirty ? "Tenés cambios sin guardar." : savedMsg ? "Cambios guardados." : "Podés editar los anuncios acá: la vista previa cambia al instante."}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={!dirty} onClick={discard} className="kol-btn-normal px-4 py-2 bg-white border border-[#C9C3BE] text-[#161418] text-[12px] font-bold disabled:opacity-40">
              Descartar
            </button>
            <button type="button" disabled={!dirty} onClick={save} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold disabled:opacity-40">
              Guardar cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px]">
          <span className="text-[13px] text-[#46413F]">
            {campaign.status === "en_vivo" || campaign.status === "cerrada"
              ? "Esta campaña ya está publicada o cerrada: los cambios se hacen en la plataforma (Google Ads o Meta), no acá."
              : "Esta campaña está en revisión o aprobada. Para editarla hay que devolverla a borrador."}
          </span>
          {campaign.status !== "en_vivo" && campaign.status !== "cerrada" && (
            <button type="button" onClick={backToDraft} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold">
              Volver a borrador para editar
            </button>
          )}
        </div>
      )}

      {meta && (
        <MetaAdEditor
          value={meta}
          readOnly={!editable}
          galleryImages={galleryImages}
          onUploadPhoto={onUploadPhoto}
          onChange={(patch) => {
            setMeta({ ...meta, ...patch });
            setDirty(true);
          }}
        />
      )}
      {google && (
        <GoogleSearchAdEditor
          value={google}
          readOnly={!editable}
          onChange={(patch) => {
            setGoogle({ ...google, ...patch });
            setDirty(true);
          }}
        />
      )}
    </div>
  );
};
