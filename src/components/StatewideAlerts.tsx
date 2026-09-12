import React, { useState, useEffect } from 'react';
import { ExternalLink, Lock, Unlock } from 'lucide-react';
import { NWS_ALERT_COLORS } from '../data/weatherData';

export const StatewideAlerts: React.FC = () => {
  const [isMapInteractionEnabled, setIsMapInteractionEnabled] = useState(false);
  const [activeAlertEvents, setActiveAlertEvents] = useState<string[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAlerts() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch('https://api.weather.gov/alerts/active?area=AL', {
          headers: { Accept: 'application/geo+json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Failed to fetch alerts');
        const data = await res.json();
        if (isMounted && data && Array.isArray(data.features)) {
          const events = new Set<string>();
          data.features.forEach((f: any) => {
            if (f.properties && f.properties.event) {
              events.add(f.properties.event);
            }
          });
          setActiveAlertEvents(Array.from(events).sort());
        }
      } catch (err) {
        console.warn('Active alerts feed fallback:', err);
      } finally {
        if (isMounted) setIsLoadingAlerts(false);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 120000); // 2 min refresh
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const toggleInteraction = (force?: boolean) => {
    setIsMapInteractionEnabled(prev => (typeof force === 'boolean' ? force : !prev));
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 min-h-[640px] sm:min-h-[720px] lg:min-h-[780px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 px-5 py-3.5 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight m-0 text-white flex items-center gap-1.5">
            Statewide Hazard Alerts
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleInteraction()}
            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl transition-all border border-white/20 shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Toggle interactive map zoom and panning"
          >
            {isMapInteractionEnabled ? <Unlock className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3 text-slate-300" />}
            <span>{isMapInteractionEnabled ? 'Lock Map Zoom' : 'Enable Map Zoom'}</span>
          </button>

          <a
            href="https://viewer.weather.noaa.gov/general#layers=42904+40090+41806+41793+41791+41792+41794+41783+42464+41782+41781+41609+40091&x=-86.48397&y=32.38745&z=11.9&panel=legend&clean=1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-xl transition-all border border-white/20 shadow-xs no-underline flex items-center gap-1.5 cursor-pointer"
          >
            <span>Full Map</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Map Iframe with Scroll Interceptor */}
      <div 
        className="p-0 bg-slate-950 flex-grow flex items-center justify-center relative min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] w-full overflow-hidden group/map"
        onMouseLeave={() => isMapInteractionEnabled && toggleInteraction(false)}
      >
        <iframe
          src="https://viewer.weather.noaa.gov/general#layers=42904+40090+41806+41793+41791+41792+41794+41783+42464+41782+41781+41609+40091&x=-86.48397&y=32.38745&z=11.9&panel=legend&clean=1"
          title="NOAA Weather Viewer Statewide Hazard Alerts"
          allow="geolocation; fullscreen"
          allowFullScreen
          loading="lazy"
          className={`w-full h-full min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] border-0 ${
            isMapInteractionEnabled ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        />

        {!isMapInteractionEnabled && (
          <div
            onClick={() => toggleInteraction(true)}
            className="absolute inset-0 bg-transparent cursor-pointer flex items-center justify-center"
            title="Click to enable map panning and zooming"
          >
            <div className="bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl border border-white/20 shadow-lg backdrop-blur-xs flex items-center gap-2 opacity-0 group-hover/map:opacity-100 transition-opacity duration-200">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Scroll zoom disabled</span>
              <span className="text-sky-300 font-extrabold text-[11px] underline">Click to interact</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Active Alerts Legend */}
      <div className="bg-slate-50 p-4 border-t border-slate-200/80 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
            Active Watch / Warning Status (Alabama)
          </span>
          <a
            href="https://www.weather.gov/help-map"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-sky-600 font-bold hover:underline"
          >
            Full Color Legend
          </a>
        </div>

        <div className="flex flex-wrap justify-start gap-2 min-h-[32px] items-center">
          {isLoadingAlerts ? (
            <div className="text-xs text-slate-400 italic animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              Scanning live NOAA hazard feeds for Alabama...
            </div>
          ) : activeAlertEvents.length > 0 ? (
            activeAlertEvents.map(event => {
              const color = NWS_ALERT_COLORS[event] || '#94a3b8';
              return (
                <div key={event} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span
                    className="w-3 h-3 rounded-xs shadow-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-slate-700 font-semibold leading-none">
                    {event}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              No active watches or warnings currently in effect for Alabama.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
