import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewPage } from './pages/OverviewPage';
import { NewSearchPage } from './pages/NewSearchPage';
import { JobsPage } from './pages/JobsPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { SelectorsPage } from './pages/SelectorsPage';
import { FieldsPage } from './pages/FieldsPage';
import { ExportsPage } from './pages/ExportsPage';
import { TestsPage } from './pages/TestsPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectBusiness = (id: string) => {
    setSelectedBusinessId(id);
    setCurrentTab('business_detail');
  };

  const handleJobStarted = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentTab('jobs');
    fetchStats();
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'business_detail') {
            setSelectedBusinessId(null);
          }
        }}
        activeJobsCount={stats?.activeJobs || 0}
        totalBusinesses={stats?.totalBusinesses || 0}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/90 transition-colors duration-200">
        {currentTab === 'overview' && (
          <OverviewPage
            stats={stats}
            onNavigate={setCurrentTab}
            onSelectBusiness={handleSelectBusiness}
          />
        )}

        {currentTab === 'new_search' && (
          <NewSearchPage
            onJobStarted={handleJobStarted}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'jobs' && (
          <JobsPage
            onNavigate={setCurrentTab}
            selectedJobId={selectedJobId}
          />
        )}

        {currentTab === 'businesses' && (
          <BusinessesPage
            onSelectBusiness={handleSelectBusiness}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'business_detail' && selectedBusinessId && (
          <BusinessDetailPage
            businessId={selectedBusinessId}
            onBack={() => setCurrentTab('businesses')}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'selectors' && (
          <SelectorsPage />
        )}

        {currentTab === 'fields' && (
          <FieldsPage />
        )}

        {currentTab === 'exports' && (
          <ExportsPage />
        )}

        {currentTab === 'tests' && (
          <TestsPage />
        )}

        {currentTab === 'settings' && (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
