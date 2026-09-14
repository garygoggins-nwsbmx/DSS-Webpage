import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Sliders,
  Route,
  Lock, 
  Unlock,
  ShieldCheck,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Radio,
  Sparkles,
  ChevronRight,
  HelpCircle
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

type BasemapKey = 'esri_dark' | 'carto_dark' | 'esri_gray' | 'osm' | 'esri_topo';
type WwaFilterKey = 'all' | 'longfuse' | 'shortfuse';
type LoopSpanKey = '30m' | '1h' | '2h';

export const StatewideAlerts: React.FC = () => {
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Basemap & Layer references
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const highwaysLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  
  // Twin-buffer MRMS Radar layers for seamless, zero-flicker looping
  const mrmsLayerARef = useRef<L.TileLayer.WMS | null>(null);
  const mrmsLayerBRef = useRef<L.TileLayer.WMS | null>(null);
  const activeBufferRef = useRef<'A' | 'B'>('A');

  // Official NOAA Nationwide WWA WMS Layer
  const wwaWmsLayerRef = useRef<L.TileLayer.WMS | null>(null);
  const wwaGeoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const countiesLayerRef = useRef<L.GeoJSON | null>(null);

  // Basemap & Overlay visibility switches
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapKey>('esri_dark');
  const [showWwa, setShowWwa] = useState<boolean>(true);
  const [wwaFilter, setWwaFilter] = useState<WwaFilterKey>('all');
  const [wwaOpacity, setWwaOpacity] = useState<number>(0.75);
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [showCounties, setShowCounties] = useState<boolean>(true);
  const [showHighways, setShowHighways] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.8);

  // MRMS Quality-Controlled Single Radar Source
  const [mrmsProduct, setMrmsProduct] = useState<'conus:conus_bref_qcd' | 'conus:conus_cref_qcd'>('conus:conus_bref_qcd');
  const [mrmsLastUpdated, setMrmsLastUpdated] = useState<Date>(new Date());

  // MRMS Radar Looper State
  const [allAvailableFrames, setAllAvailableFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loopSpeed, setLoopSpeed] = useState<number>(1); // 0.5x, 1x, 1.5x, 2x
  const [loopSpan, setLoopSpan] = useState<LoopSpanKey>('1h'); // 30m, 1h, 2h
  const [isLoadingFrames, setIsLoadingFrames] = useState<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  // Alerts data
  const [alertsData, setAlertsData] = useState<AlertFeature[]>([]);
  const [activeEventsList, setActiveEventsList] = useState<string[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<AlertFeature['properties'] | null>(null);
  const [isScrollZoomEnabled, setIsScrollZoomEnabled] = useState<boolean>(false);
  const [showWwaLegendModal, setShowWwaLegendModal] = useState<boolean>(false);

  // Basemap Configurations (No API key required)
  const BASEMAPS: Record<BasemapKey, {
    url: string;
    attribution: string;
    name: string;
    theme: 'dark' | 'light';
  }> = {
    esri_dark: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
      name: 'ESRI Dark Canvas (Recommended)',
      theme: 'dark'
    },
    carto_dark: {
      url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors, © CARTO',
      name: 'CARTO Dark Matter (Highways)',
      theme: 'dark'
    },
    esri_gray: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors',
      name: 'ESRI Light Canvas',
      theme: 'light'
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: 'OpenStreetMap Standard',
      theme: 'light'
    },
    esri_topo: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom',
      name: 'ESRI Topographic',
      theme: 'light'
    }
  };

  // Compute active frames slice based on loopSpan
  const activeFrames = useMemo(() => {
    if (allAvailableFrames.length === 0) return [];
    const count = loopSpan === '30m' ? 15 : loopSpan === '1h' ? 30 : 60;
    return allAvailableFrames.slice(-count);
  }, [allAvailableFrames, loopSpan]);

  // Keep currentFrameIndex clamped when activeFrames changes
  useEffect(() => {
    if (activeFrames.length > 0) {
      setCurrentFrameIndex(prev => Math.min(prev, activeFrames.length - 1));
    }
  }, [activeFrames.length]);

  // Fetch available MRMS Radar time frames directly from NOAA NWS WMS capabilities
  const fetchMrmsFrames = useCallback(async (product: string) => {
    setIsLoadingFrames(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch('https://opengeo.ncep.noaa.gov/geoserver/conus/ows?service=wms&version=1.1.1&request=GetCapabilities', {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Failed to fetch capabilities');
      const xml = await res.text();
      const prodName = product.replace('conus:', '');
      const regex = new RegExp('<Name>(?:conus:)?' + prodName + '<\\/Name>[\\s\\S]*?<Extent name="time"[^>]*>([^<]+)<\\/Extent>', 'i');
      const match = xml.match(regex);
      if (match && match[1]) {
        const parsedTimes = match[1].trim().split(',').filter(Boolean);
        if (parsedTimes.length > 0) {
          setAllAvailableFrames(parsedTimes);
          // Set to latest frame by default
          setCurrentFrameIndex(parsedTimes.length - 1);
          setMrmsLastUpdated(new Date());
          return;
        }
      }
    } catch (e) {
      console.warn('Unable to load NOAA MRMS GetCapabilities timestamps, generating fallback sequence:', e);
    } finally {
      setIsLoadingFrames(false);
    }

    // Graceful fallback: construct 60 scans at 2-minute cadence over past 2 hours
    const now = new Date();
    const fallback: string[] = [];
    const roundedMinutes = Math.floor(now.getUTCMinutes() / 2) * 2;
    const baseTime = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      roundedMinutes,
      0
    ));
    for (let i = 59; i >= 0; i--) {
      const t = new Date(baseTime.getTime() - i * 2 * 60 * 1000);
      fallback.push(t.toISOString());
    }
    setAllAvailableFrames(fallback);
    setCurrentFrameIndex(fallback.length - 1);
  }, []);

  // Compute current frame timestamp & display details
  const currentTimestamp = activeFrames[currentFrameIndex] || (allAvailableFrames.length > 0 ? allAvailableFrames[allAvailableFrames.length - 1] : null);
  const isLatestFrame = currentFrameIndex === activeFrames.length - 1;

  const frameTimeFormatted = useMemo(() => {
    if (!currentTimestamp) return { local: '--:--', utc: '--:--Z', relative: 'LIVE' };
    const date = new Date(currentTimestamp);
    const local = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const utcHours = String(date.getUTCHours()).padStart(2, '0');
    const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
    const utc = `${utcHours}:${utcMinutes}Z`;

    const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / (60 * 1000)));
    const relative = diffMinutes <= 3 
      ? 'LIVE' 
      : diffMinutes < 60 
        ? `-${diffMinutes}m ago` 
        : `-${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`;

    return { local, utc, relative, date };
  }, [currentTimestamp]);

  // WWA layer string based on user filter
  const getWwaLayersString = useCallback((filter: WwaFilterKey) => {
    switch (filter) {
      case 'longfuse':
        return 'hazards'; // Nation-wide long-fuse watches & advisories
      case 'shortfuse':
        return 'warnings'; // Short-fuse convective warnings
      case 'all':
      default:
        return 'hazards,warnings'; // Both long-fuse and short-fuse
    }
  }, []);

  // 1. Initialize Map and Layers
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Center on Alabama [32.80, -86.80], zoom 7 (or fitted for mobile)
    const map = L.map(mapContainerRef.current, {
      center: [32.80, -86.80],
      zoom: isMobile ? 6 : 7,
      minZoom: 4,
      maxZoom: 15,
      zoomControl: true,
      attributionControl: false,
      fadeAnimation: false, // CRITICAL: Disables Leaflet's tile opacity fade-in animation for crisp, instant frame transitions
      scrollWheelZoom: false // Disabled by default to prevent accidental scroll hijacking when scrolling page
    });

    mapInstanceRef.current = map;

    // Enable scroll zoom on explicit user click or tap
    map.on('click', () => {
      if (!map.scrollWheelZoom.enabled()) {
        map.scrollWheelZoom.enable();
        setIsScrollZoomEnabled(true);
      }
    });

    // Mobile viewport optimization: fit state bounds with padding
    if (isMobile) {
      map.fitBounds([[30.15, -88.55], [35.05, -84.85]], {
        padding: [16, 16],
        maxZoom: 7
      });
    }

    // Custom attribution
    L.control.attribution({ position: 'bottomright', prefix: 'NOAA / NWS MRMS & WWA • Esri • OSM' }).addTo(map);

    // Initial Dark Base Tile Layer
    const base = L.tileLayer(BASEMAPS.esri_dark.url, {
      maxZoom: 18,
      attribution: BASEMAPS.esri_dark.attribution
    }).addTo(map);
    baseLayerRef.current = base;

    // Dedicated World Transportation & Interstate Highways Reference Layer (zIndex: 25)
    const highways = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      zIndex: 25,
      opacity: 0.95
    }).addTo(map);
    highwaysLayerRef.current = highways;

    // Crisp Vector-Rendered Base Labels Layer (zIndex: 26) - CARTO Dark Matter Labels
    const labels = L.tileLayer('https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png', {
      maxZoom: 18,
      zIndex: 26,
      opacity: 0.95
    }).addTo(map);
    labelsLayerRef.current = labels;

    // Official NOAA National Weather Service Watches, Warnings & Advisories (WWA) Layer (zIndex: 20)
    // Upgraded to NOAA's official cloud GeoServer: renders all nation-wide long-fuse WWAs (hazards) and short-fuse warnings
    const wwaWms = L.tileLayer.wms('https://opengeo.ncep.noaa.gov/geoserver/wwa/ows', {
      layers: 'hazards,warnings',
      format: 'image/png',
      transparent: true,
      opacity: 0.75,
      zIndex: 20,
      version: '1.1.1',
      attribution: 'NOAA / NWS National Watches, Warnings & Advisories'
    }).addTo(map);
    wwaWmsLayerRef.current = wwaWms;

    // MRMS Twin-Buffer Radar Layers (zIndex: 15) for smooth looping with zero flicker and instant frame cuts
    const mrmsA = L.tileLayer.wms('https://opengeo.ncep.noaa.gov/geoserver/conus/ows', {
      layers: 'conus:conus_bref_qcd',
      format: 'image/png',
      transparent: true,
      opacity: 0.8,
      zIndex: 15,
      version: '1.1.1',
      className: 'mrms-radar-tile',
      attribution: 'NOAA / NWS MRMS (Quality-Controlled)'
    }).addTo(map);
    mrmsLayerARef.current = mrmsA;

    const mrmsB = L.tileLayer.wms('https://opengeo.ncep.noaa.gov/geoserver/conus/ows', {
      layers: 'conus:conus_bref_qcd',
      format: 'image/png',
      transparent: true,
      opacity: 0,
      zIndex: 15,
      version: '1.1.1',
      className: 'mrms-radar-tile',
      attribution: 'NOAA / NWS MRMS (Quality-Controlled)'
    }).addTo(map);
    mrmsLayerBRef.current = mrmsB;

    // Bundled Alabama Counties Layer (zIndex: 18)
    try {
      const countiesGeo = L.geoJSON(ALABAMA_COUNTIES_GEOJSON as any, {
        interactive: false,
        style: {
          color: '#fbbf24', // Muted warm amber on dark canvas
          weight: 1.2,
          opacity: 0.55,
          fillColor: '#fbbf24',
          fillOpacity: 0
        }
      }).addTo(map);
      countiesLayerRef.current = countiesGeo;
    } catch (e) {
      console.error('Error adding local counties GeoJSON:', e);
    }

    // Responsive ResizeObserver: ensures tiles and viewport never glitch during rotation or resizing
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Load initial MRMS time dimensions
    fetchMrmsFrames('conus:conus_bref_qcd');

    return () => {
      resizeObserver.disconnect();
      if (mrmsLayerARef.current) {
        mrmsLayerARef.current.remove();
        mrmsLayerARef.current = null;
      }
      if (mrmsLayerBRef.current) {
        mrmsLayerBRef.current.remove();
        mrmsLayerBRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [fetchMrmsFrames]);

  // Update Basemap & Highway styling when selectedBasemap changes
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

    const isDark = config.theme === 'dark';

    // Update County style depending on dark/light mode
    if (countiesLayerRef.current) {
      countiesLayerRef.current.setStyle({
        color: isDark ? '#fbbf24' : '#475569',
        weight: 1.2,
        opacity: isDark ? 0.55 : 0.5,
        fillColor: '#fbbf24',
        fillOpacity: 0,
        dashArray: ''
      });
      if (showCounties) {
        countiesLayerRef.current.bringToFront();
      }
    }

    // Adjust labels layer for dark vs light (CARTO crisp vector typography)
    if (labelsLayerRef.current && mapInstanceRef.current) {
      labelsLayerRef.current.remove();
      const labelUrl = isDark 
        ? 'https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'
        : 'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png';
      const newLabels = L.tileLayer(labelUrl, {
        maxZoom: 18,
        zIndex: 26,
        opacity: isDark ? 0.95 : 0.85
      }).addTo(mapInstanceRef.current);
      labelsLayerRef.current = newLabels;
    }
  }, [selectedBasemap]);

  // Update WWA layer when filter or opacity changes
  useEffect(() => {
    if (!wwaWmsLayerRef.current) return;
    const layerNames = getWwaLayersString(wwaFilter);
    wwaWmsLayerRef.current.setParams({
      layers: layerNames
    });
    wwaWmsLayerRef.current.setOpacity(showWwa ? wwaOpacity : 0);
  }, [wwaFilter, wwaOpacity, showWwa, getWwaLayersString]);

  // Update MRMS Radar layer frame via twin buffering with instant, crisp cuts (no fade-in)
  useEffect(() => {
    if (!showRadar) {
      if (mrmsLayerARef.current) mrmsLayerARef.current.setOpacity(0);
      if (mrmsLayerBRef.current) mrmsLayerBRef.current.setOpacity(0);
      return;
    }

    if (!currentTimestamp) return;

    // Use double buffering to swap frames without any blank tile flicker or fade-in delays
    const nextBuf = activeBufferRef.current === 'A' ? mrmsLayerBRef.current : mrmsLayerARef.current;
    const currBuf = activeBufferRef.current === 'A' ? mrmsLayerARef.current : mrmsLayerBRef.current;

    if (nextBuf && currBuf) {
      const params: any = {
        layers: mrmsProduct,
        time: currentTimestamp
      };

      if (!isPlaying) {
        // Direct instant swap during manual scrubber interaction
        nextBuf.setParams(params);
        nextBuf.setOpacity(radarOpacity);
        currBuf.setOpacity(0);
        activeBufferRef.current = activeBufferRef.current === 'A' ? 'B' : 'A';
      } else {
        // While looping: update nextBuf and wait for new tiles to be ready before hiding the previous frame.
        // This eliminates the fade-in effect and tile blanking, making playback completely solid and smooth.
        let swapped = false;
        const doSwap = () => {
          if (swapped) return;
          swapped = true;
          nextBuf.setOpacity(radarOpacity);
          currBuf.setOpacity(0);
          activeBufferRef.current = activeBufferRef.current === 'A' ? 'B' : 'A';
        };

        // When tiles of nextBuf finish loading, perform instantaneous swap
        nextBuf.once('load', doSwap);
        nextBuf.setParams(params);

        // Fallback timer ensures loop advances even if network delays occur
        const fallbackTimer = setTimeout(doSwap, 220);

        return () => {
          nextBuf.off('load', doSwap);
          clearTimeout(fallbackTimer);
        };
      }
    }
  }, [currentTimestamp, mrmsProduct, showRadar, radarOpacity, isPlaying]);

  // Ensure active radar layer reflects immediate opacity slider updates
  useEffect(() => {
    if (!showRadar) return;
    const currBuf = activeBufferRef.current === 'A' ? mrmsLayerARef.current : mrmsLayerBRef.current;
    if (currBuf) {
      currBuf.setOpacity(radarOpacity);
    }
  }, [radarOpacity, showRadar]);

  // Looping Playback Engine: timer progression with speed multiplier and pause on latest frame
  useEffect(() => {
    if (!isPlaying || activeFrames.length <= 1) return;

    // Base interval calculation (speed 1x = 500ms, 0.5x = 900ms, 1.5x = 330ms, 2x = 200ms)
    const baseInterval = Math.round(500 / loopSpeed);

    let timeoutId: NodeJS.Timeout;

    const scheduleNextFrame = () => {
      // If currently on the latest frame, linger slightly longer (850ms) to allow forecasters to register the present state
      const isAtEnd = currentFrameIndex === activeFrames.length - 1;
      const delay = isAtEnd ? Math.max(baseInterval, 850) : baseInterval;

      timeoutId = setTimeout(() => {
        if (!isPlayingRef.current) return;
        setCurrentFrameIndex(prev => (prev + 1) % activeFrames.length);
      }, delay);
    };

    scheduleNextFrame();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isPlaying, currentFrameIndex, activeFrames.length, loopSpeed]);

  // Refresh MRMS Radar capabilities & latest scans
  const refreshMrmsRadar = useCallback(() => {
    fetchMrmsFrames(mrmsProduct);
  }, [fetchMrmsFrames, mrmsProduct]);

  // Auto-refresh MRMS radar tiles and capabilities every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) {
        refreshMrmsRadar();
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [isPlaying, refreshMrmsRadar]);

  // Fetch Live NWS Alerts for Alabama
  const fetchAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
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

      // Render vector alert polygons on map when present
      if (mapInstanceRef.current) {
        if (wwaGeoJsonLayerRef.current) {
          wwaGeoJsonLayerRef.current.remove();
        }

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

        if (wwaWmsLayerRef.current) {
          wwaWmsLayerRef.current.redraw();
        }
      }
    } catch (e) {
      console.warn('Live alerts query error:', e);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [showWwa]);

  // Initial fetch and auto-refresh for alerts
  useEffect(() => {
    fetchAlerts();
    const alertsTimer = setInterval(fetchAlerts, 120000);
    return () => {
      clearInterval(alertsTimer);
    };
  }, [fetchAlerts]);

  // Handle Visibility Toggles for Overlays
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // WWA
    if (wwaWmsLayerRef.current) {
      if (showWwa) {
        if (!mapInstanceRef.current.hasLayer(wwaWmsLayerRef.current)) {
          wwaWmsLayerRef.current.addTo(mapInstanceRef.current);
        }
        wwaWmsLayerRef.current.setOpacity(wwaOpacity);
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

    // Highways
    if (highwaysLayerRef.current) {
      if (showHighways) {
        if (!mapInstanceRef.current.hasLayer(highwaysLayerRef.current)) {
          highwaysLayerRef.current.addTo(mapInstanceRef.current);
        }
      } else {
        if (mapInstanceRef.current.hasLayer(highwaysLayerRef.current)) {
          highwaysLayerRef.current.remove();
        }
      }
    }

    // Counties
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
  }, [showWwa, wwaOpacity, showHighways, showCounties]);

  // Recenter to Alabama
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (window.innerWidth < 768) {
        mapInstanceRef.current.fitBounds(
          [[30.15, -88.55], [35.05, -84.85]],
          { padding: [16, 16], maxZoom: 7 }
        );
      } else {
        mapInstanceRef.current.setView([32.80, -86.80], 7);
      }
    }
  };

  // Enable/Disable scroll zoom handlers
  const handleEnableScrollZoom = useCallback(() => {
    if (mapInstanceRef.current && !mapInstanceRef.current.scrollWheelZoom.enabled()) {
      mapInstanceRef.current.scrollWheelZoom.enable();
      setIsScrollZoomEnabled(true);
    }
  }, []);

  const handleDisableScrollZoom = useCallback(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.scrollWheelZoom.enabled()) {
      mapInstanceRef.current.scrollWheelZoom.disable();
      setIsScrollZoomEnabled(false);
    }
  }, []);

  // Re-lock scroll zoom when clicking outside map wrapper
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (mapWrapperRef.current && !mapWrapperRef.current.contains(e.target as Node)) {
        handleDisableScrollZoom();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [handleDisableScrollZoom]);

  // Looper Navigation Handlers
  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(prev => (prev > 0 ? prev - 1 : activeFrames.length - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(prev => (prev < activeFrames.length - 1 ? prev + 1 : 0));
  };

  const handleJumpToLive = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(activeFrames.length - 1);
    refreshMrmsRadar();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrameIndex(parseInt(e.target.value, 10));
  };

  const formattedLastUpdated = mrmsLastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  return (
    <div className="bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col transition-all duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002B49] to-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row justify-between items-start md:items-center text-white shrink-0 gap-3.5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0 shadow-inner">
            <CloudRain className="w-5 h-5 text-sky-400" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight m-0 text-white flex items-center gap-2">
                Alabama &amp; Nationwide Hazard &amp; Radar Map
              </h2>
              {alertsData.length > 0 ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  {alertsData.length} Alabama Hazard{alertsData.length === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  AL Clear • Live National Feeds
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">
              NOAA/NWS Nationwide Long-Fuse Watches &amp; Advisories • Interactive MRMS Radar Looper • Highways &amp; Counties
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Basemap Switcher Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs min-h-[38px]">
            <span className="text-slate-400 text-[11px] font-bold">Base:</span>
            <select
              value={selectedBasemap}
              onChange={(e) => setSelectedBasemap(e.target.value as BasemapKey)}
              className="bg-transparent text-white font-semibold text-xs border-0 outline-none cursor-pointer focus:ring-0"
              title="Change map basemap"
            >
              <option value="esri_dark" className="bg-slate-900 text-white">ESRI Dark Canvas</option>
              <option value="carto_dark" className="bg-slate-900 text-white">CARTO Dark Matter</option>
              <option value="esri_gray" className="bg-slate-900 text-white">ESRI Light Canvas</option>
              <option value="osm" className="bg-slate-900 text-white">OpenStreetMap</option>
              <option value="esri_topo" className="bg-slate-900 text-white">ESRI Topo</option>
            </select>
          </div>

          <button
            onClick={handleRecenter}
            className="text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            title="Reset map view to Alabama"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Recenter AL</span>
          </button>

          <button
            onClick={() => { fetchAlerts(); refreshMrmsRadar(); }}
            disabled={isLoadingAlerts || isLoadingFrames}
            className="text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all border border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
            title="Refresh alerts & MRMS radar data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${(isLoadingAlerts || isLoadingFrames) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Layer Control Bar with Long-Fuse WWA Controls - Consolidated & Space-Optimized */}
      <div 
        id="map-layers-control-bar"
        className="bg-slate-900/95 px-3 sm:px-4 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-white"
      >
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Layers:</span>
          </div>

          {/* NWS Nationwide WWA Toggle & Filter Group */}
          <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700/80 p-0.5">
            <button
              onClick={() => setShowWwa(prev => !prev)}
              className={`px-2 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                showWwa 
                  ? 'bg-rose-950 text-rose-300 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle NOAA Nationwide Watches, Warnings & Advisories"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${showWwa ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>NWS Hazards</span>
              {showWwa ? <Eye className="w-3 h-3 text-rose-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
            </button>

            {showWwa && (
              <div className="flex items-center pl-1 border-l border-slate-700 ml-1 gap-0.5">
                <button
                  onClick={() => setWwaFilter('all')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    wwaFilter === 'all'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Display all nationwide watches, warnings, and advisories"
                >
                  All
                </button>
                <button
                  onClick={() => setWwaFilter('longfuse')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    wwaFilter === 'longfuse'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Display nation-wide long-fuse watches & advisories (Winter Storm, Flood, Wind, Heat, Freeze)"
                >
                  Long-Fuse
                </button>
                <button
                  onClick={() => setWwaFilter('shortfuse')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    wwaFilter === 'shortfuse'
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Display convective short-fuse warnings (Tornado, Severe Thunderstorm, Flash Flood)"
                >
                  Short-Fuse
                </button>
              </div>
            )}
          </div>

          {/* MRMS Radar Toggle & Base/Composite Mode Chip */}
          <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700/80 p-0.5">
            <button
              onClick={() => setShowRadar(prev => !prev)}
              className={`px-2 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                showRadar 
                  ? 'bg-sky-950 text-sky-300 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle NWS MRMS Radar"
            >
              <CloudRain className={`w-3.5 h-3.5 ${showRadar ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>MRMS Radar</span>
              {showRadar ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
            </button>

            {showRadar && (
              <div className="flex items-center pl-1 border-l border-slate-700 ml-1 gap-0.5">
                <button
                  onClick={() => {
                    setMrmsProduct('conus:conus_bref_qcd');
                    fetchMrmsFrames('conus:conus_bref_qcd');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    mrmsProduct === 'conus:conus_bref_qcd'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Base Reflectivity QC (Lowest elevation angle, clutter filtered)"
                >
                  Base
                </button>
                <button
                  onClick={() => {
                    setMrmsProduct('conus:conus_cref_qcd');
                    fetchMrmsFrames('conus:conus_cref_qcd');
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    mrmsProduct === 'conus:conus_cref_qcd'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Composite Reflectivity QC (Maximum column reflectivity, clutter filtered)"
                >
                  Comp
                </button>
              </div>
            )}
          </div>

          {/* Interstate Highways Toggle */}
          <button
            onClick={() => setShowHighways(prev => !prev)}
            className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showHighways 
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700 shadow-xs' 
                : 'bg-slate-800/70 text-slate-400 border-slate-700/80 hover:text-white'
            }`}
            title="Toggle Interstate Highways (I-65, I-20, I-59, I-85, I-10) and US routes"
          >
            <Route className={`w-3.5 h-3.5 ${showHighways ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span>Highways</span>
          </button>

          {/* County Boundaries Toggle */}
          <button
            onClick={() => setShowCounties(prev => !prev)}
            className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              showCounties 
                ? 'bg-amber-950/80 text-amber-300 border-amber-700 shadow-xs' 
                : 'bg-slate-800/70 text-slate-400 border-slate-700/80 hover:text-white'
            }`}
            title="Toggle County Lines"
          >
            <MapIcon className={`w-3.5 h-3.5 ${showCounties ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Counties</span>
          </button>
        </div>

        {/* Compact Opacity Sliders Cluster */}
        <div className="flex items-center gap-2.5 ml-auto text-[11px]">
          {showRadar && (
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
              <span className="font-bold text-slate-400">Radar:</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                className="w-14 sm:w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                title="Adjust radar opacity"
              />
            </div>
          )}

          {showWwa && (
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50">
              <span className="font-bold text-slate-400">WWA:</span>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={wwaOpacity}
                onChange={(e) => setWwaOpacity(parseFloat(e.target.value))}
                className="w-14 sm:w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-400"
                title="Adjust WWA opacity"
              />
            </div>
          )}
        </div>
      </div>

      {/* MRMS Radar Product Selector & Interactive Looper Control Deck (Consolidated Single Row) */}
      {showRadar && (
        <div className="bg-slate-900/95 border-b border-slate-800">
          <div 
            id="radar-looper-consolidated-deck"
            className="px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs text-white"
          >
            {/* Left Cluster: Transport Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="radar-play-pause-btn"
                onClick={handleTogglePlay}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all shadow-sm cursor-pointer ${
                  isPlaying 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50' 
                    : 'bg-sky-500 hover:bg-sky-400 text-slate-950 ring-2 ring-sky-400/50'
                }`}
                title={isPlaying ? 'Pause MRMS radar loop' : 'Play MRMS radar loop'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Loop</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStepBack}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Step backward 1 frame (-2 min)"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleStepForward}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Step forward 1 frame (+2 min)"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleJumpToLive}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isLatestFrame && !isPlaying
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-2xs'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
                title="Jump directly to real-time latest MRMS radar scan"
              >
                <span className={`w-2 h-2 rounded-full ${isLatestFrame ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>Live</span>
              </button>

              {/* QC Verification Badge (Compact) */}
              <div 
                className="hidden lg:flex items-center gap-1 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 px-2 py-1 rounded-md text-[11px] font-bold"
                title="NWS MRMS Quality-Controlled • Clutter & AP Filtered"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>QC</span>
              </div>
            </div>

            {/* Center Cluster: Timeline Scrubber */}
            <div className="flex-1 min-w-[180px] max-w-xl flex items-center gap-2 px-1">
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {activeFrames.length > 0 ? `-${activeFrames.length * 2}m` : '-60m'}
              </span>
              <input
                id="radar-timeline-scrubber"
                type="range"
                min="0"
                max={Math.max(0, activeFrames.length - 1)}
                value={currentFrameIndex}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
                title="Scrub through MRMS radar scans"
              />
              <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                NOW
              </span>
            </div>

            {/* Right Cluster: Span, Speed, and Timestamp HUD */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Loop Span selector */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-xs">
                {(['30m', '1h', '2h'] as LoopSpanKey[]).map(span => (
                  <button
                    key={span}
                    onClick={() => {
                      setLoopSpan(span);
                      setIsPlaying(false);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      loopSpan === span 
                        ? 'bg-sky-700 text-white shadow-2xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {span}
                  </button>
                ))}
              </div>

              {/* Loop Speed selector */}
              <div className="flex items-center bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-xs">
                {[0.5, 1, 1.5, 2].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setLoopSpeed(speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      loopSpeed === speed 
                        ? 'bg-sky-700 text-white shadow-2xs' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* HUD Timestamp Pill */}
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-xs">
                <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="font-extrabold text-white">
                  {frameTimeFormatted.local}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  frameTimeFormatted.relative === 'LIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                }`}>
                  {frameTimeFormatted.relative}
                </span>
                <span className="text-[10px] font-mono text-slate-500 hidden xl:inline">
                  [{currentFrameIndex + 1}/{activeFrames.length}]
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas (Targeted Element Container) */}
      <div 
        ref={mapWrapperRef}
        onClick={handleEnableScrollZoom}
        onTouchStart={handleEnableScrollZoom}
        onMouseLeave={handleDisableScrollZoom}
        className="relative flex-grow min-h-[380px] sm:min-h-[550px] md:min-h-[680px] lg:min-h-[760px] h-[50vh] sm:h-[65vh] lg:h-[72vh] max-h-[840px] w-full overflow-hidden bg-slate-950 group"
      >
        <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[550px] md:min-h-[680px] lg:min-h-[760px] z-0" />

        {/* On-Map HUD Badge: Real-time Looper Timestamp Overlay */}
        {showRadar && (
          <div className="absolute top-3 left-3 z-[400] pointer-events-none select-none">
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-2xl flex items-center gap-2.5 text-white">
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-sky-400 animate-ping' : isLatestFrame ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                    {isPlaying ? 'MRMS Radar Looping' : 'MRMS Quality-Controlled Radar'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                    isLatestFrame 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {frameTimeFormatted.relative}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-200 mt-0.5">
                  {frameTimeFormatted.local} <span className="text-slate-400 font-normal">({frameTimeFormatted.utc})</span>
                  <span className="text-slate-500 text-[10px] ml-1.5">• Frame {currentFrameIndex + 1}/{activeFrames.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Zoom Indicator & Lock / Unlock Status Pill */}
        <div className="absolute top-3 right-3 z-[400] pointer-events-auto">
          {isScrollZoomEnabled ? (
            <div className="flex items-center gap-2 bg-sky-950/95 border border-sky-500/70 text-sky-100 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md select-none text-xs">
              <Unlock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-bold text-[11px] hidden sm:inline">Scroll Zoom Active</span>
              <span className="font-bold text-[11px] sm:hidden">Zoom Active</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisableScrollZoom();
                }}
                className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-800 hover:bg-sky-700 text-white px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-sky-500/50 ml-0.5 shadow-xs"
                title="Lock page scroll (disable mousewheel zoom)"
              >
                Lock
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEnableScrollZoom();
              }}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md cursor-pointer transition-all duration-200 select-none text-xs"
              title="Click or tap to activate mouse wheel zoom on this map"
            >
              <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-semibold text-[11px]">
                Click / tap map to zoom
              </span>
            </button>
          )}
        </div>

        {/* Selected Alert Details Popout Drawer */}
        {selectedAlert && (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md max-h-[50vh] overflow-y-auto z-[400] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700 text-white">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-xs shrink-0"
                  style={{ backgroundColor: NWS_ALERT_COLORS[selectedAlert.event] || '#e11d48' }}
                />
                <span className="font-extrabold text-white text-xs sm:text-sm">
                  {selectedAlert.event}
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
                title="Close alert details"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-snug mb-2 line-clamp-4 font-medium">
              {selectedAlert.headline || selectedAlert.description}
            </p>
            <div className="text-[10px] text-slate-400 font-semibold flex flex-wrap items-center gap-2">
              <span>Severity: {selectedAlert.severity}</span>
              <span>•</span>
              <span>Areas: {selectedAlert.areaDesc?.slice(0, 50)}...</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Active Alerts Legend & Nationwide Long-Fuse Status */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3 h-3 text-sky-400" />
              NWS Live Hazard Coverage (Alabama &amp; Nationwide Long-Fuse)
            </span>
            <span className="text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-600/40 px-2 py-0.5 rounded-md">
              Layer: {wwaFilter === 'all' ? 'All Watches, Warnings & Advisories' : wwaFilter === 'longfuse' ? 'Nationwide Long-Fuse Only' : 'Convective Short-Fuse Only'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWwaLegendModal(prev => !prev)}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              <span>{showWwaLegendModal ? 'Hide Long-Fuse Color Key' : 'View Long-Fuse Color Key'}</span>
            </button>
            <a
              href="https://www.weather.gov/help-map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-sky-400 font-bold hover:underline"
            >
              Official NWS Map Legend
            </a>
          </div>
        </div>

        {/* Expandable Long-Fuse WWA Color Reference Bar */}
        {showWwaLegendModal && (
          <div className="mb-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-[11px] text-slate-300 font-medium">Flood Watch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#3b82f6' }} />
              <span className="text-[11px] text-slate-300 font-medium">Winter Storm Watch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#818cf8' }} />
              <span className="text-[11px] text-slate-300 font-medium">Winter Weather Advisory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#d97706' }} />
              <span className="text-[11px] text-slate-300 font-medium">Wind Advisory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#b45309' }} />
              <span className="text-[11px] text-slate-300 font-medium">High Wind Watch</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#06b6d4' }} />
              <span className="text-[11px] text-slate-300 font-medium">Freeze Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#a855f7' }} />
              <span className="text-[11px] text-slate-300 font-medium">Frost Advisory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#f97316' }} />
              <span className="text-[11px] text-slate-300 font-medium">Heat Advisory</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#e11d48' }} />
              <span className="text-[11px] text-slate-300 font-medium">Tornado Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#eab308' }} />
              <span className="text-[11px] text-slate-300 font-medium">Severe T-Storm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#10b981' }} />
              <span className="text-[11px] text-slate-300 font-medium">Flash Flood Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs shrink-0" style={{ backgroundColor: '#ec4899' }} />
              <span className="text-[11px] text-slate-300 font-medium">Red Flag / Fire</span>
            </div>
          </div>
        )}

        {/* Alabama Specific Active Alerts List */}
        <div className="flex flex-wrap justify-start gap-2 min-h-[28px] items-center">
          {isLoadingAlerts ? (
            <div className="text-xs text-slate-400 italic animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              Checking live NOAA/NWS alert stream for Alabama...
            </div>
          ) : activeEventsList.length > 0 ? (
            activeEventsList.map(event => {
              const color = NWS_ALERT_COLORS[event] || '#94a3b8';
              return (
                <div key={event} className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 shadow-2xs">
                  <span
                    className="w-3 h-3 rounded-xs shadow-xs border border-white/20 shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[11px] text-slate-200 font-bold leading-none">
                    {event}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              No active watches, warnings, or advisories currently in effect for Alabama. Nationwide WWA layer is actively displaying national hazards on the map above.
            </div>
          )}
        </div>

        {/* NOAA MRMS Radar Reflectivity (dBZ) Spectrum Legend */}
        {showRadar && (
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>NWS MRMS QC Reflectivity Scale:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center text-[10px] font-mono text-slate-300 gap-1.5">
                <span className="text-slate-400">5 dBZ</span>
                <div 
                  className="h-2.5 w-36 sm:w-56 rounded-sm shadow-xs border border-slate-700" 
                  style={{
                    background: 'linear-gradient(to right, #00ecec 0%, #01a0f6 15%, #00eb00 30%, #009000 45%, #ffff00 60%, #ff9000 75%, #ff0000 85%, #c00000 92%, #ff00f0 100%)'
                  }}
                  title="5 dBZ (Very Light) to 75+ dBZ (Severe / Hail)"
                />
                <span className="text-rose-400 font-bold">75+ dBZ</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400">
                <span className="text-cyan-400 font-semibold">Light</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Moderate</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">Heavy</span>
                <span>•</span>
                <span className="text-rose-400 font-semibold">Severe / Hail</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

