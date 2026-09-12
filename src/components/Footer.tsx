import React from 'react';
import { ExternalLink, Rss, Layers } from 'lucide-react';

interface Props {
  onOpenEsriGuide: () => void;
}

export const Footer: React.FC<Props> = ({ onOpenEsriGuide }) => {
  return (
    <footer className="mt-12 bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Attribution */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <img
            src="https://www.weather.gov/images/bmx/nwslogo.png"
            alt="NWS Logo"
            className="w-12 h-12 object-contain opacity-80"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/100x100/002B49/FFFFFF?text=NWS';
            }}
          />
          <div>
            <div className="text-sm font-bold text-slate-200">
              National Weather Service &bull; Weather Forecast Office Birmingham, AL (BMX)
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Decision Support Services (DSS) Statewide Portal &bull; NOAA / National Oceanic and Atmospheric Administration
            </div>
          </div>
        </div>

        {/* Center: ESRI Platform Transition shortcut */}
        <button
          onClick={onOpenEsriGuide}
          className="bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ArcGIS Experience Builder Transition Architecture</span>
        </button>

        {/* Right: Social & Feeds */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
          <a
            href="https://x.com/NWSBirmingham"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition no-underline flex items-center gap-1.5"
          >
            <span>Follow on X</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href="https://www.facebook.com/NWSBirmingham"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition no-underline flex items-center gap-1.5"
          >
            <span>Facebook</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href="https://www.youtube.com/user/NWSBirmingham"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white transition no-underline flex items-center gap-1.5"
          >
            <span>YouTube</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          <a
            href="https://forecast.weather.gov/rss_page.php?site_name=bmx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 transition no-underline flex items-center gap-1.5 font-bold"
          >
            <Rss className="w-3.5 h-3.5" />
            <span>BMX RSS</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
