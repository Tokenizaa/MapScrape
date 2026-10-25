import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  Terminal,
} from 'lucide-react';
import { TestSuiteReport } from '../server/testsRunner';

export const TestsPage: React.FC = () => {
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/tests/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Central de Testes Automatizados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validação rigorosa dos 10+ testes obrigatórios definidos na Seção 12 da especificação técnica.
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer shadow-emerald-500/10"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executando Testes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Executar Bateria de Testes</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Overview */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Testes</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{report.total_tests}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs transition-colors duration-200">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Aprovados</span>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>{report.passed_tests}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Falhas</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {report.failed_tests === 0 ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">0</span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-bold">{report.failed_tests}</span>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tempo Total</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{report.duration_ms} ms</div>
          </div>
        </div>
      )}

      {/* Tests Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Relatório de Asserções e Integridade
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Última execução: {report ? new Date(report.timestamp).toLocaleTimeString('pt-BR') : '-'}
          </span>
        </div>

        {!report ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando relatório de testes...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {report.results.map((test, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors space-y-2 text-xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {test.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-[10px] border border-slate-200 dark:border-slate-700">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      <strong>Asserção:</strong> {test.assertion}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-400 font-mono text-[11px]">{test.duration_ms}ms</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      test.status === 'passed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
                    }`}>
                      {test.status === 'passed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          APROVADO
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          FALHOU
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {test.details && (
                  <div className="bg-slate-50 dark:bg-slate-800/70 p-2.5 rounded font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {test.details}
                  </div>
                )}
                {test.error && (
                  <div className="bg-red-50 dark:bg-red-950/50 p-2.5 rounded font-mono text-[11px] text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                    Erro: {test.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
