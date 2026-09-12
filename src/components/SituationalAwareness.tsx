import React, { useState } from 'react';
import { Radio, Satellite, Maximize2 } from 'lucide-react';
import { RADAR_SITES } from '../data/weatherData';
import { RadarSite } from '../types';

interface Props {
  onOpenLightbox: (src: string, title: string) => void;
  onOpenRadarModal: (currentCode: string) => void;
}

export const SituationalAwareness: React.FC<Props> = ({ onOpenLightbox, onOpenRadarModal }) => {
  const [activeRadar, setActiveRadar] = useState<RadarSite>(RADAR_SITES[0]);

  const satUrl = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/smv/GEOCOLOR/GOES19-SMV-GEOCOLOR-600x600.gif';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[98%] mx-auto mb-6">
      {/* Regional & Local Radar Switcher */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-sky-950 to-slate-900 px-5 py-3.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight m-0 text-white">
              Local Radar ({activeRadar.code})
            </h2>
          </div>
          <button
            onClick={() => onOpenRadarModal(activeRadar.code)}
            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-xl transition-all border border-white/20 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Pop Out</span>
          </button>
        </div>

        {/* Quick Radar Selector Pill Bar */}
        <div className="bg-slate-900/95 px-3 py-2 flex items-center justify-start sm:justify-center gap-1.5 border-b border-slate-800 overflow-x-auto text-[11px] font-bold">
          {RADAR_SITES.map((site) => {
            const isActive = activeRadar.code === site.code;
            return (
              <button
                key={site.code}
                onClick={() => setActiveRadar(site)}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {site.shortName}
              </button>
            );
          })}
        </div>

        {/* Radar Loop Display */}
        <div
          onClick={() => onOpenRadarModal(activeRadar.code)}
          className="p-0 bg-slate-950 flex-grow flex items-center justify-center cursor-zoom-in group relative aspect-square lg:aspect-auto min-h-[320px]"
          title="Click to pop out full-screen radar viewer"
        >
          <img
            src={`https://radar.weather.gov/ridge/standard/${activeRadar.code}_loop.gif`}
            alt={`${activeRadar.label} Loop`}
            className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-90"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/600x600/002B49/FFFFFF?text=Radar+Unavailable';
            }}
          />
          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-medium border border-white/10">
            {activeRadar.label}
          </div>
        </div>
      </div>

      {/* Satellite Imagery */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-5 py-3.5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight m-0 text-white">
              GOES-East GeoColor Loop
            </h2>
          </div>
          <button
            onClick={() => onOpenLightbox(satUrl, 'GOES-East Satellite (South Mississippi Valley)')}
            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-xl transition-all border border-white/20 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Pop Out</span>
          </button>
        </div>

        <div
          onClick={() => onOpenLightbox(satUrl, 'GOES-East Satellite (South Mississippi Valley)')}
          className="p-0 bg-slate-950 flex-grow flex items-center justify-center cursor-zoom-in group relative aspect-square lg:aspect-auto min-h-[320px]"
          title="Click to open satellite view in lightbox"
        >
          <img
            src={satUrl}
            alt="GOES-East GeoColor Satellite Loop"
            className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-90"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/600x600/002B49/FFFFFF?text=Satellite+Unavailable';
            }}
          />
          <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-medium border border-white/10">
            South Mississippi Valley
          </div>
        </div>
      </div>
    </section>
  );
};
