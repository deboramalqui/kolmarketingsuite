import React, { useState } from 'react';
import {
  FranchiseCampaignItem,
  CampaignPlatform,
  CampaignStatus,
} from '../types/marketing';
import {
  INITIAL_CAMPAIGNS,
  VERIFIED_LOCATIONS,
  VERIFIED_BRAND_FACTS,
} from '../data/initialMarketingData';
import {
  MetaAdEditorAndPreview,
  MetaAdEditorState,
} from './MetaAdEditorAndPreview';
import {
  GoogleSearchAdEditorAndPreview,
  GoogleSearchAdEditorState,
} from './GoogleSearchAdEditorAndPreview';
import { KolLockup } from './KolLockup';
import {
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
  Target,
  BarChart3,
  Layers,
  Save,
} from 'lucide-react';

export const CampaignStudioView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<FranchiseCampaignItem[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [activeTabDetail, setActiveTabDetail] = useState<'resumen' | 'anuncios' | 'leads' | 'checklist'>('anuncios');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  // WIZARD CREACIÓN DE CAMPAÑA
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newCampName, setNewCampName] = useState('');
  const [newCampPlatform, setNewCampPlatform] = useState<CampaignPlatform>('meta_ads');
  const [newCampObjective, setNewCampObjective] = useState('Generación de clientes potenciales (Leads Franquicias)');
  const [newCampBudget, setNewCampBudget] = useState(1200);
  const [newCampLocations, setNewCampLocations] = useState<string[]>(['Córdoba Capital', 'Rosario (Santa Fe)']);

  // Meta Creation State
  const [newMetaState, setNewMetaState] = useState<MetaAdEditorState>({
    pageName: 'KOL Accesorios',
    primaryText:
      '¿Buscás una franquicia con bajo costo fijo en tecnología? KOL cuenta con 10 locales. Inversión inicial con US$ 3.000 de derecho de marca, 0 % de regalías y 0 % de canon publicitario.',
    headline: 'Franquicia KOL Accesorios · 10 Locales',
    description: 'Derecho inicial US$ 3.000 · 0% Regalías · Llave en mano',
    domain: 'kolaccesorios.com',
    callToAction: 'Más información',
    avatarVariant: 'oscuro',
    showSello: true,
    imageUrl:
      'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1080&q=80',
  });

  // Google Search Creation State
  const [newSearchState, setNewSearchState] = useState<GoogleSearchAdEditorState>({
    headlines: [
      'Franquicia KOL Accesorios',
      'Derecho inicial US$ 3.000',
      '0% Regalías · 10 Locales',
      'Accesorios Para Celulares',
      'Negocio Rentable de Tecnología',
    ],
    descriptions: [
      'Abrí tu local de accesorios para celulares con respaldo de una red de 10 locales.',
      'Derecho inicial US$ 3.000 sin regalías mensuales ni canon de publicidad. Consultá hoy.',
      'Capacitación inicial, provisión directa de stock y montaje completo del punto de venta.',
    ],
    domain: 'kolaccesorios.com',
    path1: 'franquicias',
    path2: 'inversion',
    sitelinks: [
      {
        text: 'Descargar Dossier 2026',
        line1: 'Conocé números de inversión',
        line2: 'Proyección y requisitos',
      },
      {
        text: 'Conocé los 10 Locales',
        line1: 'Presencia en el interior',
        line2: 'Mendoza, Córdoba, Rosario',
      },
      {
        text: 'Requisitos y Montaje',
        line1: 'Locales desde 25m2',
        line2: 'Puntos clave de alto tráfico',
      },
      {
        text: 'Contacto con Expansión',
        line1: 'Hablá con el equipo',
        line2: 'Reunión informativa online',
      },
    ],
    callouts: ['10 Locales', '0% Regalías', '0% Canon Publicidad', 'Derecho Inicial US$ 3.000'],
    keywords: [
      { keyword: 'franquicias rentables tecnología', matchType: 'phrase' },
      { keyword: 'franquicia accesorios celulares', matchType: 'phrase' },
      { keyword: 'franquicia kol accesorios', matchType: 'exact' },
    ],
    negativeKeywords: ['gratis', 'empleo', 'usados', 'curso'],
  });

  // Display Ad State
  const [newDisplayShortHeadline, setNewDisplayShortHeadline] = useState('Franquicia KOL Accesorios');
  const [newDisplayLongHeadline, setNewDisplayLongHeadline] = useState('Sumate a la red con 10 locales y 0% de regalías');
  const [newDisplayDescription, setNewDisplayDescription] = useState('Derecho inicial US$ 3.000. Alta rotación de accesorios.');
  const [newDisplayImage, setNewDisplayImage] = useState(
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'
  );

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Manejo de actualización en tiempo real de la campaña seleccionada
  const handleUpdateSelectedMeta = (updatedMeta: MetaAdEditorState) => {
    if (!selectedCampaignId) return;
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === selectedCampaignId) {
          return {
            ...c,
            metaAdData: {
              ...c.metaAdData,
              ...updatedMeta,
            },
          };
        }
        return c;
      })
    );
  };

  const handleUpdateSelectedSearch = (updatedSearch: GoogleSearchAdEditorState) => {
    if (!selectedCampaignId) return;
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === selectedCampaignId) {
          return {
            ...c,
            googleAdData: {
              ...c.googleAdData,
              headlines: updatedSearch.headlines,
              descriptions: updatedSearch.descriptions,
              domain: updatedSearch.domain,
              path1: updatedSearch.path1,
              path2: updatedSearch.path2,
              sitelinks: updatedSearch.sitelinks,
              callouts: updatedSearch.callouts,
              keywords: updatedSearch.keywords,
              negativeKeywords: updatedSearch.negativeKeywords,
            },
          };
        }
        return c;
      })
    );
  };

  // Crear campaña
  const handleSaveCampaign = () => {
    const newId = `cmp-${Date.now().toString(36)}`;
    const newCampaignItem: FranchiseCampaignItem = {
      id: newId,
      name: newCampName || `Campaña ${newCampPlatform} Franquicias`,
      platform: newCampPlatform,
      status: 'active',
      objective: newCampObjective,
      budgetMonthly: newCampBudget,
      spentToDate: 0,
      leadsGenerated: 0,
      cpl: 0,
      conversionRate: 0,
      targetLocations: newCampLocations,
      createdAt: new Date().toISOString().split('T')[0],
      utmParams: {
        source: newCampPlatform === 'meta_ads' ? 'facebook' : 'google',
        medium: newCampPlatform === 'meta_ads' ? 'paid_social' : newCampPlatform === 'google_search' ? 'cpc' : 'display',
        campaign: newCampName.toLowerCase().replace(/\s+/g, '_'),
        finalUrlWithUtm: `https://kolaccesorios.com/franquicias?utm_source=${
          newCampPlatform === 'meta_ads' ? 'facebook' : 'google'
        }&utm_campaign=${newCampName.toLowerCase().replace(/\s+/g, '_')}`,
      },
      qualityChecklist: {
        feeCorrect: true,
        noExclamation: true,
        storeCountCorrect: true,
        noBuenosAiresMention: true,
        modelTestedValidated: true,
      },
      metaAdData: newCampPlatform === 'meta_ads' ? newMetaState : undefined,
      googleAdData: newCampPlatform === 'google_search' ? newSearchState : undefined,
      displayAdData:
        newCampPlatform === 'google_display'
          ? {
              shortHeadline: newDisplayShortHeadline,
              longHeadline: newDisplayLongHeadline,
              description: newDisplayDescription,
              businessName: 'KOL Accesorios',
              imageUrl: newDisplayImage,
            }
          : undefined,
    };

    setCampaigns([newCampaignItem, ...campaigns]);
    setSelectedCampaignId(newId);
    setActiveTabDetail('anuncios');
    setIsCreatingCampaign(false);
    setWizardStep(1);
  };

  // Filtros
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || c.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* VISTA PRINCIPAL: LISTA O DETALLE */}
      {!selectedCampaignId && !isCreatingCampaign && (
        <div className="space-y-6">
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Campañas Franquicias
                </span>
                <span className="text-xs text-slate-400">· {campaigns.length} registradas</span>
              </div>
              <h1 className="text-2xl font-bold text-white mt-1">
                Gestión y Creación de Campañas
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitoreo multicanal y edición en vivo de anuncios para Google Search, Google Display y Meta Ads.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCreatingCampaign(true);
                setWizardStep(1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nueva Campaña
            </button>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar campaña..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Selector de plataforma de filtro */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterPlatform('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPlatform === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterPlatform('meta_ads')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPlatform === 'meta_ads'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Meta Ads
              </button>
              <button
                type="button"
                onClick={() => setFilterPlatform('google_search')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPlatform === 'google_search'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => setFilterPlatform('google_display')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterPlatform === 'google_display'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google Display
              </button>
            </div>
          </div>

          {/* Grid de Campañas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => {
                  setSelectedCampaignId(camp.id);
                  setActiveTabDetail('anuncios');
                }}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        camp.platform === 'meta_ads'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : camp.platform === 'google_search'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {camp.platform === 'meta_ads'
                        ? 'Meta (IG & FB)'
                        : camp.platform === 'google_search'
                        ? 'Google Search'
                        : 'Google Display'}
                    </span>

                    <span
                      className={`w-2 h-2 rounded-full ${
                        camp.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {camp.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {camp.objective}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Leads</span>
                      <span className="text-sm font-bold text-white">{camp.leadsGenerated}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-500 block uppercase">CPL</span>
                      <span className="text-sm font-bold text-emerald-400">
                        US$ {camp.cpl.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/60">
                      <span className="text-[10px] text-slate-500 block uppercase">Gasto</span>
                      <span className="text-sm font-bold text-slate-300">
                        US$ {camp.spentToDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform pt-1">
                    <span>Ver ficha y editar anuncios</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL / WIZARD DE CREACIÓN DE NUEVA CAMPAÑA */}
      {isCreatingCampaign && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreatingCampaign(false)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> Cancelar y Volver
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Paso {wizardStep} de 3</span>
            </div>
          </div>

          {/* PASO 1: TIPO DE CAMPAÑA Y CONFIGURACIÓN BÁSICA */}
          {wizardStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Paso 1: Tipo de Campaña y Presupuesto
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Elegí la plataforma publicitaria donde se publicará el anuncio.
                </p>
              </div>

              {/* SELECTOR OBLIGATORIO: SEARCH, DISPLAY O META */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Plataforma Publicitaria *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    onClick={() => setNewCampPlatform('google_search')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newCampPlatform === 'google_search'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Google Search</span>
                      {newCampPlatform === 'google_search' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Anuncios de texto de alta intención para quienes buscan franquicias.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewCampPlatform('google_display')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newCampPlatform === 'google_display'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Google Display</span>
                      {newCampPlatform === 'google_display' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Banners visuales y remarketing en red de sitios web y YouTube.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewCampPlatform('meta_ads')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      newCampPlatform === 'meta_ads'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white">Meta Ads</span>
                      {newCampPlatform === 'meta_ads' && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Instagram Feed y Facebook Feed con captación de leads en redes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombre de Campaña */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre de la Campaña
                </label>
                <input
                  type="text"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="Ej: Expansión KOL Q1 - Inversores Interior"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Presupuesto y Objetivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Presupuesto Mensual Estimado (USD)
                  </label>
                  <input
                    type="number"
                    value={newCampBudget}
                    onChange={(e) => setNewCampBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Objetivo Principal
                  </label>
                  <select
                    value={newCampObjective}
                    onChange={(e) => setNewCampObjective(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Generación de clientes potenciales (Leads Franquicias)">
                      Generación de leads (Franquicias)
                    </option>
                    <option value="Tráfico al sitio web con formulario">
                      Tráfico al sitio web con formulario
                    </option>
                    <option value="Mensajes directos a WhatsApp">
                      Mensajes directos a WhatsApp
                    </option>
                  </select>
                </div>
              </div>

              {/* Botón Siguiente */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all"
                >
                  Continuar a Creativos y Anuncio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: CREATIVOS SEGÚN PLATAFORMA */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Paso 2: Creativos y Configuración de Anuncio
                  </h2>
                  <p className="text-xs text-slate-400">
                    Previsualización en tiempo real con validaciones automáticas de copy.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Volver a Datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Continuar a Revisión
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Si es Meta */}
              {newCampPlatform === 'meta_ads' && (
                <MetaAdEditorAndPreview
                  state={newMetaState}
                  onChange={setNewMetaState}
                />
              )}

              {/* Si es Google Search */}
              {newCampPlatform === 'google_search' && (
                <GoogleSearchAdEditorAndPreview
                  state={newSearchState}
                  onChange={setNewSearchState}
                />
              )}

              {/* Si es Google Display */}
              {newCampPlatform === 'google_display' && (
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 max-w-2xl mx-auto">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Anuncio Adaptable de Display
                  </h3>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Título Corto (máx 30)
                    </label>
                    <input
                      type="text"
                      value={newDisplayShortHeadline}
                      onChange={(e) => setNewDisplayShortHeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Título Largo (máx 90)
                    </label>
                    <input
                      type="text"
                      value={newDisplayLongHeadline}
                      onChange={(e) => setNewDisplayLongHeadline(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      value={newDisplayDescription}
                      onChange={(e) => setNewDisplayDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      URL de Imagen
                    </label>
                    <input
                      type="text"
                      value={newDisplayImage}
                      onChange={(e) => setNewDisplayImage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: REVISIÓN Y PUBLICACIÓN */}
          {wizardStep === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Paso 3: Revisión Final de Campaña
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verificá que todos los datos y parámetros UTM estén configurados correctamente.
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="font-semibold text-white">{newCampName || 'Campaña Franquicias'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Plataforma:</span>
                  <span className="font-semibold text-emerald-400 uppercase">{newCampPlatform}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Presupuesto Mensual:</span>
                  <span className="font-semibold text-white">US$ {newCampBudget}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Dominio de destino:</span>
                  <span className="font-semibold text-white">kolaccesorios.com</span>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Volver a Editar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCampaign}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar y Activar Campaña
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FICHA DE CAMPAÑA INDIVIDUAL (DETALLE) */}
      {selectedCampaign && !isCreatingCampaign && (
        <div className="space-y-6">
          {/* Header de la Ficha */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCampaignId(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Volver a la lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      selectedCampaign.platform === 'meta_ads'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : selectedCampaign.platform === 'google_search'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {selectedCampaign.platform === 'meta_ads'
                      ? 'Meta Ads'
                      : selectedCampaign.platform === 'google_search'
                      ? 'Google Search'
                      : 'Google Display'}
                  </span>
                  <span className="text-xs text-slate-500">ID: {selectedCampaign.id}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {selectedCampaign.name}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Campaña Activa
              </span>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Presupuesto Mes
              </span>
              <span className="text-xl font-bold text-white mt-1 block">
                US$ {selectedCampaign.budgetMonthly}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Gasto Acumulado
              </span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">
                US$ {selectedCampaign.spentToDate}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Leads Calificados
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {selectedCampaign.leadsGenerated}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Costo por Lead (CPL)
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                US$ {selectedCampaign.cpl.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Pestañas de la Ficha */}
          <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTabDetail('anuncios')}
              className={`pb-3 px-3 transition-colors flex items-center gap-2 relative ${
                activeTabDetail === 'anuncios'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              Anuncios y Creativos (Edición en Vivo)
            </button>

            <button
              type="button"
              onClick={() => setActiveTabDetail('resumen')}
              className={`pb-3 px-3 transition-colors flex items-center gap-2 relative ${
                activeTabDetail === 'resumen'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Resumen & Parámetros
            </button>

            <button
              type="button"
              onClick={() => setActiveTabDetail('checklist')}
              className={`pb-3 px-3 transition-colors flex items-center gap-2 relative ${
                activeTabDetail === 'checklist'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Directivas de Franquicia
            </button>
          </div>

          {/* PESTAÑA: ANUNCIOS Y CREATIVOS (EDITABLE EN TIEMPO REAL) */}
          {activeTabDetail === 'anuncios' && (
            <div className="space-y-6">
              {/* Si es Meta Ads */}
              {selectedCampaign.platform === 'meta_ads' && selectedCampaign.metaAdData && (
                <MetaAdEditorAndPreview
                  state={{
                    pageName: selectedCampaign.metaAdData.pageName || 'KOL Accesorios',
                    primaryText: selectedCampaign.metaAdData.primaryText,
                    headline: selectedCampaign.metaAdData.headline,
                    description: selectedCampaign.metaAdData.description,
                    domain: selectedCampaign.metaAdData.domain || 'kolaccesorios.com',
                    callToAction: selectedCampaign.metaAdData.callToAction,
                    avatarVariant: selectedCampaign.metaAdData.avatarVariant || 'oscuro',
                    showSello: selectedCampaign.metaAdData.showSello ?? true,
                    imageUrl: selectedCampaign.metaAdData.imageUrl,
                  }}
                  onChange={handleUpdateSelectedMeta}
                  readOnly={false}
                />
              )}

              {/* Si es Google Search */}
              {selectedCampaign.platform === 'google_search' && selectedCampaign.googleAdData && (
                <GoogleSearchAdEditorAndPreview
                  state={{
                    headlines: selectedCampaign.googleAdData.headlines,
                    descriptions: selectedCampaign.googleAdData.descriptions,
                    domain: selectedCampaign.googleAdData.domain || 'kolaccesorios.com',
                    path1: selectedCampaign.googleAdData.path1 || 'franquicias',
                    path2: selectedCampaign.googleAdData.path2 || 'inversion',
                    sitelinks: selectedCampaign.googleAdData.sitelinks || [],
                    callouts: selectedCampaign.googleAdData.callouts || [],
                    keywords: selectedCampaign.googleAdData.keywords || [],
                    negativeKeywords: selectedCampaign.googleAdData.negativeKeywords || [],
                  }}
                  onChange={handleUpdateSelectedSearch}
                  readOnly={false}
                />
              )}

              {/* Si es Google Display */}
              {selectedCampaign.platform === 'google_display' && selectedCampaign.displayAdData && (
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4 max-w-2xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Creativo de Display
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Título Corto
                      </label>
                      <input
                        type="text"
                        value={selectedCampaign.displayAdData.shortHeadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCampaigns((prev) =>
                            prev.map((c) =>
                              c.id === selectedCampaign.id
                                ? {
                                    ...c,
                                    displayAdData: {
                                      ...c.displayAdData!,
                                      shortHeadline: val,
                                    },
                                  }
                                : c
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Título Largo
                      </label>
                      <input
                        type="text"
                        value={selectedCampaign.displayAdData.longHeadline}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCampaigns((prev) =>
                            prev.map((c) =>
                              c.id === selectedCampaign.id
                                ? {
                                    ...c,
                                    displayAdData: {
                                      ...c.displayAdData!,
                                      longHeadline: val,
                                    },
                                  }
                                : c
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: RESUMEN Y PARÁMETROS */}
          {activeTabDetail === 'resumen' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Parámetros de Campaña
                </h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500">Objetivo:</span>
                    <span className="font-semibold text-white">{selectedCampaign.objective}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500">Tasa de Conversión:</span>
                    <span className="font-semibold text-emerald-400">{selectedCampaign.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500">Fecha de Creación:</span>
                    <span className="font-semibold text-white">{selectedCampaign.createdAt}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span className="text-slate-500">Dominio oficial:</span>
                    <span className="font-mono text-emerald-400">kolaccesorios.com</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Configuración UTM & Tracking
                </h3>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 break-all">
                  {selectedCampaign.utmParams.finalUrlWithUtm}
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>• Fuente (utm_source): <span className="text-white font-mono">{selectedCampaign.utmParams.source}</span></p>
                  <p>• Medio (utm_medium): <span className="text-white font-mono">{selectedCampaign.utmParams.medium}</span></p>
                  <p>• Campaña (utm_campaign): <span className="text-white font-mono">{selectedCampaign.utmParams.campaign}</span></p>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: DIRECTIVAS DE FRANQUICIA */}
          {activeTabDetail === 'checklist' && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Directivas Comerciales KOL Franquicias
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Derecho inicial de marca</span>
                    <p className="text-slate-400 mt-0.5">
                      Fijado exactamente en US$ 3.000 (sin "desde").
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Presencia de locales</span>
                    <p className="text-slate-400 mt-0.5">
                      Informar "10 locales" (sin agregar "en el país").
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Zonas con locales operativos</span>
                    <p className="text-slate-400 mt-0.5">
                      Provincias del interior (Rosario, Córdoba, San Juan, Mendoza). No nombrar Buenos Aires como zona con locales.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Regalías y Canon</span>
                    <p className="text-slate-400 mt-0.5">
                      0 % de regalías y 0 % de canon publicitario mensual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
