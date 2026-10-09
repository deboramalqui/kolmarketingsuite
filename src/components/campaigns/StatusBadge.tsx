import React from "react";
import { CampaignLifecycleStatus } from "../../types/marketing";
import { statusLabel } from "./campaignModel";

const styles: Record<CampaignLifecycleStatus, string> = {
  idea: "bg-[#E7E3DF] text-[#46413F]",
  borrador: "bg-[#FAF8F6] text-[#161418] border border-[#C9C3BE]",
  en_revision: "bg-[#FFD9E4] text-[#161418] border border-[#C51172]/30",
  lista_para_publicar: "bg-[#161418] text-[#FAF8F6]",
  en_vivo: "bg-white text-[#161418] border-2 border-[#161418]",
  cerrada: "bg-[#E7E3DF] text-[#6A6460]",
  devuelta: "bg-[#F3F0ED] text-[#A40F5F] border border-[#A40F5F]",
};

export const StatusBadge: React.FC<{ status: CampaignLifecycleStatus }> = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold whitespace-nowrap ${styles[status]}`}>{statusLabel[status]}</span>
);
