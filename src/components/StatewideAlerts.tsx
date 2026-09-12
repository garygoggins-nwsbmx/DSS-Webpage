import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  AlertTriangle, 
  CloudRain, 
  Map as MapIcon, 
  Info,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import { NWS_ALERT_COLORS } from '../data/weatherData';
import ALABAMA_COUNTIES_GEOJSON from '../data/alabama_counties.json';

interface AlertFeature {
  type: string;
  id: string;
  properties: {
    event: string;
    headline?: string;
    severity?: string;
    certainty?: string;
    urgency?: string;
    description?: string;
    instruction?: string;
    areaDesc?: string;
    effective?: string;
    expires?: string;
    onset?: string;
  };
  geometry: any;
}

export const StatewideAlerts: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap & Layer references
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const wwaWmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const wwaGeoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const countiesLayerRef = useRef<L.GeoJSON | null>(null);

  // Layer switches
  const [selectedBasemap, setSelectedBasemap] = useState<'osm' | 'esri_gray' | 'esri_topo'>('esri_gray');
  const [showWwa, setShowWwa] = useState<boolean>(true);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showCounties, setShowCounties] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.75);

  // Alerts data
  const [alertsData, setAlertsData] = useState<AlertFeature[]>([]);
  const [activeEventsList, setActiveEventsList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<AlertFeature['properties'] | null>(null);

  // Basemap URLs (Open, 100% free, no API key required)
  const BASEMAPS = {
    esri_gray: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
      name: 'ESRI Light Gray (Clean DSS)'
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: 'OpenStreetMap'
    },
    esri_topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom',
      name: 'ESRI Topographic'
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Alabama [32.80, -86.80], zoom 7
    const map = L.map(mapContainerRef.current, {
      center: [32.80, -86.80],
      zoom: 7,
      minZoom: 6,
      maxZoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add Attribution in bottom right
    L.control.attribution({ position: 'bottomright', prefix: 'NOAA / NWS • IEM' }).addTo(map);

    // Initial Base Tile Layer (No API Key Required)
    const base = L.tileLayer(BASEMAPS.esri_gray.url, {
      maxZoom: 18,
      attribution: BASEMAPS.esri_gray.attribution
    }).addTo(map);
    baseLayerRef.current = base;

    // 2. High-Resolution NEXRAD Base Reflectivity WMS Layer
    const radarWms = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi', {
      layers: 'nexrad-n0q-900913',
      format: 'image/png',
      transparent: true,
      opacity: 0.75,
      zIndex: 10
    }).addTo(map);
    radarLayerRef.current = radarWms;

    // 3. Official NOAA/IEM Live Watches, Warnings & Advisories (WWA) WMS Layer (Real-time polygons)
    const wwaWms = L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/us/wwa.cgi', {
      layers: 'warnings_c,warnings_p',
      format: 'image/png',
      transparent: true,
      opacity: 0.70,
      zIndex: 20
    }).addTo(map);
    wwaWmsLayerRef.current = wwaWms;

    // 4. Bundled Alabama Counties Layer (Instant, Zero Network Dependency)
    try {
      const countiesGeo = L.geoJSON(ALABAMA_COUNTIES_GEOJSON as any, {
        style: {
          color: '#1e293b', // Crisp slate-800 boundary
          weight: 1.6,
          opacity: 0.9,
          fillColor: '#38bdf8',
          fillOpacity: 0.03,
          dashArray: '4, 4'
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties?.NAME || 'County';
          layer.bindTooltip(`<b>${name}</b>`, {
            sticky: true,
            className: 'bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded shadow-lg border-0'
          });
        }
      }).addTo(map);
      countiesLayerRef.current = countiesGeo;
    } catch (e) {
      console.error('Error adding local counties GeoJSON:', e);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap if changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const config = BASEMAPS[selectedBasemap];
    if (baseLayerRef.current) {
      baseLayerRef.current.remove();
    }
    const newBase = L.tileLayer(config.url, {
      maxZoom: 18,
      attribution: config.attribution
    }).addTo(mapInstanceRef.current);
    baseLayerRef.current = newBase;
    
    // Ensure overlays sit on top of base
    if (countiesLayerRef.current && showCounties) {
      countiesLayerRef.current.bringToFront();
    }
  }, [selectedBasemap]);

  // Fetch Live NWS Alerts for Alabama & Polygons
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const res = await fetch('https://api.weather.gov/alerts/active?area=AL', {
        headers: { 
          Accept: 'application/geo+json',
          'User-Agent': '(NWS-DSS-Alabama-Portal, weather.portal@alabama.gov)'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`NWS API error status ${res.status}`);
      const data = await res.json();
      const features: AlertFeature[] = data.features || [];

      setAlertsData(features);

      const events = new Set<string>();
      features.forEach(f => {
        if (f.properties?.event) {
          events.add(f.properties.event);
        }
      });
      setActiveEventsList(Array.from(events).sort());
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Render vector alert polygons on map when present
      if (mapInstanceRef.current) {
        if (wwaGeoJsonLayerRef.current) {
          wwaGeoJsonLayerRef.current.remove();
        }

        // Filter alerts with valid geometry polygons
        const withGeom = features.filter(f => f.geometry && f.geometry.coordinates);
        if (withGeom.length > 0) {
          const geoLayer = L.geoJSON({ type: 'FeatureCollection', features: withGeom } as any, {
            style: (feature) => {
              const eventName = feature?.properties?.event || '';
              const color = NWS_ALERT_COLORS[eventName] || '#e11d48';
              return {
                color: color,
                weight: 2.5,
                opacity: 0.95,
                fillColor: color,
                fillOpacity: 0.38
              };
            },
            onEachFeature: (feature, l) => {
              const p = feature.properties;
              const eventName = p.event || 'NWS Alert';
              const color = NWS_ALERT_COLORS[eventName] || '#e11d48';

              const popupContent = `
                <div style="font-family: system-ui, sans-serif; min-width: 220px; max-width: 300px; padding: 2px;">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <span style="display:inline-block; width: 12px; height: 12px; border-radius: 2px; background: ${color};"></span>
                    <strong style="color: #0f172a; font-size: 13px;">${eventName}</strong>
                  </div>
                  <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
                    <b>Severity:</b> ${p.severity || 'Unknown'} | <b>Urgency:</b> ${p.urgency || 'Unknown'}
                  </div>
                  <div style="font-size: 11px; color: #1e293b; margin-bottom: 6px; line-height: 1.4;">
                    ${p.headline || p.areaDesc || 'Active weather hazard polygon.'}
                  </div>
                  ${p.expires ? `<div style="font-size: 10px; color: #64748b;"><b>Expires:</b> ${new Date(p.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
                </div>
              `;

              l.bindPopup(popupContent, { maxWidth: 320 });
              l.on('click', () => {
                setSelectedAlert(p);
              });
            }
          });

          if (showWwa) {
            geoLayer.addTo(mapInstanceRef.current);
          }
          wwaGeoJsonLayerRef.current = geoLayer;
        }

        // Also trigger WMS layer redraw
        if (wwaWmsLayerRef.current) {
          wwaWmsLayerRef.current.redraw();
        }
      }
    } catch (e) {
      console.warn('Live alerts query error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [showWwa]);

  // Initial fetch and 2-min auto-refresh
  useEffect(() => {
    fetchAlerts();
    const timer = setInterval(fetchAlerts, 120000);
    return () => clearInterval(timer);
  }, [fetchAlerts]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Toggle WWA (Both WMS raster stream and GeoJSON polygon vectors)
    if (wwaWmsLayerRef.current) {
      if (showWwa) {
        if (!mapInstanceRef.current.hasLayer(wwaWmsLayerRef.current)) {
          wwaWmsLayerRef.current.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(wwaWmsLayerRef.current)) {
          wwaWmsLayerRef.current.remove();
        }
      }
    }
    if (wwaGeoJsonLayerRef.current) {
      if (showWwa) {
        if (!mapInstanceRef.current.hasLayer(wwaGeoJsonLayerRef.current)) {
          wwaGeoJsonLayerRef.current.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(wwaGeoJsonLayerRef.current)) {
          wwaGeoJsonLayerRef.current.remove();
        }
      }
    }

    // Toggle Radar
    if (radarLayerRef.current) {
      if (showRadar) {
        if (!mapInstanceRef.current.hasLayer(radarLayerRef.current)) {
          radarLayerRef.current.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(radarLayerRef.current)) {
          radarLayerRef.current.remove();
        }
      }
    }

    // Toggle Counties
    if (countiesLayerRef.current) {
      if (showCounties) {
        if (!mapInstanceRef.current.hasLayer(countiesLayerRef.current)) {
          countiesLayerRef.current.addTo(mapInstanceRef.current);
        }
        countiesLayerRef.current.bringToFront();
      } else {
        if (mapInstanceRef.current.hasLayer(countiesLayerRef.current)) {
          countiesLayerRef.current.remove();
        }
      }
    }
  }, [showWwa, showRadar, showCounties]);

  // Handle Radar Opacity
  useEffect(() => {
    if (radarLayerRef.current) {
      radarLayerRef.current.setOpacity(radarOpacity);
    }
  }, [radarOpacity]);

  // Recenter to Alabama
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([32.80, -86.80], 7);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300 min-h-[640px] sm:min-h-[720px] lg:min-h-[780px]">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-5 py-3.5 flex flex-wrap justify-between items-center text-white shrink-0 gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight m-0 text-white flex items-center gap-2">
              Alabama Statewide Hazard & Radar Map
            </h2>
            <div className="text-[10px] text-slate-400 font-medium">
              NOAA/NWS Watches & Warnings • NEXRAD Radar • Official County Lines
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Basemap Switcher Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold hidden md:inline">Base:</span>
            <select
              value={selectedBasemap}
              onChange={(e) => setSelectedBasemap(e.target.value as any)}
              className="bg-transparent text-white font-semibold text-xs border-0 outline-none cursor-pointer focus:ring-0"
              title="Change map basemap"
            >
              <option value="esri_gray" className="bg-slate-900 text-white">ESRI Light Canvas</option>
              <option value="osm" className="bg-slate-900 text-white">OpenStreetMap</option>
              <option value="esri_topo" className="bg-slate-900 text-white">ESRI Topo</option>
            </select>
          </div>

          <button
            onClick={handleRecenter}
            className="text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-xl transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Reset map view to Alabama"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" />
            <span className="hidden sm:inline">Recenter</span>
          </button>

          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-xl transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh alerts & radar data"
          >
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Layer Control Bar */}
      <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>Active Layers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* NWS WWA Toggle */}
          <button
            onClick={() => setShowWwa(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showWwa 
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs' 
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${showWwa ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>NWS WWA</span>
            {showWwa ? <Eye className="w-3 h-3 text-rose-500" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>

          {/* Radar Toggle */}
          <button
            onClick={() => setShowRadar(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showRadar 
                ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-xs' 
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            <CloudRain className={`w-3.5 h-3.5 ${showRadar ? 'text-sky-600' : 'text-slate-400'}`} />
            <span>NEXRAD Radar</span>
            {showRadar ? <Eye className="w-3 h-3 text-sky-500" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>

          {/* County Boundaries Toggle */}
          <button
            onClick={() => setShowCounties(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showCounties 
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs' 
                : 'bg-white text-slate-400 border-slate-200 line-through'
            }`}
          >
            <MapIcon className={`w-3.5 h-3.5 ${showCounties ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>County Lines</span>
            {showCounties ? <Eye className="w-3 h-3 text-amber-600" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
          </button>
        </div>

        {/* Radar Opacity slider */}
        {showRadar && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-300 ml-auto sm:ml-0">
            <Sliders className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-500">Radar Fade:</span>
            <input
              type="range"
              min="0.2"
              max="1"
              step="0.05"
              value={radarOpacity}
              onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div className="relative flex-grow min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] w-full overflow-hidden bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] z-0" />

        {/* Selected Alert Details Popout Drawer */}
        {selectedAlert && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-slate-300">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: NWS_ALERT_COLORS[selectedAlert.event] || '#e11d48' }}
                />
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  {selectedAlert.event}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-700 leading-snug mb-1 line-clamp-3 font-medium">
              {selectedAlert.headline || selectedAlert.description}
            </p>
            <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-2">
              <span>Severity: {selectedAlert.severity}</span>
              <span>•</span>
              <span>Areas: {selectedAlert.areaDesc?.slice(0, 50)}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Active Alerts Legend & Live Status */}
      <div className="bg-slate-50 p-4 border-t border-slate-200/80 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3 h-3 text-slate-400" />
            Active Watch / Warning Status (Alabama)
          </span>
          <a
            href="https://www.weather.gov/help-map"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-sky-600 font-bold hover:underline"
          >
            Official NWS Color Reference
          </a>
        </div>

        <div className="flex flex-wrap justify-start gap-2 min-h-[32px] items-center">
          {isLoading ? (
            <div className="text-xs text-slate-400 italic animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              Checking live NOAA/NWS alert stream for Alabama...
            </div>
          ) : activeEventsList.length > 0 ? (
            activeEventsList.map(event => {
              const color = NWS_ALERT_COLORS[event] || '#94a3b8';
              return (
                <div key={event} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span
                    className="w-3 h-3 rounded-xs shadow-xs border border-black/10 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] text-slate-700 font-bold leading-none">
                    {event}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              No active watches, warnings, or advisories currently in effect for Alabama.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
