import React, { useState } from "react";
import { CampaignAd, FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { AdVariantsEditor } from "./AdVariantsEditor";
import { getAds, metaPlacementOf, todayISO } from "../campaigns/campaignModel";
import { AssetActions } from "../campaigns/assetLibrary";

const EDITABLE: FranchiseCampaignItem["status"][] = ["idea", "borrador", "devuelta"];

interface Props {
  campaign: FranchiseCampaignItem;
  assets: GalleryAsset[];
  actions: AssetActions;
  onSaveCampaign: (c: FranchiseCampaignItem) => void;
}

/** Pestaña "Anuncios y creativos" de la ficha: varios anuncios, editables en el lugar, con vista previa realista. */
export const CampaignAdsTab: React.FC<Props> = ({ campaign, assets, actions, onSaveCampaign }) => {
  const [ads, setAds] = useState<CampaignAd[]>(() => getAds(campaign));
  const [dirty, setDirty] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const editable = EDITABLE.includes(campaign.status);

  const save = () => {
    onSaveCampaign({ ...campaign, ads, googleAdData: undefined, displayAdData: undefined, metaAdData: undefined, updatedAt: todayISO() });
    setDirty(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };
  const discard = () => {
    setAds(getAds(campaign));
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
            <button type="button" disabled={!dirty} onClick={discard} className="kol-btn-normal px-4 py-2 bg-white border border-[#C9C3BE] text-[#161418] text-[12px] font-bold disabled:opacity-40">Descartar</button>
            <button type="button" disabled={!dirty} onClick={save} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold disabled:opacity-40">Guardar cambios</button>
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
            <button type="button" onClick={backToDraft} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12px] font-bold">Volver a borrador para editar</button>
          )}
        </div>
      )}

      <AdVariantsEditor
        platform={campaign.platform}
        ads={ads}
        readOnly={!editable}
        assets={assets}
        actions={actions}
        defaultPlacement={metaPlacementOf(campaign)}
        onChange={(next) => {
          setAds(next);
          setDirty(true);
        }}
      />
    </div>
  );
};
