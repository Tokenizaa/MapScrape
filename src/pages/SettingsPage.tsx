import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [concurrencyLimit, setConcurrencyLimit] = useState('5');
  const [timeoutSeconds, setTimeoutSeconds] = useState('15');
  const [userAgent, setUserAgent] = useState('');
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';'>(',');
  const [includeBom, setIncludeBom] = useState(true);
  const [protectFormulas, setProtectFormulas] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const s = await res.json();
        setFirecrawlKey(s.firecrawlApiKeyMasked || '');
        setConcurrencyLimit(String(s.concurrencyLimit || 5));
        setTimeoutSeconds(String(s.timeoutSeconds || 15));
        setUserAgent(s.userAgent || '');
        setCsvDelimiter(s.csvDelimiter || ',');
        setIncludeBom(s.includeBom ?? true);
        setProtectFormulas(s.protectFormulas ?? true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedFeedback(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firecrawlApiKey: firecrawlKey,
          concurrencyLimit: parseInt(concurrencyLimit, 10),
          timeoutSeconds: parseInt(timeoutSeconds, 10),
          userAgent,
          csvDelimiter,
          includeBom,
          protectFormulas,
        }),
      });

      if (res.ok) {
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3000);
        fetchSettings();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Configurações do Motor de Coleta & Segurança
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerencie limites de requisições, concorrência, credenciais seguras de enriquecimento e formatação universal de dados.
        </p>
      </div>

      {savedFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Configurações salvas e aplicadas com sucesso no backend.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 text-xs transition-colors duration-200">
        {/* Firecrawl Credentials */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Credenciais de Enriquecimento Externo (Firecrawl)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
            A chave de API é armazenada e manipulada exclusivamente no servidor Node.js backend. Quando ausente, a plataforma opera com o motor nativo Cheerio DOM para inspeção e extração.
          </p>
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">Chave de API Firecrawl (Opcional)</label>
            <input
              type="text"
              value={firecrawlKey}
              onChange={e => setFirecrawlKey(e.target.value)}
              placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {firecrawlKey ? 'Chave configurada e ativa no backend.' : 'Nenhuma chave externa configurada (usando extrator nativo).'}
            </span>
          </div>
        </div>

        {/* Engine Limits */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Limites Operacionais & Concorrência
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Limite de Concorrência de Requisições</label>
              <input
                type="number"
                min="1"
                max="20"
                value={concurrencyLimit}
                onChange={e => setConcurrencyLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Processos simultâneos de extração.</span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Timeout por Página (Segundos)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={timeoutSeconds}
                onChange={e => setTimeoutSeconds(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Tempo limite para abortar páginas lentas.</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">User-Agent Utilizado nas Conexões</label>
            <input
              type="text"
              value={userAgent}
              onChange={e => setUserAgent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-[11px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Export Defaults */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Padrões de Exportação
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Delimitador Padrão do CSV</label>
              <select
                value={csvDelimiter}
                onChange={e => setCsvDelimiter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value=",">Vírgula (,)</option>
                <option value=";">Ponto e vírgula (;)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBom}
                onChange={e => setIncludeBom(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Incluir BOM UTF-8 por padrão em arquivos CSV</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={protectFormulas}
                onChange={e => setProtectFormulas(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span className="text-slate-800 dark:text-slate-200 font-semibold">Ativar proteção contra injeção de fórmulas por padrão</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer shadow-emerald-500/10"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
};
