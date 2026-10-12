import { stripSecrets } from "../lib/secrets";
import React, { useState } from "react";
import { ConnectedAccountsConfig } from "../types/marketing";
import { useConnectionCheck, type ConnResult } from "../lib/connections";
import { UsersPanel } from "./UsersPanel";
import { useAuth } from "../lib/auth";
import {
  Check,
  RefreshCw,
  Server,
  Info,
  Plug,
} from "lucide-react";

/** Estado de una conexión: sale de la prueba real del servidor. El verde se usa solo para "Conectado", siempre con tilde y texto. */
const ConnBadge: React.FC<{ res: ConnResult | null; loading: boolean }> = ({ res, loading }) => {
  const base = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[14px] font-bold";
  if (loading || !res) return <span className={`${base} border-[#46413F] bg-[#161418] text-[#C9C3BE]`}>Probando…</span>;
  if (res.state === "ok")
    return (
      <span className={`${base} border-[#7FD6A4] bg-[#161418] text-[#7FD6A4]`}>
        <Check className="w-4 h-4" aria-hidden="true" />
        Conectado
      </span>
    );
  if (res.state === "error")
    return (
      <span className={`${base} border-2 border-[#FAF8F6] bg-[#161418] text-[#FAF8F6]`}>
        <span aria-hidden="true">!</span>
        Con error
      </span>
    );
  if (res.state === "clave_cargada") return <span className={`${base} border-[#C9C3BE] bg-[#161418] text-[#FAF8F6]`}>Clave cargada, sin probar</span>;
  return <span className={`${base} border-[#46413F] bg-[#161418] text-[#C9C3BE]`}>No conectado</span>;
};

const ConnMessage: React.FC<{ res: ConnResult | null; loading: boolean }> = ({ res, loading }) =>
  loading || !res ? null : <p className="text-[14px] text-[#C9C3BE] leading-snug">{res.message}</p>;

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
  const { authEnabled } = useAuth();
  const [section, setSection] = useState<"conexiones" | "usuarios">("conexiones");
  const { check, loading: checking, failed: checkFailed, run: runCheck } = useConnectionCheck(config.metaAdAccountId);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(stripSecrets(formData));
    try {
      await fetch("/api/accounts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripSecrets(formData)),
      });
      setSaveStatus("Configuración guardada en el servidor.");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch {
      setSaveStatus("Configuración guardada en local.");
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const input = "w-full h-[48px] px-3 bg-[#161418] border border-[#C9C3BE] rounded-[8px] text-[14px] text-[#FAF8F6] kol-focus-dark";
  const label = "block text-[14px] font-semibold text-[#C9C3BE] mb-1";
  const card = "p-6 bg-[#2A2629] border border-[#46413F] rounded-[12px] space-y-4";

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-[#FAF8F6]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#46413F] pb-5">
        <div className="space-y-2">
          <h2 className="font-kol-display font-extrabold text-[24px] leading-tight text-[#FAF8F6]">Configuración</h2>
          <p className="text-[14px] text-[#C9C3BE]">
            Estado real de cada fuente de datos. Se prueba al abrir esta pantalla y cada vez que tocás “Probar conexiones”.
            {check.checkedAt ? ` Última prueba: ${new Date(check.checkedAt).toLocaleString("es-AR")}.` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={runCheck}
            disabled={checking}
            className="kol-btn-normal px-5 border border-[#C9C3BE] text-[#FAF8F6] hover:bg-[#2A2629] flex items-center gap-2 font-bold whitespace-nowrap kol-focus-dark"
          >
            <Plug className={`w-4 h-4 ${checking ? "animate-pulse" : ""}`} aria-hidden="true" />
            <span>{checking ? "Probando…" : "Probar conexiones"}</span>
          </button>
          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="kol-btn-normal px-5 bg-[#C51172] text-[#FFFFFF] hover:bg-[#A40F5F] flex items-center gap-2 font-bold whitespace-nowrap kol-focus-dark"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>{isSyncing ? "Actualizando…" : "Actualizar datos ahora"}</span>
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Configuración" className="flex gap-2">
        {([["conexiones", "Conexiones"], ["usuarios", "Usuarios y roles"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`kol-btn-normal px-5 font-bold kol-focus-dark ${section === id ? "bg-[#FAF8F6] text-[#161418]" : "border border-[#C9C3BE] text-[#FAF8F6] hover:bg-[#2A2629]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "usuarios" ? (
        <UsersPanel />
      ) : (
      <>
      {checkFailed && (
        <div className="p-3.5 bg-[#2A2629] border-2 border-[#FAF8F6] rounded-[10px] text-[14px] text-[#FAF8F6] font-semibold flex items-start gap-2" role="alert">
          <span aria-hidden="true" className="font-bold">!</span>
          <span>No se pudo probar las conexiones: {checkFailed}.</span>
        </div>
      )}

      <div className="p-4 bg-[#2A2629] border border-[#46413F] rounded-[10px] flex items-start gap-3" role="note">
        <Info className="w-5 h-5 shrink-0 text-[#FAF8F6] mt-0.5" aria-hidden="true" />
        <p className="text-[14px] text-[#FAF8F6] leading-snug">
          {authEnabled ? <><strong>Acceso:</strong> el inicio de sesión con Google está encendido. Quién entra y con qué rol se ve en “Usuarios y roles”.</> : <><strong>Acceso:</strong> el inicio de sesión está apagado: cualquier persona que tenga el enlace puede abrir la app. Se enciende en “Usuarios y roles”.</>}
        </p>
      </div>

      {saveStatus && (
        <div className="p-3.5 bg-[#2A2629] border border-[#7FD6A4] rounded-[10px] text-[14px] text-[#FAF8F6] font-medium flex items-center gap-2" role="status">
          <Check className="w-4 h-4 text-[#7FD6A4] shrink-0" aria-hidden="true" />
          <span>{saveStatus}</span>
        </div>
      )}

      {syncNotice && (
        <div className="p-3.5 bg-[#2A2629] border border-[#46413F] rounded-[10px] text-[14px] text-[#FAF8F6] font-medium flex items-center gap-2" role="status">
          <Info className="w-4 h-4 text-[#FAF8F6] shrink-0" aria-hidden="true" />
          <span>{syncNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Google Analytics 4 */}
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">1. Google Analytics 4</h3>
            <ConnBadge res={check.ga4} loading={checking} />
          </div>
          <ConnMessage res={check.ga4} loading={checking} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cx-ga4-prop" className={label}>ID de la propiedad de GA4</label>
              <input
                id="cx-ga4-prop"
                type="text"
                value={formData.gmpPropertyId}
                onChange={(e) => setFormData({ ...formData, gmpPropertyId: e.target.value })}
                className={`${input} font-mono`}
                placeholder="372010641"
              />
            </div>
          </div>

          <div className="p-3 bg-[#161418] border border-[#46413F] rounded-[8px] text-[14px] text-[#C9C3BE] space-y-1">
            <p>
              <strong>Única conversión de franquicia:</strong>{" "}
              <code className="bg-[#2A2629] text-[#FFBA00] px-1.5 py-0.5 rounded font-mono font-bold">lead_franquicia</code>.
            </p>
            <p>generate_lead (el WhatsApp de todo el sitio) y purchase no se usan para franquicias.</p>
          </div>
        </div>

        {/* 2. Google Search Console */}
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">2. Google Search Console</h3>
            <ConnBadge res={check.gsc} loading={checking} />
          </div>
          <ConnMessage res={check.gsc} loading={checking} />
          <p className="text-[14px] text-[#C9C3BE]">
            Usa la misma autorización de Google que GA4. Lee las búsquedas de Google que llevan a las páginas <span className="font-mono text-[#FAF8F6]">/franquicia</span>.
          </p>
        </div>

        {/* 3. Microsoft Clarity */}
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">3. Microsoft Clarity</h3>
            <ConnBadge res={check.clarity} loading={checking} />
          </div>
          <ConnMessage res={check.clarity} loading={checking} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cx-clarity-id" className={label}>ID del proyecto de Clarity</label>
              <input
                id="cx-clarity-id"
                type="text"
                value={formData.clarityProjectId}
                onChange={(e) => setFormData({ ...formData, clarityProjectId: e.target.value })}
                className={`${input} font-mono`}
                placeholder="ytmpieugg9"
              />
            </div>
          </div>
        </div>

        {/* 4. Meta Ads */}
        <div className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-kol-display font-bold text-[18px] text-[#FAF8F6]">4. Meta Ads (Facebook e Instagram)</h3>
            <ConnBadge res={check.meta} loading={checking} />
          </div>
          <ConnMessage res={check.meta} loading={checking} />
          <p className="text-[14px] text-[#C9C3BE]">La clave de Meta vive en los Secrets del servidor, nunca en esta pantalla. Acá solo va el ID de la cuenta publicitaria.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cx-meta-act" className={label}>ID de la cuenta publicitaria</label>
              <input
                id="cx-meta-act"
                type="text"
                value={formData.metaAdAccountId}
                onChange={(e) => setFormData({ ...formData, metaAdAccountId: e.target.value })}
                className={`${input} font-mono`}
                placeholder="act_..."
              />
            </div>

            <div>
              <label htmlFor="cx-meta-kw" className={label}>Solo campañas que contengan</label>
              <input
                id="cx-meta-kw"
                type="text"
                value={formData.metaAllowedCampaignKeywords.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metaAllowedCampaignKeywords: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                className={input}
                placeholder="franquicia, inversor"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-[14px] text-[#C9C3BE]">
            <Server className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Los ajustes se guardan en el servidor (sin claves).</span>
          </div>

          <button type="submit" className="kol-btn-normal px-6 bg-[#FFBA00] text-[#161418] hover:bg-[#FFCB3D] font-bold text-[14px] kol-focus-dark">
            Guardar cambios
          </button>
        </div>
      </form>
      </>
      )}
    </div>
  );
};