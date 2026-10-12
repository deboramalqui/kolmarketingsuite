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

const AI_SOURCES = ["chatgpt", "openai", "perplexity", "gemini", "claude", "copilot", "deepseek", "grok", "you.com", "meta.ai"];
/** Pista sobre el origen de una visita (solo orientativa) */
function originHint(source: string, medium: string): string {
  const s = source.toLowerCase();
  if (AI_SOURCES.some((a) => s.includes(a))) return "posible asistente de IA";
  if (s === "(direct)" || medium === "(none)") return "directo: enlace copiado, escrito a mano o sin origen";
  if (s.includes("google") && medium === "organic") return "búsqueda de Google";
  if (s.includes("instagram") || s.includes("facebook") || s.includes("l.wl.co")) return "red social";
  return "otro origen";
}

interface FuentesViewProps {
  pages: Array<{ path: string; sessions: number; users: number; bounceRatePct: number; leads: number }>;
  ga4Connected: boolean;
  guide?: { clicks: number; leads: number; downloads: number };
  notFound?: Array<{ path: string; sessions: number; sources: Array<{ source: string; medium: string; sessions: number }> }>;
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
  pages,
  ga4Connected,
  guide,
  notFound = [],
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
          className="kol-btn-normal px-4 py-2 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] hover:bg-[#C9C3BE] flex items-center gap-2 whitespace-nowrap text-[14px] font-bold self-start sm:self-auto"
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
                className={`text-[14px] px-2 py-0.5 rounded-[4px] font-semibold ${
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
              <span className="text-[14px] bg-[#E7E3DF] text-[#161418] font-semibold px-2.5 py-1 rounded-[6px]">
                Evento único de conversión: <strong className="text-[#C51172]">lead_franquicia</strong>
              </span>
            </div>
            <p className="text-[14px] text-[#46413F] leading-relaxed">
              <strong>Regla fija del protocolo:</strong> No se mide <code className="bg-[#E7E3DF] px-1 rounded">generate_lead</code> (porque mezcla el botón de WhatsApp de retail de todo el sitio comercial) ni <code className="bg-[#E7E3DF] px-1 rounded">purchase</code> (una franquicia no tiene ingreso inmediato de carrito).
            </p>
            <div className="flex items-center gap-2 text-[14px] text-[#6A6460] pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                Recordatorio técnico: GA4 tarda 24 a 48 hs en procesar eventos nuevos. Los administradores logueados no se miden; probar siempre formularios en ventana de incógnito.
              </span>
            </div>
          </div>

          {/* Guía descargable de los 9 pasos: personas únicas, leídas de GA4 */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-hidden">
            <div className="bg-[#E7E3DF] px-4 py-3 font-bold text-[#161418] text-[14px]">
              Guía de los 9 pasos (últimos 28 días, personas únicas)
            </div>
            {ga4Connected && guide ? (
              <div className="grid grid-cols-3 gap-4 p-4">
                {[
                  { label: "Tocaron el botón de la guía", value: guide.clicks },
                  { label: "Pidieron la guía (formulario de la guía)", value: guide.leads },
                  { label: "Descargaron el PDF", value: guide.downloads },
                ].map((k) => (
                  <div key={k.label} className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] p-4">
                    <div className="text-[14px] text-[#46413F] font-semibold">{k.label}</div>
                    <div className="text-[28px] font-extrabold text-[#161418] tabular-nums">{k.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-5 text-[14px] text-[#46413F]">Sin datos: GA4 todavía no está conectado.</p>
            )}
            <p className="px-4 pb-4 text-[14px] text-[#46413F]">
              Los administradores logueados no se miden. Este formulario es distinto del de consulta de franquicia (lead_franquicia), que se cuenta aparte en la tabla de abajo.
            </p>
          </div>

          {/* Páginas de /franquicia* leídas de GA4: nada de esta tabla es fijo */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-hidden">
            <div className="bg-[#E7E3DF] px-4 py-3 font-bold text-[#161418] text-[14px]">
              Páginas de franquicia medidas en GA4 (últimos 28 días)
            </div>
            {pages.length === 0 ? (
              <p className="px-4 py-5 text-[14px] text-[#46413F]">
                {ga4Connected
                  ? "GA4 está conectado pero todavía no devolvió páginas de /franquicia en este período."
                  : "Sin datos: GA4 todavía no está conectado."}
              </p>
            ) : (
              <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-[#F3F0ED] text-[#46413F] text-[14px] font-semibold">
                    <th className="py-3 px-4">Ruta de destino</th>
                    <th className="py-3 px-3 text-right">Sesiones</th>
                    <th className="py-3 px-3 text-right">Usuarios únicos</th>
                    <th className="py-3 px-3 text-right">Tasa de rebote</th>
                    <th className="py-3 px-3 text-right">Consultas enviadas (lead_franquicia)</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] text-[#161418]">
                  {pages.map((p, idx) => (
                    <tr key={p.path} className={(notFound.some((n) => n.path === p.path) ? "bg-[#F3F0ED] border-l-4 border-l-[#C51172]" : idx % 2 === 1 ? "bg-[#FAF8F6]" : "bg-[#FFFFFF]") + " border-t border-[#C9C3BE]"}>
                      <td className="py-3 px-4 font-bold">
                        {p.path}{" "}
                        <span className="text-[14px] text-[#46413F] font-normal">
                          ({p.path === "/franquicia/" ? "Hub principal" : notFound.some((n) => n.path === p.path) ? "" : "Página hija"})
                        </span>
                        {notFound.some((n) => n.path === p.path) && (
                          <span className="ml-1 text-[14px] font-bold text-[#A40F5F]"><span aria-hidden="true">! </span>Página no encontrada (404)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">{p.sessions}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{p.users}</td>
                      <td className="py-3 px-3 text-right tabular-nums">{p.bounceRatePct.toLocaleString("es-AR")} %</td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-[#C51172]">{p.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>

          {/* Direcciones que no existen (404) y de dónde llegaron: ¿una IA, un enlace mal armado? */}
          {notFound.length > 0 && (
            <div className="border border-[#C9C3BE] rounded-[10px] overflow-hidden">
              <div className="bg-[#E7E3DF] px-4 py-3 font-bold text-[#161418] text-[14px]">
                Visitas a direcciones que no existen (404) y de dónde llegaron
              </div>
              <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-[#F3F0ED] text-[#46413F] text-[14px] font-semibold">
                    <th className="py-3 px-4">Dirección pedida</th>
                    <th className="py-3 px-3">Origen de la visita</th>
                    <th className="py-3 px-3 text-right">Sesiones</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] text-[#161418]">
                  {notFound.flatMap((n) =>
                    n.sources.map((s, i) => (
                      <tr key={`${n.path}-${s.source}-${s.medium}-${i}`} className="border-t border-[#C9C3BE] bg-[#FFFFFF]">
                        <td className="py-3 px-4 font-mono text-[14px]">{i === 0 ? n.path : ""}</td>
                        <td className="py-3 px-3">
                          {s.source} / {s.medium}{" "}
                          <span className="text-[14px] text-[#46413F]">({originHint(s.source, s.medium)})</span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums font-semibold">{s.sessions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table></div>
              <p className="px-4 py-3 text-[14px] text-[#46413F]">
                GA4 registra cualquier dirección que alguien pida, aunque la página no exista. La interpretación entre paréntesis es una pista según el origen, no un dato de GA4.
              </p>
            </div>
          )}
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
                  Google Search Console · Propiedad kolaccesorios.com
                </span>
              </div>
              <p className="text-[14px] text-[#46413F]">
                Todas las consultas orgánicas que registraron impresiones hacia el hub de franquicias
              </p>
            </div>
          </div>

          {/* Tarjetas resumen de métricas Search Console */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[14px] text-[#6A6460] font-bold block">Consultas con impresiones</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.length}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[14px] text-[#6A6460] font-bold block">Clics orgánicos</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.reduce((acc, kw) => acc + kw.clicks, 0)}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[14px] text-[#6A6460] font-bold block">Impresiones totales</span>
              <span className="font-kol-display font-extrabold text-[22px] text-[#161418] tabular-nums">
                {searchKeywords.reduce((acc, kw) => acc + kw.impressions, 0).toLocaleString("es-AR")}
              </span>
            </div>
            <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[8px]">
              <span className="text-[14px] text-[#6A6460] font-bold block">CTR Promedio ponderado</span>
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
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[14px] font-bold">
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
                    <td className="py-3 px-3 font-mono text-[14px] text-[#46413F]">
                      {kw.landingPage || "/franquicia/"}
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
                      {kw.conversions ?? "—"}
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
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[14px] font-bold ">
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
              <p className="text-[14px] text-[#46413F]">
                Etiquetas configuradas: <code className="bg-[#E7E3DF] px-1 rounded">seccion</code>, <code className="bg-[#E7E3DF] px-1 rounded">pagina_franquicia</code> y evento <code className="bg-[#E7E3DF] px-1 rounded">lead_franquicia</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenClarityRecordings(undefined, "lead_franquicia")}
                className="kol-btn-normal px-3 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] hover:bg-[#C9C3BE]/50 text-[14px] font-bold"
              >
                <PlayCircle className="w-4 h-4 text-[#161418]" />
                <span>Grabaciones: Consulta enviada</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenClarityRecordings(undefined, "inicio_formulario")}
                className="kol-btn-normal px-3 py-1.5 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#FAF8F6] text-[14px] font-semibold"
              >
                <span>Grabaciones: Formulario abandonado</span>
              </button>
            </div>
          </div>

          {/* Tabla de páginas con botón explícito de grabaciones */}
          <div className="border border-[#C9C3BE] rounded-[10px] overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[14px] font-bold">
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
                          className={`font-bold px-2 py-0.5 rounded-[4px] text-[14px] ${
                            isHighRage
                              ? "bg-[#F3F0ED] text-[#A40F5F] border-2 border-[#A40F5F]"
                              : "bg-[#E7E3DF] text-[#161418]"
                          }`}
                        >
                          {isHighRage ? "! " : ""}{page.rageClicksPct.toFixed(1)} %
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#46413F]">
                        {page.deadClicksPct.toFixed(1)} %
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {page.avgScrollDepthPct} %
                      </td>
                      <td className="py-3 px-4 text-[14px] text-[#46413F] max-w-xs">
                        {page.dominantFrictionIssue}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenClarityRecordings(page.pageUrl)}
                          className="kol-btn-normal px-3 py-1 bg-[#161418] text-[#FAF8F6] hover:bg-[#2A2629] text-[14px] font-bold flex items-center gap-1.5 mx-auto whitespace-nowrap"
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
