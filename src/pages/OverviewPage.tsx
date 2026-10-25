import React from 'react';
import {
  Building2,
  Sparkles,
  ListOrdered,
  AlertTriangle,
  Download,
  ArrowRight,
  ShieldCheck,
  Globe,
  Code2,
  Percent,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface OverviewPageProps {
  stats: any;
  onNavigate: (tab: NavTab) => void;
  onSelectBusiness?: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ stats, onNavigate }) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        Carregando métricas da plataforma...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total de Estabelecimentos',
      value: stats.totalBusinesses ?? 0,
      subtext: 'Registros únicos na base',
      icon: Building2,
      color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800/40',
    },
    {
      label: 'Cadastros Enriquecidos',
      value: stats.enrichedBusinesses ?? 0,
      subtext: `${stats.totalBusinesses ? Math.round((stats.enrichedBusinesses / stats.totalBusinesses) * 100) : 0}% com DOM e web verificados`,
      icon: Sparkles,
      color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-800/40',
    },
    {
      label: 'Execuções Concluídas',
      value: stats.completedJobs ?? 0,
      subtext: `${stats.activeJobs ?? 0} em andamento`,
      icon: ListOrdered,
      color: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-800/40',
    },
    {
      label: 'Taxa de Duplicidade',
      value: `${stats.duplicateRatePct ?? 0}%`,
      subtext: 'Deduplicação automática multi-sinal',
      icon: Percent,
      color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800/40',
    },
  ];

  const coverageItems = [
    { label: 'Nome Comercial', pct: stats.fieldCoverage?.nome_comercial ?? 100 },
    { label: 'Categoria & Segmento', pct: stats.fieldCoverage?.categoria ?? 100 },
    { label: 'Endereço Normalizado', pct: stats.fieldCoverage?.endereco ?? 0 },
    { label: 'Telefone Principal', pct: stats.fieldCoverage?.telefone_principal ?? 0 },
    { label: 'WhatsApp Direto', pct: stats.fieldCoverage?.whatsapp ?? 0 },
    { label: 'Site Oficial Verificado', pct: stats.fieldCoverage?.site_oficial ?? 0 },
    { label: 'Avaliações & Reputação', pct: stats.fieldCoverage?.avaliacoes_nota ?? 0 },
    { label: 'Dados Legais / CNPJ', pct: stats.fieldCoverage?.cnpj_dados_legais ?? 0 },
    { label: 'Qualificação de Lead', pct: stats.fieldCoverage?.qualificacao_lead ?? 0 },
    { label: 'Evidências DOM Mapeadas', pct: stats.fieldCoverage?.evidencias_dom ?? 0 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Visão Geral da Plataforma
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Motor independente de coleta, enriquecimento cadastral, rastreabilidade de seletores e exportação universal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new_search')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <span>Nova Pesquisa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('exports')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Base</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {kpi.value}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {kpi.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Field Coverage & Engine Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coverage Card (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cobertura do Catálogo Mestre de Campos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Percentual de preenchimento e integridade dos dados coletados na base atual.
              </p>
            </div>
            <button
              onClick={() => onNavigate('fields')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Catálogo Completo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
            {coverageItems.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <span className="text-slate-900 dark:text-white font-bold">{item.pct}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.pct >= 90
                        ? 'bg-emerald-500'
                        : item.pct >= 60
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engine Status & Collectors (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors duration-200">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Estado dos Coletores & Serviços
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Google Maps Places Engine</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Mecanismo adaptativo com inspeção DOM e busca regional operacional.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Web DOM Inspector (Cheerio)</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Extração de Schema.org, WhatsApp, e-mails e metadados ativa.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Firecrawl API Integration</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Disponível em modo fallback direto ou com chave de API em Configurações.</div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Sanitização Anti-Fórmula CSV</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">Bloqueio ativo contra exploração de fórmulas em Excel/LibreOffice.</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Seletores Registrados</span>
            <span className="font-bold text-slate-900 dark:text-white">{stats.selectorsCount ?? 4} ativos</span>
          </div>
        </div>
      </div>

      {/* Recent Exports and Action Callout */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Contrato de Interoperabilidade Independente</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-2">
            Base Comercial Pronta para Exportação Universal
          </h3>
          <p className="text-sm text-slate-400 max-w-2xl">
            Exporte registros consolidados em CSV UTF-8 com BOM, JSON aninhado ou pacote ZIP com 13 tabelas relacionais e manifesto de campos.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('businesses')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            Navegar Registros
          </button>
          <button
            onClick={() => onNavigate('exports')}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
          >
            Gerar Arquivo
          </button>
        </div>
      </div>
    </div>
  );
};
