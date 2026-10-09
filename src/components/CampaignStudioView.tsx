import React from "react";
import { FranchiseCampaignItem } from "../types/marketing";
import { CampaignsSection } from "./campaigns/CampaignsSection";

interface CampaignStudioViewProps {
  franchiseCampaigns: FranchiseCampaignItem[];
  onSaveCampaign: (campaign: FranchiseCampaignItem) => void;
  onDeleteCampaign: (id: string) => void;
  // Props heredadas de versiones anteriores; la sección ya no las usa
  brandGuidelines?: unknown;
  clarityPages?: unknown;
}

/** Pestaña "Campañas": el contenido vive en src/components/campaigns/ */
export const CampaignStudioView: React.FC<CampaignStudioViewProps> = ({ franchiseCampaigns, onSaveCampaign, onDeleteCampaign }) => (
  <CampaignsSection franchiseCampaigns={franchiseCampaigns} onSaveCampaign={onSaveCampaign} onDeleteCampaign={onDeleteCampaign} />
);
