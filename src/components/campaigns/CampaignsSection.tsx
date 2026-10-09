import React, { useCallback, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { FranchiseCampaignItem, GalleryAsset } from "../../types/marketing";
import { loadAssets, saveAssets, fileToAsset, AssetActions } from "./assetLibrary";
import { CampaignList } from "./CampaignList";
import { NewCampaignWizard } from "./NewCampaignWizard";
import { CampaignDetail } from "./CampaignDetail";
import { DataAndFilesView } from "./DataAndFilesView";
import { normalizeCampaign, loadEventStatus, saveEventStatus, EventStatus } from "./campaignModel";
import { buildDemoCampaigns, buildSampleCampaigns, isDemoCampaign, isSampleCampaign } from "./sampleCampaigns";

interface Props {
  franchiseCampaigns: FranchiseCampaignItem[];
  onSaveCampaign: (c: FranchiseCampaignItem) => void;
  onDeleteCampaign: (id: string) => void;
}

type Sub = "campanas" | "datos";

export const CampaignsSection: React.FC<Props> = ({ franchiseCampaigns, onSaveCampaign, onDeleteCampaign }) => {
  const [sub, setSub] = useState<Sub>("campanas");
  const [creating, setCreating] = useState(false);
  const [suggested, setSuggested] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<"resumen" | "anuncios" | "paquete">("resumen");
  const [assets, setAssets] = useState<GalleryAsset[]>(() => loadAssets());
  const [events, setEvents] = useState<EventStatus>(() => loadEventStatus());
  const updateEvents = (next: EventStatus) => {
    setEvents(next);
    saveEventStatus(next);
  };

  const campaigns = franchiseCampaigns.map(normalizeCampaign);
  const selected = campaigns.find((c) => c.id === selectedId);

  const assetsRef = useRef<GalleryAsset[]>(assets);
  assetsRef.current = assets;
  const updateAssets = useCallback((next: GalleryAsset[]) => {
    setAssets(next);
    return saveAssets(next);
  }, []);

  // Subir o ajustar imágenes sin salir de lo que se está haciendo
  const actions: AssetActions = {
    add: async (file, kind) => {
      const asset = await fileToAsset(file, kind);
      const next = [asset, ...assetsRef.current];
      const saved = saveAssets(next);
      assetsRef.current = next;
      setAssets(next);
      return { asset, saved };
    },
    update: (id, patch) => {
      const next = assetsRef.current.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveAssets(next);
      assetsRef.current = next;
      setAssets(next);
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div>
          <h1 className="font-kol-display font-extrabold text-[24px] sm:text-[28px] text-[#161418]">Campañas de franquicia</h1>
          <p className="text-[14px] text-[#46413F] mt-1 max-w-3xl">
            Armá, revisá y dejá listas las campañas de Google (Búsqueda y Display) y de Meta (Instagram y Facebook). Todo con los datos verificados de Kol.
          </p>
        </div>
        {sub === "campanas" && !creating && !selected && (
          <button type="button" onClick={() => { setSuggested(false); setCreating(true); }} className="kol-btn-normal px-5 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[13px] flex items-center gap-2 self-start md:self-auto">
            <Plus className="w-4 h-4 text-[#FFBA00]" /> Nueva campaña
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Secciones de campañas" className="flex gap-2">
        {([["campanas", "Campañas"], ["datos", "Datos y archivos"]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={sub === id} onClick={() => { setSub(id); }} className={`px-4 py-2 text-[13.5px] font-bold rounded-[8px] kol-focus ${sub === id ? "bg-[#161418] text-[#FAF8F6]" : "bg-white text-[#46413F] border border-[#C9C3BE] hover:bg-[#FAF8F6]"}`}>
            {label}
            {id === "datos" && <span className="ml-2 text-[11px] opacity-80">{assets.length}</span>}
          </button>
        ))}
      </div>

      {sub === "datos" && <DataAndFilesView assets={assets} onChange={updateAssets} events={events} onEventsChange={updateEvents} />}

      {creating && (
        <div hidden={sub !== "campanas"}>
        <NewCampaignWizard
          assets={assets}
          events={events}
          initiatives={Array.from(new Set(campaigns.map((c) => c.initiative).filter(Boolean) as string[]))}
          suggested={suggested}
          onCancel={() => setCreating(false)}
          actions={actions}
          onSave={(c) => {
            onSaveCampaign(c);
            setCreating(false);
            setSelectedId(c.id);
            setInitialTab("resumen");
          }}
        />
        </div>
      )}

      {sub === "campanas" && !creating && selected && (
        <CampaignDetail
          key={selected.id}
          campaign={selected}
          assets={assets}
          events={events}
          initialTab={initialTab}
          onBack={() => setSelectedId(null)}
          actions={actions}
          onSave={onSaveCampaign}
        />
      )}

      {sub === "campanas" && !creating && !selected && (
        <CampaignList
          campaigns={campaigns}
          onNew={() => { setSuggested(false); setCreating(true); }}
          onNewSuggested={() => { setSuggested(true); setCreating(true); }}
          onOpen={(id, tab) => { setSelectedId(id); setInitialTab(tab || "resumen"); }}
          onUpdate={onSaveCampaign}
          onDelete={onDeleteCampaign}
          hasSamples={campaigns.some(isSampleCampaign)}
          onLoadSamples={() => buildSampleCampaigns().filter((c) => !campaigns.some((x) => x.id === c.id)).forEach(onSaveCampaign)}
          hasDemo={campaigns.some(isDemoCampaign)}
          onLoadDemo={() => buildDemoCampaigns().filter((c) => !campaigns.some((x) => x.id === c.id)).forEach(onSaveCampaign)}
          onRemoveDemo={() => {
            if (window.confirm("¿Borrar la demo?")) campaigns.filter(isDemoCampaign).forEach((c) => onDeleteCampaign(c.id));
          }}
          onRemoveSamples={() => {
            if (window.confirm("¿Borrar las campañas de prueba?")) campaigns.filter(isSampleCampaign).forEach((c) => onDeleteCampaign(c.id));
          }}
        />
      )}
    </div>
  );
};
