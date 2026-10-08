import React, { useState } from "react";
import { ConnectedAccountsConfig } from "../types/marketing";
import {
  Check,
  RefreshCw,
  Server,
  Info,
  User,
  ShieldCheck,
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
  const [formData, setFormData] = useState<ConnectedAccountsConfig>({
    ...config,
    gmpAccountEmail:
      config.gmpAccountEmail?.includes("marketing@") ||
      config.gmpAccountEmail?.includes("redes.kol")
        ? ""
        : config.gmpAccountEmail || "",
  });
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
      setSaveStatus("Configuración guardada en el servidor.");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch {
      setSaveStatus("Configuración guardada en local.");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-[#FAF8F6]">
      {/* Encabezado con tema oscuro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#46413F] pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-[#FFBA00] uppercase tracking-wider">
              Centro de Conexiones
            </span>
          </div>
          <h2 className="font-kol-display font-extrabold text-[24px] leading-tight text-[#FAF8F6]">
            Administración unificada de fuentes de datos
          </h2>
          <p className="text-[14px] text-[#C9C3BE]">
            Estado de Google Marketing Platform, Microsoft Clarity y Meta para el tablero de franquicias
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerSync}
          disabled={isSyncing}
          className="kol-btn-normal px-5 py-2.5 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] flex items-center gap-2 font-bold whitespace-nowrap self-start sm:self-auto shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Actualizando todo..." : "Actualizar datos ahora"}</span>
        </button>
      </div>

      {/* Identidad de usuario en sesión */}
      <div className="p-4 bg-[#2A2629] border border-[#46413F] rounded-[10px] space-y-2">
        <div className="flex items-center gap-2 text-[14px] font-bold text-[#FAF8F6]">
          <User className="w-4 h-4 text-[#FFBA00]" />
          <span>Sesión activa</span>
        </div>
        <div className="p-3 bg-[#161418] border border-[#46413F] rounded-[8px] flex items-center justify-between">
          <div>
            <span className="text-[#8C8580] block text-[11px] uppercase font-bold tracking-wider">
              Usuario conectado
            </span>
            <span className="font-semibold text-[#FAF8F6] text-[14px]">
              malquidebora@gmail.com
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-[11px] font-bold">
            Verificado
          </span>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-600 rounded-[10px] text-[14px] text-emerald-300 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {syncNotice && (
        <div className="p-3.5 bg-[#2A2629] border border-[#46413F] rounded-[10px] text-[14px] text-[#FAF8F6] font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-[#FFBA00] shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Google Analytics 4 */}
        <div className="p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">
                1. Google Analytics 4 (GA4)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-emerald-950 text-emerald-400 border border-emerald-700 text-[12px] font-bold">
              Conectado · Propiedad 372010641
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Property ID de GA4
              </label>
              <input
                type="text"
                value={formData.gmpPropertyId}
                onChange={(e) =>
                  setFormData({ ...formData, gmpPropertyId: e.target.value })
                }
                className="w-full h-[40px] px-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] font-mono text-[#FAF8F6] kol-focus"
                placeholder="372010641"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Correo de cuenta Google asociada (opcional)
              </label>
              <input
                type="email"
                value={formData.gmpAccountEmail}
                onChange={(e) =>
                  setFormData({ ...formData, gmpAccountEmail: e.target.value })
                }
                className="w-full h-[40px] px-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] text-[#FAF8F6] kol-focus placeholder-[#8C8580]"
                placeholder="tu-cuenta-google@... (opcional)"
              />
            </div>
          </div>

          <div className="p-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[13px] text-[#C9C3BE] space-y-1">
            <p>
              <strong>Evento de conversión único verificado:</strong> <code className="bg-[#2A2629] text-[#FFBA00] px-1.5 py-0.5 rounded font-mono font-bold">lead_franquicia</code>.
            </p>
            <p className="text-[12px] text-[#8C8580]">
              Cualquier otro evento comercial (generate_lead o purchase) se descarta para evitar desvíos en los datos de franquicias.
            </p>
          </div>
        </div>

        {/* 2. Google Search Console */}
        <div className="p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">
                2. Google Search Console
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-emerald-950 text-emerald-400 border border-emerald-700 text-[12px] font-bold">
              Conectado · kolaccesorios.com.ar
            </span>
          </div>

          <p className="text-[14px] text-[#C9C3BE]">
            Mide las búsquedas orgánicas reales que llevan tráfico al hub <span className="font-mono text-[#FAF8F6]">/franquicias</span> y sus páginas hijas (<span className="font-mono text-[#FAF8F6]">/cuanto-cuesta</span>, <span className="font-mono text-[#FAF8F6]">/requisitos</span>, etc.).
          </p>
        </div>

        {/* 3. Microsoft Clarity */}
        <div className="p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">
                3. Microsoft Clarity (Mapas de calor y grabaciones)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-emerald-950 text-emerald-400 border border-emerald-700 text-[12px] font-bold">
              Conectado · Proyecto ytmpieugg9
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Project ID de Clarity
              </label>
              <input
                type="text"
                value={formData.clarityProjectId}
                onChange={(e) =>
                  setFormData({ ...formData, clarityProjectId: e.target.value })
                }
                className="w-full h-[40px] px-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] font-mono text-[#FAF8F6] kol-focus"
                placeholder="ytmpieugg9"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Estado de vinculación con GA4
              </label>
              <div className="h-[40px] px-3 border border-[#46413F] bg-[#161418] rounded-[8px] text-[14px] text-[#FAF8F6] flex items-center">
                Sincronizado con propiedad 372010641
              </div>
            </div>
          </div>
        </div>

        {/* 4. Meta Ads */}
        <div className="p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#8C8580]" />
              <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">
                4. Meta Ads (Campañas de Facebook e Instagram)
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-[4px] bg-[#161418] text-[#8C8580] border border-[#46413F] text-[12px] font-bold">
              No conectado todavía · Pendiente Noviembre
            </span>
          </div>

          <div className="p-3.5 bg-[#161418] border border-[#46413F] rounded-[8px] text-[13px] text-[#C9C3BE] leading-relaxed">
            <strong>Estado actual:</strong> Todavía no conectaste tu cuenta de Meta Ads. Se activará cuando se lancen las campañas de franquicias en noviembre para no mezclar datos sin inversión.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Ad Account ID de Meta (cuando conectes)
              </label>
              <input
                type="text"
                value={formData.metaAdAccountId}
                onChange={(e) =>
                  setFormData({ ...formData, metaAdAccountId: e.target.value })
                }
                className="w-full h-[40px] px-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] font-mono text-[#FAF8F6] kol-focus"
                placeholder="act_..."
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#C9C3BE] mb-1">
                Filtro de campañas permitidas
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
                className="w-full h-[40px] px-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] text-[#FAF8F6] kol-focus"
                placeholder="franquicia, inversor"
              />
            </div>
          </div>
        </div>

        {/* Guardado */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-[13px] text-[#8C8580]">
            <Server className="w-4 h-4 shrink-0" />
            <span>Los datos se guardan de forma centralizada en el servidor.</span>
          </div>

          <button
            type="submit"
            className="kol-btn-normal px-6 py-2.5 bg-[#FFBA00] text-[#161418] hover:opacity-90 font-bold text-[14px]"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
};
