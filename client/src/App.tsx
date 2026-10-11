import { useState } from 'react';
import { Sidebar, type NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EvidenceDrawer } from './components/evidence/EvidenceDrawer';
import { OverviewPage } from './pages/OverviewPage';
import { GhatPrioritiesPage } from './pages/GhatPrioritiesPage';
import { WaterQualityPage } from './pages/WaterQualityPage';
import { EvidenceExplorerPage } from './pages/EvidenceExplorerPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { BriefingPage } from './pages/BriefingPage';
import { MethodologyPage } from './pages/MethodologyPage';
import type { Measurement } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('overview');
  const [selectedGhat, setSelectedGhat] = useState<string>('Bairagarh (Sant Hirdaram) kund');
  const [evidenceInitialSite, setEvidenceInitialSite] = useState<string>('all');
  const [evidenceInitialParam, setEvidenceInitialParam] = useState<string>('all');
  const [inspectingMeasurement, setInspectingMeasurement] = useState<Measurement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const handleSelectGhatFromAnywhere = (siteName: string) => {
    setSelectedGhat(siteName);
    setCurrentTab('quality');
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Desktop & Mobile Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        language={language}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentTab={currentTab}
          onOpenMobile={() => setMobileMenuOpen(true)}
          language={language}
          onToggleLanguage={toggleLanguage}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {currentTab === 'overview' && (
            <OverviewPage
              onSelectGhat={handleSelectGhatFromAnywhere}
              onNavigateToTab={(tab) => setCurrentTab(tab)}
              onInspectEvidence={handleInspectRecordInDrawer}
              language={language}
            />
          )}

          {currentTab === 'priorities' && (
            <GhatPrioritiesPage
              onSelectGhat={handleSelectGhatFromAnywhere}
              onNavigateToEvidenceWithSite={handleNavigateToEvidenceWithSite}
              language={language}
            />
          )}

          {currentTab === 'quality' && (
            <WaterQualityPage
              selectedSite={selectedGhat}
              onSelectSite={setSelectedGhat}
              onNavigateToEvidenceWithSite={handleNavigateToEvidenceWithSite}
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
      </div>

      {/* Granular Evidence Inspection Drawer */}
      <EvidenceDrawer
        measurement={inspectingMeasurement}
        onClose={handleCloseDrawer}
        language={language}
      />
    </div>
  );
}

export default App;
