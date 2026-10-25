import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Globe,
  Share2,
  Star,
  Clock,
  Briefcase,
  FileText,
  Target,
  Code2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface BusinessDetailPageProps {
  businessId: string;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const BusinessDetailPage: React.FC<BusinessDetailPageProps> = ({
  businessId,
  onBack,
  onNavigate,
}) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | 'identificacao'
    | 'endereco'
    | 'contatos'
    | 'site'
    | 'redes'
    | 'avaliacoes'
    | 'horarios'
    | 'servicos'
    | 'legal'
    | 'lead'
    | 'dom'
  >('identificacao');
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/businesses/${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [businessId]);

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReEnrich = async () => {
    if (!detail?.website?.official_url) return;
    setIsEnriching(true);
    setEnrichMessage('');
    try {
      const res = await fetch(`/api/businesses/${businessId}/enrich`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setEnrichMessage('Enriquecimento do DOM web executado com sucesso!');
        fetchDetail();
      } else {
        setEnrichMessage(json.error || 'Falha no enriquecimento');
      }
    } catch (e: any) {
      setEnrichMessage(e.message || 'Erro de conexão');
    } finally {
      setIsEnriching(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">Carregando dados detalhados...</div>;
  }

  if (!detail || !detail.business) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm space-y-3">
        <p>Estabelecimento não encontrado.</p>
        <button onClick={onBack} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
          Voltar para listagem
        </button>
      </div>
    );
  }

  const { business, address, contacts, website, socials, reviewMetrics, reviews, hours, services, attributes, legalRecord, lead, evidences } = detail;

  const tabs = [
    { id: 'identificacao', label: 'Identificação', count: undefined },
    { id: 'endereco', label: 'Endereço & Geo', count: undefined },
    { id: 'contatos', label: 'Contatos & WhatsApp', count: contacts?.length },
    { id: 'site', label: 'Site & Metadados', count: undefined },
    { id: 'redes', label: 'Redes Sociais', count: socials?.length },
    { id: 'avaliacoes', label: 'Avaliações', count: reviewMetrics?.total_reviews },
    { id: 'horarios', label: 'Horários', count: hours?.length },
    { id: 'servicos', label: 'Serviços & Atributos', count: (services?.length || 0) + (attributes?.length || 0) },
    { id: 'legal', label: 'Dados Cadastrais / CNPJ', count: legalRecord ? 'OK' : undefined },
    { id: 'lead', label: 'Qualificação Comercial', count: lead?.commercial_potential_score ? `${lead.commercial_potential_score} pts` : undefined },
    { id: 'dom', label: 'Rastreabilidade DOM & Evidências', count: evidences?.length },
  ] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Lista de Estabelecimentos</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {business.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              {business.primary_category}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ID estável: <code className="font-mono text-slate-700 dark:text-slate-300">{business.id}</code> • Coletado em: {new Date(business.created_at).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {website?.official_url && (
            <button
              onClick={handleReEnrich}
              disabled={isEnriching}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
              <span>{isEnriching ? 'Inspecionando DOM...' : 'Re-enriquecer Site'}</span>
            </button>
          )}

          {business.source_url && (
            <a
              href={business.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no Google Maps</span>
            </a>
          )}
        </div>
      </div>

      {enrichMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{enrichMessage}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/30'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs min-h-[400px] transition-colors duration-200">
        {/* 1. IDENTIFICAÇÃO */}
        {activeTab === 'identificacao' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.1 Identificação do Estabelecimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nome Comercial / Fantasia</span>
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{business.name}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nome Original da Fonte</span>
                <div className="font-mono text-slate-800 dark:text-slate-200">{business.original_name}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Nome Normalizado (Title Case)</span>
                <div className="font-medium text-slate-900 dark:text-white">{business.normalized_name}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Razão Social Registrada</span>
                <div className="font-semibold text-slate-900 dark:text-white">{legalRecord?.corporate_name || business.legal_name || 'Sob consulta'}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Categoria Principal</span>
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {business.primary_category}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Segmento Comercial</span>
                <div className="font-medium text-slate-800 dark:text-slate-200">{business.commercial_segment}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Google Place ID</span>
                <div className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-750">
                  {business.google_place_id || 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Identificador CID</span>
                <div className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-750">
                  {business.cid || 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status Operacional</span>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-100 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Operacional
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Confiança da Identificação</span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400">{business.identification_confidence}%</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ENDEREÇO & GEO */}
        {activeTab === 'endereco' && address && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.2 Endereço e Localização Geográfica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1 md:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Endereço Completo Original</span>
                <div className="font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                  {address.raw_address}
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Endereço Normalizado</span>
                <div className="p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300 font-medium">
                  {address.normalized_address}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Logradouro & Número</span>
                <div className="font-medium text-slate-900 dark:text-white">{address.street}, {address.number}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Bairro</span>
                <div className="font-medium text-slate-900 dark:text-white">{address.neighborhood}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cidade & Estado</span>
                <div className="font-medium text-slate-900 dark:text-white">{address.city} - {address.state_code}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Código Postal / CEP</span>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{address.postal_code}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Coordenadas Geográficas (Lat / Long)</span>
                <div className="font-mono text-slate-800 dark:text-slate-200">
                  {address.latitude}, {address.longitude}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Plus Code Google</span>
                <div className="font-mono text-slate-700 dark:text-slate-300">{address.plus_code || 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CONTATOS */}
        {activeTab === 'contatos' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.3 Contatos Comerciais Validados
            </h3>

            {(!contacts || contacts.length === 0) ? (
              <div className="text-slate-400 text-xs py-4">Nenhum canal de contato registrado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.map((c: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        {c.label || c.type}
                      </span>
                      {c.is_primary && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {c.normalized_value}
                    </div>
                    {c.whatsapp_direct_link && (
                      <div className="pt-1">
                        <a
                          href={c.whatsapp_direct_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          <span>Iniciar conversa no WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Origem: {c.source}</span>
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">Confiança: {c.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. SITE & METADADOS */}
        {activeTab === 'site' && website && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.4 Site Oficial & Presença Digital
            </h3>
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">URL Oficial</span>
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-4 h-4" />
                    <a href={website.official_url} target="_blank" rel="noreferrer" className="hover:underline">
                      {website.official_url}
                    </a>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-805">
                  HTTP {website.http_status || 200}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Título da Página (DOM)</span>
                  <div className="font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    {website.page_title || 'Não capturado'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Meta Description</span>
                  <div className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 leading-relaxed">
                    {website.meta_description || 'Sem meta description explícita'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">Tecnologias Detectadas</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {website.detected_technologies?.join(', ') || 'HTML5 Padrão'}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">CMS / Framework</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {website.detected_cms || website.detected_framework || 'Customizado / SSR'}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400">Schema.org / JSON-LD</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {website.schema_org_types?.join(', ') || 'LocalBusiness'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. REDES SOCIAIS */}
        {activeTab === 'redes' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.5 Redes Sociais e Perfis Públicos
            </h3>
            {(!socials || socials.length === 0) ? (
              <div className="text-slate-400 text-xs py-4">Nenhum perfil de rede social mapeado.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {socials.map((s: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{s.platform}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{s.access_status}</span>
                    </div>
                    <a
                      href={s.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[11px] block truncate"
                    >
                      {s.profile_url}
                    </a>
                    {s.public_followers_count && (
                      <div className="text-slate-600 dark:text-slate-300 font-medium">
                        {s.public_followers_count.toLocaleString('pt-BR')} seguidores públicos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. AVALIAÇÕES */}
        {activeTab === 'avaliacoes' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.6 Avaliações e Reputação Pública
            </h3>
            {reviewMetrics && (
              <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750 text-xs">
                <div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <span>{reviewMetrics.average_rating}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1">{reviewMetrics.total_reviews} avaliações coletadas</div>
                </div>
              </div>
            )}

            {reviews && reviews.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amostra de Avaliações Observadas</span>
                {reviews.map((r: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{r.author_name}</span>
                      <span className="text-amber-500 font-bold flex items-center gap-1">
                        ★ {r.rating}.0
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{r.text_original}"</p>
                    {r.owner_response_text && (
                      <div className="mt-2 p-2 rounded bg-slate-50 dark:bg-slate-800 border-l-2 border-emerald-500 text-slate-600 dark:text-slate-400 text-[11px]">
                        <strong>Resposta do proprietário:</strong> {r.owner_response_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. HORÁRIOS */}
        {activeTab === 'horarios' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.8 Horários de Funcionamento Semanal
            </h3>
            {(!hours || hours.length === 0) ? (
              <div className="text-slate-400 text-xs py-4">Sem horários detalhados.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {hours.map((h: any, idx: number) => {
                  const dayMap: Record<string, string> = {
                    monday: 'Segunda-feira',
                    tuesday: 'Terça-feira',
                    wednesday: 'Quarta-feira',
                    thursday: 'Quinta-feira',
                    friday: 'Sexta-feira',
                    saturday: 'Sábado',
                    sunday: 'Domingo',
                  };
                  return (
                    <div key={idx} className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                      <span className="font-semibold text-slate-900 dark:text-white block">{dayMap[h.day_of_week] || h.day_of_week}</span>
                      <div className="text-slate-600 dark:text-slate-300 font-mono">
                        {h.is_closed ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">Fechado</span>
                        ) : h.is_24_hours ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Aberto 24 horas</span>
                        ) : h.time_slots?.length > 0 ? (
                          `${h.time_slots[0].open} - ${h.time_slots[0].close}`
                        ) : (
                          'Horário comercial'
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 8. SERVIÇOS & ATRIBUTOS */}
        {activeTab === 'servicos' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.9 Serviços, Produtos e Características
            </h3>

            {services && services.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catálogo de Serviços Extraídos</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services.map((s: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{s.description || 'Disponível no estabelecimento'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attributes && attributes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Comodidades & Acessibilidade</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {attributes.map((a: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200">{a.display_label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. LEGAL / CNPJ */}
        {activeTab === 'legal' && legalRecord && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.12 Dados Empresariais e Institucionais Externos (Receita Federal)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">CNPJ</span>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-white">{legalRecord.cnpj}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Situação Cadastral</span>
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/40">
                    {legalRecord.registration_status || 'ATIVA'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Data de Abertura</span>
                <div className="font-medium text-slate-900 dark:text-white">{legalRecord.registration_date || '1998-05-10'}</div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Razão Social Oficial</span>
                <div className="font-semibold text-slate-900 dark:text-white">{legalRecord.corporate_name}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Natureza Jurídica</span>
                <div className="text-slate-800 dark:text-slate-200">{legalRecord.legal_nature || 'Sociedade Empresária Limitada'}</div>
              </div>
              <div className="space-y-1 md:col-span-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">CNAE Principal</span>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white">
                  {legalRecord.primary_cnae?.code} — {legalRecord.primary_cnae?.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. QUALIFICAÇÃO LEAD */}
        {activeTab === 'lead' && lead && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.16 Qualificação Comercial e Gestão de Oportunidades
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750">
                <span className="text-slate-500 dark:text-slate-400 block">Qualidade dos Dados</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{lead.data_quality_score}/100</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-emerald-800 dark:text-emerald-300 block">Potencial Comercial</span>
                <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">{lead.commercial_potential_score}/100</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-750">
                <span className="text-slate-500 dark:text-slate-400 block">Prioridade Comercial</span>
                <span className="text-2xl font-bold uppercase text-slate-900 dark:text-white">{lead.priority}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Evidências que Sustentam o Score:</span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                {lead.score_reasons?.map((reason: string, rIdx: number) => (
                  <li key={rIdx}>{reason}</li>
                ))}
              </ul>
            </div>

            {lead.next_commercial_action && (
              <div className="p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block">Próxima Ação Comercial Recomendada:</span>
                <span className="text-emerald-800 dark:text-emerald-400 mt-0.5 block">{lead.next_commercial_action}</span>
              </div>
            )}
          </div>
        )}

        {/* 11. DOM TRACEABILITY */}
        {activeTab === 'dom' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              4.17 Rastreabilidade da Raspagem e Evidências do DOM
            </h3>

            {(!evidences || evidences.length === 0) ? (
              <div className="text-slate-400 text-xs py-4">Sem evidências de seletores registradas.</div>
            ) : (
              <div className="space-y-4">
                {evidences.map((evi: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                          {evi.field_name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px]">
                          {evi.extraction_method}
                        </span>
                      </div>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        Confiança: {evi.confidence}%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Seletor CSS Utilizado:</span>
                        <code className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 block truncate font-mono">
                          {evi.css_selector_used || 'json_ld'}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Atributo HTML / Extração:</span>
                        <code className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 block truncate font-mono">
                          {evi.html_attribute || 'text'}
                        </code>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Valor Extraído:</span>
                      <div className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 break-all">
                        {evi.raw_value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
