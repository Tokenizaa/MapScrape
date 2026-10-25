import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Archive,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { ExportJob, ScrapeJob } from '../types/schema';

export const ExportsPage: React.FC = () => {
  const [format, setFormat] = useState<'csv' | 'json' | 'zip_multi_csv'>('csv');
  const [delimiter, setDelimiter] = useState<',' | ';'>(',');
  const [includeBom, setIncludeBom] = useState(true);
  const [protectFormulas, setProtectFormulas] = useState(true);
  const [filterJobId, setFilterJobId] = useState<string>('all');
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastExport, setLastExport] = useState<ExportJob | null>(null);
  const [copiedContract, setCopiedContract] = useState(false);

  const fetchExportInfo = async () => {
    try {
      const [resJobs, resStats] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/stats'),
      ]);
      if (resJobs.ok) {
        const jData = await resJobs.json();
        setJobs(jData);
      }
      if (resStats.ok) {
        const sData = await resStats.json();
        setExportHistory(sData.recentExports || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExportInfo();
  }, []);

  const handleGenerateExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setLastExport(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          delimiter,
          include_bom: includeBom,
          protect_formula_injection: protectFormulas,
          filter_job_id: filterJobId === 'all' ? undefined : filterJobId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar arquivo de exportação');
      }

      const job: ExportJob = await response.json();
      setLastExport(job);
      setExportHistory(prev => [job, ...prev]);

      // Automatically trigger browser download
      const link = document.createElement('a');
      link.href = job.download_url;
      link.download = job.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Erro ao exportar base');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContract = () => {
    const contract = `CONTRATO DE INTEROPERABILIDADE - MAPSCRAPE PRO (v2.0.0)
Formato Principal: CSV UTF-8 com BOM e cabeçalhos estáveis em snake_case.
Chave Primária: business_id (UUID / String estável).
Proteção contra Fórmulas: Células iniciando com '=', '+', '-', '@' prefixadas com "'".

Colunas do CSV Mestre:
business_id,business_name,normalized_name,legal_name,primary_category,commercial_segment,establishment_type,listing_status,phone_primary,whatsapp_link,email_primary,website_url,rating,review_count,full_address,street,number,neighborhood,city,state,postal_code,latitude,longitude,google_place_id,source_url,enrichment_status,lead_quality_score,commercial_potential_score,lead_priority,created_at,updated_at

Pacote ZIP Multi-CSV Relacional:
- businesses.csv (cadastro principal)
- addresses.csv (geolocalização e endereços normalizados)
- contacts.csv (telefones, WhatsApp e e-mails)
- websites.csv (metadados, CMS e tecnologias)
- reviews.csv (avaliações e respostas)
- business_hours.csv (grade semanal)
- legal_records.csv (CNPJ e dados Receita Federal)
- lead_qualification.csv (scores de oportunidade)
- field_sources.csv (rastreabilidade DOM e seletores)
- manifest.json (metadados e contagens da exportação)
- schema_dictionary.csv (dicionário de tipos de dados)
`;
    navigator.clipboard.writeText(contract);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Central de Exportação Universal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gere arquivos em formatos universais para utilização independente em qualquer outro sistema, planilha ou banco de dados.
          </p>
        </div>
        <button
          onClick={copyContract}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-transparent dark:border-slate-700"
        >
          {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedContract ? 'Contrato Copiado!' : 'Copiar Contrato de Importação'}</span>
        </button>
      </div>

      {/* Export Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Box (7 cols) */}
        <form onSubmit={handleGenerateExport} className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 transition-colors duration-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Parâmetros do Arquivo de Saída
          </h2>

          {/* Format Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Formato de Exportação *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'csv',
                  title: 'CSV Mestre UTF-8',
                  desc: '1 linha por empresa. Ideal para Excel, Sheets e CRM.',
                  icon: FileSpreadsheet,
                },
                {
                  id: 'json',
                  title: 'JSON Aninhado',
                  desc: 'Estrutura completa com arrays de contatos e horas.',
                  icon: FileCode,
                },
                {
                  id: 'zip_multi_csv',
                  title: 'ZIP Multi-CSV',
                  desc: '13 tabelas relacionais + manifest.json + dicionário.',
                  icon: Archive,
                },
              ].map(f => {
                const Icon = f.icon;
                const isSelected = format === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <input
                        type="radio"
                        name="export_format"
                        checked={isSelected}
                        onChange={() => {}}
                        className="accent-emerald-600"
                      />
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{f.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{f.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delimiter & Compatibility */}
          {format !== 'json' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delimitador de Colunas</label>
                <select
                  value={delimiter}
                  onChange={e => setDelimiter(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value=",">Vírgula (,) — Padrão Internacional</option>
                  <option value=";">Ponto e Vírgula (;) — Padrão Brasil / Excel</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filtrar por Execução</label>
                <select
                  value={filterJobId}
                  onChange={e => setFilterJobId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Exportar Toda a Base de Estabelecimentos</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.name} ({j.processed_count} registros)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Security & Encodings Toggles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeBom}
                onChange={e => setIncludeBom(e.target.checked)}
                className="accent-emerald-600 rounded mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Incluir Byte Order Mark UTF-8 (BOM)</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Garante abertura automática com acentos corretos em softwares de planilhas (Microsoft Excel, LibreOffice, Apple Numbers).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={protectFormulas}
                onChange={e => setProtectFormulas(e.target.checked)}
                className="accent-emerald-600 rounded mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Proteção Rigorosa Contra Injeção de Fórmulas (DDE Sanitization)
                </span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Inativa comandos maliciosos prefixando células iniciadas com =, +, -, @ com apóstrofo, protegendo a equipe contra ataques em planilhas.
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Contrato de interoperabilidade autônomo. Sem dependência de login ou API.
            </span>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer shadow-emerald-500/10"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Gerando Arquivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Gerar e Baixar Arquivo</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Contract & Specs Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Success Banner if exported recently */}
          {lastExport && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Arquivo Pronto para Uso!</span>
              </div>
              <div>Arquivo: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-bold">{lastExport.file_name}</code></div>
              <div>Registros exportados: <strong className="font-bold">{lastExport.records_count}</strong></div>
              <div>Tamanho: <span className="font-mono">{lastExport.file_size_bytes ? `${Math.round(lastExport.file_size_bytes / 1024)} KB` : 'N/A'}</span></div>
              <div className="pt-1">
                <a
                  href={lastExport.download_url}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Novamente</span>
                </a>
              </div>
            </div>
          )}

          {/* Contract Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 text-xs transition-colors duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Contrato de Importação & Interoperabilidade</span>
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              O arquivo gerado é o contrato definitivo. Qualquer outro projeto (Python, Node, Go, R, Power BI, Excel ou bancos relacionais) pode consumir a base diretamente sem chamar APIs externas.
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
              <div>• Codificação: UTF-8 + BOM</div>
              <div>• Delimitador: Configurável (, ou ;)</div>
              <div>• Chave de Relacionamento: business_id</div>
              <div>• Escape de Fórmulas: Ativado (Prefixo ')</div>
              <div>• Versão do Esquema: 2.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
