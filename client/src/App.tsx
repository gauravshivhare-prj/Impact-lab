import { useEffect, useState } from 'react';
import type { NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EvidenceDrawer } from './components/evidence/EvidenceDrawer';
import { GhatDetailModal } from './components/ghat/GhatDetailModal';
import { dataService } from './services/dataService';
import { OverviewPage } from './pages/OverviewPage';
import { GhatMapPage } from './pages/GhatMapPage';
import { GhatPrioritiesPage } from './pages/GhatPrioritiesPage';
import { WaterQualityPage } from './pages/WaterQualityPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { RiskScreeningPage } from './pages/RiskScreeningPage';
import { BriefingPage } from './pages/BriefingPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AssistantPage } from './pages/AssistantPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { Measurement, GhatPriority } from './types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedGhat, setSelectedGhat] = useState<string>('Bairagarh (Sant Hirdaram) kund');
  const [evidenceInitialSite, setEvidenceInitialSite] = useState<string>('all');
  const [evidenceInitialParam, setEvidenceInitialParam] = useState<string>('all');
  const [inspectingMeasurement, setInspectingMeasurement] = useState<Measurement | null>(null);
  const [inspectingGhat, setInspectingGhat] = useState<GhatPriority | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [dataSource, setDataSource] = useState<'loading' | 'api' | 'embedded'>('loading');

  // Load data from API
  useEffect(() => {
    let cancelled = false;
    dataService.loadFromApi().then((loaded) => {
      if (!cancelled) setDataSource(loaded ? 'api' : 'embedded');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectGhatFromAnywhere = (siteName: string) => {
    setSelectedGhat(siteName);
    setCurrentTab('quality');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGhatDetail = (ghatOrSite: GhatPriority | string) => {
    if (typeof ghatOrSite === 'string') {
      const found = dataService.getGhatDetails(ghatOrSite);
      if (found) {
        setInspectingGhat(found);
      }
    } else {
      setInspectingGhat(ghatOrSite);
    }
  };

  const handleNavigateToMap = (siteName?: string) => {
    if (siteName) setSelectedGhat(siteName);
    setCurrentTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToEvidenceWithSite = (siteName: string, param?: string) => {
    setEvidenceInitialSite(siteName);
    setEvidenceInitialParam(param || 'all');
    setCurrentTab('evidence');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInspectRecordInDrawer = (measurement: Measurement) => {
    setInspectingMeasurement(measurement);
  };

  const handleCloseDrawer = () => {
    setInspectingMeasurement(null);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">
            {language === 'hi' ? 'प्रमाणीकरण जांच रहा है...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage language={language} />;
  }

  // Show admin dashboard for administrators
  if (user?.role === 'administrator') {
    return <AdminDashboardPage language={language} />;
  }

  // Show loading state while loading data
  if (dataSource === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">
            {language === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading ghat monitoring data...'}
          </p>
        </div>
      </div>
    );
  }

  // Municipal Officer Dashboard (main application)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        onToggleLanguage={toggleLanguage}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {dataSource === 'embedded' && currentTab !== 'overview' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              The GhatRakshak API is not reachable, so the bundled copy of the 2023–2025 dataset is being shown.
            </div>
          </div>
        )}

        {currentTab === 'overview' && (
          <OverviewPage
            onSelectGhat={handleOpenGhatDetail}
            onOpenGhatDetail={handleOpenGhatDetail}
            onNavigateToTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onInspectEvidence={handleInspectRecordInDrawer}
            language={language}
          />
        )}

        {currentTab === 'map' && (
          <GhatMapPage
            selectedSite={selectedGhat}
            onSelectGhat={handleSelectGhatFromAnywhere}
            onOpenGhatDetail={handleOpenGhatDetail}
            onInspectEvidence={(site) => handleNavigateToEvidenceWithSite(site)}
            language={language}
          />
        )}

        {currentTab !== 'overview' && currentTab !== 'map' && (
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full pb-12">
            {currentTab === 'priorities' && (
              <GhatPrioritiesPage
                onSelectGhat={handleOpenGhatDetail}
                onOpenGhatDetail={handleOpenGhatDetail}
                onNavigateToEvidenceWithSite={handleNavigateToEvidenceWithSite}
                language={language}
              />
            )}

            {currentTab === 'risk' && <RiskScreeningPage language={language} />}

            {currentTab === 'quality' && (
              <WaterQualityPage
                selectedSite={selectedGhat}
                onSelectSite={setSelectedGhat}
                onOpenGhatDetail={handleOpenGhatDetail}
                onNavigateToEvidenceWithSite={handleNavigateToEvidenceWithSite}
                onNavigateToMap={handleNavigateToMap}
                language={language}
              />
            )}

            {currentTab === 'evidence' && (
              <EvidenceExplorerPage
                initialSite={evidenceInitialSite}
                initialParameter={evidenceInitialParam}
                onInspectRecord={handleInspectRecordInDrawer}
                language={language}
              />
            )}

            {currentTab === 'data-quality' && (
              <DataQualityPage
                onInspectRecord={handleInspectRecordInDrawer}
                language={language}
              />
            )}

            {currentTab === 'briefings' && (
              <BriefingPage language={language} />
            )}

            {currentTab === 'methodology' && (
              <MethodologyPage language={language} />
            )}

            {currentTab === 'assistant' && (
              <AssistantPage language={language} />
            )}

            {currentTab === 'simulator' && (
              <SimulatorPage language={language} />
            )}
          </main>
        )}
      </div>

      {/* Granular Evidence Inspection Drawer */}
      <EvidenceDrawer
        measurement={inspectingMeasurement}
        onClose={handleCloseDrawer}
        language={language}
      />

      {/* Ghat Location & Details Modal */}
      <GhatDetailModal
        ghat={inspectingGhat}
        isOpen={inspectingGhat !== null}
        onClose={() => setInspectingGhat(null)}
        onNavigateToMap={handleNavigateToMap}
        onNavigateToQuality={handleSelectGhatFromAnywhere}
        onNavigateToEvidence={handleNavigateToEvidenceWithSite}
        language={language}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
