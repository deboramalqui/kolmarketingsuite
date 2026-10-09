import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { FranchiseCampaignItem } from "../../types/marketing";
import { applyGa4Rows, fetchGa4Rows, fetchGa4Status } from "./ga4Sync";

interface Props {
  campaigns: FranchiseCampaignItem[];
  onUpdate: (c: FranchiseCampaignItem) => void;
  label?: string;
}

/** Botón "Traer de GA4": actualiza los resultados de las campañas publicadas */
export const Ga4SyncBar: React.FC<Props> = ({ campaigns, onUpdate, label = "Actualizar resultados desde GA4" }) => {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const st = await fetchGa4Status(false);
      if (!st.configured) {
        setMsg({ ok: false, text: "GA4 todavía no está conectado. Las instrucciones están en Datos y archivos → Conexión con GA4." });
        return;
      }
      const rows = await fetchGa4Rows();
      let updated = 0;
      const missing: string[] = [];
      campaigns.forEach((c) => {
        const next = applyGa4Rows(c, rows);
        if (next) {
          onUpdate(next);
          updated++;
        } else missing.push(c.name);
      });
      setMsg({
        ok: updated > 0,
        text: updated
          ? `Listo: se actualizaron ${updated} campaña(s) con datos de GA4.${missing.length ? ` Sin datos todavía: ${missing.join(", ")} (GA4 tarda 24 a 48 h, o falta que lleguen visitas con ese UTM).` : ""}`
          : "GA4 no tiene visitas con los UTM de estas campañas todavía. GA4 tarda 24 a 48 h y hace falta que la campaña esté publicada con los parámetros del paquete.",
      });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No se pudo leer GA4." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={busy || campaigns.length === 0} className="kol-btn-normal px-4 py-2 bg-[#161418] text-[#FAF8F6] text-[12.5px] font-bold flex items-center gap-2 disabled:opacity-40">
        <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> {busy ? "Consultando GA4…" : label}
      </button>
      {msg && (
        <span role="status" className={`text-[12.5px] ${msg.ok ? "text-[#161418]" : "text-[#A40F5F] font-bold"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
};
