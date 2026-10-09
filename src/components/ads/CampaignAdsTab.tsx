import React, { useState } from "react";
import { FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { MetaAdEditor, MetaAdFields } from "./MetaAdEditor";
import { GoogleSearchAdEditor, GoogleAdFields } from "./GoogleSearchAdEditor";
import { DisplayAdEditor, DisplayAdFields } from "./DisplayAdEditor";
import { parseKeywords, stringifyKeywords } from "./adChecks";
import { metaPlacementOf, todayISO } from "../campaigns/campaignModel";

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
    mediaAssetId: m.mediaAssetId,
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

export function displayFieldsFrom(c: FranchiseCampaignItem): DisplayAdFields {
  const d = c.displayAdData!;
  return {
    businessName: d.businessName,
    shortHeadlines: d.shortHeadlines,
    longHeadline: d.longHeadline,
    descriptions: d.descriptions,
    callToAction: d.callToAction,
    landscapeAssetId: d.landscapeAssetId,
    squareAssetId: d.squareAssetId,
    logoSquareAssetId: d.logoSquareAssetId,
    logoWideAssetId: d.logoWideAssetId,
  };
}

interface Props {
  campaign: FranchiseCampaignItem;
  assets: GalleryAsset[];
  onGoToFiles: () => void;
  onSaveCampaign: (c: FranchiseCampaignItem) => void;
}

/** Pestaña "Anuncios y creativos" de la ficha: editable en el lugar, con vista previa realista. */
export const CampaignAdsTab: React.FC<Props> = ({ campaign, assets, onGoToFiles, onSaveCampaign }) => {
  const [meta, setMeta] = useState<MetaAdFields | null>(campaign.platform === "meta_instagram" && campaign.metaAdData ? metaFieldsFrom(campaign) : null);
  const [google, setGoogle] = useState<GoogleAdFields | null>(campaign.platform === "google_search" && campaign.googleAdData ? googleFieldsFrom(campaign) : null);
  const [display, setDisplay] = useState<DisplayAdFields | null>(campaign.platform === "google_display" && campaign.displayAdData ? displayFieldsFrom(campaign) : null);
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const editable = EDITABLE.includes(campaign.status);

  const save = () => {
    const base = { ...campaign, updatedAt: todayISO() };
    if (meta && campaign.metaAdData) {
      onSaveCampaign({ ...base, metaAdData: { ...campaign.metaAdData, ...meta, mediaUrl: "" } });
    } else if (google && campaign.googleAdData) {
      onSaveCampaign({
        ...base,
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
    } else if (display && campaign.displayAdData) {
      onSaveCampaign({ ...base, displayAdData: { ...campaign.displayAdData, ...display } });
    }
    setDirty(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const discard = () => {
    if (campaign.platform === "meta_instagram" && campaign.metaAdData) setMeta(metaFieldsFrom(campaign));
    if (campaign.platform === "google_search" && campaign.googleAdData) setGoogle(googleFieldsFrom(campaign));
    if (campaign.platform === "google_display" && campaign.displayAdData) setDisplay(displayFieldsFrom(campaign));
    setDirty(false);
  };

  const backToDraft = () => onSaveCampaign({ ...campaign, status: "borrador", updatedAt: todayISO() });

  return (
    <div className="space-y-5">
      {editable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px]">
          <span className="text-[13px] text-[#46413F]" aria-live="polite">
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
          defaultPlacement={metaPlacementOf(campaign)}
          value={meta}
          readOnly={!editable}
          assets={assets}
          onGoToFiles={onGoToFiles}
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
      {display && (
        <DisplayAdEditor
          value={display}
          readOnly={!editable}
          assets={assets}
          onGoToFiles={onGoToFiles}
          onChange={(patch) => {
            setDisplay({ ...display, ...patch });
            setDirty(true);
          }}
        />
      )}
    </div>
  );
};
