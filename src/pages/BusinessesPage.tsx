import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Building2,
  Phone,
  Globe,
  Star,
  Sparkles,
  Download,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface BusinessesPageProps {
  onSelectBusiness: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const BusinessesPage: React.FC<BusinessesPageProps> = ({
  onSelectBusiness,
  onNavigate,
}) => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (cityFilter !== 'all') params.append('city', cityFilter);

      const res = await fetch(`/api/businesses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Failed to load businesses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [page, categoryFilter, cityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBusinesses();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Base Cadastral de Estabelecimentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {total} estabelecimentos comerciais preservados com rastreabilidade de origem e evidências DOM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new_search')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <span>+ Coletar Mais</span>
          </button>
          <button
            onClick={() => onNavigate('exports')}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome comercial, categoria ou segmento..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Hospital Geral">Hospital Geral</option>
              <option value="Clínica Médica">Clínica Médica</option>
              <option value="Clínica Odontológica">Clínica Odontológica</option>
              <option value="Empresa de Software">Empresa de Software</option>
              <option value="Restaurante">Restaurante</option>
              <option value="Empresa de Logística">Empresa de Logística</option>
              <option value="Chocolateria">Chocolateria</option>
            </select>
          </div>

          <select
            value={cityFilter}
            onChange={e => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas as Cidades</option>
            <option value="São Paulo">São Paulo, SP</option>
            <option value="Rio de Janeiro">Rio de Janeiro, RJ</option>
            <option value="Curitiba">Curitiba, PR</option>
            <option value="Belo Horizonte">Belo Horizonte, MG</option>
            <option value="Brasília">Brasília, DF</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando registros da base...</div>
        ) : businesses.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm space-y-2">
            <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p>Nenhum estabelecimento corresponde aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Estabelecimento / Razão Social</th>
                  <th className="py-3 px-4">Categoria & Segmento</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Contato Principal</th>
                  <th className="py-3 px-4">Website Oficial</th>
                  <th className="py-3 px-4">Avaliação</th>
                  <th className="py-3 px-4">Lead Score</th>
                  <th className="py-3 px-4">Status Enriquecimento</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {businesses.map(b => (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                        {b.legal_name || 'Razão social disponível via Receita'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-medium text-[11px]">
                        {b.primary_category}
                      </span>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {b.commercial_segment}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {b.city || 'São Paulo'}{b.state ? ` - ${b.state}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">Brasil</div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.phone ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                          <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{b.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">Não coletado</span>
                      )}
                    </td>

                    {/* Website */}
                    <td className="py-3.5 px-4">
                      {b.website ? (
                        <a
                          href={b.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 max-w-[140px] truncate"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{b.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 italic">Sem site</span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-900 dark:text-white">{b.rating}</span>
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">({b.review_count || 0})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Lead Score */}
                    <td className="py-3.5 px-4">
                      {b.lead_score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${
                            b.lead_score >= 80 ? 'bg-emerald-500' : b.lead_score >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{b.lead_score}/100</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>

                    {/* Enrichment */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.enrichment_status === 'enriched'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {b.enrichment_status === 'enriched' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Enriquecido
                          </>
                        ) : (
                          'Pendente'
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectBusiness(b.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 font-medium rounded-md transition-colors cursor-pointer border border-transparent dark:border-slate-750"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecionar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Mostrando página <strong className="text-slate-900 dark:text-white">{page}</strong> de <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({total} estabelecimentos no total)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
