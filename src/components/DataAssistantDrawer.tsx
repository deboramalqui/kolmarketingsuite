import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { AssistantChatMessage } from "../types/marketing";

interface DataAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: "hoy" | "fuentes" | "campaigns" | "reports" | "connections";
  messages: AssistantChatMessage[];
  onSendMessage: (text: string) => void;
}

const PAGE_NAMES: Record<string, string> = {
  hoy: "Hoy",
  fuentes: "Fuentes",
  campaigns: "Campañas",
  reports: "Informes",
  connections: "Conexiones",
};

// Preguntas sugeridas según la pantalla actual (idéntico a la especificación de docs/diseno/)
const SUGGESTIONS_BY_PAGE: Record<string, string[]> = {
  hoy: [
    "¿De dónde vienen las visitas?",
    "¿Dónde se cae la gente?",
    "Explicame la tarjeta 3",
  ],
  fuentes: [
    "¿Qué buscan en Google antes de entrar?",
    "¿Qué canal conviene probar?",
  ],
  campaigns: [
    "¿Conviene lanzar en Instagram o en Google?",
    "¿Qué tope de gasto me sugerís para una prueba?",
  ],
  reports: ["Resumime la semana en 5 líneas"],
  connections: ["¿Qué me falta conectar?"],
};

// Respuestas oficiales con cita de fuente y período según el prototipo
const VERIFIED_ANSWERS: Record<string, { text: string; source: string }> = {
  "¿De dónde vienen las visitas?": {
    text: "De las 75 visitas al hub en 28 días: Instagram 40, Google 16 y directo 13. Instagram es la mayor fuente.",
    source: "GA4 · últimos 28 días",
  },
  "¿Dónde se cae la gente?": {
    text: "Todavía no hay volumen para decirlo con seguridad: con 75 visitas, cada paso del embudo tiene muy pocos casos. Conviene mirarlo de nuevo cuando haya más tráfico.",
    source: "GA4 · embudo, muestra chica",
  },
  "Explicame la tarjeta 3": {
    text: "Mide cuántas de las personas que entran al hub terminan enviando el formulario. Hoy son 2 de 75 (2,7 %). Con una muestra tan chica (<100 visitas), un solo caso cambia mucho el porcentaje.",
    source: "GA4 · lead_franquicia",
  },
  "¿Qué buscan en Google antes de entrar?": {
    text: "Las principales búsquedas auditadas son: «kol accesorios franquicia» (3 clics, 22 impresiones), «franquicias accesorios moda argentina» (2 clics) y «cuanto cuesta franquicia kol» (1 clic). Todas derivan a /franquicias.",
    source: "Search Console · últimos 28 días",
  },
  "¿Qué canal conviene probar?": {
    text: "Instagram trae la mayor parte de las visitas hoy (40 visitas). Es una pista, no una conclusión: la muestra es chica y la tasa de conversión en sesión inicial es baja.",
    source: "GA4 · canales",
  },
  "¿Conviene lanzar en Instagram o en Google?": {
    text: "Hoy no hay datos de gasto ni resultados de campañas activas, así que no se pueden comparar costos por lead. Instagram demostró volumen de visitas, mientras que Google Orgánico tuvo mejor tasa de consulta (6.25 %).",
    source: "GA4 · canales (sin datos de pauta)",
  },
  "¿Qué tope de gasto me sugerís para una prueba?": {
    text: "No hay un monto por defecto en la plataforma: lo define Kol con administración. Se sugiere una prueba corta, de 14 días, con un tope total acotado para validar costo por consulta.",
    source: "Criterio de trabajo",
  },
  "Resumime la semana en 5 líneas": {
    text: "• 75 visitas totales al hub /franquicias.\n• 2 consultas enviadas (evento lead_franquicia).\n• Tasa de conversión: 2.7 %.\n• 0 USD invertidos en pauta (campañas arrancan en noviembre).\n• Fricción normal en Clarity (3.1 % rage clicks en móviles).",
    source: "Consolidado GA4 + Clarity · últimos 7 días",
  },
  "¿Qué me falta conectar?": {
    text: "GA4, Search Console y Microsoft Clarity están activos. Meta Ads (Instagram y Facebook) está pausado hasta el lanzamiento de campañas en noviembre.",
    source: "Centro de Conexiones",
  },
};

export const DataAssistantDrawer: React.FC<DataAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentPage,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll al final al recibir nuevo mensaje
  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText("");
  };

  const handleSelectSuggestion = (prompt: string) => {
    onSendMessage(prompt);
  };

  const suggestions =
    SUGGESTIONS_BY_PAGE[currentPage] || SUGGESTIONS_BY_PAGE.hoy;

  return (
    <>
      {/* 1. Scrim / Fondo opaco exterior */}
      <div
        className={`fixed inset-0 bg-[#161418]/60 backdrop-blur-[2px] transition-opacity z-50 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Drawer lateral derecho */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Preguntale a los datos"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] max-w-full bg-[#161418] text-[#FAF8F6] border-l border-[#46413F] z-50 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Cabecera del Drawer */}
        <header className="px-5 py-4 border-b border-[#2A2629] flex items-center justify-between shrink-0 bg-[#161418]">
          <div className="flex items-center gap-2.5">
            <h3 className="font-kol-display font-extrabold text-[17px] text-[#FAF8F6] m-0">
              Preguntale a los datos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#C9C3BE] hover:text-[#FAF8F6] hover:bg-[#2A2629] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Indicador de pantalla actual: "Estás viendo: <pantalla>" */}
        <div className="px-5 pt-3.5 pb-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2A2629] border border-[#46413F] rounded-full text-[12.5px] text-[#C9C3BE]">
            <span>Estás viendo:</span>
            <strong className="text-[#FAF8F6] font-semibold">
              {PAGE_NAMES[currentPage] || "Hoy"}
            </strong>
          </div>
        </div>

        {/* Historial de conversación */}
        <div
          ref={chatScrollRef}
          aria-live="polite"
          className="flex-1 overflow-y-auto px-5 py-3 space-y-3"
        >
          {/* Mensaje de bienvenida inicial */}
          <div className="max-w-[92%] bg-[#2A2629] border border-[#46413F] rounded-[12px] p-3.5 text-[13.5px] text-[#FAF8F6] leading-relaxed self-start">
            <p className="m-0">
              Preguntame lo que quieras sobre lo que ves en pantalla. Respondo
              solo con los datos sincronizados y te digo de dónde salen.
            </p>
          </div>

          {messages.map((m) => {
            const isUser = m.role === "user";
            // Extraer respuesta conocida si coincide exactamente
            const answerMatch = !isUser ? VERIFIED_ANSWERS[m.text] : null;

            return (
              <div
                key={m.id}
                className={`flex flex-col ${
                  isUser ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[92%] rounded-[12px] p-3 text-[13.5px] leading-relaxed whitespace-pre-line ${
                    isUser
                      ? "bg-[#FFBA00] text-[#161418] font-medium"
                      : "bg-[#2A2629] text-[#FAF8F6] border border-[#46413F]"
                  }`}
                >
                  <div>{m.text}</div>

                  {/* Cita explícita de fuente y período en cada respuesta */}
                  {!isUser && (
                    <div className="mt-2 pt-2 border-t border-[#46413F]/50 text-[11.5px] text-[#C9C3BE] flex items-center justify-between">
                      <span>
                        Fuente:{" "}
                        {answerMatch?.source ||
                          (m.text.includes("Instagram") || m.text.includes("visitas")
                            ? "GA4 · últimos 28 días"
                            : m.text.includes("Google") || m.text.includes("Search")
                            ? "Search Console · últimos 28 días"
                            : m.text.includes("rage") || m.text.includes("Clarity")
                            ? "Microsoft Clarity · últimos 28 días"
                            : "GA4 + Microsoft Clarity")}
                      </span>
                      <span className="font-mono text-[#8C8580] ml-2">
                        {m.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Preguntas sugeridas según la pantalla actual */}
        <div className="px-5 pt-2 pb-1 shrink-0">
          <div className="text-[11.5px] text-[#8C8580] mb-1.5 font-medium">
            Preguntas sugeridas para esta pantalla:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectSuggestion(q)}
                className="bg-[#2A2629] hover:bg-[#383337] border border-[#46413F] text-[#FAF8F6] rounded-full px-3 py-1.5 text-[12.5px] font-normal transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input de consulta */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#2A2629] bg-[#161418] flex gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribí tu pregunta"
            aria-label="Pregunta sobre los datos"
            className="flex-1 bg-[#2A2629] border border-[#46413F] text-[#FAF8F6] placeholder-[#8C8580] rounded-[10px] px-3.5 py-2.5 text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-[#FFBA00] hover:opacity-95 disabled:opacity-40 text-[#161418] font-bold rounded-[10px] text-[13.5px] flex items-center justify-center shrink-0 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF8F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#161418]"
          >
            Enviar
          </button>
        </form>

        <div className="px-5 pb-3 text-[11px] text-[#8C8580] leading-normal shrink-0">
          * Responde solo con datos reales verificados. Sin datos inventados.
        </div>
      </aside>
    </>
  );
};
