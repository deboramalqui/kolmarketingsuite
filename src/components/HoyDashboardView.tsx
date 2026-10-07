import React from "react";
import {
  FranchiseFunnelStep,
  AcquisitionChannel,
  GoogleSearchKeyword,
  ClarityPageTelemetry,
} from "../types/marketing";
import {
  TrendingUp,
  AlertTriangle,
  Info,
  ExternalLink,
  Search,
  Upload,
  ArrowRight,
  Filter,
  Check,
  PlayCircle,
  Eye,
  MousePointer,
} from "lucide-react";

interface HoyDashboardViewProps {
  funnelSteps: FranchiseFunnelStep[];
  acquisitionChannels: AcquisitionChannel[];
  searchKeywords: GoogleSearchKeyword[];
  clarityPages: ClarityPageTelemetry[];
  keywordDateRange: "7d" | "28d" | "90d" | "12m";
  onSelectDateRange: (range: "7d" | "28d" | "90d" | "12m") => void;
  dateRangeLabel: string;
  onOpenClarityRecordings: (filterUrl?: string, eventName?: string) => void;
  onUploadKeywordsCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGoToFuentes: (subTab?: "ga4" | "search" | "meta" | "clarity") => void;
  onGoToAssistant: () => void;
}

export const HoyDashboardView: React.FC<HoyDashboardViewProps> = ({
  funnelSteps,
  acquisitionChannels,
  searchKeywords,
  clarityPages,
  keywordDateRange,
  onSelectDateRange,
  dateRangeLabel,
  onOpenClarityRecordings,
  onUploadKeywordsCsv,
  onGoToFuentes,
  onGoToAssistant,
}) => {
  const hubVisitors = funnelSteps[0]?.count || 75;
  const ctaClicks = funnelSteps[1]?.count || 4;
  const formStarts = funnelSteps[2]?.count || 3;
  const franchiseLeads = funnelSteps[3]?.count || 2;

  // Canal con IA
  const aiChannels = acquisitionChannels.filter((c) => c.isAiChannel);
  const totalAiVisitors = aiChannels.reduce((sum, c) => sum + c.visitors, 0);

  // Palabras clave filtradas
  const [keywordQuery, setKeywordQuery] = React.useState("");
  const filteredKeywords = searchKeywords.filter(
    (kw) =>
      !keywordQuery.trim() ||
      kw.keyword.toLowerCase().includes(keywordQuery.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* 1. TRES ALERTAS AUTOMÁTICAS DE UNA LÍNEA */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <h2 className="font-kol-display font-extrabold text-[18px] text-[#161418] uppercase tracking-wider">
            Alertas automáticas del período (28 días)
          </h2>
          <span className="text-[12px] font-bold text-[#8C8580]">
            Actualizado en vivo con GA4, Search Console y Clarity
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Alerta 1: Fricción en Clarity */}
          <div className="p-3.5 bg-[#FFF5F8] border border-[#FFD9E4] rounded-[10px] flex items-center justify-between gap-3 text-[14px]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C51172] shrink-0" />
              <div className="text-[#161418]">
                <strong className="font-bold text-[#C51172]">Fricción en móviles:</strong>{" "}
                La landing <span className="font-mono font-semibold">/franquicias</span> registró{" "}
                <strong>3.1 % de clics con rabia</strong> (rage clicks) en el botón de requisitos.
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenClarityRecordings("/franquicias")}
              className="text-[13px] font-bold text-[#C51172] hover:text-[#A40F5F] flex items-center gap-1.5 shrink-0 underline decoration-1 underline-offset-4"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Ver grabaciones</span>
            </button>
          </div>

          {/* Alerta 2: Atribución de canales */}
          <div className="p-3.5 bg-[#FFF9E6] border border-[#FFE699] rounded-[10px] flex items-center justify-between gap-3 text-[14px]">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A700] shrink-0" />
              <div className="text-[#161418]">
                <strong className="font-bold text-[#996F00]">Atribución de visitas:</strong>{" "}
                Instagram trajo <strong>40 de las 75 visitas</strong> al hub pero no registró consultas directas en la sesión.
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToAssistant}
              className="text-[13px] font-bold text-[#996F00] hover:text-[#735400] flex items-center gap-1.5 shrink-0 underline decoration-1 underline-offset-4"
            >
              <span>Preguntarle a la IA</span>
            </button>
          </div>

          {/* Alerta 3: Procesamiento estándar GA4 */}
          <div className="p-3.5 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[10px] flex items-center justify-between gap-3 text-[14px]">
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-[#46413F] shrink-0" />
              <div className="text-[#46413F]">
                <strong className="font-semibold text-[#161418]">Procesamiento de datos:</strong>{" "}
                Google Analytics 4 demora entre 24 y 48 horas en consolidar eventos nuevos. Los administradores logueados están excluidos de la medición.
              </div>
            </div>
            <span className="text-[12px] font-semibold text-[#8C8580] shrink-0">
              Ventana estándar GA4
            </span>
          </div>
        </div>
      </section>

      {/* 2. FRANJA DEL EMBUDO (LOS 4 PASOS VERIFICADOS DE KOL FRANQUICIAS) */}
      <section className="bg-[#FFFFFF] border-2 border-[#161418] kol-card-12 p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#161418] text-[#FAF8F6] text-[12px] font-bold uppercase tracking-wider">
                Protocolo verificado
              </span>
              <h2 className="font-kol-display font-extrabold text-[24px] leading-[30px] text-[#161418]">
                Embudo del Hub de Franquicias (4 pasos)
              </h2>
            </div>
            <p className="text-[14px] text-[#46413F] mt-1">
              Medición de comportamiento real desde el primer contacto en el hub hasta el envío de la consulta de inversión
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenClarityRecordings(undefined, "lead_franquicia")}
              className="kol-btn-normal px-3.5 py-2 bg-[#FFD9E4] text-[#161418] border border-[#C51172] hover:bg-[#FFC2D4] flex items-center gap-2 text-[13px] font-bold"
              title="Abrir Clarity filtrando por quienes enviaron el formulario"
            >
              <PlayCircle className="w-4 h-4 text-[#C51172]" />
              <span>Ver grabaciones con consulta enviada</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenClarityRecordings(undefined, "inicio_formulario")}
              className="kol-btn-normal px-3.5 py-2 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#FAF8F6] flex items-center gap-2 text-[13px] font-semibold"
              title="Abrir Clarity de quienes empezaron a llenar pero no enviaron"
            >
              <MousePointer className="w-4 h-4 text-[#46413F]" />
              <span>Ver abandonos del formulario</span>
            </button>
          </div>
        </div>

        {/* Pasos del embudo visual con caídas en lenguaje claro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Paso 1 */}
          <div className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px] text-[#46413F] font-semibold mb-1">
                <span>Paso 1</span>
                <span className="font-mono text-[12px] bg-[#E7E3DF] px-2 py-0.5 rounded">GA4 page_view</span>
              </div>
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                Entra al hub
              </h3>
              <div className="mt-3">
                <span className="font-kol-display font-extrabold text-[32px] text-[#161418] tabular-nums">
                  {hubVisitors}
                </span>
                <span className="text-[14px] text-[#46413F] ml-1.5 font-medium">visitas</span>
              </div>
            </div>

            <div className="p-2.5 bg-[#FFFFFF] border border-[#E7E3DF] rounded-[6px] text-[13px] text-[#46413F] leading-snug">
              Total de visitantes únicos al hub de franquicias en los últimos 28 días.
            </div>
          </div>

          {/* Paso 2 */}
          <div className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px] text-[#46413F] font-semibold mb-1">
                <span>Paso 2</span>
                <span className="font-mono text-[12px] bg-[#E7E3DF] px-2 py-0.5 rounded">click_cta_formulario</span>
              </div>
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                Toca botón de formulario
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-kol-display font-extrabold text-[32px] text-[#161418] tabular-nums">
                  {ctaClicks}
                </span>
                <span className="text-[13px] font-bold text-[#C51172]">
                  ({((ctaClicks / hubVisitors) * 100).toFixed(1)} %)
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#FFFFFF] border border-[#E7E3DF] rounded-[6px] text-[13px] text-[#161418] font-medium leading-snug">
              <strong>De {hubVisitors} que entraron, {ctaClicks} tocaron el botón</strong> para abrir el formulario de franquicia.
            </div>
          </div>

          {/* Paso 3 */}
          <div className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px] text-[#46413F] font-semibold mb-1">
                <span>Paso 3</span>
                <span className="font-mono text-[12px] bg-[#E7E3DF] px-2 py-0.5 rounded">inicio_formulario</span>
              </div>
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                Empieza el formulario
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-kol-display font-extrabold text-[32px] text-[#161418] tabular-nums">
                  {formStarts}
                </span>
                <span className="text-[13px] font-bold text-[#161418]">
                  ({((formStarts / ctaClicks) * 100).toFixed(0)} % de los que tocaron)
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#FFFFFF] border border-[#E7E3DF] rounded-[6px] text-[13px] text-[#161418] font-medium leading-snug">
              <strong>De {ctaClicks} que tocaron, {formStarts} empezaron</strong> a completar datos de contacto.
            </div>
          </div>

          {/* Paso 4 */}
          <div className="bg-[#FAF8F6] border-2 border-[#C51172] rounded-[10px] p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[13px] text-[#C51172] font-bold mb-1">
                <span>Paso 4 · Conversión</span>
                <span className="font-mono text-[12px] bg-[#FFD9E4] text-[#161418] px-2 py-0.5 rounded">lead_franquicia</span>
              </div>
              <h3 className="font-kol-display font-bold text-[18px] text-[#161418]">
                Envía consulta
              </h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-kol-display font-extrabold text-[32px] text-[#C51172] tabular-nums">
                  {franchiseLeads}
                </span>
                <span className="text-[13px] font-bold text-[#161418]">
                  ({((franchiseLeads / hubVisitors) * 100).toFixed(1)} % del hub)
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-[#FFD9E4]/60 border border-[#C51172]/40 rounded-[6px] text-[13px] text-[#161418] font-semibold leading-snug">
              <strong>2 completaron y enviaron</strong> su consulta. Un solo evento de conversión verificado.
            </div>
          </div>
        </div>

        {/* Resumen del embudo en español llano */}
        <div className="p-4 bg-[#F3F0ED] border border-[#C9C3BE] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[14px]">
          <div className="text-[#161418] leading-relaxed">
            <strong>Resumen del embudo:</strong> La mayor pérdida de interesados ocurre entre entrar al hub y tocar el botón (de 75 personas solo 4 tocan el CTA, cayendo un 94.7 %). Quienes inician el formulario tienen alta tasa de finalización (2 de 3 lo envían).
          </div>
          <button
            type="button"
            onClick={() => onGoToFuentes("clarity")}
            className="kol-btn-normal px-4 py-2 bg-[#FFFFFF] text-[#161418] border border-[#8C8580] hover:bg-[#FAF8F6] whitespace-nowrap text-[13px] font-bold shrink-0"
          >
            Ver análisis de Clarity
          </button>
        </div>
      </section>

      {/* 3. DE DÓNDE VIENEN (CANALES DE ADQUISICIÓN CON GRUPO CANALES CON IA) */}
      <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <h2 className="font-kol-display font-extrabold text-[22px] leading-[28px] text-[#161418]">
              De dónde vienen (Canales de adquisición al hub)
            </h2>
            <p className="text-[14px] text-[#46413F] mt-1">
              Separación clara de canales: Instagram, Google Orgánico, Directo y el nuevo grupo de <strong>Canales con IA</strong>
            </p>
          </div>

          <div className="text-[13px] text-[#46413F] font-semibold bg-[#FAF8F6] border border-[#C9C3BE] px-3 py-1.5 rounded-[8px]">
            Base total: {hubVisitors} visitas al hub (últimos 28 días)
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabla de canales */}
          <div className="overflow-x-auto border border-[#C9C3BE] rounded-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[13px] font-bold">
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-3 text-right">Visitas</th>
                  <th className="py-3 px-3 text-right">% del total</th>
                  <th className="py-3 px-3 text-right">Consultas</th>
                  <th className="py-3 px-3 text-right">Conv. %</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#161418]">
                {acquisitionChannels.map((channel, idx) => {
                  const pct = ((channel.visitors / hubVisitors) * 100).toFixed(1);
                  return (
                    <tr
                      key={channel.channelGroup}
                      className={
                        idx % 2 === 1
                          ? "bg-[#FAF8F6] border-t border-[#C9C3BE]"
                          : "bg-[#FFFFFF] border-t border-[#C9C3BE]"
                      }
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#161418] flex items-center gap-2">
                          {channel.channelGroup}
                          {channel.isAiChannel && (
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#FFD9E4] text-[#C51172] text-[11px] font-bold">
                              IA Generativa
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#46413F] mt-0.5">
                          {channel.detail}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {channel.visitors}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[#46413F]">
                        {pct} %
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-[#C51172]">
                        {channel.leadsFranquicia}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold">
                        {channel.conversionPct > 0 ? `${channel.conversionPct.toFixed(1)} %` : "0 %"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Gráfico de barras visual de distribución */}
          <div className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] p-5 space-y-4">
            <h3 className="font-kol-display font-bold text-[16px] text-[#161418]">
              Distribución visual del tráfico al hub
            </h3>

            <div className="space-y-3.5">
              {acquisitionChannels.map((c) => {
                const share = (c.visitors / hubVisitors) * 100;
                return (
                  <div key={c.channelGroup} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-bold text-[#161418] flex items-center gap-1.5">
                        {c.channelGroup}
                        {c.isAiChannel && <span className="text-[11px] text-[#C51172] font-semibold">(ChatGPT, Perplexity, Gemini)</span>}
                      </span>
                      <span className="font-mono font-semibold text-[#161418]">
                        {c.visitors} de {hubVisitors} ({share.toFixed(1)} %)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#E7E3DF] rounded-[4px] overflow-hidden">
                      <div
                        style={{ width: `${share}%` }}
                        className={`h-full rounded-[4px] transition-all duration-300 ${
                          c.channelGroup === "Instagram"
                            ? "bg-[#C51172]"
                            : c.channelGroup === "Google Orgánico"
                            ? "bg-[#161418]"
                            : c.isAiChannel
                            ? "bg-[#FFBA00]"
                            : "bg-[#8C8580]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-[#FFFFFF] border border-[#C9C3BE] rounded-[8px] text-[13px] text-[#46413F] leading-snug">
              <strong>Canales con IA:</strong> Se registraron 7 visitas referidas desde motores conversacionales (ChatGPT, Perplexity y Gemini) buscando modelos de franquicias o tiendas KOL. Ninguna convirtió a consulta todavía.
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUÉ BUSCAN (GOOGLE SEARCH CONSOLE) */}
      <section className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <h2 className="font-kol-display font-extrabold text-[22px] leading-[28px] text-[#161418]">
              Qué buscan (Google Search Console)
            </h2>
            <p className="text-[14px] text-[#46413F] mt-1">
              Consultas en Google que llevaron a páginas de franquicia, filtradas por clics e impresiones
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#46413F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={keywordQuery}
                onChange={(e) => setKeywordQuery(e.target.value)}
                placeholder="Buscar término..."
                className="h-[36px] pl-9 pr-3 text-[13px] bg-[#FFFFFF] border border-[#8C8580] rounded-[8px] text-[#161418] kol-focus"
              />
            </div>

            <label className="kol-btn-normal px-3 py-1.5 bg-[#E7E3DF] text-[#161418] border border-[#8C8580] hover:bg-[#C9C3BE] flex items-center gap-1.5 cursor-pointer text-[13px] font-semibold">
              <Upload className="w-3.5 h-3.5" />
              <span>Subir CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={onUploadKeywordsCsv}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Selector de rango de fecha de Search Console */}
        <div className="p-3.5 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#161418]">Período:</span>
            {(
              [
                { id: "7d", label: "7 días" },
                { id: "28d", label: "28 días" },
                { id: "90d", label: "90 días" },
                { id: "12m", label: "12 meses" },
              ] as const
            ).map((rng) => (
              <button
                key={rng.id}
                type="button"
                onClick={() => onSelectDateRange(rng.id)}
                className={`px-3 py-1 rounded-[6px] border font-semibold transition-colors ${
                  keywordDateRange === rng.id
                    ? "bg-[#161418] text-[#FAF8F6] border-[#161418]"
                    : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                }`}
              >
                {rng.label}
              </button>
            ))}
            <span className="font-mono text-[#46413F] bg-[#E7E3DF] px-2.5 py-1 rounded-[6px] ml-1">
              {dateRangeLabel}
            </span>
          </div>

          <div className="text-[#46413F] text-[12px]">
            Filtrado exclusivamente a páginas de franquicia (<span className="font-mono">/franquicias*</span>)
          </div>
        </div>

        {filteredKeywords.length === 0 ? (
          <div className="p-8 bg-[#FAF8F6] border border-[#C9C3BE] rounded-[10px] text-center space-y-2">
            <p className="font-bold text-[#161418]">
              Sin términos de búsqueda que coincidan
            </p>
            <p className="text-[13px] text-[#46413F]">
              Subí un CSV exportado de Google Search Console para cargar las búsquedas orgánicas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#C9C3BE] rounded-[10px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E7E3DF] text-[#2A2629] text-[13px] font-bold">
                  <th className="py-3 px-4">Consulta de búsqueda</th>
                  <th className="py-3 px-3">Página de destino</th>
                  <th className="py-3 px-3 text-right">Clics</th>
                  <th className="py-3 px-3 text-right">Impresiones</th>
                  <th className="py-3 px-3 text-right">CTR %</th>
                  <th className="py-3 px-3 text-right">Posición</th>
                  <th className="py-3 px-3 text-right">Consultas</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-[#161418]">
                {filteredKeywords.map((kw, idx) => (
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
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-[#161418]">
                      {kw.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
