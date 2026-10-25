import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { ScrapeSelectorRegistry } from '../types/schema';

export const SelectorsPage: React.FC = () => {
  const [selectors, setSelectors] = useState<ScrapeSelectorRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchSelectors = async () => {
    try {
      const res = await fetch('/api/selectors');
      if (res.ok) {
        const data = await res.json();
        setSelectors(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectors();
  }, []);

  const handleTestSelector = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/selectors/${id}/test`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setTestResult(result);
        fetchSelectors();
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explorador de Seletores DOM & Rastreabilidade
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro contínuo de seletores CSS, atributos inspecionados, cadeias de fallback e validação técnica em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Monitoramento de Quebra de DOM Ativo</span>
        </div>
      </div>

      {/* Test feedback banner */}
      {testResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Validação de Seletor Executada com Sucesso</span>
          </div>
          <div>Campo testado: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">{testResult.target_field}</code></div>
          <div>CSS validado: <code className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded">{testResult.css_tested}</code></div>
          <div>Amostra extraída: <strong className="font-semibold">{testResult.extracted_sample}</strong></div>
        </div>
      )}

      {/* Selectors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando catálogo de seletores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Campo Alvo / Fonte</th>
                  <th className="py-3 px-4">Seletor CSS Primário</th>
                  <th className="py-3 px-4">Atributo DOM</th>
                  <th className="py-3 px-4">Estratégia de Fallback</th>
                  <th className="py-3 px-4 text-center">Sucessos / Falhas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {selectors.map(sel => (
                  <tr key={sel.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    {/* Field & Source */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-mono">
                        {sel.target_field}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {sel.source_name}
                      </div>
                    </td>

                    {/* CSS Selector */}
                    <td className="py-3.5 px-4">
                      <code className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[11px] font-mono block max-w-xs truncate border border-slate-200 dark:border-slate-750">
                        {sel.primary_css_selector}
                      </code>
                    </td>

                    {/* Attribute */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold border border-emerald-100 dark:border-emerald-800/60">
                        {sel.attribute_name}
                      </span>
                    </td>

                    {/* Fallback */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-tight">
                        {sel.fallback_strategy}
                      </div>
                      {sel.alternative_css_selector && (
                        <code className="text-slate-500 dark:text-slate-400 text-[10px] block mt-1 truncate">
                          Alt: {sel.alternative_css_selector}
                        </code>
                      )}
                    </td>

                    {/* Counters */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sel.success_count}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sel.failure_count} falhas
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Verificado
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleTestSelector(sel.id)}
                        disabled={testingId === sel.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 border border-transparent dark:border-slate-700"
                      >
                        <Play className="w-3 h-3" />
                        <span>{testingId === sel.id ? 'Testando...' : 'Revalidar'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
