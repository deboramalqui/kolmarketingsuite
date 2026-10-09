import React, { useState } from 'react';
import { KolLogo } from './KolLogo';
import { KolLockup } from './KolLockup';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Globe,
  Sparkles,
} from 'lucide-react';

export interface MetaAdEditorState {
  pageName: string;
  primaryText: string;
  headline: string;
  description: string;
  domain: string;
  callToAction: string;
  avatarVariant: 'claro' | 'oscuro';
  showSello: boolean;
  imageUrl: string;
}

interface MetaAdEditorAndPreviewProps {
  state: MetaAdEditorState;
  onChange: (next: MetaAdEditorState) => void;
  readOnly?: boolean;
}

export const MetaAdEditorAndPreview: React.FC<MetaAdEditorAndPreviewProps> = ({
  state,
  onChange,
  readOnly = false,
}) => {
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [expandedIgText, setExpandedIgText] = useState(false);
  const [expandedFbText, setExpandedFbText] = useState(false);

  const updateField = <K extends keyof MetaAdEditorState>(field: K, value: MetaAdEditorState[K]) => {
    onChange({
      ...state,
      [field]: value,
    });
  };

  // Chequeos en vivo de compliance según directivas KOL:
  // 1. Derecho inicial US$ 3.000 sin "desde"
  const allCopy = `${state.primaryText} ${state.headline} ${state.description}`.toLowerCase();
  const hasDesdeFee = /desde\s+(us\$|u\$s|\$)?\s*3\.?000/i.test(allCopy);
  const mentionsFee = /(us\$|u\$s)\s*3\.?000/i.test(allCopy);

  // 2. No decir "10 locales en el país" (decir "10 locales")
  const has10LocalesPais = /10\s+locales\s+(en\s+el\s+pa[íi]s|del\s+pa[íi]s)/i.test(allCopy);
  const mentions10Locales = /10\s+locales/i.test(allCopy);

  // 3. No nombrar Buenos Aires como zona con locales
  const mentionsBuenosAires = /(buenos\s+aires|caba|capital\s+federal)/i.test(allCopy);

  // 4. Sin signos de exclamación en títulos
  const hasExclamationInHeadline = state.headline.includes('!') || state.headline.includes('¡');

  // 5. "modelo probado" marcado como a validar
  const mentionsModeloProbado = /modelo\s+probado/i.test(allCopy);

  // Texto recortado para Instagram (125 chars)
  const igCharLimit = 125;
  const isIgTextLong = state.primaryText.length > igCharLimit;
  const igDisplayText = isIgTextLong && !expandedIgText
    ? state.primaryText.slice(0, igCharLimit) + '...'
    : state.primaryText;

  // Texto recortado para Facebook
  const fbCharLimit = 180;
  const isFbTextLong = state.primaryText.length > fbCharLimit;
  const fbDisplayText = isFbTextLong && !expandedFbText
    ? state.primaryText.slice(0, fbCharLimit) + '...'
    : state.primaryText;

  return (
    <div className="space-y-6">
      {/* Selector de plataforma de previsualización */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Vista previa de Meta:
          </span>
          <div className="inline-flex p-1 rounded-lg bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setActivePlatform('instagram')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activePlatform === 'instagram'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Instagram Feed
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform('facebook')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activePlatform === 'facebook'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facebook Feed
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Edición en tiempo real
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-emerald-400">{state.domain}</span>
        </div>
      </div>

      {/* Grid: Editor a la izquierda + Preview a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PANEL DE EDICIÓN */}
        <div className="lg:col-span-7 space-y-5 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Parámetros y Textos del Anuncio
            </h3>
            <span className="text-xs text-slate-400">Edición en vivo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre de la Página
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={state.pageName}
                onChange={(e) => updateField('pageName', e.target.value)}
                placeholder="Ej: KOL Accesorios"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Dominio visible
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={state.domain}
                onChange={(e) => updateField('domain', e.target.value)}
                placeholder="kolaccesorios.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Texto Principal (Copy del post)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {state.primaryText.length} caracteres
              </span>
            </div>
            <textarea
              rows={4}
              disabled={readOnly}
              value={state.primaryText}
              onChange={(e) => updateField('primaryText', e.target.value)}
              placeholder="Escribí el texto persuasivo del anuncio..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              En Instagram los primeros 125 caracteres se muestran antes del botón "más".
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Título del Enlace (FB)
                </label>
                {hasExclamationInHeadline && (
                  <span className="text-[10px] text-red-400 font-bold">¡Sin signos '!'</span>
                )}
              </div>
              <input
                type="text"
                disabled={readOnly}
                value={state.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="Ej: Franquicia KOL Accesorios"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none focus:ring-1 ${
                  hasExclamationInHeadline
                    ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Visible en Facebook bajo la imagen (no en Instagram).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Descripción Adicional (FB)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={state.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Ej: Derecho inicial US$ 3.000 · 0% Regalías"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Botón de Llamada a la Acción (CTA)
              </label>
              <select
                disabled={readOnly}
                value={state.callToAction}
                onChange={(e) => updateField('callToAction', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Más información">Más información</option>
                <option value="Contactar">Contactar</option>
                <option value="Enviar mensaje">Enviar mensaje</option>
                <option value="Registrarte">Registrarte</option>
                <option value="Solicitar información">Solicitar información</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL Imagen Creativa
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={state.imageUrl}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Opciones de Identidad Visual */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Configuración Visual de Marca
            </span>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300">Fondo de Isotipo:</span>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateField('avatarVariant', 'claro')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    state.avatarVariant === 'claro'
                      ? 'border-emerald-500 bg-white text-slate-950 font-bold'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <KolLogo size={18} variant="claro" />
                  Blanco
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateField('avatarVariant', 'oscuro')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    state.avatarVariant === 'oscuro'
                      ? 'border-emerald-500 bg-slate-900 text-white font-bold ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <KolLogo size={18} variant="oscuro" />
                  Negro
                </button>
              </div>

              {/* Casilla de sello sobre imagen */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={state.showSello}
                  onChange={(e) => updateField('showSello', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <span className="font-semibold">
                  Activar sello "KOL FRANQUICIAS" sobre la imagen
                </span>
              </label>
            </div>
          </div>

          {/* CHECKLIST DE CALIDAD EN VIVO (Reglas 4) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Validación en Vivo de Copy & Compliance KOL
            </span>

            <div className="space-y-2 text-xs">
              {/* Regla 1: Derecho inicial US$ 3.000 sin "desde" */}
              <div className="flex items-start gap-2">
                {hasDesdeFee ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={hasDesdeFee ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    Derecho inicial US$ 3.000 (sin la palabra "desde")
                  </span>
                  {hasDesdeFee && (
                    <p className="text-[11px] text-red-400">
                      Detectado "desde US$ 3.000". Debe decir directamente "Derecho inicial US$ 3.000" o "US$ 3.000 de derecho de marca".
                    </p>
                  )}
                </div>
              </div>

              {/* Regla 2: No decir "10 locales en el país" */}
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
                      Evitar la frase "en el país". La fórmula oficial verificada es simplemente "10 locales" o "red de 10 locales".
                    </p>
                  )}
                </div>
              </div>

              {/* Regla 3: No nombrar Buenos Aires como zona con locales */}
              <div className="flex items-start gap-2">
                {mentionsBuenosAires ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={mentionsBuenosAires ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    No mencionar Buenos Aires / CABA como zona con locales
                  </span>
                  {mentionsBuenosAires && (
                    <p className="text-[11px] text-red-400">
                      Alerta: KOL opera sus locales en el interior (Rosario, Córdoba, Mendoza, San Juan). No indicar locales en Buenos Aires.
                    </p>
                  )}
                </div>
              </div>

              {/* Regla 4: Sin signos de exclamación en títulos */}
              <div className="flex items-start gap-2">
                {hasExclamationInHeadline ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className={hasExclamationInHeadline ? 'text-red-300 font-semibold' : 'text-slate-300'}>
                    Sin signos de exclamación en títulos
                  </span>
                  {hasExclamationInHeadline && (
                    <p className="text-[11px] text-red-400">
                      Meta y Google restringen la puntuación sensacionalista. Quitar '!' o '¡' del título.
                    </p>
                  )}
                </div>
              </div>

              {/* Regla 5: "modelo probado" marcado como a validar */}
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                <div>
                  <span className="text-amber-300 font-medium">
                    "Modelo probado" catalogado como: a validar
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {mentionsModeloProbado
                      ? 'El texto contiene "modelo probado" — recordá que esta afirmación requiere validación con datos de ROI por plaza.'
                      : 'Afirmación pendiente de respaldo contable antes de escalar pauta abierta.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW EN VIVO REALISTA */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm sticky top-6">
            <span className="text-xs font-bold text-slate-400 mb-3 block text-center uppercase tracking-wider">
              {activePlatform === 'instagram' ? 'Maqueta Instagram Feed' : 'Maqueta Facebook Feed'}
            </span>

            {/* INSTAGRAM PREVIEW */}
            {activePlatform === 'instagram' && (
              <div className="w-full bg-black text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl font-sans text-xs">
                {/* Header Instagram */}
                <div className="flex items-center justify-between p-3 border-b border-neutral-900 bg-black">
                  <div className="flex items-center gap-2.5">
                    {/* Foto de perfil circular: solo isotipo de hoja KOL */}
                    <div className="w-9 h-9 rounded-full overflow-hidden p-0.5 ring-2 ring-emerald-500/30 flex items-center justify-center bg-slate-900">
                      <KolLogo size={32} variant={state.avatarVariant} />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-white text-xs flex items-center gap-1">
                        {state.pageName || 'kol.franquicias'}
                      </div>
                      <span className="text-[10px] text-neutral-400">Publicidad</span>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                </div>

                {/* Imagen Cuadrada de Instagram */}
                <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={state.imageUrl}
                    alt="Creativo de anuncio"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1080&q=80';
                    }}
                  />

                  {/* Sello KOL FRANQUICIAS sobre la imagen (abajo a la izquierda) */}
                  {state.showSello && (
                    <div className="absolute bottom-3 left-3">
                      <KolLockup size="sm" />
                    </div>
                  )}
                </div>

                {/* Barra de acción azul Instagram */}
                <div className="bg-[#0064e0] text-white px-3.5 py-2.5 flex items-center justify-between font-semibold text-xs tracking-wide cursor-pointer hover:bg-blue-600 transition-colors">
                  <span>{state.callToAction || 'Más información'}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>

                {/* Iconos de Interacción */}
                <div className="p-3 pb-2 flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Heart className="w-5 h-5 hover:text-red-500 cursor-pointer transition-colors" />
                    <MessageCircle className="w-5 h-5 cursor-pointer" />
                    <Send className="w-5 h-5 cursor-pointer" />
                  </div>
                  <Bookmark className="w-5 h-5 cursor-pointer" />
                </div>

                {/* Texto Principal en Instagram */}
                {/* Cortado a 125 caracteres con botón "más". Título y descripción NO se ven en IG */}
                <div className="px-3 pb-4 space-y-1">
                  <div className="text-[12px] leading-relaxed text-neutral-200">
                    <span className="font-bold text-white mr-1.5">{state.pageName || 'kol.franquicias'}</span>
                    <span>{igDisplayText}</span>
                    {isIgTextLong && !expandedIgText && (
                      <button
                        type="button"
                        onClick={() => setExpandedIgText(true)}
                        className="text-neutral-400 hover:text-white font-medium ml-1 cursor-pointer"
                      >
                        más
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block pt-1">
                    Ver traducción
                  </span>
                </div>
              </div>
            )}

            {/* FACEBOOK PREVIEW */}
            {activePlatform === 'facebook' && (
              <div className="w-full bg-[#242526] text-[#e4e6eb] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl font-sans text-xs">
                {/* Header Facebook */}
                <div className="p-3 flex items-center justify-between bg-[#242526]">
                  <div className="flex items-center gap-2.5">
                    {/* Foto de perfil circular: solo isotipo de hoja KOL */}
                    <div className="w-10 h-10 rounded-full overflow-hidden p-0.5 flex items-center justify-center bg-slate-900 border border-slate-700">
                      <KolLogo size={34} variant={state.avatarVariant} />
                    </div>
                    <div className="leading-tight">
                      <div className="font-bold text-[#e4e6eb] text-xs">
                        {state.pageName || 'KOL Accesorios'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#b0b3b8]">
                        <span>Publicidad</span>
                        <span>·</span>
                        <Globe className="w-3 h-3 text-[#b0b3b8]" />
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-[#b0b3b8]" />
                </div>

                {/* Texto Principal ARRIBA de la imagen en Facebook */}
                <div className="px-3 pb-2.5 text-[12px] leading-relaxed text-[#e4e6eb]">
                  <span>{fbDisplayText}</span>
                  {isFbTextLong && !expandedFbText && (
                    <button
                      type="button"
                      onClick={() => setExpandedFbText(true)}
                      className="text-[#b0b3b8] hover:underline font-semibold ml-1 cursor-pointer"
                    >
                      Ver más
                    </button>
                  )}
                </div>

                {/* Imagen Proporción 1.91:1 en Facebook */}
                <div className="relative aspect-[1.91/1] w-full bg-neutral-900 overflow-hidden flex items-center justify-center border-y border-[#3a3b3c]">
                  <img
                    src={state.imageUrl}
                    alt="Creativo FB"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1080&q=80';
                    }}
                  />

                  {/* Sello KOL FRANQUICIAS sobre la imagen si está activado */}
                  {state.showSello && (
                    <div className="absolute bottom-2.5 left-2.5">
                      <KolLockup size="sm" />
                    </div>
                  )}
                </div>

                {/* Panel inferior de Facebook: dominio, título, descripción y botón gris */}
                <div className="p-3 bg-[#3a3b3c]/60 flex items-center justify-between gap-3 border-b border-[#3a3b3c]">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#b0b3b8] block truncate font-mono">
                      {state.domain.toUpperCase() || 'KOLACCESORIOS.COM'}
                    </span>
                    <h4 className="font-bold text-[#e4e6eb] text-xs truncate mt-0.5">
                      {state.headline || 'Franquicia KOL Accesorios'}
                    </h4>
                    {state.description && (
                      <p className="text-[11px] text-[#b0b3b8] truncate mt-0.5">
                        {state.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 bg-[#4e4f50] hover:bg-[#5c5d5e] text-white font-semibold text-xs rounded-md shrink-0 transition-colors"
                  >
                    {state.callToAction || 'Más información'}
                  </button>
                </div>

                {/* Acciones sociales Facebook */}
                <div className="p-2 px-4 flex items-center justify-around text-[#b0b3b8] font-semibold text-xs">
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <ThumbsUp className="w-4 h-4" />
                    <span>Me gusta</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <MessageCircle className="w-4 h-4" />
                    <span>Comentar</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <Share2 className="w-4 h-4" />
                    <span>Compartir</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
