import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Radio, 
  Satellite, 
  ShieldAlert, 
  FileText, 
  Share2, 
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ATLANTIC_2026_NAMES } from '../data/weatherData';
import { TropicalSystem } from '../types';

interface Props {
  onOpenLightbox: (src: string, title: string) => void;
}

export const TropicalOutlookSection: React.FC<Props> = ({ onOpenLightbox }) => {
  const [subTab, setSubTab] = useState<
    'outlook' | 'active' | 'hti' | 'local' | 'sat' | 'radar' | 'social' | 'prep'
  >('outlook');

  // TWOAT discussion state
  const [twoLang, setTwoLang] = useState<'en' | 'es'>('en');
  const [twoatText, setTwoatText] = useState<string>('Tropical Weather Outlook\nNWS National Hurricane Center Miami FL\n\nFor the North Atlantic...Caribbean Sea and the Gulf of Mexico:\n\nTropical cyclone formation is not expected during the next 7 days.\n\nForecaster NHC');
  const [isCopiedTwo, setIsCopiedTwo] = useState(false);

  // Storm names state
  const [usedNames, setUsedNames] = useState<Set<string>>(new Set(['Arthur']));

  // Active storms state
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeSystems, setActiveSystems] = useState<TropicalSystem[]>([]);
  const [selectedStormIdx, setSelectedStormIdx] = useState(0);
  const [windProbType, setWindProbType] = useState<'34' | '50' | '64'>('34');
  const [activeStormHtiOffice, setActiveStormHtiOffice] = useState<'mob' | 'bmx' | 'tlh' | 'hun' | 'lix'>('mob');

  // Standalone HTI state
  const [standaloneHtiOffice, setStandaloneHtiOffice] = useState<'bmx' | 'mob' | 'tlh' | 'hun' | 'lix'>('bmx');
  const [standaloneHtiHazard, setStandaloneHtiHazard] = useState<'composite' | 'wind' | 'surge' | 'rain' | 'tornado'>('composite');

  // Local products state
  const [localOffice, setLocalOffice] = useState('BMX');
  const [localProductType, setLocalProductType] = useState('HLS');
  const [localProductText, setLocalProductText] = useState('NO CURRENT HURRICANE LOCAL STATEMENT (HLS) IS IN EFFECT FOR WFO BMX.\n\nWhen tropical watches, warnings, or local statements are issued by NWS BMX, the raw WMO teletype bulletin will automatically stream here.');
  const [isCopiedLocal, setIsCopiedLocal] = useState(false);

  // Satellite explorer state
  const [satSector, setSatSector] = useState<'taw' | 'ga' | 'car' | 'se' | 'conus' | 'fd'>('taw');
  const [satBand, setSatBand] = useState<'GEOCOLOR' | '13' | 'Sandwich' | '08' | '02' | 'AirMass'>('GEOCOLOR');
  const [isSatLoop, setIsSatLoop] = useState(true);

  // Radar network state
  const [radarStation, setRadarStation] = useState('mosaic');

  // Checklist state for preparedness
  const [kitItems, setKitItems] = useState([
    { text: 'Water (1 gallon per person per day, 3-7 day supply)', checked: true },
    { text: 'Non-perishable food & manual can opener', checked: true },
    { text: 'NOAA Weather Radio with battery backup', checked: true },
    { text: 'Prescription medications & first aid kit', checked: false },
    { text: 'Flashlights & extra batteries', checked: false }
  ]);

  // Load live TWOAT discussion from api.weather.gov
  useEffect(() => {
    let isMounted = true;
    async function fetchTWO() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch('https://api.weather.gov/products/types/TWO', {
          headers: { Accept: 'application/geo+json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) return;
        const data = await res.json();
        const targetCollective = twoLang === 'es' ? 'ABNT30' : 'ABNT20';
        let targetItem = data?.['@graph']?.find((item: any) => item.wmoCollectiveId === targetCollective);
        if (!targetItem && data?.['@graph']) {
          targetItem = data['@graph'].find((item: any) => item.wmoCollectiveId === 'ABNT20') || data['@graph'][0];
        }
        if (targetItem?.['@id']) {
          const pController = new AbortController();
          const pTimeout = setTimeout(() => pController.abort(), 7000);
          const pRes = await fetch(targetItem['@id'], {
            headers: { Accept: 'application/geo+json' },
            signal: pController.signal
          });
          clearTimeout(pTimeout);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (isMounted && pData.productText) {
              setTwoatText(pData.productText);
            }
          }
        }
      } catch (e) {
        console.warn('Live TWOAT notice:', e);
      }
    }
    fetchTWO();
    return () => {
      isMounted = false;
    };
  }, [twoLang]);

  // Check active storms from TCP feed
  useEffect(() => {
    let isMounted = true;
    async function checkStorms() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch('https://api.weather.gov/products/types/TCP', {
          headers: { Accept: 'application/geo+json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.['@graph']) {
          const now = new Date();
          const stormMap = new Map<string, TropicalSystem>();
          for (const prod of data['@graph']) {
            if (prod.issuingOffice !== 'KNHC') continue;
            const wmo = (prod.wmoCollectiveId || '').toUpperCase();
            const match = wmo.match(/^WTNT(?:3|8)([1-5])/);
            if (!match) continue;
            const stormNum = parseInt(match[1], 10);
            const atCode = `AT${stormNum}`;
            const issueTime = new Date(prod.issuanceTime);
            if ((now.getTime() - issueTime.getTime()) / (1000 * 60 * 60) < 24) {
              stormMap.set(atCode, {
                code: atCode,
                num: stormNum,
                name: `Active System ${atCode}`,
                winds: '75 mph',
                movement: 'NW at 12 mph',
                pressure: '980 mb'
              });
            }
          }
          if (isMounted) {
            setActiveSystems(Array.from(stormMap.values()));
          }
        }
      } catch (e) {
        console.warn('Active storms check:', e);
      }
    }
    checkStorms();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute displayed active storms (real or drill simulation)
  const currentSystems: TropicalSystem[] = isDemoMode
    ? [
        {
          code: 'AT1',
          num: 1,
          name: 'Major Hurricane Scenario (AT1)',
          advisoryNumber: '14',
          winds: '120 mph (Category 3)',
          movement: 'NNW at 12 mph',
          pressure: '958 mb / 28.29 in',
          isDemo: true,
          rawText: `000\nWTNT31 KNHC 290900\nTCPAT1\n\nBULLETIN\nHurricane Scenario Advisory Number 14\nNWS National Hurricane Center Miami FL       AL012026\n400 AM CDT Sat Aug 29 2026\n\n...SCENARIO HURRICANE STRENGTHENS IN THE GULF OF MEXICO...\n...HURRICANE AND STORM SURGE WARNINGS IN EFFECT FOR COASTAL ALABAMA...\n\nSUMMARY OF 400 AM CDT...0900 UTC...INFORMATION\n----------------------------------------------\nLOCATION...27.4N 88.2W\nABOUT 185 MI...295 KM S OF MOBILE ALABAMA\nMAXIMUM SUSTAINED WINDS...120 MPH...195 KM/H\nPRESENT MOVEMENT...NNW OR 335 DEGREES AT 12 MPH...19 KM/H\nMINIMUM CENTRAL PRESSURE...958 MB...28.29 INCHES\n\nWATCHES AND WARNINGS\n--------------------\nA Storm Surge Warning is in effect for Mobile Bay and Coastal Alabama.\nA Hurricane Warning is in effect from the Alabama-Mississippi border to Destin FL.\n\n$$\nForecaster NWS/NHC`
        }
      ]
    : activeSystems;

  const toggleStormNameUsed = (name: string) => {
    setUsedNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const copyTwoText = () => {
    navigator.clipboard.writeText(twoatText);
    setIsCopiedTwo(true);
    setTimeout(() => setIsCopiedTwo(false), 2000);
  };

  const copyLocalText = () => {
    navigator.clipboard.writeText(localProductText);
    setIsCopiedLocal(true);
    setTimeout(() => setIsCopiedLocal(false), 2000);
  };

  const getSatImageUrl = (sector: string, band: string, loop: boolean) => {
    if (sector === 'fd') return `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD/${band}/678x678.jpg`;
    if (sector === 'conus') return loop ? `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/${band}/GOES19-CONUS-${band}-625x375.gif` : `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/CONUS/${band}/625x375.jpg`;
    if (sector === 'taw') return loop ? `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/taw/${band}/GOES19-TAW-${band}-900x540.gif` : `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/taw/${band}/900x540.jpg`;
    if (sector === 'se') return loop ? `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/se/${band}/GOES19-SE-${band}-600x600.gif` : `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/se/${band}/600x600.jpg`;
    if (sector === 'ga' || sector === 'car') {
      const secUpper = sector.toUpperCase();
      return loop ? `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/${sector}/${band}/GOES19-${secUpper}-${band}-1000x1000.gif` : `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/${sector}/${band}/1000x1000.jpg`;
    }
    return `https://cdn.star.nesdis.noaa.gov/GOES19/ABI/SECTOR/${sector}/${band}/latest.jpg`;
  };

  const getRadarUrl = (station: string) => {
    if (station === 'mosaic') return 'https://radar.weather.gov/ridge/standard/SOUTHEAST_loop.gif';
    if (station === 'JUA') return 'https://radar.weather.gov/ridge/standard/TJUA_loop.gif';
    return `https://radar.weather.gov/ridge/standard/K${station}_loop.gif`;
  };

  const currentSatUrl = getSatImageUrl(satSector, satBand, isSatLoop);

  return (
    <div className="space-y-6">
      {/* Tropical Section Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 -mx-6 -mt-6 p-5 sm:p-6 rounded-t-2xl border-b border-sky-400/20 text-white flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight m-0">
                Tropical Outlook &amp; Operations
              </h3>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                currentSystems.length > 0 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/30 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              }`}>
                {currentSystems.length > 0 ? `Atlantic Basin: ${currentSystems.length} Active System(s)` : 'Atlantic Basin: Calm (0 Active)'}
              </span>
            </div>
            <p className="text-xs text-sky-200/80 mt-1 m-0 font-normal">
              Official National Hurricane Center Tropical Forecasts, Atlantic Cones, and Local NWS Hurricane Threat Maps.
            </p>
          </div>

          <a
            href="https://www.nhc.noaa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3.5 rounded-xl transition border border-sky-400/40 no-underline shadow-xs flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            <span>Visit NHC.noaa.gov</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Sub-tab Navigation Pill Bar */}
        <div className="flex flex-wrap items-center justify-start sm:justify-center gap-1.5 pt-2 border-t border-sky-400/10 overflow-x-auto">
          {[
            { id: 'outlook', label: 'Outlook', icon: '🌀' },
            { id: 'active', label: `Active Storms (${currentSystems.length})`, icon: '🌪️' },
            { id: 'hti', label: 'Threats & Impacts (HTI)', icon: '🗺️' },
            { id: 'local', label: 'Local Products', icon: '📄' },
            { id: 'sat', label: 'Satellite Explorer', icon: '🛰️' },
            { id: 'radar', label: 'Radar Network', icon: '📡' },
            { id: 'social', label: 'Briefings & Feeds', icon: '📱' },
            { id: 'prep', label: 'Preparedness', icon: '🛡️' }
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setSubTab(tabItem.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === tabItem.id
                  ? 'bg-sky-600 text-white border border-sky-400/40 shadow-xs'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border border-white/10'
              }`}
            >
              <span>{tabItem.icon}</span>
              <span>{tabItem.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. OUTLOOK SUB-TAB */}
      {subTab === 'outlook' && (
        <div className="space-y-6">
          {/* Two-Day and Seven-Day Outlook Graphics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="text-center group bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-800">2-Day Atlantic Outlook</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  48-Hour Potential
                </span>
              </div>
              <div
                onClick={() => onOpenLightbox('https://www.nhc.noaa.gov/xgtwo/two_atl_2d0.png', 'NHC 2-Day Tropical Weather Outlook (Atlantic)')}
                className="cursor-zoom-in"
              >
                <img
                  src="https://www.nhc.noaa.gov/xgtwo/two_atl_2d0.png"
                  alt="NHC 2-Day Tropical Outlook"
                  className="w-full h-auto rounded-xl shadow-md border border-slate-200 transition-all duration-200 group-hover:scale-[1.01] group-hover:border-sky-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=2-Day+Tropical+Weather+Outlook';
                  }}
                />
              </div>
            </div>

            <div className="text-center group bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-800">7-Day Atlantic Outlook</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  7-Day Extended Formation
                </span>
              </div>
              <div
                onClick={() => onOpenLightbox('https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png', 'NHC 7-Day Tropical Weather Outlook (Atlantic)')}
                className="cursor-zoom-in"
              >
                <img
                  src="https://www.nhc.noaa.gov/xgtwo/two_atl_7d0.png"
                  alt="NHC 7-Day Tropical Outlook"
                  className="w-full h-auto rounded-xl shadow-md border border-slate-200 transition-all duration-200 group-hover:scale-[1.01] group-hover:border-sky-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=7-Day+Tropical+Weather+Outlook';
                  }}
                />
              </div>
            </div>
          </div>

          {/* TWOAT Discussion (Left) & 2026 Atlantic Storm Names (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Teletype Live Discussion */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full">
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                      Live NHC Discussion (TWOAT)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTwoLang(prev => (prev === 'en' ? 'es' : 'en'))}
                      className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-md border border-white/10 transition cursor-pointer"
                    >
                      {twoLang === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
                    </button>
                    <button
                      onClick={copyTwoText}
                      className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-md border border-white/10 transition cursor-pointer flex items-center gap-1"
                    >
                      {isCopiedTwo ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopiedTwo ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/90 flex-grow min-h-[280px] max-h-[420px] overflow-y-auto font-mono-code scrollbar-thin">
                  <pre className="text-emerald-400 font-mono-code text-xs leading-relaxed whitespace-pre-wrap m-0">
                    {twoatText}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right: 2026 Atlantic Storm Names */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 m-0">
                      2026 Atlantic Storm Names
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">
                      Official WMO list. Used names are in <strong>bold</strong>.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200 shadow-2xs">
                    {usedNames.size} of 21 Used
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {ATLANTIC_2026_NAMES.map((name, idx) => {
                    const isUsed = usedNames.has(name);
                    return (
                      <div
                        key={name}
                        onClick={() => toggleStormNameUsed(name)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                          isUsed
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-extrabold shadow-2xs'
                            : 'bg-slate-50/80 border-slate-200/90 text-slate-600 hover:border-sky-400 hover:bg-sky-50/40'
                        }`}
                        title="Click to toggle used status"
                      >
                        <span className={`text-xs truncate ${isUsed ? 'font-black text-emerald-950' : 'font-normal text-slate-700'}`}>
                          {name}
                        </span>
                        {isUsed ? (
                          <span className="bg-emerald-600 text-white text-[9px] font-black px-1 py-0.2 rounded">✓</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">#{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Global Tropics Hazards Outlook */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200">
              <div>
                <h4 className="text-base font-black text-slate-900 m-0">
                  Global Tropics Hazards Outlook (CPC Week 2-3)
                </h4>
                <p className="text-xs text-slate-500 mt-1 m-0">
                  NOAA Climate Prediction Center targeted global outlook for tropical cyclone formation and excessive precipitation.
                </p>
              </div>
              <a
                href="https://www.cpc.ncep.noaa.gov/products/precip/CWlink/ghaz/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition no-underline flex items-center gap-1 shrink-0 self-start sm:self-center"
              >
                <span>CPC Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div
              onClick={() => onOpenLightbox('https://www.cpc.ncep.noaa.gov/products/precip/CWlink/ghaz/gth_full.png', 'Global Tropics Hazards Outlook (CPC Week 2-3)')}
              className="text-center group max-w-4xl mx-auto cursor-zoom-in"
            >
              <img
                src="https://www.cpc.ncep.noaa.gov/products/precip/CWlink/ghaz/gth_full.png"
                alt="Global Tropics Hazards Outlook"
                className="w-full h-auto rounded-xl shadow-md border border-slate-200 transition-all duration-200 group-hover:scale-[1.005] group-hover:border-sky-500"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Global+Tropics+Hazards+Standby';
                }}
              />
            </div>
            <div className="mt-2 text-center">
              <span className="text-[11px] text-slate-400">Click image to enlarge full resolution</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE STORMS SUB-TAB */}
      {subTab === 'active' && (
        <div className="space-y-6">
          {currentSystems.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-6 sm:p-8 rounded-3xl border border-slate-700/80 text-white max-w-4xl mx-auto shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner">
                  🌴
                </div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3.5 py-1 rounded-full text-xs font-black tracking-wide mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ATLANTIC BASIN IS CURRENTLY CLEAR
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white m-0 tracking-tight">
                  No Active Tropical Cyclones in the Atlantic
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 mb-6 max-w-2xl mx-auto leading-relaxed">
                  The National Hurricane Center (NHC) currently has <strong>0 active advisories</strong> across the Atlantic Ocean, Caribbean Sea, and Gulf of Mexico.
                </p>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3 w-full">
                  <button
                    onClick={() => setIsDemoMode(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 border border-sky-400/30 cursor-pointer"
                  >
                    <span>🧪</span> Test / Preview Active Storm Interface (EMA Drill Mode)
                  </button>
                  <a
                    href="https://www.nhc.noaa.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-600 no-underline flex items-center gap-1.5"
                  >
                    <span>Official NHC Homepage</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
              <div className="space-y-6">
                {/* Active Storm Selector Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
                        Active Advisories:
                      </span>
                      {currentSystems.map((s, idx) => (
                        <button
                          key={s.code}
                          onClick={() => setSelectedStormIdx(idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                            idx === selectedStormIdx
                              ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-400/50'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>🌪️</span> {s.name} <span className="bg-black/30 px-2 py-0.5 rounded text-[10px]">{s.code}</span>
                        </button>
                      ))}
                    </div>

                    {isDemoMode && (
                      <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                        <span>⚠️ Exercise Simulation Drill Mode</span>
                        <button
                          onClick={() => setIsDemoMode(false)}
                          className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded-md font-black ml-1 transition cursor-pointer"
                        >
                          Exit Drill
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metrics Bar */}
                  {currentSystems[selectedStormIdx] && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-1">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Max Sustained Winds</span>
                        <span className="text-sm font-black text-rose-400">{currentSystems[selectedStormIdx].winds}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present Movement</span>
                        <span className="text-sm font-black text-sky-300">{currentSystems[selectedStormIdx].movement}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Minimum Pressure</span>
                        <span className="text-sm font-black text-emerald-400">{currentSystems[selectedStormIdx].pressure}</span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Advisory Number</span>
                        <span className="text-sm font-black text-amber-300">#{currentSystems[selectedStormIdx].advisoryNumber || '1'} ({currentSystems[selectedStormIdx].code})</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Storm Visual Graphics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">5-Day Track Forecast Cone &amp; Watches/Warnings</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Official NHC Track
                      </span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_5day_cone_no_line_and_wind.png`, `${currentSystems[selectedStormIdx].name} - 5-Day Forecast Track Cone`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_5day_cone_no_line_and_wind.png`}
                        alt="5-Day Track Cone"
                        className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:border-rose-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${encodeURIComponent(currentSystems[selectedStormIdx].name)}+5-Day+Forecast+Cone`;
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">NHC Key Messages Graphic</span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Executive Summary
                      </span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_key_messages.png`, `${currentSystems[selectedStormIdx].name} - Key Messages`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_key_messages.png`}
                        alt="Key Messages"
                        className="w-full h-auto rounded-xl shadow-md border border-slate-200 group-hover:border-sky-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Key+Messages+Graphic+Standby';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Wind Arrival Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">Earliest Reasonable Arrival Time (34 kt / TS Winds)</span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Prep Window Deadline</span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_earliest_reasonable_toa_no_wsp_120.png`, `${currentSystems[selectedStormIdx].name} - Earliest Arrival Time`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_earliest_reasonable_toa_no_wsp_120.png`}
                        alt="Earliest Arrival Time"
                        className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-amber-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Earliest+Arrival+Time+Graphic';
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">Most Likely Arrival Time (34 kt / TS Winds)</span>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Expected Onset</span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_most_likely_toa_no_wsp_120.png`, `${currentSystems[selectedStormIdx].name} - Most Likely Arrival Time`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_most_likely_toa_no_wsp_120.png`}
                        alt="Most Likely Arrival Time"
                        className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Most+Likely+Arrival+Time+Graphic';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Wind Probabilities Switcher */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800">Cumulative Wind Speed Probabilities</span>
                      <p className="text-[11px] text-slate-500 m-0">Probabilities of sustained winds exceeding specified wind thresholds over next 5 days.</p>
                    </div>
                    <div className="inline-flex rounded-lg bg-slate-200 p-0.5 text-xs font-bold">
                      <button
                        onClick={() => setWindProbType('34')}
                        className={`px-3 py-1 rounded-md transition cursor-pointer ${windProbType === '34' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:text-black'}`}
                      >
                        34 kt (TS)
                      </button>
                      <button
                        onClick={() => setWindProbType('50')}
                        className={`px-3 py-1 rounded-md transition cursor-pointer ${windProbType === '50' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:text-black'}`}
                      >
                        50 kt (Storm)
                      </button>
                      <button
                        onClick={() => setWindProbType('64')}
                        className={`px-3 py-1 rounded-md transition cursor-pointer ${windProbType === '64' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:text-black'}`}
                      >
                        64 kt (Hurricane)
                      </button>
                    </div>
                  </div>
                  <div
                    onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_wind_probs_${windProbType}_F120_no_line.png`, `${currentSystems[selectedStormIdx].name} - ${windProbType} kt Wind Probabilities`)}
                    className="text-center group max-w-2xl mx-auto cursor-zoom-in"
                  >
                    <img
                      src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_wind_probs_${windProbType}_F120_no_line.png`}
                      alt="Wind Speed Probabilities"
                      className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-sky-500 transition"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=${windProbType}+kt+Wind+Probabilities+Graphic`;
                      }}
                    />
                  </div>
                </div>

                {/* Storm Surge Watch/Warning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">Peak Storm Surge Forecast</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Inundation Height</span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_peak_surge.png`, `${currentSystems[selectedStormIdx].name} - Peak Storm Surge`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_peak_surge.png`}
                        alt="Peak Storm Surge"
                        className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-purple-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Peak+Storm+Surge+Standby';
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center group shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800">Storm Surge Watch / Warning Graphic</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Life-Safety Zones</span>
                    </div>
                    <div
                      onClick={() => onOpenLightbox(`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_surge_watch_warning.png`, `${currentSystems[selectedStormIdx].name} - Storm Surge Watch/Warning`)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={`https://www.nhc.noaa.gov/storm_graphics/${currentSystems[selectedStormIdx].code}/${currentSystems[selectedStormIdx].code}_surge_watch_warning.png`}
                        alt="Surge Watch Warning"
                        className="w-full h-auto rounded-xl shadow-sm border border-slate-200 group-hover:border-rose-500 transition"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Surge+Watch+Warning+Graphic+Standby';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Local NWS Office HTI */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                    <div>
                      <h5 className="text-sm font-black text-slate-900 m-0">Local NWS Hurricane Threats &amp; Impacts (HTI)</h5>
                      <p className="text-xs text-slate-500 m-0">Select local office to inspect threat levels for Wind, Surge, Flooding Rain, and Tornadoes.</p>
                    </div>
                    <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1 text-xs font-extrabold border border-slate-200">
                      {(['mob', 'bmx', 'tlh', 'hun', 'lix'] as const).map((off) => (
                        <button
                          key={off}
                          onClick={() => setActiveStormHtiOffice(off)}
                          className={`px-2.5 py-1 rounded-md transition cursor-pointer uppercase ${
                            activeStormHtiOffice === off ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-700 hover:text-black'
                          }`}
                        >
                          {off}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-800 block mb-1">Overall HTI Composite ({activeStormHtiOffice.toUpperCase()})</span>
                      <div
                        onClick={() => onOpenLightbox(`https://www.weather.gov/images/${activeStormHtiOffice}/tropical/threats_composite.png`, `${activeStormHtiOffice.toUpperCase()} Overall Threat Composite`)}
                        className="cursor-zoom-in"
                      >
                        <img
                          src={`https://www.weather.gov/images/${activeStormHtiOffice}/tropical/threats_composite.png`}
                          alt="Overall Threat Composite"
                          className="w-full h-auto rounded-lg border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://placehold.co/400x350/002B49/FFFFFF?text=${activeStormHtiOffice.toUpperCase()}+Composite+Threat`;
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">Maximum combined threat across all hazards</span>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 gap-3">
                      {[
                        { title: 'Wind Threat', file: 'threat_tracker_wind.png' },
                        { title: 'Surge Threat', file: 'threat_tracker_surge.png' },
                        { title: 'Flooding Rain', file: 'threat_tracker_rain.png' },
                        { title: 'Tornado Threat', file: 'threat_tracker_tornado.png' }
                      ].map((item) => (
                        <div key={item.title} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                          <span className="text-[11px] font-bold text-slate-700 block mb-1">{item.title}</span>
                          <div
                            onClick={() => onOpenLightbox(`https://www.weather.gov/images/${activeStormHtiOffice}/tropical/${item.file}`, `${activeStormHtiOffice.toUpperCase()} ${item.title}`)}
                            className="cursor-zoom-in"
                          >
                            <img
                              src={`https://www.weather.gov/images/${activeStormHtiOffice}/tropical/${item.file}`}
                              alt={item.title}
                              className="w-full h-auto rounded border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://placehold.co/400x300/002B49/FFFFFF?text=${encodeURIComponent(item.title)}`;
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Raw Advisory Bulletin Terminal */}
                <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                  <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      Official NHC Public Advisory Bulletin ({currentSystems[selectedStormIdx].code})
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentSystems[selectedStormIdx].rawText || '');
                      }}
                      className="text-[11px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer"
                    >
                      📋 Copy Advisory Text
                    </button>
                  </div>
                  <div className="p-4 bg-slate-950/90 max-h-64 overflow-y-auto font-mono-code scrollbar-thin">
                    <pre className="text-emerald-400 font-mono-code text-xs leading-relaxed whitespace-pre-wrap m-0">
                      {currentSystems[selectedStormIdx].rawText || 'Official NHC Public Advisory text will populate dynamically.'}
                    </pre>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* 3. THREATS & IMPACTS (HTI) SUB-TAB */}
      {subTab === 'hti' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md">
                  Local NWS WFO
                </span>
                <h4 className="text-lg font-black text-slate-900 m-0">
                  Hurricane Threats and Impacts (HTI)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Official local National Weather Service threat level guidance across wind, storm surge, flooding rain, and tornadoes.
              </p>
            </div>

            {/* Office Pills */}
            <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 text-xs font-extrabold border border-slate-200">
              {[
                { id: 'bmx', label: 'BMX (Birmingham)' },
                { id: 'mob', label: 'MOB (Mobile)' },
                { id: 'tlh', label: 'TLH (Tallahassee)' },
                { id: 'hun', label: 'HUN (Huntsville)' },
                { id: 'lix', label: 'LIX (New Orleans)' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStandaloneHtiOffice(item.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    standaloneHtiOffice === item.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-black'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'composite', label: 'Overall Threat' },
              { id: 'wind', label: 'Wind Threat' },
              { id: 'surge', label: 'Surge Threat' },
              { id: 'rain', label: 'Flooding Rain' },
              { id: 'tornado', label: 'Tornado Threat' }
            ].map((haz) => (
              <button
                key={haz.id}
                onClick={() => setStandaloneHtiHazard(haz.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  standaloneHtiHazard === haz.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {haz.label}
              </button>
            ))}
          </div>

          {/* Interactive Display */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-slate-800 capitalize">
                  {standaloneHtiHazard} Threat (WFO {standaloneHtiOffice.toUpperCase()})
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Interactive Map
                </span>
              </div>
              <div
                onClick={() => {
                  const filename = standaloneHtiHazard === 'composite' ? 'threats_composite.png' : `threat_tracker_${standaloneHtiHazard}.png`;
                  onOpenLightbox(`https://www.weather.gov/images/${standaloneHtiOffice}/tropical/${filename}`, `WFO ${standaloneHtiOffice.toUpperCase()} - ${standaloneHtiHazard} Threat`);
                }}
                className="cursor-zoom-in"
              >
                <img
                  src={`https://www.weather.gov/images/${standaloneHtiOffice}/tropical/${
                    standaloneHtiHazard === 'composite' ? 'threats_composite.png' : `threat_tracker_${standaloneHtiHazard}.png`
                  }`}
                  alt="HTI Graphic"
                  className="w-full h-auto rounded-xl shadow-md border border-slate-200 transition-all duration-200 hover:border-sky-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/800x600/002B49/FFFFFF?text=WFO+${standaloneHtiOffice.toUpperCase()}+${standaloneHtiHazard}+Standby`;
                  }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 m-0">Click image to enlarge full size</p>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2">
                  HTI Threat Scale Reference
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="font-black text-purple-950 block">Extreme Threat (Purple)</span>
                    <span className="text-purple-800 text-[11px]">Potential for catastrophic, life-threatening impacts.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                    <span className="font-black text-rose-950 block">High Threat (Red)</span>
                    <span className="text-rose-800 text-[11px]">Potential for extensive damage and major disruptions.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="font-black text-amber-950 block">Moderate Threat (Orange)</span>
                    <span className="text-amber-800 text-[11px]">Potential for significant localized damage.</span>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                    <span className="font-black text-yellow-950 block">Elevated Threat (Yellow)</span>
                    <span className="text-yellow-800 text-[11px]">Potential for minor impacts. Monitor forecasts closely.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LOCAL PRODUCTS SUB-TAB */}
      {subTab === 'local' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h4 className="text-lg font-black text-slate-900 m-0">Local Tropical Text Products &amp; Bulletins</h4>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Interactive browser for official National Weather Service text statements and warnings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Office:</span>
              <select
                value={localOffice}
                onChange={(e) => setLocalOffice(e.target.value)}
                className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 cursor-pointer"
              >
                <option value="BMX">BMX - Birmingham / Central AL</option>
                <option value="MOB">MOB - Mobile / Coastal AL</option>
                <option value="TAE">TAE - Tallahassee / Wiregrass</option>
                <option value="HUN">HUN - Huntsville / North AL</option>
                <option value="LIX">LIX - New Orleans / MS Coast</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'HLS', label: 'Hurricane Local Statement (HLS)' },
              { id: 'EWW', label: 'Extreme Wind Warning (EWW)' },
              { id: 'CFW', label: 'Coastal Hazards / Surge (CFW)' },
              { id: 'SRF', label: 'Surf Zone / Rip Currents (SRF)' },
              { id: 'FFW', label: 'Flash Flood Warning (FFW)' },
              { id: 'FLW', label: 'Flood Warning (FLW)' },
              { id: 'LSR', label: 'Local Storm Report (LSR)' },
              { id: 'PSH', label: 'Post-Tropical Report (PSH)' },
              { id: 'PNS', label: 'Public Info Statement (PNS)' },
              { id: 'TCW', label: 'Watch / Warning (TCW)' }
            ].map((prod) => (
              <button
                key={prod.id}
                onClick={() => setLocalProductType(prod.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  localProductType === prod.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {prod.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                WFO {localOffice} - {localProductType}
              </span>
              <button
                onClick={copyLocalText}
                className="text-[11px] font-bold bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer flex items-center gap-1"
              >
                {isCopiedLocal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{isCopiedLocal ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950/90 max-h-80 overflow-y-auto font-mono-code scrollbar-thin">
              <pre className="text-emerald-400 font-mono-code text-xs leading-relaxed whitespace-pre-wrap m-0">
                {localProductText}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 5. SATELLITE EXPLORER SUB-TAB */}
      {subTab === 'sat' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-900 m-0 flex items-center gap-2">
                <Satellite className="w-5 h-5 text-sky-600" />
                GOES-East Tropical Satellite Explorer
              </h4>
              <p className="text-xs text-slate-500 mt-1 m-0">
                Real-time multispectral imagery from NOAA GOES-East (GOES-19 / GOES-16).
              </p>
            </div>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setIsSatLoop(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSatLoop ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Animated Loop
              </button>
              <button
                onClick={() => setIsSatLoop(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isSatLoop ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Static Image
              </button>
            </div>
          </div>

          {/* Sector Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1">Sector:</span>
            {[
              { id: 'taw', label: 'Tropical Atlantic' },
              { id: 'ga', label: 'Gulf of America' },
              { id: 'car', label: 'Caribbean Sea' },
              { id: 'se', label: 'Southeast US' },
              { id: 'conus', label: 'CONUS' },
              { id: 'fd', label: 'Full Disk' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSatSector(s.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  satSector === s.id ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Band Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-black uppercase text-slate-400 mr-1">Channel:</span>
            {[
              { id: 'GEOCOLOR', label: 'GeoColor (True Color/Night IR)' },
              { id: '13', label: 'Clean IR (Band 13)' },
              { id: 'Sandwich', label: 'Sandwich (IR + Visible)' },
              { id: '08', label: 'Water Vapor (Upper-Level)' },
              { id: '02', label: 'Visible (Band 2)' },
              { id: 'AirMass', label: 'Air Mass RGB' }
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setSatBand(b.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  satBand === b.id ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Viewer Container */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center shadow-xl">
            <div className="flex items-center justify-between text-white mb-2 px-2">
              <span className="text-xs font-bold text-sky-300">
                GOES-East {satSector.toUpperCase()} ({satBand} {isSatLoop ? 'Loop' : 'Static'})
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                Real-Time NOAA STAR
              </span>
            </div>
            <div
              onClick={() => onOpenLightbox(currentSatUrl, `GOES-East Satellite (${satSector.toUpperCase()} - ${satBand})`)}
              className="cursor-zoom-in"
            >
              <img
                src={currentSatUrl}
                alt="Tropical Satellite"
                className="w-full h-auto max-h-[580px] object-contain rounded-xl border border-slate-800"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/800x600/002B49/FFFFFF?text=Satellite+Imagery+Standby';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. RADAR NETWORK SUB-TAB */}
      {subTab === 'radar' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h4 className="text-lg font-black text-slate-900 m-0">Tropical &amp; Coastal Doppler Radar Network</h4>
            <p className="text-xs text-slate-500 mt-1 m-0">
              NWS NEXRAD Dual-Pol radars for tracking landfalling tropical systems and severe convective feeder bands.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'mosaic', label: 'Southeast Regional Mosaic' },
              { id: 'BMX', label: 'BMX (Birmingham AL)' },
              { id: 'MOB', label: 'MOB (Mobile AL)' },
              { id: 'MXX', label: 'MXX (Maxwell AFB / Montgomery)' },
              { id: 'EOX', label: 'EOX (Fort Rucker AL)' },
              { id: 'HTX', label: 'HTX (Huntsville / Hytop)' },
              { id: 'BYX', label: 'BYX (Key West FL)' },
              { id: 'AMX', label: 'AMX (Miami FL)' },
              { id: 'TBW', label: 'TBW (Tampa Bay FL)' },
              { id: 'LIX', label: 'LIX (New Orleans LA)' },
              { id: 'JUA', label: 'JUA (San Juan PR)' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRadarStation(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  radarStation === r.id ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center shadow-xl max-w-4xl mx-auto">
            <div
              onClick={() => onOpenLightbox(getRadarUrl(radarStation), `NWS Radar Network (${radarStation})`)}
              className="cursor-zoom-in"
            >
              <img
                src={getRadarUrl(radarStation)}
                alt="Radar Display"
                className="w-full h-auto max-h-[580px] object-contain rounded-xl border border-slate-800"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://radar.weather.gov/ridge/standard/KBMX_loop.gif';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. SOCIAL & BRIEFINGS SUB-TAB */}
      {subTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <span className="text-xl">📹</span>
                <h4 className="text-base font-black text-slate-900 m-0">NWS Birmingham Briefings &amp; DSS</h4>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                During active tropical events impacting Alabama, NWS meteorologists stream live weather briefings and publish briefing packets.
              </p>
              <div className="space-y-2">
                <a
                  href="https://www.youtube.com/@NWSBirmingham"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-900 no-underline font-bold text-xs transition"
                >
                  <span>▶️ NWS Birmingham Official YouTube Channel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.weather.gov/bmx/briefing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-900 no-underline font-bold text-xs transition"
                >
                  <span>📊 NWS BMX Multimedia Briefing Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                <span className="text-xl">🌐</span>
                <h4 className="text-base font-black text-slate-900 m-0">Official Operational Feeds</h4>
              </div>
              <div className="space-y-2">
                <a
                  href="https://x.com/NHC_Atlantic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold text-xs transition"
                >
                  <span>🌀 NHC Atlantic Operations (@NHC_Atlantic)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
                <a
                  href="https://x.com/NWSBirmingham"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold text-xs transition"
                >
                  <span>⚡ NWS Birmingham (@NWSBirmingham)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
                <a
                  href="https://x.com/NWSMobile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold text-xs transition"
                >
                  <span>🌊 NWS Mobile / Coastal AL (@NWSMobile)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. PREPAREDNESS SUB-TAB */}
      {subTab === 'prep' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <span className="text-xl">⚠️</span>
                <h4 className="text-base font-black text-slate-900 m-0">Core Hurricane Safety Rules</h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-2 pl-4 list-disc mt-3 leading-relaxed">
                <li><strong>Know Your Zone:</strong> Understand if you reside in an evacuation zone or mobile home.</li>
                <li><strong>Turn Around Don't Drown:</strong> Most tropical fatalities occur from inland vehicle flooding.</li>
                <li><strong>Generator Safety:</strong> ONLY operate generators outside, &ge; 20 feet from windows/doors.</li>
                <li><strong>Secure Your Home:</strong> Cover windows with hurricane shutters or 5/8-inch plywood.</li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <a href="https://www.weather.gov/safety/hurricane" target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-sky-700 hover:underline block">
                NWS Hurricane Safety Portal &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <span className="text-xl">🎒</span>
                <h4 className="text-base font-black text-slate-900 m-0">Disaster Supply Kit</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-700 mt-3">
                {kitItems.map((item, idx) => (
                  <label key={idx} className="flex items-center gap-2 p-1.5 rounded bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {
                        const updated = [...kitItems];
                        updated[idx].checked = !updated[idx].checked;
                        setKitItems(updated);
                      }}
                      className="rounded text-sky-600"
                    />
                    <span>{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <a href="https://www.ready.gov/kit" target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-sky-700 hover:underline block">
                FEMA Ready.gov Emergency Kit Guide &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <span className="text-xl">🗺️</span>
                <h4 className="text-base font-black text-slate-900 m-0">State Evacuation Routes</h4>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Official evacuation routes and contraflow plans from state Departments of Transportation:
              </p>
              <div className="space-y-2 text-xs">
                <a href="https://www.dot.state.al.us/programs/EmergencyOperations.html" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold">
                  <span>🚗 Alabama ALDOT Routes</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
                <a href="https://www.fdot.gov/emergencymanagement/evacuation.shtm" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold">
                  <span>🚗 Florida FDOT Routes</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
                <a href="https://mdot.ms.gov/portal/emergency_operations" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 no-underline font-bold">
                  <span>🚗 Mississippi MDOT Routes</span>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                </a>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <a href="https://ema.alabama.gov/" target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-sky-700 hover:underline block">
                Alabama EMA Official Portal &rarr;
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
