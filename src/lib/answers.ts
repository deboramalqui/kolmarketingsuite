import { ClarityPageTelemetry, FranchiseCampaignItem, GoogleSearchKeyword } from "../types/marketing";
import { Snapshot, hasData, agoLabel } from "./liveData";
import { ConnectionsStatus } from "./secrets";

export interface AnswerContext {
  snapshot: Snapshot;
  campaigns: FranchiseCampaignItem[];
  connections: ConnectionsStatus;
  clarityPages: ClarityPageTelemetry[];
  searchKeywords?: GoogleSearchKeyword[];
}

export interface Answer {
  text: string;
  source: string;
}

const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toFixed(1).replace(".", ",")} %` : "—");
const NO_DATA: Answer = {
  text: "Todavía no tengo datos de GA4 para contestar eso: la conexión no está activa o todavía no hubo una lectura. Se conecta en Campañas → Datos y archivos → Conexión con Google Analytics.",
  source: "Sin datos",
};

/**
 * Respuestas armadas SOLO con los datos reales que tiene la app (lectura de GA4, campañas cargadas, estado de conexiones).
 * Si el dato no existe, lo dice. No estima ni completa con ejemplos.
 */
export function answerQuestion(question: string, ctx: AnswerContext): Answer {
  const q = question.toLowerCase();
  const { snapshot: s, campaigns, connections } = ctx;
  const f = s.funnel;
  const v = f.page_view.now;
  const c = f.click_cta_formulario.now;
  const i = f.inicio_formulario.now;
  const l = f.lead_franquicia.now;
  const period = `últimos ${s.periodDays} días`;
  const when = `GA4 · ${period} · lectura ${agoLabel(s.fetchedAt)}`;

  if (/conect|conexion|falta/.test(q)) {
    return {
      text: `GA4: ${connections.ga4.connected ? "conectado" : "sin conectar"}.\nClarity: ${connections.clarity ? "clave cargada" : "sin clave en el servidor"}.\nMeta Ads: ${connections.meta ? "clave cargada" : "sin clave (se activa en noviembre)"}.\nSearch Console: no hay lectura propia todavía; se ve dentro de GA4.`,
      source: "Estado de conexiones del servidor",
    };
  }

  if (/tope|presupuesto|cuanto gast|gasto/.test(q) && !/resum/.test(q)) {
    return { text: "No hay un monto por defecto: lo define Kol con administración, en pesos argentinos. Para una prueba conviene una duración corta (14 días) con un tope total chico.", source: "Criterio de trabajo" };
  }

  if (/instagram o en google|conviene lanzar|comparar/.test(q)) {
    const live = campaigns.filter((x) => x.status === "en_vivo" && !x.id.startsWith("demo-"));
    return { text: live.length ? `Hay ${live.length} campaña(s) publicada(s). Mirá sus resultados en Campañas → Por campaña paraguas.` : "Todavía no hay campañas publicadas ni gasto, así que no se puede comparar el costo por consulta entre plataformas.", source: "Campañas cargadas en la herramienta" };
  }

  if (!hasData(s)) return NO_DATA;

  if (/canal|de d[oó]nde|origen|prob/.test(q) || /visita/.test(q) && /d[oó]nde/.test(q)) {
    if (s.channels.length === 0) return { text: "GA4 está conectado pero no devolvió visitas por canal en este período.", source: when };
    const total = s.channels.reduce((a, x) => a + x.visitors, 0);
    const lines = s.channels.slice(0, 5).map((x) => `• ${x.channelGroup}: ${x.visitors} visitas (${pct(x.visitors, total)}), ${x.leads} consulta(s)`).join("\n");
    return { text: `Visitas a las páginas de franquicia por canal:\n${lines}\n${total < 100 ? "Es una muestra chica (menos de 100 personas): es una pista, no una conclusión." : ""}`.trim(), source: when };
  }

  if (/cae|traba|formulario|embudo/.test(q) && !/tarjeta/.test(q)) {
    if (v === 0) return { text: "En este período GA4 no registró visitas a las páginas de franquicia.", source: when };
    const drops = [
      { a: "entran al hub", b: "tocan el botón", from: v, to: c },
      { a: "tocan el botón", b: "empiezan el formulario", from: c, to: i },
      { a: "empiezan el formulario", b: "lo envían", from: i, to: l },
    ];
    const worst = [...drops].filter((d) => d.from > 0).sort((x, y) => (y.from - y.to) / y.from - (x.from - x.to) / x.from)[0];
    return {
      text: `Embudo de los ${period}: ${v} entraron, ${c} tocaron el botón, ${i} empezaron el formulario, ${l} lo enviaron.${worst ? `\nLa mayor caída es entre “${worst.a}” y “${worst.b}”: de ${worst.from} pasan ${worst.to}.` : ""}${v < 100 ? "\nCon tan pocas visitas, un solo caso cambia mucho los porcentajes." : ""}`,
      source: when,
    };
  }

  if (/tarjeta 3|conversi|porcentaje|visita a consulta/.test(q)) {
    return { text: `Mide cuántas de las personas que entran al hub terminan enviando el formulario. Hoy son ${l} de ${v} (${pct(l, v)}).${v < 100 ? " Con menos de 100 visitas, un solo caso cambia mucho el porcentaje." : ""}`, source: `${when} · lead_franquicia` };
  }

  if (/google|buscan|palabras|b[uú]squeda/.test(q)) {
    const kws = [...(ctx.searchKeywords ?? [])].sort((x, y) => y.impressions - x.impressions);
    if (kws.length === 0) {
      return { text: "Todavía no hay búsquedas de Google para mostrar: Search Console no devolvió consultas para las páginas de franquicia, o no está conectado (se prueba en Conexiones).", source: "Sin datos de Search Console" };
    }
    const top = kws.slice(0, 3).map((k) => `“${k.keyword}” (${k.impressions} impresiones, ${k.clicks} ${k.clicks === 1 ? "clic" : "clics"}, posición ${k.avgPosition.toFixed(1).replace(".", ",")})`).join("; ");
    return { text: `Search Console muestra ${kws.length} búsquedas que llevan a las páginas de franquicia. Las que más aparecen: ${top}.`, source: "Google Search Console · últimos 28 días" };
  }

  if (/fricci|clarity|rage|grabaci/.test(q)) {
    const p = ctx.clarityPages.find((x) => x.pageUrl.includes("/franquicia")) || ctx.clarityPages[0];
    return p ? { text: `En ${p.pageUrl}: ${p.rageClicksPct.toFixed(1)} % de clics repetidos, ${p.deadClicksPct.toFixed(1)} % de clics sin respuesta, ${p.sessions} sesiones.`, source: "Microsoft Clarity" } : { text: "Todavía no hay datos de Clarity: falta la clave de exportación en el servidor (CLARITY_API_TOKEN).", source: "Sin datos" };
  }

  if (/resum|semana|5 l[ií]neas/.test(q)) {
    const live = campaigns.filter((x) => !x.id.startsWith("demo-"));
    return {
      text: `• ${v} personas entraron al hub de franquicias (${period}).\n• ${l} consulta(s) enviada(s) (${pct(l, v)}).\n• Período anterior: ${f.page_view.prev} visitas y ${f.lead_franquicia.prev} consultas.\n• ${live.length} campaña(s) cargada(s), ${live.filter((x) => x.status === "en_vivo").length} publicada(s).\n• Sin gasto publicitario registrado.`,
      source: when,
    };
  }

  return {
    text: `Con los datos de GA4 (${period}): ${v} visitas al hub, ${l} consultas (${pct(l, v)}). Probá preguntar por canales, por dónde se cae la gente o por una tarjeta en particular.`,
    source: when,
  };
}

/** Resumen de 5 líneas armado con los datos reales (sin textos fijos) */
export function weeklySummaryLines(ctx: AnswerContext): Array<{ title: string; text: string }> {
  const { snapshot: s, campaigns, clarityPages } = ctx;
  const f = s.funnel;
  const v = f.page_view.now;
  const c = f.click_cta_formulario.now;
  const l = f.lead_franquicia.now;
  const live = hasData(s);
  const real = campaigns.filter((x) => !x.id.startsWith("demo-"));
  const clarity = clarityPages.find((p) => p.pageUrl.includes("/franquicia")) || clarityPages[0];
  const top = [...s.channels].sort((a, b) => b.visitors - a.visitors)[0];
  const dLeads = l - f.lead_franquicia.prev;
  const dVisits = v - f.page_view.prev;
  return [
    {
      title: "Qué pasó",
      text: live ? `${v} personas visitaron las páginas de franquicia en los últimos ${s.periodDays} días y se enviaron ${l} consulta${l === 1 ? "" : "s"} (lead_franquicia).` : "Todavía no hay datos de GA4: la conexión no está activa o no hubo lectura.",
    },
    {
      title: "Qué cambió",
      text: live ? `Contra el período anterior: ${dVisits >= 0 ? "+" : ""}${dVisits} visitas y ${dLeads >= 0 ? "+" : ""}${dLeads} consultas.${top ? ` El canal que más trajo fue ${top.channelGroup} (${top.visitors} visitas).` : ""}` : "Sin datos para comparar.",
    },
    {
      title: "Dónde se traba",
      text: live && v > 0 ? `De ${v} que entraron, ${c} tocaron el botón del formulario (${((c / v) * 100).toFixed(1).replace(".", ",")} %) y ${l} lo enviaron.${v < 100 ? " Con menos de 100 visitas es una muestra chica." : ""}` : "Sin visitas para analizar el embudo.",
    },
    {
      title: "Qué mirar en Clarity",
      text: clarity ? `En ${clarity.pageUrl}: ${clarity.rageClicksPct.toFixed(1)} % de clics repetidos y ${clarity.deadClicksPct.toFixed(1)} % de clics sin respuesta en ${clarity.sessions} sesiones.` : "Todavía no hay datos de Clarity (falta la clave de exportación en el servidor).",
    },
    {
      title: "Próximo paso",
      text: real.length === 0 ? "Todavía no hay campañas cargadas: armar la primera en Campañas, revisarla y publicarla." : `Hay ${real.length} campaña${real.length === 1 ? "" : "s"} cargada${real.length === 1 ? "" : "s"} (${real.filter((x) => x.status === "en_vivo").length} publicada${real.filter((x) => x.status === "en_vivo").length === 1 ? "" : "s"}). Revisar los resultados en Campañas → Por campaña paraguas.`,
    },
  ];
}
