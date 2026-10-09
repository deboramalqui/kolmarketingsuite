import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Shuffle,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Globe,
  Tag,
} from 'lucide-react';
import { KeywordItem, SitelinkItem } from '../types/marketing';

export interface GoogleSearchAdEditorState {
  headlines: string[]; // hasta 15, max 30 chars
  descriptions: string[]; // hasta 4, max 90 chars
  domain: string;
  path1: string;
  path2: string;
  sitelinks: SitelinkItem[];
  callouts: string[];
  keywords: KeywordItem[];
  negativeKeywords: string[];
}

interface GoogleSearchAdEditorAndPreviewProps {
  state: GoogleSearchAdEditorState;
  onChange: (next: GoogleSearchAdEditorState) => void;
  readOnly?: boolean;
}

export const GoogleSearchAdEditorAndPreview: React.FC<GoogleSearchAdEditorAndPreviewProps> = ({
  state,
  onChange,
  readOnly = false,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [combinationSeed, setCombinationSeed] = useState(0);

  // Funciones de actualización de estado
  const updateHeadlines = (index: number, val: string) => {
    const next = [...state.headlines];
    next[index] = val;
    onChange({ ...state, headlines: next });
  };

  const addHeadline = () => {
    if (state.headlines.length < 15) {
      onChange({ ...state, headlines: [...state.headlines, ''] });
    }
  };

  const removeHeadline = (index: number) => {
    if (state.headlines.length > 3) {
      const next = state.headlines.filter((_, i) => i !== index);
      onChange({ ...state, headlines: next });
    }
  };

  const updateDescriptions = (index: number, val: string) => {
    const next = [...state.descriptions];
    next[index] = val;
    onChange({ ...state, descriptions: next });
  };

  const addDescription = () => {
    if (state.descriptions.length < 4) {
      onChange({ ...state, descriptions: [...state.descriptions, ''] });
    }
  };

  const removeDescription = (index: number) => {
    if (state.descriptions.length > 2) {
      const next = state.descriptions.filter((_, i) => i !== index);
      onChange({ ...state, descriptions: next });
    }
  };

  const updateKeyword = (index: number, field: keyof KeywordItem, val: any) => {
    const next = [...state.keywords];
    next[index] = { ...next[index], [field]: val };
    onChange({ ...state, keywords: next });
  };

  const addKeyword = () => {
    onChange({
      ...state,
      keywords: [...state.keywords, { keyword: '', matchType: 'phrase' }],
    });
  };

  const removeKeyword = (index: number) => {
    const next = state.keywords.filter((_, i) => i !== index);
    onChange({ ...state, keywords: next });
  };

  // Botón "Ver otra combinación"
  const handleShuffleCombination = () => {
    setCombinationSeed((prev) => prev + 1);
  };

  // Selección de títulos y descripciones para la combinación actual
  const validHeadlines = state.headlines.filter((h) => h.trim().length > 0);
  const validDescriptions = state.descriptions.filter((d) => d.trim().length > 0);

  const getCombinedHeadlines = () => {
    if (validHeadlines.length === 0) return ['Franquicia KOL Accesorios', 'Derecho inicial US$ 3.000'];
    const h1 = validHeadlines[combinationSeed % validHeadlines.length];
    const h2 = validHeadlines[(combinationSeed + 1) % validHeadlines.length] || validHeadlines[0];
    const h3 = validHeadlines.length > 2 ? validHeadlines[(combinationSeed + 2) % validHeadlines.length] : null;
    return [h1, h2, h3].filter(Boolean) as string[];
  };

  const getCombinedDescriptions = () => {
    if (validDescriptions.length === 0)
      return ['Abrí tu local de accesorios para celulares con red consolidada de 10 locales.'];
    const d1 = validDescriptions[combinationSeed % validDescriptions.length];
    const d2 = validDescriptions.length > 1 ? validDescriptions[(combinationSeed + 1) % validDescriptions.length] : null;
    return [d1, d2].filter(Boolean) as string[];
  };

  const currentDisplayHeadlines = getCombinedHeadlines();
  const currentDisplayDescriptions = getCombinedDescriptions();

  // Chequeos de calidad en vivo
  const allCopy = `${state.headlines.join(' ')} ${state.descriptions.join(' ')}`.toLowerCase();

  // 1. Derecho inicial US$ 3.000 sin "desde"
  const hasDesdeFee = /desde\s+(us\$|u\$s|\$)?\s*3\.?000/i.test(allCopy);

  // 2. No decir "10 locales en el país" (decir "10 locales")
  const has10LocalesPais = /10\s+locales\s+(en\s+el\s+pa[íi]s|del\s+pa[íi]s)/i.test(allCopy);

  // 3. No nombrar Buenos Aires como zona con locales
  const mentionsBuenosAires = /(buenos\s+aires|caba|capital\s+federal)/i.test(allCopy);

  // 4. Sin signos de exclamación en títulos
  const headlinesWithExclamation = state.headlines.filter((h) => h.includes('!') || h.includes('¡'));

  // 5. "modelo probado" marcado como a validar
  const mentionsModeloProbado = /modelo\s+probado/i.test(allCopy);

  return (
    <div className="space-y-6">
      {/* Barra de Controles de Vista Previa */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Vista Previa Google Search:
          </span>
          <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                device === 'desktop'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Computadora
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                device === 'mobile'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Celular
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleShuffleCombination}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
            Ver otra combinación
          </button>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Combinación #{combinationSeed + 1}
          </span>
        </div>
      </div>

      {/* Grid: Editor + Previsualización */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PANEL DE EDICIÓN */}
        <div className="lg:col-span-7 space-y-6 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          {/* TÍTULOS (hasta 15, máx 30 caracteres) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Títulos ({state.headlines.length}/15)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Google rotará hasta 3 títulos por impresión. Máximo 30 caracteres.
                </p>
              </div>
              {!readOnly && state.headlines.length < 15 && (
                <button
                  type="button"
                  onClick={addHeadline}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/50"
                >
                  <Plus className="w-3 h-3" /> Añadir Título
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {state.headlines.map((headline, idx) => {
                const len = headline.length;
                const isOver = len > 30;
                const hasExcl = headline.includes('!') || headline.includes('¡');
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        disabled={readOnly}
                        value={headline}
                        onChange={(e) => updateHeadlines(idx, e.target.value)}
                        placeholder={`Título ${idx + 1}...`}
                        className={`w-full px-3 py-1.5 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none pr-16 ${
                          isOver || hasExcl
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-800 focus:border-emerald-500'
                        }`}
                      />
                      <span
                        className={`absolute right-2.5 top-2 text-[10px] font-mono font-bold ${
                          isOver ? 'text-red-400 bg-red-950/80 px-1 rounded' : 'text-slate-500'
                        }`}
                      >
                        {len}/30
                      </span>
                    </div>
                    {!readOnly && state.headlines.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeHeadline(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DESCRIPCIONES (hasta 4, máx 90 caracteres) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Descripciones ({state.descriptions.length}/4)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Google rotará hasta 2 descripciones por impresión. Máximo 90 caracteres.
                </p>
              </div>
              {!readOnly && state.descriptions.length < 4 && (
                <button
                  type="button"
                  onClick={addDescription}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/50"
                >
                  <Plus className="w-3 h-3" /> Añadir Descripción
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {state.descriptions.map((desc, idx) => {
                const len = desc.length;
                const isOver = len > 90;
                return (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[11px] font-mono text-slate-500 w-5 text-right mt-2">
                      {idx + 1}.
                    </span>
                    <div className="relative flex-1">
                      <textarea
                        rows={2}
                        disabled={readOnly}
                        value={desc}
                        onChange={(e) => updateDescriptions(idx, e.target.value)}
                        placeholder={`Descripción ${idx + 1}...`}
                        className={`w-full px-3 py-1.5 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none pr-16 ${
                          isOver
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-slate-800 focus:border-emerald-500'
                        }`}
                      />
                      <span
                        className={`absolute right-2.5 bottom-2.5 text-[10px] font-mono font-bold ${
                          isOver ? 'text-red-400 bg-red-950/80 px-1 rounded' : 'text-slate-500'
                        }`}
                      >
                        {len}/90
                      </span>
                    </div>
                    {!readOnly && state.descriptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeDescription(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 mt-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RUTA VISIBLE (Display Path) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Ruta visible (Rutas de dirección en el anuncio)
            </label>
            <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
              <span className="text-slate-300 font-semibold">{state.domain}</span>
              <span>/</span>
              <input
                type="text"
                disabled={readOnly}
                value={state.path1}
                maxLength={15}
                onChange={(e) => onChange({ ...state, path1: e.target.value })}
                placeholder="franquicias"
                className="w-28 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
              />
              <span>/</span>
              <input
                type="text"
                disabled={readOnly}
                value={state.path2}
                maxLength={15}
                onChange={(e) => onChange({ ...state, path2: e.target.value })}
                placeholder="inversion"
                className="w-28 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-white"
              />
            </div>
          </div>

          {/* PALABRAS CLAVE CON CONCORDANCIA Y NEGATIVAS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Palabras Clave & Tipos de Concordancia
                </h4>
                <p className="text-[11px] text-slate-400">
                  Exacta [palabra], Frase "palabra", Amplia +palabra.
                </p>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={addKeyword}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md hover:bg-emerald-900/50"
                >
                  <Plus className="w-3 h-3" /> Añadir Keyword
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {state.keywords.map((kw, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800"
                >
                  <input
                    type="text"
                    disabled={readOnly}
                    value={kw.keyword}
                    onChange={(e) => updateKeyword(idx, 'keyword', e.target.value)}
                    placeholder="Palabra clave..."
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                  />
                  <select
                    disabled={readOnly}
                    value={kw.matchType}
                    onChange={(e) => updateKeyword(idx, 'matchType', e.target.value)}
                    className="bg-slate-900 text-[11px] text-slate-300 px-2 py-1 rounded border border-slate-700"
                  >
                    <option value="phrase">Frase " "</option>
                    <option value="exact">Exacta [ ]</option>
                    <option value="broad">Amplia</option>
                  </select>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeKeyword(idx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Palabras clave negativas */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 block">
                Palabras Clave Negativas (-palabras para excluir tráfico no cualificado):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {state.negativeKeywords.map((neg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-red-950/60 text-red-300 border border-red-900/60"
                  >
                    -{neg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CHECKLIST DE CALIDAD EN VIVO (Reglas 4) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Validación en Vivo de Google Search Copy
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                {hasDesdeFee ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={hasDesdeFee ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    Derecho inicial US$ 3.000 sin "desde"
                  </span>
                  {hasDesdeFee && (
                    <p className="text-[11px] text-red-400">
                      Eliminar la palabra "desde". Mantener "Derecho inicial US$ 3.000".
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                {has10LocalesPais ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={has10LocalesPais ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    Decir exactamente "10 locales" (sin "en el país")
                  </span>
                  {has10LocalesPais && (
                    <p className="text-[11px] text-red-400">
                      Evitar la frase "en el país".
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                {mentionsBuenosAires ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={mentionsBuenosAires ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    Sin nombrar Buenos Aires como zona con locales
                  </span>
                  {mentionsBuenosAires && (
                    <p className="text-[11px] text-red-400">
                      KOL opera en el interior (Rosario, Córdoba, Mendoza, San Juan). No nombrar Buenos Aires.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                {headlinesWithExclamation.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span
                    className={
                      headlinesWithExclamation.length > 0
                        ? 'text-red-300 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    Sin signos de exclamación en títulos ({headlinesWithExclamation.length} detectados)
                  </span>
                  {headlinesWithExclamation.length > 0 && (
                    <p className="text-[11px] text-red-400">
                      Las políticas de Google Ads rechazan anuncios de búsqueda con signos '!'.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <div>
                  <span className="text-amber-300 font-medium">
                    "Modelo probado" catalogado como: a validar
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {mentionsModeloProbado
                      ? 'La frase "modelo probado" fue detectada. Requiere respaldo documental.'
                      : 'Sin afirmaciones no contrastadas.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW EN VIVO DE GOOGLE SEARCH (Solo texto, sin imagen) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full sticky top-6">
            <span className="text-xs font-bold text-slate-400 mb-3 block text-center uppercase tracking-wider">
              {device === 'desktop' ? 'Google Búsqueda (Computadora)' : 'Google Búsqueda (Celular)'}
            </span>

            {/* CAJA DE RESULTADO GOOGLE SEARCH */}
            <div
              className={`w-full bg-[#202124] text-[#bdc1c6] p-5 rounded-2xl border border-slate-800 shadow-2xl font-sans text-xs ${
                device === 'mobile' ? 'max-w-sm mx-auto' : ''
              }`}
            >
              {/* Encabezado URL + Badge Patrocinado */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-400">K</span>
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white truncate">KOL Accesorios</span>
                    <span className="text-[10px] text-[#9aa0a6]">·</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                      Patrocinado
                    </span>
                  </div>
                  <div className="text-[11px] text-[#bdc1c6] truncate font-mono">
                    https://{state.domain}
                    {state.path1 && ` › ${state.path1}`}
                    {state.path2 && ` › ${state.path2}`}
                  </div>
                </div>
              </div>

              {/* Título Principal Azul de Google */}
              <div className="mb-2">
                <h3 className="text-base sm:text-lg font-medium text-[#8ab4f8] hover:underline cursor-pointer leading-snug">
                  {currentDisplayHeadlines.join(' | ')}
                </h3>
              </div>

              {/* Descripciones de texto */}
              <div className="text-[13px] text-[#bdc1c6] leading-relaxed mb-3">
                {currentDisplayDescriptions.join(' ')}
              </div>

              {/* Destacados (Callouts) */}
              {state.callouts && state.callouts.length > 0 && (
                <div className="text-[12px] text-[#9aa0a6] mb-3 flex flex-wrap gap-x-2">
                  {state.callouts.map((callout, i) => (
                    <span key={i} className="inline-block">
                      • {callout}
                    </span>
                  ))}
                </div>
              )}

              {/* Enlaces de Sitio (Sitelinks) */}
              {state.sitelinks && state.sitelinks.length > 0 && (
                <div
                  className={`mt-4 pt-3 border-t border-slate-800 ${
                    device === 'desktop'
                      ? 'grid grid-cols-2 gap-4'
                      : 'flex flex-col space-y-3'
                  }`}
                >
                  {state.sitelinks.map((sitelink, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <a
                        href="#link"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs sm:text-sm font-medium text-[#8ab4f8] hover:underline block truncate"
                      >
                        {sitelink.text}
                      </a>
                      {sitelink.line1 && (
                        <p className="text-[11px] text-[#9aa0a6] leading-snug truncate">
                          {sitelink.line1}
                        </p>
                      )}
                      {sitelink.line2 && (
                        <p className="text-[11px] text-[#9aa0a6] leading-snug truncate">
                          {sitelink.line2}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aviso explicativo */}
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Anuncio de búsqueda responsivo: Google combina dinámicamente títulos y descripciones según la consulta del usuario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
