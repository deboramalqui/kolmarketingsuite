import React, { useState } from "react";
import { Download, Copy, Check, Info } from "lucide-react";
import type { GoogleSearchKeyword } from "../types/marketing";
import type { Snapshot } from "../lib/liveData";
import { hasData } from "../lib/liveData";
import { downloadCsv } from "../lib/exportCsv";

interface InformesViewProps {
  snapshot: Snapshot;
  searchKeywords: GoogleSearchKeyword[];
  summaryLines: Array<{ title: string; text: string }>;
}

const EVENT_NAMES: Array<[keyof Snapshot["funnel"], string]> = [
  ["page_view", "Entra a las páginas de franquicia"],
  ["click_cta_formulario", "Toca el botón del formulario"],
  ["inicio_formulario", "Empieza el formulario"],
  ["lead_franquicia", "Envía la consulta"],
];

const stamp = () => new Date().toISOString().slice(0, 10);

export const InformesView: React.FC<InformesViewProps> = ({ snapshot, searchKeywords, summaryLines }) => {
  const [copied, setCopied] = useState(false);
  const live = hasData(snapshot);
  const pages = snapshot.pages ?? [];

  const copySummary = async () => {
    const text = summaryLines.map((l, i) => `${i + 1}. ${l.title}: ${l.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const downloads: Array<{ id: string; title: string; text: string; count: number; run: () => void }> = [
    {
      id: "embudo",
      title: "Embudo de captación",
      text: "Los 4 pasos, con el período actual y el anterior.",
      count: live ? EVENT_NAMES.length : 0,
      run: () =>
        downloadCsv(
          `embudo-franquicias-${stamp()}.csv`,
          ["Paso", "Evento", "Personas (últimos 28 días)", "Personas (28 días anteriores)"],
          EVENT_NAMES.map(([ev, name], i) => [i + 1 + ". " + name, ev, snapshot.funnel[ev].now, snapshot.funnel[ev].prev])
        ),
    },
    {
      id: "paginas",
      title: "Páginas de franquicia",
      text: "Sesiones, usuarios, rebote y consultas por página.",
      count: pages.length,
      run: () =>
        downloadCsv(
          `paginas-franquicia-${stamp()}.csv`,
          ["Página", "Sesiones", "Usuarios", "Tasa de rebote %", "Consultas enviadas"],
          pages.map((p) => [p.path, p.sessions, p.users, p.bounceRatePct, p.leads])
        ),
    },
    {
      id: "canales",
      title: "Canales de origen",
      text: "De dónde llegan las personas y cuántas consultan.",
      count: snapshot.channels.length,
      run: () =>
        downloadCsv(
          `canales-franquicia-${stamp()}.csv`,
          ["Canal", "Visitantes", "Consultas"],
          snapshot.channels.map((c) => [c.channelGroup, c.visitors, c.leads])
        ),
    },
    {
      id: "busquedas",
      title: "Búsquedas en Google",
      text: "Consultas de Search Console que llevan a las páginas de franquicia.",
      count: searchKeywords.length,
      run: () =>
        downloadCsv(
          `busquedas-google-${stamp()}.csv`,
          ["Consulta", "Página", "Clics", "Impresiones", "CTR %", "Posición promedio"],
          searchKeywords.map((k) => [k.keyword, k.landingPage ?? "", k.clicks, k.impressions, k.ctrPct, k.avgPosition])
        ),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9C3BE] pb-3">
          <div>
            <h2 className="font-kol-display font-bold text-[20px] text-[#161418]">Resumen semanal de franquicias</h2>
            <p className="text-[14px] text-[#46413F] mt-0.5">
              Cinco líneas en español claro, armadas solo con datos reales. Período de 28 días.
              {snapshot.fetchedAt ? ` Última lectura: ${new Date(snapshot.fetchedAt).toLocaleString("es-AR")}.` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={copySummary}
            className="kol-btn-normal px-4 bg-[#C51172] hover:bg-[#A40F5F] text-[#FFFFFF] flex items-center gap-2 whitespace-nowrap kol-focus"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copiado" : "Copiar resumen"}</span>
          </button>
        </div>
        <div className="space-y-2.5 text-[15px] text-[#161418] leading-relaxed">
          {summaryLines.map((l, i) => (
            <div key={l.title} className="flex items-start gap-2.5">
              <strong className="text-[#C51172] shrink-0 font-bold">
                {i + 1}. {l.title}:
              </strong>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#FFFFFF] border border-[#C9C3BE] rounded-[12px] p-6 space-y-4">
        <div className="border-b border-[#C9C3BE] pb-3">
          <h2 className="font-kol-display font-bold text-[20px] text-[#161418]">Descargar los datos reales (CSV)</h2>
          <p className="text-[14px] text-[#46413F] mt-0.5">
            Se abren en Excel o Google Sheets. Salen tal cual los lee GA4 o Search Console: nada se completa ni se estima.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {downloads.map((d) => (
            <div key={d.id} className="bg-[#FAF8F6] border border-[#C9C3BE] rounded-[12px] p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="font-kol-display font-bold text-[16px] text-[#161418]">{d.title}</div>
                <p className="text-[14px] text-[#46413F] mt-1">{d.text}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] text-[#46413F] tabular-nums">{d.count > 0 ? `${d.count} filas` : "Sin datos"}</span>
                <button
                  type="button"
                  disabled={d.count === 0}
                  onClick={d.run}
                  className="kol-btn-normal px-4 bg-[#E7E3DF] text-[#2A2629] border border-[#8C8580] hover:bg-[#C9C3BE]/50 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap kol-focus"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar CSV</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#F3F0ED] border border-[#C9C3BE] border-l-4 border-l-[#C51172] rounded-[12px] p-4 flex items-start gap-3" role="status">
        <Info className="w-5 h-5 shrink-0 text-[#161418] mt-0.5" aria-hidden="true" />
        <p className="text-[14px] text-[#161418] font-semibold leading-snug">
          Hoy los informes no se envían por correo: el envío automático todavía no está conectado. Copiá el resumen o descargá los CSV.
          Cuando se conecte el envío, se activa en esta pantalla.
        </p>
      </section>
    </div>
  );
};
