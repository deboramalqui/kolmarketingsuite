import React, { useState } from "react";
import { ConnectedAccountsConfig } from "../types/marketing";
import {
  Check,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Server,
  Layers,
  Info,
  Globe,
  Radio,
  ExternalLink,
} from "lucide-react";

interface ConexionesViewProps {
  config: ConnectedAccountsConfig;
  onSaveConfig: (newConfig: ConnectedAccountsConfig) => void;
  onTriggerSync: () => Promise<void>;
  isSyncing: boolean;
  syncNotice: string | null;
}

export const ConexionesView: React.FC<ConexionesViewProps> = ({
  config,
  onSaveConfig,
  onTriggerSync,
  isSyncing,
  syncNotice,
}) => {
  const [formData, setFormData] = useState<ConnectedAccountsConfig>(config);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    try {
      await fetch("/api/accounts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSaveStatus("Configuración guardada en servidor y sincronizada para todo el equipo.");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch {
      setSaveStatus("Guardado en local (el servidor no respondió)");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div>
          <h2 className="font-kol-display font-extrabold text-[24px] leading-[30px] text-[#161418]">
            Centro de conexiones (KOL Marketing Suite)
          </h2>
          <p className="text-[14px] text-[#46413F] mt-1">
            Administración unificada de GA4, Search Console, Meta Ads y Clarity para el tablero de franquicias
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="kol-btn-normal px-5 py-2.5 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] flex items-center gap-2 font-bold whitespace-nowrap self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Actualizando todo..." : "Actualizar datos ahora"}</span>
        </button>
      </div>

      {saveStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-[10px] text-[14px] text-emerald-800 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {syncNotice && (
        <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-[14px] text-[#161418] font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-[#C51172] shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Google Analytics 4 */}
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                1. Google Analytics 4 (GA4)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#E7E3DF] text-[#161418] text-[12px] font-bold">
              Propiedad activa: 372010641
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Property ID de GA4
              </label>
              <input
                type="text"
                value={formData.gmpPropertyId}
                onChange={(e) =>
                  setFormData({ ...formData, gmpPropertyId: e.target.value })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] font-mono text-[#161418] kol-focus"
                placeholder="372010641"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Correo de cuenta Google asociada
              </label>
              <input
                type="email"
                value={formData.gmpAccountEmail}
                onChange={(e) =>
                  setFormData({ ...formData, gmpAccountEmail: e.target.value })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
                placeholder="marketing@kolfranquicias.com.ar"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F6] border border-[#E7E3DF] rounded-[8px] text-[13px] text-[#46413F] space-y-1">
            <p>
              <strong>Evento de conversión único configurado:</strong> <code className="bg-[#E7E3DF] px-1 rounded font-bold text-[#161418]">lead_franquicia</code>.
            </p>
            <p className="text-[12px] text-[#8C8580]">
              Cualquier otro evento como generate_lead (WhatsApp retail) o purchase no se computa para evitar distorsiones.
            </p>
          </div>
        </div>

        {/* 2. Google Search Console */}
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                2. Google Search Console
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#E7E3DF] text-[#161418] text-[12px] font-bold">
              kolaccesorios.com.ar
            </span>
          </div>

          <p className="text-[14px] text-[#46413F]">
            Mide consultas orgánicas y palabras clave que dirigen tráfico al hub de franquicias (<span className="font-mono">/franquicias</span>). Podés conectar vía API o subir las exportaciones periódicas en CSV desde la pantalla "Hoy" o "Fuentes".
          </p>
        </div>

        {/* 3. Meta Ads */}
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#8C8580]" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                3. Meta Ads (Campañas pagas)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#F3F0ED] text-[#46413F] text-[12px] font-bold">
              Inactivo · Se activa en noviembre
            </span>
          </div>

          <div className="p-3.5 bg-[#FFF9E6] border border-[#FFE699] rounded-[8px] text-[13px] text-[#996F00] leading-snug">
            <strong>Decisión del 5/10/2026:</strong> No se mide Meta por ahora. Se activa automáticamente con las campañas de franquicias en noviembre para no mezclar datos sin inversión.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-80">
            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Ad Account ID (precargado)
              </label>
              <input
                type="text"
                value={formData.metaAdAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, metaAdAccountId: e.target.value })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] font-mono text-[#161418] kol-focus"
                placeholder="act_1029384756"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Palabras clave para filtrar campañas
              </label>
              <input
                type="text"
                value={formData.metaAllowedCampaignKeywords.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaAllowedCampaignKeywords: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] text-[#161418] kol-focus"
                placeholder="franquicia, inversor"
              />
            </div>
          </div>
        </div>

        {/* 4. Microsoft Clarity */}
        <div className="p-6 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#C51172]" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                4. Microsoft Clarity (Mapas de calor y grabaciones)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#FFD9E4] text-[#161418] text-[12px] font-bold">
              Proyecto: ytmpieugg9
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Project ID de Clarity
              </label>
              <input
                type="text"
                value={formData.clarityProjectId}
                onChange={(e) =>
                  setFormData({ ...formData, clarityProjectId: e.target.value })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] font-mono text-[#161418] kol-focus"
                placeholder="ytmpieugg9"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#161418] mb-1">
                Token de Data Export (opcional para API)
              </label>
              <input
                type="password"
                value={formData.clarityApiToken || ""}
                onChange={(e) =>
                  setFormData({ ...formData, clarityApiToken: e.target.value })
                }
                className="w-full h-[40px] px-3 border border-[#8C8580] rounded-[8px] text-[14px] font-mono text-[#161418] kol-focus"
                placeholder="eyJhbGciOi..."
              />
            </div>
          </div>

          <p className="text-[13px] text-[#46413F]">
            El proyecto <span className="font-mono font-semibold">ytmpieugg9</span> está integrado en vivo con la propiedad GA4 <span className="font-mono font-semibold">372010641</span>. Las grabaciones de sesiones se pueden abrir filtradas directamente por página o por evento <code className="bg-[#E7E3DF] px-1 rounded">lead_franquicia</code>.
          </p>
        </div>

        {/* Botón de guardado */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[13px] text-[#8C8580]">
            <Server className="w-4 h-4 shrink-0" />
            <span>Los datos se guardan de forma centralizada en el servidor para todo el equipo.</span>
          </div>

          <button
            type="submit"
            className="kol-btn-normal px-6 py-2.5 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] font-bold text-[14px]"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
};
