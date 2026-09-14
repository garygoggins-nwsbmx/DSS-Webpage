import React from 'react';
import { Layers, ExternalLink } from 'lucide-react';

export const ArcGisMapSection: React.FC = () => {
  return (
    <section 
      id="cwa-maps"
      className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-slate-200/80 text-center max-w-[98%] mx-auto mb-10 scroll-mt-16 sm:scroll-mt-20"
    >
      <div className="flex flex-col items-center justify-center mb-4">
        <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight m-0">
          Alabama NWS County Warning Areas &amp; Offices
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-medium m-0">
          Interactive jurisdiction map. Click or tap to inspect office boundary, contacts, and forecast links.
        </p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-inner bg-slate-900">
        <iframe
          src="https://noaa.maps.arcgis.com/apps/Embed/index.html?webmap=cc1f04072b884c98af91f8184d9fd370&extent=-90.5,29.5,-82.5,35.5&zoom=true&previewImage=false&scale=true&search=true&searchextent=true&disable_scroll=true&theme=dark"
          title="Alabama NWS County Warning Areas & Offices"
          className="w-full h-[380px] sm:h-[550px] border-0 rounded-2xl block"
          loading="lazy"
          allowFullScreen
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 px-2">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          In ArcGIS Experience Builder, this WebMap is connected directly to the Map Widget with full 2-way event syncing.
        </span>
        <a
          href="https://noaa.maps.arcgis.com/home/item.html?id=cc1f04072b884c98af91f8184d9fd370"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline font-bold inline-flex items-center gap-1 mt-1 sm:mt-0"
        >
          <span>Open in ArcGIS Online</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </section>
  );
};
