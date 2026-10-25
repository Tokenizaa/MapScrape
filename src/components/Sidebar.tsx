import React from 'react';
import {
  LayoutDashboard,
  Search,
  ListOrdered,
  Building2,
  Code2,
  Database,
  Download,
  CheckCircle2,
  Settings,
  ShieldCheck,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type NavTab =
  | 'overview'
  | 'new_search'
  | 'jobs'
  | 'businesses'
  | 'business_detail'
  | 'selectors'
  | 'fields'
  | 'exports'
  | 'tests'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeJobsCount: number;
  totalBusinesses: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeJobsCount,
  totalBusinesses,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  const navItems = [
    { id: 'overview' as NavTab, label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'new_search' as NavTab, label: 'Nova Pesquisa', icon: Search },
    {
      id: 'jobs' as NavTab,
      label: 'Execuções',
      icon: ListOrdered,
      badge: activeJobsCount > 0 ? `${activeJobsCount} ativa${activeJobsCount > 1 ? 's' : ''}` : undefined,
      badgeColor: 'bg-emerald-500 text-white animate-pulse',
    },
    {
      id: 'businesses' as NavTab,
      label: 'Base Cadastral',
      icon: Building2,
      badge: totalBusinesses > 0 ? String(totalBusinesses) : undefined,
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    { id: 'selectors' as NavTab, label: 'Seletores DOM', icon: Code2 },
    { id: 'fields' as NavTab, label: 'Catálogo de Campos', icon: Layers },
    { id: 'exports' as NavTab, label: 'Exportações', icon: Download },
    { id: 'tests' as NavTab, label: 'Testes Automatizados', icon: CheckCircle2 },
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen select-none shrink-0 transition-colors duration-200">
      {/* Brand Header & Dark Mode Toggle */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200 dark:shadow-none">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white leading-none flex items-center gap-1.5 text-sm">
              MapScrape <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider">Pro</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Dados Comerciais & DOM
            </div>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200/50 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Switch & Engine Status Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Motor de Coleta Ativo</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v2.0.0</span>
        </div>

        <div className="flex items-center justify-between px-1 text-[10px] text-slate-500 dark:text-slate-400">
          <span>Modo {isDark ? 'Escuro' : 'Claro'} ativo</span>
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Seguro
          </span>
        </div>
      </div>
    </aside>
  );
};
