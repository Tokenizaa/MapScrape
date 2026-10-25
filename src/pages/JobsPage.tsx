import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  Download,
  Terminal,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { ScrapeJob } from '../types/schema';
import { NavTab } from '../components/Sidebar';

interface JobsPageProps {
  onNavigate: (tab: NavTab) => void;
  selectedJobId?: string | null;
}

export const JobsPage: React.FC<JobsPageProps> = ({ onNavigate, selectedJobId }) => {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<ScrapeJob | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
        if (selectedJobId) {
          const match = data.find((j: ScrapeJob) => j.id === selectedJobId);
          if (match) setActiveJob(match);
        } else if (data.length > 0 && !activeJob) {
          setActiveJob(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [selectedJobId]);

  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusBadge = (status: ScrapeJob['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Em Execução
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluída
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" />
            Falha
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Na Fila
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Execuções & Tarefas de Coleta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Histórico das sessões de coleta com telemetria, contadores de registros e logs detalhados do DOM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchJobs}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => onNavigate('new_search')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-500/10"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Nova Execução</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Jobs List on Left, Active Job Logs & Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Jobs List (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Todas as Execuções ({jobs.length})
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Carregando execuções...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-2">
              <p>Nenhuma execução registrada até o momento.</p>
              <button
                onClick={() => onNavigate('new_search')}
                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                Iniciar primeira pesquisa
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
              {jobs.map(job => {
                const isSelected = activeJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setActiveJob(job)}
                    className={`p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/40 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {job.name}
                        </span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>Termo: <strong className="text-slate-700 dark:text-slate-300">{job.query}</strong></span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{new Date(job.start_time).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {job.processed_count} / {job.target_volume}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {job.duration_seconds ? `${job.duration_seconds}s` : 'em curso'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Job Detail & Live Console (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-5 transition-colors duration-200">
          {activeJob ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {activeJob.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ID: <code className="text-slate-700 dark:text-slate-300 font-mono">{activeJob.id}</code>
                  </div>
                </div>
                {activeJob.status === 'running' && (
                  <button
                    onClick={() => handleCancelJob(activeJob.id)}
                    className="px-3 py-1 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/80 text-red-700 dark:text-red-300 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Encontrados</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{activeJob.found_count}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                  <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block">Processados</span>
                  <span className="text-base font-bold text-emerald-800 dark:text-emerald-300">{activeJob.processed_count}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Duração</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{activeJob.duration_seconds || 0}s</span>
                </div>
              </div>

              {/* Console Logs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    Console de Rastreabilidade & DOM
                  </span>
                  <span className="text-[11px] text-slate-400">{activeJob.logs?.length || 0} eventos</span>
                </div>

                <div className="bg-slate-950 text-slate-200 rounded-lg p-3 text-xs font-mono h-80 overflow-y-auto space-y-2 select-text border border-slate-800">
                  {(!activeJob.logs || activeJob.logs.length === 0) ? (
                    <div className="text-slate-600">Nenhum log registrado.</div>
                  ) : (
                    activeJob.logs.map((log, idx) => {
                      let levelColor = 'text-slate-400';
                      if (log.level === 'warn') levelColor = 'text-amber-400';
                      if (log.level === 'error') levelColor = 'text-red-400 font-semibold';
                      if (log.level === 'success') levelColor = 'text-emerald-400 font-semibold';

                      return (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-slate-600 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString('pt-BR')}:{' '}
                          </span>
                          <span className={levelColor}>{log.message}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Job Export Action */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <button
                  onClick={() => onNavigate('businesses')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                >
                  Ver estabelecimentos coletados →
                </button>
                <button
                  onClick={() => onNavigate('exports')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Este Lote</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Selecione uma execução para inspecionar os detalhes e logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
