import React, { useState, useEffect, useCallback } from 'react';
import { GRAPHICS_TABS } from '../data/weatherData';
import { GraphicsTabId } from '../types';
import { TropicalOutlookSection } from './TropicalOutlookSection';
import { ChevronDown, ExternalLink } from 'lucide-react';

interface Props {
  onOpenLightbox: (src: string, title: string) => void;
  onOpenLightboxLayers: (layers: string[], title: string) => void;
}

export const GraphicsDashboard: React.FC<Props> = ({ onOpenLightbox, onOpenLightboxLayers }) => {
  const [activeTab, setActiveTab] = useState<GraphicsTabId>('tab-severe');

  // Track detection of 1x1 white dot placeholder images (NWS blank placeholder when no severe graphics are issued)
  const [severeImagesDotStatus, setSevereImagesDotStatus] = useState<Record<number, boolean>>({});

  const detectWhiteDot = useCallback((img: HTMLImageElement, day: number) => {
    if (img.naturalWidth === 1 && img.naturalHeight === 1) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pixel = ctx.getImageData(0, 0, 1, 1).data;
          // Check if pixel is white or transparent
          const isWhiteOrBlank =
            (pixel[0] >= 240 && pixel[1] >= 240 && pixel[2] >= 240) || pixel[3] === 0;
          setSevereImagesDotStatus((prev) => (prev[day] === isWhiteOrBlank ? prev : { ...prev, [day]: isWhiteOrBlank }));
          return;
        }
      } catch {
        // Fallback for canvas security error
        setSevereImagesDotStatus((prev) => (prev[day] ? prev : { ...prev, [day]: true }));
        return;
      }
      setSevereImagesDotStatus((prev) => (prev[day] ? prev : { ...prev, [day]: true }));
    } else if (img.naturalWidth > 1 && img.naturalHeight > 1) {
      setSevereImagesDotStatus((prev) => (prev[day] === false ? prev : { ...prev, [day]: false }));
    }
  }, []);

  useEffect(() => {
    [1, 2, 3].forEach((day) => {
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        detectWhiteDot(testImg, day);
      };
      testImg.src = `https://www.weather.gov/images/bmx/DSS/SevereAL${day}.png`;
    });
  }, [detectWhiteDot]);

  const groups = ['Hazard Outlooks', 'National Overviews', 'Forecast Elements', 'CPC Climate & Extended'] as const;

  const renderPrecipGrid = () => {
    return Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
      const url = `https://www.weather.gov/images/bmx/DSS/PoP${num}.png`;
      return (
        <div key={num} className="text-center group">
          <div
            onClick={() => onOpenLightbox(url, `Precipitation Chance - Period ${num}`)}
            className="cursor-zoom-in"
          >
            <img
              src={url}
              alt={`Period ${num}`}
              className="w-full rounded-xl shadow-xs border border-slate-200 transition-all duration-200 group-hover:scale-[1.02] group-hover:border-sky-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=Precip+Period+${num}`;
              }}
            />
          </div>
          <p className="mt-1 font-semibold text-xs text-slate-700 m-0">Period {num}</p>
        </div>
      );
    });
  };

  const renderWindGrid = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
      const url = `https://www.weather.gov/images/bmx/DSS/WindGustmph${num}.png`;
      return (
        <div key={num} className="text-center group">
          <div
            onClick={() => onOpenLightbox(url, `Max Wind Gust - Period ${num}`)}
            className="cursor-zoom-in"
          >
            <img
              src={url}
              alt={`Period ${num}`}
              className="w-full rounded-xl shadow-xs border border-slate-200 transition-all duration-200 group-hover:scale-[1.02] group-hover:border-sky-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=Wind+Gust+Period+${num}`;
              }}
            />
          </div>
          <p className="mt-1 font-semibold text-xs text-slate-700 m-0">Period {num}</p>
        </div>
      );
    });
  };

  const renderTempGrid = (prefix: string, labelPrefix: string) => {
    return Array.from({ length: 6 }, (_, i) => i + 1).map((num) => {
      const url = `https://www.weather.gov/images/bmx/DSS/${prefix}${num}.png`;
      return (
        <div key={num} className="text-center group">
          <div
            onClick={() => onOpenLightbox(url, `${labelPrefix} - Day ${num}`)}
            className="cursor-zoom-in"
          >
            <img
              src={url}
              alt={`Day ${num}`}
              className="w-full rounded-xl shadow-xs border border-slate-200 transition-all duration-200 group-hover:scale-[1.02] group-hover:border-sky-500"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${prefix}+Day+${num}`;
              }}
            />
          </div>
          <p className="mt-1 font-semibold text-xs text-slate-700 m-0">Day {num}</p>
        </div>
      );
    });
  };

  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden max-w-[98%] mx-auto mb-8 scroll-mt-16 sm:scroll-mt-20" id="statewidegraphics">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-5 border-b border-sky-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-4">
          <img
            src="https://www.weather.gov/images/bmx/footer-state-seal.png"
            alt="Alabama State Seal"
            className="w-16 h-16 object-contain hidden sm:block drop-shadow-md"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/100x100/002B49/FFFFFF?text=AL';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                All 67 Alabama Counties
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0 mt-1">
              Alabama Statewide Hazard &amp; Forecast Graphics
            </h2>
            <p className="text-xs text-sky-200/80 mt-1 flex items-center gap-1.5 m-0 font-normal">
              Multi-Agency Integrated Graphics: BMX, HUN, MOB, TAE, WPC, SPC, NHC, &amp; CPC
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-Only Dropdown */}
      <div className="block lg:hidden bg-slate-100 p-3.5 border-b border-slate-200">
        <label htmlFor="mobile-tab-select" className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
          ⚡ Jump Directly to Weather Hazard Category:
        </label>
        <div className="relative">
          <select
            id="mobile-tab-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as GraphicsTabId)}
            className="w-full bg-white border-2 border-sky-600/40 text-slate-900 font-bold text-sm rounded-xl p-3 pr-10 appearance-none shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            {groups.map((groupName) => (
              <optgroup key={groupName} label={groupName}>
                {GRAPHICS_TABS.filter((t) => t.group === groupName).map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.icon} {tab.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-sky-700">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Layout: Desktop Sidebar + Content Panel */}
      <div className="flex flex-col lg:flex-row min-h-[720px]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-72 bg-slate-50/90 border-r border-slate-200/80 p-3.5 flex-col gap-1 shrink-0 max-h-[880px] overflow-y-auto">
          {groups.map((groupName, gIdx) => (
            <React.Fragment key={groupName}>
              {gIdx > 0 && <hr className="my-2 border-slate-200" />}
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 pt-1 pb-1 block">
                {groupName}
              </span>
              {GRAPHICS_TABS.filter((t) => t.group === groupName).map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as GraphicsTabId)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#002B49] to-[#0284C7] text-white shadow-md font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-sky-700 border border-slate-200/60 shadow-2xs'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full lg:flex-grow p-6 sm:p-8 bg-white overflow-hidden">
          {/* TAB: Severe Impacts */}
          {activeTab === 'tab-severe' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">
                Severe Weather Impacts &amp; SPC Outlooks
              </h3>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-[#001E36] m-0">
                Local Statewide Impact Graphics
              </h4>

              <div className="flex flex-wrap justify-center gap-6 w-full mb-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.weather.gov/images/bmx/DSS/SevereAL${day}.png`;
                  const isWhiteDot = !!severeImagesDotStatus[day];
                  return (
                    <div
                      key={day}
                      style={isWhiteDot ? { display: 'none' } : undefined}
                      className={`w-full md:flex-1 max-w-xl text-center group ${isWhiteDot ? 'hidden' : ''}`}
                    >
                      <div
                        onClick={() => onOpenLightbox(url, `Day ${day} Severe Weather Impacts`)}
                        className="cursor-zoom-in"
                        style={isWhiteDot ? { display: 'none' } : undefined}
                      >
                        <img
                          src={url}
                          alt={`Day ${day} Severe Impacts`}
                          crossOrigin="anonymous"
                          ref={(el) => {
                            if (el && el.complete && el.naturalWidth > 0) {
                              detectWhiteDot(el, day);
                            }
                          }}
                          onLoad={(e) => {
                            detectWhiteDot(e.currentTarget, day);
                          }}
                          style={isWhiteDot ? { display: 'none' } : undefined}
                          className={`w-full h-auto rounded-xl shadow-sm border border-slate-200 transition-all duration-200 group-hover:border-sky-500 group-hover:shadow-md ${
                            isWhiteDot ? 'hidden' : ''
                          }`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=Day+${day}+Severe+Impacts`;
                          }}
                        />
                      </div>
                      <p className={`mt-2 text-xs font-semibold text-slate-600 m-0 ${isWhiteDot ? 'hidden' : ''}`}>
                        Day {day} Statewide Impact
                      </p>
                    </div>
                  );
                })}
                {[1, 2, 3].every((d) => severeImagesDotStatus[d]) && (
                  <div className="w-full text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs font-medium">
                    No active Day 1–3 severe weather impact graphics currently issued by NWS Birmingham (BMX).
                  </div>
                )}
              </div>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-rose-600 m-0">
                National Convective Outlooks (Storm Prediction Center)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.spc.noaa.gov/products/outlook/day${day}otlk.png`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `SPC Day ${day} Outlook`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`SPC Day ${day}`}
                          className="w-full h-auto rounded-xl shadow-sm border border-slate-200 transition-all duration-200 group-hover:border-sky-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/600x600/002B49/FFFFFF?text=Graphic+Unavailable';
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day} Categorical</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Observed Rain & Outlooks */}
          {activeTab === 'tab-ero' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">
                Observed Rainfall (Past 24-72 Hours)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { hours: '24', layerId: '25' },
                  { hours: '48', layerId: '33' },
                  { hours: '72', layerId: '37' }
                ].map((item) => (
                  <div
                    key={item.hours}
                    className="text-center group cursor-zoom-in"
                    onClick={() =>
                      onOpenLightboxLayers(
                        [
                          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&size=1200,900&imageSR=102100&format=png32&f=image',
                          'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&layers=show:1,3,5,7,9,11,13&size=1200,900&imageSR=102100&format=png32&transparent=true&f=image',
                          `https://mapservices.weather.noaa.gov/raster/rest/services/obs/rfc_qpe/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&layers=show:${item.layerId}&size=1200,900&imageSR=102100&format=png32&transparent=true&f=image`,
                          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&size=1200,900&imageSR=102100&format=png32&transparent=true&f=image'
                        ],
                        `Past ${item.hours} Hours Observed Rainfall (Alabama)`
                      )
                    }
                  >
                    <div className="relative w-full aspect-[4/3] rounded-xl shadow-sm border border-slate-200 overflow-hidden group-hover:scale-[1.02] group-hover:border-sky-500 transition-all duration-200 bg-[#e8ecef]">
                      <img
                        src="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&size=400,300&imageSR=102100&format=png32&f=image"
                        alt="Base map"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <img
                        src="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&layers=show:1,3,5,7,9,11,13&size=400,300&imageSR=102100&format=png32&transparent=true&f=image"
                        alt="Counties"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-0 opacity-100"
                      />
                      <img
                        src={`https://mapservices.weather.noaa.gov/raster/rest/services/obs/rfc_qpe/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&layers=show:${item.layerId}&size=400,300&imageSR=102100&format=png32&transparent=true&f=image`}
                        alt="Precip"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply pointer-events-none"
                      />
                      <img
                        src="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/export?bbox=-88.5,30.2,-84.8,35.0&bboxSR=4326&size=400,300&imageSR=102100&format=png32&transparent=true&f=image"
                        alt="Reference"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                    </div>
                    <p className="mt-2 font-semibold text-sm text-slate-700 m-0">{item.hours} hr Observed</p>
                  </div>
                ))}
              </div>

              {/* Precipitation Legend */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-3xl mx-auto">
                <h4 className="text-xs font-bold text-slate-800 mb-2 text-center">Precipitation Legend (Inches)</h4>
                <div className="h-3 w-full rounded-sm overflow-hidden flex shadow-inner">
                  <span className="flex-1 bg-[#d0e1f9]" title="< 0.01" />
                  <span className="flex-1 bg-[#9ecae1]" title="0.01 - 0.1" />
                  <span className="flex-1 bg-[#6baed6]" title="0.1 - 0.25" />
                  <span className="flex-1 bg-[#4292c6]" title="0.25 - 0.5" />
                  <span className="flex-1 bg-[#2171b5]" title="0.5 - 0.75" />
                  <span className="flex-1 bg-[#08519c]" title="0.75 - 1.0" />
                  <span className="flex-1 bg-[#006837]" title="1.0 - 1.5" />
                  <span className="flex-1 bg-[#31a354]" title="1.5 - 2.0" />
                  <span className="flex-1 bg-[#78c679]" title="2.0 - 2.5" />
                  <span className="flex-1 bg-[#c2e699]" title="2.5 - 3.0" />
                  <span className="flex-1 bg-[#ffffb2]" title="3.0 - 4.0" />
                  <span className="flex-1 bg-[#fecc5c]" title="4.0 - 5.0" />
                  <span className="flex-1 bg-[#fd8d3c]" title="5.0 - 6.0" />
                  <span className="flex-1 bg-[#f03b20]" title="6.0 - 8.0" />
                  <span className="flex-1 bg-[#bd0026]" title="8.0 - 10.0" />
                  <span className="flex-1 bg-[#7a0177]" title=">= 10.0" />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono-code font-bold">
                  <span>0.01</span>
                  <span>0.5</span>
                  <span>1.0</span>
                  <span>2.0</span>
                  <span>4.0</span>
                  <span>6.0</span>
                  <span>10+</span>
                </div>
              </div>

              {/* Excessive Rainfall Outlooks */}
              <h3 className="text-xl font-bold text-slate-800 m-0 pt-4 border-t border-slate-200">
                Excessive Rainfall Outlooks
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.wpc.ncep.noaa.gov/exper/eromap/statemaps/AL_Day${day}.png`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `Day ${day} Excessive Rainfall Outlook`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`Day ${day} ERO`}
                          className="w-full h-auto rounded-xl shadow-sm border border-slate-200 transition-all duration-200 group-hover:scale-[1.02] group-hover:border-sky-500"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=Day+${day}+Excessive+Rainfall`;
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: River Flooding */}
          {activeTab === 'tab-hydro' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">River Flooding (Observed &amp; Forecast)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.weather.gov/images/bmx/AL_Statewide_Observed.png', 'Statewide Observed River Stages')}
                    className="cursor-zoom-in"
                  >
                    <img
                      src="https://www.weather.gov/images/bmx/AL_Statewide_Observed.png"
                      alt="Statewide Observed"
                      className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:scale-[1.01] group-hover:border-sky-500 transition"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Observed+River+Stages';
                      }}
                    />
                  </div>
                  <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Statewide Observed River Stages</p>
                </div>

                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.weather.gov/images/bmx/AL_Statewide_Forecast.png', 'Statewide Forecast River Stages')}
                    className="cursor-zoom-in"
                  >
                    <img
                      src="https://www.weather.gov/images/bmx/AL_Statewide_Forecast.png"
                      alt="Statewide Forecast"
                      className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:scale-[1.01] group-hover:border-sky-500 transition"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Forecast+River+Stages';
                      }}
                    />
                  </div>
                  <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Statewide Forecast River Stages</p>
                </div>
              </div>

              <div className="text-center mt-4">
                <a
                  href="https://water.noaa.gov/wfo/bmx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-5 py-2.5 rounded-xl border border-sky-200 transition no-underline shadow-xs"
                >
                  <span>View National Water Prediction Service (NWPS) Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* TAB: Tropical Outlook */}
          {activeTab === 'tab-tropical' && (
            <TropicalOutlookSection onOpenLightbox={onOpenLightbox} />
          )}

          {/* TAB: Fire Weather */}
          {activeTab === 'tab-fire' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Fire Weather Risk (SPC)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((day) => {
                  const url = `https://www.spc.noaa.gov/products/fire_wx/day${day}otlk_fire.gif`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `Day ${day} Fire Weather Outlook`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`Day ${day} Fire`}
                          className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:border-sky-500 transition"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/600x600/002B49/FFFFFF?text=Fire+Weather+Graphic';
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day} Fire Weather Risk</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Heat Risk */}
          {activeTab === 'tab-heatrisk' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Heat Risk Outlooks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.wpc.ncep.noaa.gov/heatrisk/graphics/HeatRisk_Day${day}_AL.png`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `Day ${day} Heat Risk`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`Day ${day} Heat Risk`}
                          className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=Day+${day}+Heat+Risk`;
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day} Heat Risk</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Winter Impacts */}
          {activeTab === 'tab-winterimpacts' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Winter Weather Impacts</h3>
              <div className="max-w-2xl mx-auto text-center group">
                <div
                  onClick={() => onOpenLightbox('https://www.weather.gov/images/bmx/DSS/WinterAL1.png', 'Local Winter Weather Impacts')}
                  className="cursor-zoom-in"
                >
                  <img
                    src="https://www.weather.gov/images/bmx/DSS/WinterAL1.png"
                    alt="Winter Impacts"
                    className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Local+Winter+Impacts';
                    }}
                  />
                </div>
                <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Local Impacts (NWS Birmingham)</p>
              </div>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-sky-600 m-0">
                Winter Storm Severity Index (WPC)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.wpc.ncep.noaa.gov/wwd/wssi/images/WSSI_Overall_Day${day}_AL_Day${day}.png`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `WSSI Day ${day} Overall`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`WSSI Day ${day}`}
                          className="w-full h-auto rounded-lg shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://placehold.co/600x600/002B49/FFFFFF?text=Graphic+Unavailable';
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day} Overall</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Synoptic */}
          {activeTab === 'tab-synoptic' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 m-0">Today's Weather Map (WPC Surface Analysis &amp; Fronts)</h3>
                <span className="text-xs bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-semibold border border-sky-200">
                  Updated every 3 hours
                </span>
              </div>
              <div
                onClick={() => onOpenLightbox('https://www.wpc.ncep.noaa.gov/sfc/lrgnamsfcwbg.gif', 'WPC Surface Analysis & Fronts')}
                className="cursor-zoom-in max-w-4xl mx-auto"
              >
                <img
                  src="https://www.wpc.ncep.noaa.gov/sfc/lrgnamsfcwbg.gif"
                  alt="Surface Analysis"
                  className="w-full h-auto rounded-xl shadow-md border border-slate-200 hover:border-sky-500 transition"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://www.wpc.ncep.noaa.gov/sfc/namussfcwbg.gif';
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center m-0">
                Official NOAA Weather Prediction Center (WPC) Unified Surface Analysis with Fronts &amp; Pressure Centers
              </p>
            </div>
          )}

          {/* TAB: National Forecast */}
          {activeTab === 'tab-national' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">National Forecast Charts (WPC)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((day) => {
                  const url = `https://www.wpc.ncep.noaa.gov/noaa/noaad${day}.gif`;
                  return (
                    <div key={day} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `Day ${day} National Forecast`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`Day ${day}`}
                          className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Day {day} Forecast</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Rain Amounts */}
          {activeTab === 'tab-rain' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Rainfall Accumulation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[24, 48, 72].map((hrs) => {
                  const url = `https://www.weather.gov/images/bmx/DSS/QPF${hrs}1.png`;
                  return (
                    <div key={hrs} className="text-center group">
                      <div
                        onClick={() => onOpenLightbox(url, `${hrs} hr Rainfall Accumulation`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={`${hrs} hr rainfall`}
                          className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${hrs}+hr+Rainfall`;
                          }}
                        />
                      </div>
                      <p className="mt-2 font-semibold text-sm text-slate-700 m-0">{hrs} hr Rainfall</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Precip Chances */}
          {activeTab === 'tab-precip' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Chance of Precipitation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderPrecipGrid()}
              </div>
            </div>
          )}

          {/* TAB: Snow Amounts */}
          {activeTab === 'tab-snow' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Snowfall Accumulation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { file: 'SnowAmt241.png', label: '24 hr Snowfall' },
                  { file: 'SnowAmt481.png', label: '48 hr Snowfall' },
                  { file: 'SnowAmt721.png', label: '72 hr Snowfall' },
                  { file: 'SnowAmt10Prcntl721.png', label: '72 hr Low End (10th %)' },
                  { file: 'SnowAmt90Prcntl721.png', label: '72 hr High End (90th %)' }
                ].map((item) => (
                  <div key={item.file} className="text-center group">
                    <div
                      onClick={() => onOpenLightbox(`https://www.weather.gov/images/bmx/DSS/${item.file}`, item.label)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.weather.gov/images/bmx/DSS/${item.file}`}
                        alt={item.label}
                        className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${encodeURIComponent(item.label)}`;
                        }}
                      />
                    </div>
                    <p className="mt-2 font-semibold text-xs text-slate-700 m-0">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Ice Amounts */}
          {activeTab === 'tab-ice' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Ice Accumulation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { file: 'IceAccum241.png', label: '24 hr Ice Accumulation' },
                  { file: 'IceAccum481.png', label: '48 hr Ice Accumulation' },
                  { file: 'IceAccum721.png', label: '72 hr Ice Accumulation' },
                  { file: 'IceAccum10Prcntl721.png', label: '72 hr Low End (10th %)' },
                  { file: 'IceAccum90Prcntl721.png', label: '72 hr High End (90th %)' }
                ].map((item) => (
                  <div key={item.file} className="text-center group">
                    <div
                      onClick={() => onOpenLightbox(`https://www.weather.gov/images/bmx/DSS/${item.file}`, item.label)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.weather.gov/images/bmx/DSS/${item.file}`}
                        alt={item.label}
                        className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${encodeURIComponent(item.label)}`;
                        }}
                      />
                    </div>
                    <p className="mt-2 font-semibold text-xs text-slate-700 m-0">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Max Wind Gusts */}
          {activeTab === 'tab-wind' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Maximum Wind Gusts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderWindGrid()}
              </div>
            </div>
          )}

          {/* TAB: High Temperatures */}
          {activeTab === 'tab-high' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">High Temperatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderTempGrid('MaxT', 'High Temperature')}
              </div>
            </div>
          )}

          {/* TAB: Max Apparent Temperatures */}
          {activeTab === 'tab-maxapp' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Maximum Apparent Temperatures (Heat Index)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderTempGrid('MaxApparentT', 'Max Apparent')}
              </div>
            </div>
          )}

          {/* TAB: Low Temperatures */}
          {activeTab === 'tab-low' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Low Temperatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderTempGrid('MinT', 'Low Temperature')}
              </div>
            </div>
          )}

          {/* TAB: Min Apparent Temperatures */}
          {activeTab === 'tab-minapp' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Minimum Apparent Temperatures (Wind Chill)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderTempGrid('MinApparentT', 'Min Apparent')}
              </div>
            </div>
          )}

          {/* TAB: 6-14 CPC */}
          {activeTab === 'tab-614cpc' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">6-10 &amp; 8-14 Day Outlooks (CPC)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { file: '610day/610temp.new.gif', label: '6-10 Day Temperature' },
                  { file: '610day/610prcp.new.gif', label: '6-10 Day Precipitation' },
                  { file: '814day/814temp.new.gif', label: '8-14 Day Temperature' },
                  { file: '814day/814prcp.new.gif', label: '8-14 Day Precipitation' }
                ].map((item) => (
                  <div key={item.file} className="text-center group">
                    <div
                      onClick={() => onOpenLightbox(`https://www.cpc.ncep.noaa.gov/products/predictions/${item.file}`, item.label)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.cpc.ncep.noaa.gov/products/predictions/${item.file}`}
                        alt={item.label}
                        className="w-full h-auto rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500 transition"
                      />
                    </div>
                    <p className="mt-2 font-semibold text-xs text-slate-700 m-0">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: 8-14 Hazards */}
          {activeTab === 'tab-814hazards' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">8-14 Day Hazards Outlook (CPC)</h3>
              <div className="max-w-2xl mx-auto text-center group">
                <div
                  onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/predictions/threats/hazards_d8_14_contours.png', '8-14 Day Hazards Composite')}
                  className="cursor-zoom-in"
                >
                  <img
                    src="https://www.cpc.ncep.noaa.gov/products/predictions/threats/hazards_d8_14_contours.png"
                    alt="Hazards Composite"
                    className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:border-sky-500 transition"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Graphic+Unavailable';
                    }}
                  />
                </div>
                <p className="mt-2 font-semibold text-sm text-slate-700 m-0">Composite Hazards</p>
              </div>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-rose-600 m-0">
                Probabilistic Hazards
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { file: 'temp_probhazards_d8_14_contours.png', label: 'Temperature' },
                  { file: 'precip_probhazards_d8_14_contours.png', label: 'Precipitation' },
                  { file: 'snow_probhazards_d8_14_contours.png', label: 'Snow' },
                  { file: 'wind_probhazards_d8_14_contours.png', label: 'Wind' }
                ].map((item) => (
                  <div key={item.file} className="text-center group">
                    <div
                      onClick={() => onOpenLightbox(`https://www.cpc.ncep.noaa.gov/products/predictions/threats/${item.file}`, `8-14 Day ${item.label} Hazard`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.cpc.ncep.noaa.gov/products/predictions/threats/${item.file}`}
                        alt={item.label}
                        className="w-full h-auto rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/600x450/002B49/FFFFFF?text=Graphic+Unavailable';
                        }}
                      />
                    </div>
                    <p className="mt-2 font-semibold text-xs text-slate-700 m-0">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Monthly & Seasonal */}
          {activeTab === 'tab-seasonal' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">Monthly &amp; Seasonal Outlooks (CPC)</h3>
              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-sky-600 m-0">
                Monthly (30-Day)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/predictions/30day/off14_temp.gif', '1 Month Temperature Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img src="https://www.cpc.ncep.noaa.gov/products/predictions/30day/off14_temp.gif" alt="1 Month Temp" className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500" />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Temperature</p>
                </div>
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/predictions/30day/off14_prcp.gif', '1 Month Precipitation Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img src="https://www.cpc.ncep.noaa.gov/products/predictions/30day/off14_prcp.gif" alt="1 Month Precip" className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500" />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Precipitation</p>
                </div>
              </div>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-amber-600 m-0">
                Seasonal (90-Day)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/predictions/90day/lead01/off01_temp.gif', '3 Month Temperature Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img src="https://www.cpc.ncep.noaa.gov/products/predictions/90day/lead01/off01_temp.gif" alt="3 Month Temp" className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500" />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Temperature</p>
                </div>
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/predictions/90day/lead01/off01_prcp.gif', '3 Month Precipitation Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img src="https://www.cpc.ncep.noaa.gov/products/predictions/90day/lead01/off01_prcp.gif" alt="3 Month Precip" className="w-full rounded-xl shadow-xs border border-slate-200 group-hover:border-sky-500" />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Precipitation</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Drought */}
          {activeTab === 'tab-drought' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 m-0">U.S. Drought Monitor (Alabama)</h3>
              <div className="max-w-2xl mx-auto text-center group">
                <div
                  onClick={() => onOpenLightbox('https://droughtmonitor.unl.edu/data/png/current/current_al_trd.png', 'U.S. Drought Monitor - Alabama')}
                  className="cursor-zoom-in"
                >
                  <img
                    src="https://droughtmonitor.unl.edu/data/png/current/current_al_trd.png"
                    alt="Drought Monitor"
                    className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:border-sky-500 transition"
                  />
                </div>
                <p className="mt-2 font-semibold text-xs text-slate-500 m-0">Source: NDMC / USDA / NOAA</p>
              </div>

              <h4 className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold text-[#001E36] border-l-4 border-amber-600 m-0">
                Extended Drought Outlooks (CPC)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/expert_assessment/month_drought.png', 'Monthly Drought Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img
                      src="https://www.cpc.ncep.noaa.gov/products/expert_assessment/month_drought.png"
                      alt="Monthly Drought"
                      className="w-full rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/600x400/002B49/FFFFFF?text=Graphic+Unavailable';
                      }}
                    />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Monthly Drought Outlook</p>
                </div>
                <div className="text-center group">
                  <div
                    onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/expert_assessment/season_drought.png', 'Seasonal Drought Outlook')}
                    className="cursor-zoom-in"
                  >
                    <img
                      src="https://www.cpc.ncep.noaa.gov/products/expert_assessment/season_drought.png"
                      alt="Seasonal Drought"
                      className="w-full rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/600x400/002B49/FFFFFF?text=Graphic+Unavailable';
                      }}
                    />
                  </div>
                  <p className="mt-2 font-semibold text-xs text-slate-700 m-0">Seasonal Drought Outlook</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
