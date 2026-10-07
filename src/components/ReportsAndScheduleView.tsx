import React, { useState } from "react";
import {
  CustomReport,
  ScheduledEmailReport,
  DispatchedEmailLog,
  CampaignMetric,
  ClarityPageTelemetry,
} from "../types/marketing";
import { Plus, Send, Download, Check, RefreshCw } from "lucide-react";

interface ReportsAndScheduleViewProps {
  reports: CustomReport[];
  onCreateReport: (report: CustomReport) => void;
  onRequestDeleteReport: (report: CustomReport) => void;
  schedules: ScheduledEmailReport[];
  onAddSchedule: (schedule: ScheduledEmailReport) => void;
  onToggleSchedule: (id: string) => void;
  onDeleteSchedule: (id: string) => void;
  dispatchedLogs: DispatchedEmailLog[];
  onAddDispatchedLog: (log: DispatchedEmailLog) => void;
  campaigns: CampaignMetric[];
  clarityPages: ClarityPageTelemetry[];
  defaultRecipientEmail: string;
  oauthAccessToken: string;
}

const AVAILABLE_REPORT_METRICS = [
  "ROAS",
  "CPA",
  "lead_franquicia",
  "Meta Lead / Contact",
  "CTR %",
  "Inversión 30d",
  "click_cta_formulario",
  "click_whatsapp",
  "Rage Clicks %",
  "Dead Clicks %",
  "Scroll Depth %",
];

export const ReportsAndScheduleView: React.FC<ReportsAndScheduleViewProps> = ({
  reports,
  onCreateReport,
  onRequestDeleteReport,
  schedules,
  onAddSchedule,
  onToggleSchedule,
  onDeleteSchedule,
  dispatchedLogs,
  onAddDispatchedLog,
  campaigns,
  clarityPages,
  defaultRecipientEmail,
  oauthAccessToken,
}) => {
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportPlatform, setNewReportPlatform] = useState("GMP + Clarity");
  const [newReportDateRange, setNewReportDateRange] =
    useState("Últimos 30 días");
  const [newReportMetrics, setNewReportMetrics] = useState<string[]>([
    "ROAS",
    "CPA",
    "lead_franquicia",
    "Rage Clicks %",
  ]);

  const [scheduleName, setScheduleName] = useState(
    "Informe de rendimiento del embudo KOL Franquicias"
  );
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<"Diaria" | "Semanal" | "Mensual">(
    "Semanal"
  );
  const [format, setFormat] = useState<
    "PDF Ejecutivo" | "HTML Interactivo" | "CSV Tabular"
  >("HTML Interactivo");
  const [selectedScheduleMetrics, setSelectedScheduleMetrics] = useState<
    string[]
  >([
    "ROAS",
    "CPA",
    "lead_franquicia",
    "Inversión 30d",
    "Rage Clicks %",
    "Scroll Depth %",
  ]);
  const [isDispatchingId, setIsDispatchingId] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const toggleMetricSelection = (
    metric: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(
      list.includes(metric)
        ? list.filter((m) => m !== metric)
        : [...list, metric]
    );
  };

  const handleCreateCustomReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return;

    const avgRoas = (
      campaigns.reduce((a, b) => a + b.roas, 0) / Math.max(1, campaigns.length)
    ).toFixed(2);
    const totalConv = campaigns.reduce((a, b) => a + b.conversions, 0);

    const created: CustomReport = {
      id: `rep-${Date.now().toString().slice(-4)}`,
      title: newReportTitle.trim(),
      sourcePlatform: newReportPlatform,
      metrics:
        newReportMetrics.length > 0
          ? newReportMetrics
          : ["ROAS", "lead_franquicia"],
      dateRange: newReportDateRange,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      createdBy: "Marketing KOL Suite",
      summaryInsight: `ROAS consolidado de ${avgRoas}x con ${totalConv.toLocaleString("es-AR")} eventos de conversión en los 56 enlaces monitoreados`,
      rowCount: campaigns.length * 140,
    };

    onCreateReport(created);
    setNewReportTitle("");
  };

  const handleExportReportCsv = (rep: CustomReport) => {
    const headers = [
      "Campaña",
      "Plataforma",
      "Presupuesto diario",
      "ROAS",
      "CPA USD",
      "Conversiones",
      "Clarity Rage Clicks %",
      "Clarity Scroll Depth %",
    ];
    const rows = campaigns.map((c) => [
      c.name,
      c.platform,
      c.dailyBudget,
      c.roas,
      c.cpaUsd,
      c.conversions,
      c.clarityRageClicksPct,
      c.clarityScrollDepthPct,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${rep.title.toLowerCase().replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.includes("@")) {
      setEmailError("Ingresá un correo válido");
      return;
    }
    setEmailError(null);
    if (!scheduleName.trim()) return;

    const nextLabels = {
      Diaria: "Mañana 07:00",
      Semanal: "Lunes 08:00",
      Mensual: "Día 1 del mes 08:00",
    };

    const newSched: ScheduledEmailReport = {
      id: `sch-${Date.now().toString().slice(-4)}`,
      name: scheduleName.trim(),
      recipientEmail: recipientEmail.trim(),
      frequency,
      format,
      metrics:
        selectedScheduleMetrics.length > 0
          ? selectedScheduleMetrics
          : ["ROAS", "CPA", "lead_franquicia"],
      active: true,
      lastSentAt: null,
      nextRunLabel: nextLabels[frequency],
    };

    onAddSchedule(newSched);
  };

  const handleDispatchNow = async (sched: ScheduledEmailReport) => {
    setIsDispatchingId(sched.id);
    setDispatchError(null);

    try {
      const res = await fetch("/api/reports/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleConfig: sched,
          gmpSummary: campaigns,
          claritySummary: clarityPages,
          oauthAccessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al generar y enviar el informe");
      }

      const content = data.reportContent || {};
      const newLog: DispatchedEmailLog = {
        id: `log-${Date.now()}`,
        scheduleName: sched.name,
        recipientEmail: sched.recipientEmail,
        frequency: sched.frequency,
        format: sched.format,
        dispatchedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        deliveryStatus:
          data.deliveryStatus ||
          `Enviado a ${sched.recipientEmail} (${sched.format})`,
        emailSubject:
          content.emailSubject ||
          `[KOL Franquicias] ${sched.name} (${sched.frequency})`,
        executiveHeadline:
          content.executiveHeadline ||
          "Resumen de rendimiento de Google Marketing Platform y Clarity",
        executiveSummary:
          content.executiveSummary ||
          "Informe generado automáticamente con métricas sincronizadas.",
        keyHighlights: Array.isArray(content.keyHighlights)
          ? content.keyHighlights
          : [],
        clarityBehavioralAlert:
          content.clarityBehavioralAlert ||
          "Monitoreo de fricción activo en páginas del hub y páginas hijas.",
        recommendedNextSteps: Array.isArray(content.recommendedNextSteps)
          ? content.recommendedNextSteps
          : [],
      };

      onAddDispatchedLog(newLog);
    } catch (err: unknown) {
      setDispatchError(
        err instanceof Error
          ? err.message
          : "No se pudo despachar el informe por correo"
      );
    } finally {
      setIsDispatchingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Bloque 1: Creación y eliminación programática de reportes personalizados */}
      <div className="bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#C9C3BE] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                1
              </span>
              <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Creá y eliminá reportes personalizados
              </h2>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Armá tus propios cruces entre Google Marketing Platform y Clarity o pedíselo por escrito al asistente
            </p>
          </div>
          <span className="text-[14px] font-bold text-[#161418] tabular-nums">
            {reports.length} reportes guardados
          </span>
        </div>

        <form
          onSubmit={handleCreateCustomReport}
          className="p-5 bg-[#F3F0ED] kol-card-12 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Nombre del reporte
              </label>
              <input
                type="text"
                value={newReportTitle}
                onChange={(e) => setNewReportTitle(e.target.value)}
                placeholder="Ej: Embudo en páginas hijas vs rage clicks en Clarity"
                required
                className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Origen de los datos
              </label>
              <select
                value={newReportPlatform}
                onChange={(e) => setNewReportPlatform(e.target.value)}
                className="w-full h-[40px] px-3 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
              >
                <option value="GMP + Meta + Clarity">GMP + Meta Ads (selectivo) + Clarity</option>
                <option value="Meta Ads">Meta Ads (Solo campañas seleccionadas)</option>
                <option value="GMP + Clarity">GMP + Clarity</option>
                <option value="GA4">Google Analytics 4</option>
                <option value="DV360">Display &amp; Video 360</option>
                <option value="SA360">Search Ads 360</option>
                <option value="CM360">Campaign Manager 360</option>
                <option value="Clarity UX">Microsoft Clarity</option>
              </select>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Período
              </label>
              <select
                value={newReportDateRange}
                onChange={(e) => setNewReportDateRange(e.target.value)}
                className="w-full h-[40px] px-3 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
              >
                <option value="Tiempo real (hoy)">Tiempo real (hoy)</option>
                <option value="Últimos 7 días">Últimos 7 días</option>
                <option value="Últimos 30 días">Últimos 30 días</option>
                <option value="Trimestre actual">Trimestre actual</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[14px] font-semibold text-[#161418]">
              Elegí las métricas del reporte (quedan seleccionadas con tilde)
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_REPORT_METRICS.map((m) => {
                const active = newReportMetrics.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() =>
                      toggleMetricSelection(
                        m,
                        newReportMetrics,
                        setNewReportMetrics
                      )
                    }
                    className={`kol-chip-filter px-3 border flex items-center gap-1.5 kol-focus ${
                      active
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#FAF8F6]"
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#C9C3BE]">
            <span className="text-[14px] text-[#46413F]">
              Al crear el reporte, se suma a la tabla inferior listo para descargar en CSV.
            </span>
            <button
              type="submit"
              className="kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap shrink-0 kol-focus"
            >
              <Plus className="w-4 h-4" />
              <span>Crear reporte</span>
            </button>
          </div>
        </form>

        {/* Listado de reportes personalizados */}
        <div className="divide-y divide-[#C9C3BE]">
          {reports.map((rep, idx) => (
            <div
              key={rep.id}
              className="py-5 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#46413F]">
                  <span className="font-kol-display font-extrabold text-[16px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-[#161418]">{rep.id}</span>
                  <span>· {rep.sourcePlatform}</span>
                  <span>· {rep.dateRange}</span>
                  <span className="tabular-nums">
                    · {rep.rowCount.toLocaleString("es-AR")} registros
                  </span>
                </div>

                <h3 className="font-kol-display font-bold text-[18px] leading-[24px] text-[#161418] pt-1">
                  {rep.title}
                </h3>

                <p className="text-[15px] text-[#46413F]">
                  {rep.summaryInsight}
                </p>

                <div className="text-[14px] text-[#161418]">
                  <span className="font-semibold">Métricas incluidas:</span>{" "}
                  {rep.metrics.join(" · ")}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportReportCsv(rep)}
                  className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 flex items-center gap-2 whitespace-nowrap kol-focus"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDeleteReport(rep)}
                  className="text-[14px] font-semibold text-[#C51172] underline decoration-2 underline-offset-4 hover:text-[#A40F5F] px-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloque 2: Programador de informes periódicos por correo electrónico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-5">
          <div className="border-b border-[#C9C3BE] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                2
              </span>
              <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Programá informes por correo
              </h2>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Elegí la frecuencia, el formato y a qué dirección de correo enviar cada informe automáticamente
            </p>
          </div>

          <form onSubmit={handleCreateSchedule} className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Nombre del envío programado
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                required
                className="w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] border border-[#8C8580] rounded-[10px] text-[#161418] kol-focus"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Correo electrónico destinatario
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="nombre@kolaccesorios.com.ar"
                className={`w-full h-[40px] px-3.5 text-[15px] bg-[#FFFFFF] rounded-[10px] text-[#161418] kol-focus ${
                  emailError
                    ? "border-2 border-[#A40F5F]"
                    : "border border-[#8C8580]"
                }`}
              />
              {emailError && (
                <div className="mt-1.5 text-[14px] text-[#A40F5F] font-medium flex items-center gap-1.5">
                  <span className="font-bold">!</span>
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Frecuencia como grupo conectado de segmentados con 2 px entre botones (Lámina 9.2) */}
            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Frecuencia de envío
              </label>
              <div className="flex items-center gap-[2px]">
                {(["Diaria", "Semanal", "Mensual"] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFrequency(freq)}
                    className={`flex-1 kol-btn-normal px-2.5 border flex items-center justify-center gap-1.5 ${
                      frequency === freq
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {frequency === freq && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span>{freq}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Formato del informe
              </label>
              <div className="flex items-center gap-[2px]">
                {(
                  [
                    "HTML Interactivo",
                    "PDF Ejecutivo",
                    "CSV Tabular",
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormat(fmt)}
                    className={`flex-1 kol-btn-normal px-2 border flex items-center justify-center gap-1 text-[13px] ${
                      format === fmt
                        ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                        : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580] hover:bg-[#F3F0ED]"
                    }`}
                  >
                    {format === fmt && <Check className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-[#161418] mb-1.5">
                Métricas clave a incluir
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_REPORT_METRICS.map((m) => {
                  const active = selectedScheduleMetrics.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        toggleMetricSelection(
                          m,
                          selectedScheduleMetrics,
                          setSelectedScheduleMetrics
                        )
                      }
                      className={`kol-chip-filter px-3 border flex items-center gap-1 kol-focus ${
                        active
                          ? "bg-[#E7E3DF] text-[#161418] border-[#161418]"
                          : "bg-[#FFFFFF] text-[#46413F] border-[#8C8580]"
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[14px] text-[#46413F]">
              Al guardar, el informe queda programado y podés enviarlo en el acto para probar la entrega en tu correo.
            </p>

            <button
              type="submit"
              className="w-full kol-btn-normal px-5 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center justify-center gap-2 kol-focus"
            >
              <span>Guardar programación de envío</span>
            </button>
          </form>
        </div>

        {/* Columna derecha (7 cols): Programaciones activas y vista previa del correo enviado */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#C9C3BE] kol-card-12 p-6 space-y-6">
          <div className="border-b border-[#C9C3BE] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-kol-display font-extrabold text-[18px] text-[#C51172] border-b-[3px] border-[#C51172] pb-0.5 leading-none">
                3
              </span>
              <h2 className="font-kol-display font-bold text-[22px] leading-[28px] text-[#161418]">
                Envíos programados y despacho en vivo
              </h2>
            </div>
            <p className="text-[15px] text-[#46413F] mt-2">
              Al presionar «Enviar ahora», redactamos el informe con los datos actuales de KOL y lo enviamos al correo indicado
            </p>
          </div>

          {dispatchError && (
            <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#A40F5F] rounded-[10px] text-[14px] text-[#A40F5F] font-medium flex items-center gap-2">
              <span className="font-bold">!</span>
              <span>{dispatchError}</span>
            </div>
          )}

          <div className="divide-y divide-[#C9C3BE]">
            {schedules.map((sched) => {
              const isSending = isDispatchingId === sched.id;
              return (
                <div
                  key={sched.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="text-[14px] text-[#46413F]">
                      <span className="font-bold text-[#161418]">
                        {sched.active ? "✓ Activo" : "Pausado"}
                      </span>{" "}
                      · {sched.frequency} · {sched.format} · Próximo envío:{" "}
                      {sched.nextRunLabel}
                    </div>

                    <h4 className="font-kol-display font-bold text-[18px] text-[#161418]">
                      {sched.name}
                    </h4>

                    <div className="text-[15px] text-[#161418]">
                      Destinatario:{" "}
                      <span className="font-semibold">{sched.recipientEmail}</span>
                    </div>

                    <div className="text-[14px] text-[#46413F]">
                      Métricas: {sched.metrics.join(" · ")}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDispatchNow(sched)}
                      disabled={isSending}
                      className="kol-btn-normal px-4 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] disabled:opacity-40 flex items-center gap-2 whitespace-nowrap kol-focus"
                    >
                      {isSending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSending ? "Enviando..." : "Enviar ahora"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleSchedule(sched.id)}
                      className="kol-btn-normal px-3.5 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 whitespace-nowrap kol-focus"
                    >
                      {sched.active ? "Pausar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSchedule(sched.id)}
                      className="text-[14px] font-semibold text-[#C51172] underline decoration-2 underline-offset-4 hover:text-[#A40F5F] px-2"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista previa del último correo despachado */}
          {dispatchedLogs.length > 0 && (
            <div className="pt-4 border-t border-[#C9C3BE] space-y-3">
              {/* Aviso de confirmación en rosa énfasis #FFD9E4 con texto negro #161418 */}
              <div className="p-3.5 bg-[#FFD9E4] text-[#161418] border border-[#C9C3BE] rounded-[4px] flex items-center justify-between text-[14px]">
                <span className="font-semibold">
                  ✓ Informe enviado a {dispatchedLogs[0].recipientEmail} ({dispatchedLogs[0].dispatchedAt})
                </span>
                <span className="text-[#C51172] font-bold">
                  {dispatchedLogs[0].deliveryStatus}
                </span>
              </div>

              <div className="p-5 bg-[#F3F0ED] border border-[#C9C3BE] kol-card-12 space-y-3 text-[15px] text-[#161418]">
                <div className="font-kol-display font-bold text-[18px]">
                  Asunto: {dispatchedLogs[0].emailSubject}
                </div>
                <p className="leading-relaxed">
                  {dispatchedLogs[0].executiveSummary}
                </p>

                {dispatchedLogs[0].keyHighlights.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-bold text-[14px]">
                      Cifras protagonistas del período:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[14px]">
                      {dispatchedLogs[0].keyHighlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3.5 bg-[#FFD9E4] text-[#161418] kol-card-12 text-[14px]">
                  <span className="font-bold">Diagnóstico de Clarity:</span>{" "}
                  {dispatchedLogs[0].clarityBehavioralAlert}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
