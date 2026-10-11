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
import type { Measurement, GhatPriority } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedGhat, setSelectedGhat] = useState<string>('Bairagarh (Sant Hirdaram) kund');
  const [evidenceInitialSite, setEvidenceInitialSite] = useState<string>('all');
  const [evidenceInitialParam, setEvidenceInitialParam] = useState<string>('all');
  const [inspectingMeasurement, setInspectingMeasurement] = useState<Measurement | null>(null);
  const [inspectingGhat, setInspectingGhat] = useState<GhatPriority | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [dataSource, setDataSource] = useState<'loading' | 'api' | 'embedded'>('loading');

  // Prefer live data from the Express API; fall back to the embedded dataset if it is unreachable.
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

  if (dataSource === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading ghat monitoring data…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Header matching mockup */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {dataSource === 'embedded' && currentTab !== 'overview' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
              The GhatWatch API is not reachable, so the bundled copy of the 2023–2025 dataset is being shown.
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
          </main>
        )}
      </div>

      {/* Granular Evidence Inspection Drawer */}
      <EvidenceDrawer
        measurement={inspectingMeasurement}
        onClose={handleCloseDrawer}
        language={language}
      />

      {/* Visarjan Ghat Location & Comprehensive Details Modal */}
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

export default App;
