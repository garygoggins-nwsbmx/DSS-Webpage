import React, { useState } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { HeroHeader } from './components/HeroHeader';
import { StatewideAlerts } from './components/StatewideAlerts';
import { ForecasterKeyMessages } from './components/ForecasterKeyMessages';
import { OperationalBriefings } from './components/OperationalBriefings';
import { CurrentObservations } from './components/CurrentObservations';
import { GraphicsDashboard } from './components/GraphicsDashboard';
import { ArcGisMapSection } from './components/ArcGisMapSection';
import { LightboxModal } from './components/LightboxModal';
import { RadarModal } from './components/RadarModal';
import { EsriMigrationGuideModal } from './components/EsriMigrationGuideModal';
import { DssRequestModal } from './components/DssRequestModal';
import { Footer } from './components/Footer';
import { LightboxState } from './types';

export default function App() {
  const [isEsriGuideOpen, setIsEsriGuideOpen] = useState<boolean>(false);
  const [isDssFormOpen, setIsDssFormOpen] = useState<boolean>(false);
  const [radarModalCode, setRadarModalCode] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState>({
    isOpen: false,
    title: ''
  });

  const handleOpenLightbox = (src: string, title: string) => {
    setLightbox({
      isOpen: true,
      src,
      title
    });
  };

  const handleOpenLightboxLayers = (layers: string[], title: string) => {
    setLightbox({
      isOpen: true,
      layers,
      title
    });
  };

  const handleCloseLightbox = () => {
    setLightbox(prev => ({ ...prev, isOpen: false }));
  };

  const handleOpenRadarModal = (code: string) => {
    setRadarModalCode(code);
  };

  const handleCloseRadarModal = () => {
    setRadarModalCode(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Sticky Top Navigation with Mobile Pancake Menu */}
      <TopNavbar onOpenDssForm={() => setIsDssFormOpen(true)} />

      {/* Hero Header & Partner Banner */}
      <HeroHeader 
        onOpenEsriGuide={() => setIsEsriGuideOpen(true)} 
        onOpenDssForm={() => setIsDssFormOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full space-y-6 mt-6">
        
        {/* NWS Forecaster Key Messages & AFD Discussion */}
        <section id="key-messages" className="max-w-[98%] mx-auto scroll-mt-16 sm:scroll-mt-20">
          <ForecasterKeyMessages onOpenLightbox={handleOpenLightbox} />
        </section>

        {/* Interactive Statewide Hazard & Radar Map (Prominent Full-Width Display) */}
        <section id="interactive-radar-map" className="max-w-[98%] mx-auto scroll-mt-16 sm:scroll-mt-20">
          <StatewideAlerts />
        </section>

        {/* Operational Briefings: Daily Slides, Hazardous Slides & Webinar Video */}
        <OperationalBriefings />

        {/* Live Surface Observations & Daily Climate Records */}
        <CurrentObservations />

        {/* Massive Full-Width Graphics Dashboard */}
        <GraphicsDashboard
          onOpenLightbox={handleOpenLightbox}
          onOpenLightboxLayers={handleOpenLightboxLayers}
        />

        {/* Native ArcGIS County Warning Areas WebMap Section */}
        <ArcGisMapSection />
      </main>

      {/* Footer */}
      <Footer onOpenEsriGuide={() => setIsEsriGuideOpen(true)} />

      {/* Pop-out Lightbox Modal */}
      <LightboxModal
        lightbox={lightbox}
        onClose={handleCloseLightbox}
      />

      {/* Pop-out Radar Modal */}
      <RadarModal
        isOpen={!!radarModalCode}
        initialCode={radarModalCode || 'KBMX'}
        onClose={handleCloseRadarModal}
      />

      {/* ESRI Platform Migration Advisory Modal */}
      <EsriMigrationGuideModal
        isOpen={isEsriGuideOpen}
        onClose={() => setIsEsriGuideOpen(false)}
      />

      {/* In-Page DSS Request Form Modal Window */}
      <DssRequestModal
        isOpen={isDssFormOpen}
        onClose={() => setIsDssFormOpen(false)}
      />
    </div>
  );
}
