import React, { useState } from "react";
import {
  CampaignMetric,
  ClarityPageTelemetry,
  GoogleSearchKeyword,
  ConnectedAccountsConfig,
} from "../types/marketing";
import {
  Search,
  Upload,
  RefreshCw,
  PlayCircle,
  ExternalLink,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Globe,
  Radio,
  Sliders,
} from "lucide-react";

interface FuentesViewProps {
  accountsConfig: ConnectedAccountsConfig;
  clarityPages: ClarityPageTelemetry[];
  searchKeywords: GoogleSearchKeyword[];
  keywordDateRange: "7d" | "28d" | "90d" | "12m";
  onSelectDateRange: (range: "7d" | "28d" | "90d" | "12m") => void;
  dateRangeLabel: string;
  onUploadKeywordsCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenClarityRecordings: (filterUrl?: string, eventName?: string) => void;
  onManualSync: () => void;
  isSyncing: boolean;
  initialSubTab?: "ga4" | "search" | "meta" | "clarity";
  onUpdateKeywordLandingPage?: (id: string, newLandingPage: string) => void;
}

export const FuentesView: React.FC<FuentesViewProps> = ({
  accountsConfig,
  clarityPages,
  searchKeywords,
  keywordDateRange,
  onSelectDateRange,
  dateRangeLabel,
  onUploadKeywordsCsv,
  onOpenClarityRecordings,
  onManualSync,
  isSyncing,
  initialSubTab = "ga4",
  onUpdateKeywordLandingPage,
}) => {
  const [subTab, setSubTab] = useState<"ga4" | "search" | "meta" | "clarity">(
    initialSubTab
  );
  const [editingKwId, setEditingKwId] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");

  return (
    <div className="space-y-8">
      {/* Selector de sub-pestañas de fuentes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
        <div>
          <h2 className="font-kol-display font-extrabold text-[24px] leading-[30px] text-[#161418]">
            Fuentes de datos conectadas
          </h2>
          <p className="text-[14px] text-[#46413F] mt-1">
            Tablas técnicas detalladas por plataforma: Google Marketing Platform, Microsoft Clarity y Meta
          </p>
        </div>

        <button
          type="button"
          onClick={onManualSync}
          disabled={isSyncing}
          className="kol-btn-normal px-4 py-2 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] hover:bg-[#C9C3BE] flex items-center gap-2 whitespace-nowrap text-[13px] font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Actualizando fuentes..." : "Actualizar datos"}</span>
        </button>
      </div>

      {/* Sub-navegación estilo fichas */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "ga4", label: "Google Analytics 4 (GA4)", badge: "Propiedad 372010641" },
            { id: "search", label: "Google Search Console", badge: `${searchKeywords.length} consultas` },
            { id: "meta", label: "Meta Ads", badge: "Inactivo hasta nov." },
            { id: "clarity", label: "Microsoft Clarity", badge: "Proyecto ytmpieugg9" },
          ] as const
        ).map((item) => {
          const active = subTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubTab(item.id)}
              className={`px-4 py-2.5 rounded-[10px] border flex items-center gap-2.5 transition-colors kol-focus ${
                active
                  ? "bg-[#161418] text-[#FAF8F6] border-[#161418] font-bold"
                  : "bg-[#FFFFFF] text-[#46413F] border-[#C9C3BE] hover:bg-[#FAF8F6]"
              }`}
            >
              <span className="text-[14px]">{item.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-[4px] font-semibold ${
                  active
                    ? "bg-[#2A2629] text-[#FFBA00]"
                    : "bg-[#E7E3DF] text-[#161418]"
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-PESTAÑA 1: GA4 */}
      {subTab === "ga4" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-[#161418] text-[15px]">
                  Propiedad GA4: 372010641
                </span>
              </div>
              <span className="text-[13px] bg-[#E7E3DF] text-[#161418] font-semibold px-2.5 py-1 rounded-[6px]">
                Evento único de conversión: <strong className="text-[#C51172]">lead_franquicia</strong>
              </span>
            </div>
            <p className="text-[14px] text-[#46413F] leading-relaxed">
              <strong>Regla fija del protocolo:</strong> No se mide <code className="bg-[#E7E3DF] px-1 rounded">generate_lead</code> (porque mezcla el botón de WhatsApp de retail de todo el sitio comercial) ni <code className="bg-[#E7E3DF] px-1 rounded">purchase</code> (una franquicia no tiene ingreso inmediato de carrito).
            </p>
            <div className="flex items-center gap-2 text-[13px] text-[#8C8580] pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Recordatorio técnico: GA4 tarda 24 a 48 hs en procesar eventos nuevos. Los administradores logueados no se miden; probar siempre formularios en ventana de incógnito.
              </span>
            </div>
          </div>

          {/* Tabla de páginas medidas en el Hub de Franquicias */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-hidden">
            <div className="bg-[#E7E3DF] px-4 py-3 font-bold text-[#161418] text-[14px]">
              Páginas de franquicia medidas en GA4 (Últimos 28 días)
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F3F0ED] text-[#46413F] text-[13px] font-semibold">
                  <th className="py-3 px-4">Ruta de destino</th>
                  <th className="py-3 px-3 text-right">Sesiones</th>
                  <th className="py-3 px-3 text-right">Usuarios únicos</th>
                  <th className="py-3 px-3 text-right">Tasa de rebote</th>
                  <th className="py-3 px-3 text-right">Evento lead_franquicia</th>
                  <th className="py-3 px-3 text-right">Vinculación Clarity</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#161418]">
                <tr className="bg-[#FFFFFF] border-t border-[#C9C3BE]">
                  <td className="py-3 px-4 font-bold">
                    /franquicias <span className="text-[12px] text-[#46413F] font-normal">(Hub principal de franquicias)</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold">60</td>
                  <td className="py-3 px-3 text-right tabular-nums">57</td>
                  <td className="py-3 px-3 text-right tabular-nums">38.4 %</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-[#C51172]">1</td>
                  <td className="py-3 px-3 text-right text-emerald-700 text-[13px] font-semibold">✓ Vinculado</td>
                </tr>
                <tr className="bg-[#FAF8F6] border-t border-[#C9C3BE]">
                  <td className="py-3 px-4 font-bold">
                    /franquicias/formulario <span className="text-[12px] text-[#46413F] font-normal">(Formulario de contacto de franquicia)</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold">15</td>
                  <td className="py-3 px-3 text-right tabular-nums">14</td>
                  <td className="py-3 px-3 text-right tabular-nums">12.0 %</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-[#C51172]">1</td>
                  <td className="py-3 px-3 text-right text-emerald-700 text-[13px] font-semibold">✓ Vinculado</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 2: SEARCH CONSOLE */}
      {subTab === "search" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-[#161418] text-[15px]">
                  Google Search Console · Propiedad kolaccesorios.com.ar
                </span>
              </div>
              <p className="text-[13px] text-[#46413F]">
                Todas las consultas orgánicas que registraron impresiones hacia el hub de franquicias
              </p>
            </div>
          </div>

          {/* Tarjetas resumen de métricas Search Console */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Consultas con impresiones</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.length}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Clics orgánicos</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.reduce((acc, kw) => acc + kw.clicks, 0)}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[12px] text-[#8C8580] uppercase font-bold block">Impresiones totales</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.reduce((acc, kw) => acc + kw.impressions, 0).toLocaleString("es-AR")}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[12px] text-[#8C8580] uppercase font-bold block">CTR Promedio ponderado</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#C51172] tabular-nums">
                {(
                  (searchKeywords.reduce((acc, kw) => acc + kw.clicks, 0) /
                    Math.max(1, searchKeywords.reduce((acc, kw) => acc + kw.impressions, 0))) *
                  100
                ).toFixed(1)}{" "}
                %
              </span>
            </div>
          </div>

          {/* Tabla de términos orgánicos */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[13px] font-bold">
                  <th className="py-3 px-4">Término de búsqueda (Keyword)</th>
                  <th className="py-3 px-3">Página destino</th>
                  <th className="py-3 px-3 text-right">Clics</th>
                  <th className="py-3 px-3 text-right">Impresiones</th>
                  <th className="py-3 px-3 text-right">CTR %</th>
                  <th className="py-3 px-3 text-right">Posición promedio</th>
                  <th className="py-3 px-3 text-right">Leads</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#161418]">
                {searchKeywords.map((kw, idx) => (
                  <tr
                    key={kw.id}
                    className={
                      idx % 2 === 1
                        ? "bg-[#FAF8F6] border-t border-[#C9C3BE]"
                        : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                    }
                  >
                    <td className="py-3 px-4 font-bold text-[#161418]">
                      {kw.keyword}
                    </td>
                    <td className="py-3 px-3 font-mono text-[13px] text-[#46413F]">
                      {kw.landingPage || "/franquicias"}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-extrabold text-[#161418]">
                      {kw.clicks}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-[#46413F]">
                      {kw.impressions.toLocaleString("es-AR")}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold">
                      {kw.ctrPct.toFixed(1)} %
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-[#C51172]">
                      #{kw.avgPosition.toFixed(1)}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">
                      {kw.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 3: META ADS (OCULTO/INACTIVO HASTA NOVIEMBRE) */}
      {subTab === "meta" && (
        <div className="space-y-6">
          <div className="p-6 bg-[#FAF8F6] border-2 border-[#161418] rounded-[10px] space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                Decisión del 5/10/2026
              </span>
              <h3 className="font-kol-display font-bold text-[20px] text-[#161418]">
                Meta Ads inactivo · Se activa con las campañas de noviembre
              </h3>
            </div>

            <p className="text-[15px] text-[#161418] leading-relaxed max-w-3xl">
              Por decisión del equipo el 5 de octubre de 2026, <strong>no se mide Meta por ahora</strong>. El módulo publicitario de Meta se encuentra en pausa hasta que comiencen las campañas oficiales de captación de franquiciados con presupuesto asignado.
            </p>

            <div className="p-4 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] space-y-2 text-[14px]">
              <div className="font-bold text-[#161418]">
                Reglas técnicas precargadas para noviembre:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#46413F]">
                <li>Filtro selectivo activado: solo campañas con términos [franquicia, inversor] (no trae el resto de la cuenta de retail).</li>
                <li>Evento de conversión asignado exclusivamente: <strong className="text-[#161418]">lead_franquicia</strong>.</li>
                <li>Presupuesto de inversión se consolidará para el cálculo de Costo por Consulta.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PESTAÑA 4: MICROSOFT CLARITY */}
      {subTab === "clarity" && (
        <div className="space-y-6">
          <div className="p-4 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-[#161418] text-[15px]">
                  Microsoft Clarity · Proyecto: ytmpieugg9 (Vinculado a GA4 372010641)
                </span>
              </div>
              <p className="text-[13px] text-[#46413F]">
                Etiquetas configuradas: <code className="bg-[#E7E3DF] px-1 rounded">seccion</code>, <code className="bg-[#E7E3DF] px-1 rounded">pagina_franquicia</code> y evento <code className="bg-[#E7E3DF] px-1 rounded">lead_franquicia</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenClarityRecordings(undefined, "lead_franquicia")}
                className="kol-btn-normal px-3 py-1.5 bg-[#FFD9E4] text-[#161418] border border-[#C51172] hover:bg-[#FFC2D4] text-[12px] font-bold"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#C51172]" />
                <span>Grabaciones: Consulta enviada</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenClarityRecordings(undefined, "inicio_formulario")}
                className="kol-btn-normal px-3 py-1.5 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#FAF8F6] text-[12px] font-semibold"
              >
                <span>Grabaciones: Formulario abandonado</span>
              </button>
            </div>
          </div>

          {/* Tabla de páginas con botón explícito de grabaciones */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[13px] font-bold">
                  <th className="py-3 px-4">Página analizada</th>
                  <th className="py-3 px-3 text-right">Sesiones</th>
                  <th className="py-3 px-3 text-right">Clics con rabia (Rage)</th>
                  <th className="py-3 px-3 text-right">Clics muertos</th>
                  <th className="py-3 px-3 text-right">Scroll medio</th>
                  <th className="py-3 px-4">Fricción detectada</th>
                  <th className="py-3 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#161418]">
                {clarityPages.map((page, idx) => {
                  const isHighRage = page.rageClicksPct >= 3.0;
                  return (
                    <tr
                      key={page.id}
                      className={
                        idx % 2 === 1
                          ? "bg-[#FAF8F6] border-t border-[#C9C3BE]"
                          : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                      }
                    >
                      <td className="py-3 px-4 font-bold text-[#161418]">
                        {page.pageUrl}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {page.sessions}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-[4px] text-[12px] ${
                            isHighRage
                              ? "bg-[#FFD9E4] text-[#A40F5F]"
                              : "bg-[#E7E3DF] text-[#161418]"
                          }`}
                        >
                          {page.rageClicksPct.toFixed(1)} %
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#46413F]">
                        {page.deadClicksPct.toFixed(1)} %
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {page.avgScrollDepthPct} %
                      </td>
                      <td className="py-3 px-4 text-[13px] text-[#46413F] max-w-xs">
                        {page.dominantFrictionIssue}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenClarityRecordings(page.pageUrl)}
                          className="kol-btn-normal px-3 py-1 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] text-[12px] font-bold flex items-center gap-1.5 mx-auto whitespace-nowrap"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-[#FFBA00]" />
                          <span>Ver grabaciones</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
