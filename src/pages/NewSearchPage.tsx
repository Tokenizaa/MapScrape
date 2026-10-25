import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface NewSearchPageProps {
  onJobStarted: (jobId: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const NewSearchPage: React.FC<NewSearchPageProps> = ({ onJobStarted }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('Clínicas e Consultórios Médicos');
  const [category, setCategory] = useState('Saúde e Bem-Estar');
  const [location, setLocation] = useState('São Paulo, SP');
  const [targetVolume, setTargetVolume] = useState('5');
  const [enrichmentEnabled, setEnrichmentEnabled] = useState(true);
  const [enrichmentDepth, setEnrichmentDepth] = useState('2');
  const [sources, setSources] = useState<string[]>([
    'Google Maps Places',
    'Web Oficial & DOM',
    'Receita Federal / CNPJ',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSource = (source: string) => {
    if (sources.includes(source)) {
      if (sources.length > 1) {
        setSources(sources.filter(s => s !== source));
      }
    } else {
      setSources([...sources, source]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location.trim()) {
      setErrorMsg('Termo de busca e Localização são campos obrigatórios.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || `Pesquisa: ${query} (${location})`,
          query: query.trim(),
          category: category.trim(),
          location: location.trim(),
          target_volume: parseInt(targetVolume, 10),
          sources,
          enrichment_enabled: enrichmentEnabled,
          enrichment_depth: parseInt(enrichmentDepth, 10),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Erro ao registrar trabalho de coleta');
      }

      const createdJob = await response.json();
      onJobStarted(createdJob.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao iniciar trabalho de coleta.');
      setIsSubmitting(false);
    }
  };

  const presetQueries = [
    { q: 'Clínicas e Consultórios Médicos', cat: 'Saúde e Bem-Estar', loc: 'São Paulo, SP' },
    { q: 'Empresas de Tecnologia e Software', cat: 'Tecnologia da Informação', loc: 'Curitiba, PR' },
    { q: 'Restaurantes e Gastronomia', cat: 'Alimentos e Bebidas', loc: 'Rio de Janeiro, RJ' },
    { q: 'Operadores de Logística e Fretes', cat: 'Transporte e Logística', loc: 'Belo Horizonte, MG' },
    { q: 'Escritórios de Advocacia e Contabilidade', cat: 'Serviços Corporativos', loc: 'Brasília, DF' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Configurar Nova Pesquisa & Coleta
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inicie uma varredura comercial independente. O pipeline extrairá a identificação principal, endereços normalizados, telefones, canais WhatsApp, metadados de websites e dados cadastrais.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Exemplos Rápidos de Prospecção
        </label>
        <div className="flex flex-wrap gap-2">
          {presetQueries.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(preset.q);
                setCategory(preset.cat);
                setLocation(preset.loc);
                setName(`Coleta: ${preset.q}`);
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {preset.q} — <span className="text-slate-400 dark:text-slate-500">{preset.loc}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Erro no formulário</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Query Term */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Termos de Busca / Palavras-Chave <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: Clínicas Médicas, Restaurantes, Empresas de TI"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pode incluir múltiplos segmentos ou termos separados por vírgula.
            </p>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Localização (Cidade, UF ou Bairro) <span className="text-emerald-600 dark:text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Ex: São Paulo, SP ou Curitiba, PR"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Segmento Comercial
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Saúde e Bem-Estar">Saúde e Bem-Estar (Clínicas, Consultórios)</option>
              <option value="Tecnologia da Informação">Tecnologia da Informação (Softwares, TI)</option>
              <option value="Alimentos e Bebidas">Alimentos e Bebidas (Restaurantes, Cafés)</option>
              <option value="Transporte e Logística">Transporte e Logística (Transportadoras)</option>
              <option value="Serviços Corporativos">Serviços Corporativos (Contabilidade, BPO)</option>
              <option value="Varejo e Comércio">Varejo e Comércio Local</option>
              <option value="Educação e Treinamentos">Educação e Treinamentos</option>
            </select>
          </div>

          {/* Target Volume */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Volume Alvo de Estabelecimentos
            </label>
            <select
              value={targetVolume}
              onChange={e => setTargetVolume(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="3">3 estabelecimentos (Verificação rápida)</option>
              <option value="5">5 estabelecimentos (Padrão recomendado)</option>
              <option value="10">10 estabelecimentos (Amostra expandida)</option>
              <option value="20">20 estabelecimentos (Lote comercial)</option>
            </select>
          </div>

          {/* Optional Custom Job Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Identificador da Execução (Opcional)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Campanha Prospecção Q4 SP"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Sources Selection */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Fontes Públicas Habilitadas
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'Google Maps Places', label: 'Google Maps Places', desc: 'Identificação, notas, horários, coordenadas' },
              { id: 'Web Oficial & DOM', label: 'Web Oficial & DOM', desc: 'WhatsApp, e-mails, Schema.org, CMS' },
              { id: 'Receita Federal / CNPJ', label: 'Receita Federal / CNPJ', desc: 'Razão social, CNAE e situação cadastral' },
            ].map(src => {
              const isChecked = sources.includes(src.id);
              return (
                <div
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">{src.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="accent-emerald-600 rounded"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{src.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enrichment Options */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Enriquecimento Profundo via DOM do Site Oficial
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                Visita automaticamente o website oficial de cada empresa encontrada, inspecionando o DOM para extrair botões de WhatsApp, contatos comerciais, redes sociais e metadados JSON-LD.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enrichmentEnabled}
                onChange={e => setEnrichmentEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {enrichmentEnabled && (
            <div className="pl-4 border-l-2 border-emerald-500 space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Profundidade de Navegação por Estabelecimento
              </label>
              <div className="flex items-center gap-3 text-xs">
                {['1', '2', '3'].map(depth => (
                  <label key={depth} className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="depth"
                      value={depth}
                      checked={enrichmentDepth === depth}
                      onChange={e => setEnrichmentDepth(e.target.value)}
                      className="accent-emerald-600"
                    />
                    <span>{depth} página{depth !== '1' ? 's' : ''} {depth === '1' ? '(Home)' : depth === '2' ? '(Home + Contato)' : '(Completo)'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Execução em segundo plano com logs progressivos em tempo real.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer shadow-emerald-500/10"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Iniciando Coleta...</span>
              </>
            ) : (
              <>
                <span>Iniciar Coleta Automatizada</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
