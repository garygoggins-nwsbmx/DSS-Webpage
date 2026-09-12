import { RadarSite, StationMeta } from '../types';

export const ALABAMA_STATIONS: StationMeta[] = [
  { id: 'KBHM', name: 'Birmingham', cwa: 'BMX' },
  { id: 'KHSV', name: 'Huntsville', cwa: 'HUN' },
  { id: 'KMGM', name: 'Montgomery', cwa: 'BMX' },
  { id: 'KMOB', name: 'Mobile', cwa: 'MOB' },
  { id: 'KTCL', name: 'Tuscaloosa', cwa: 'BMX' },
  { id: 'KANB', name: 'Anniston', cwa: 'BMX' },
  { id: 'KDHN', name: 'Dothan', cwa: 'TAE' }
];

export const RADAR_SITES: RadarSite[] = [
  { code: 'KBMX', shortName: 'KBMX (BHM)', label: 'KBMX Birmingham (Central AL)' },
  { code: 'KHTX', shortName: 'KHTX (HUN)', label: 'KHTX Hytop (North AL)' },
  { code: 'KMXX', shortName: 'KMXX (MGM)', label: 'KMXX Maxwell AFB (Central/East AL)' },
  { code: 'KMOB', shortName: 'KMOB (MOB)', label: 'KMOB Mobile (South AL)' },
  { code: 'KEOX', shortName: 'KEOX (DHN)', label: 'KEOX Fort Rucker (Wiregrass)' }
];

export const ATLANTIC_2026_NAMES = [
  'Arthur', 'Bertha', 'Cristobal', 'Dolly', 'Edouard', 'Fay',
  'Gonzalo', 'Hanna', 'Isaias', 'Josephine', 'Kyle', 'Leah',
  'Marco', 'Nana', 'Omar', 'Paulette', 'Rene', 'Sally',
  'Teddy', 'Vicky', 'Wilfred'
];

export const NWS_ALERT_COLORS: Record<string, string> = {
  "Tornado Warning": "#FF0000",
  "Tornado Watch": "#FFFF00",
  "Severe Thunderstorm Warning": "#FFA500",
  "Severe Thunderstorm Watch": "#DB7093",
  "Flash Flood Warning": "#8B0000",
  "Flash Flood Statement": "#8B0000",
  "Flash Flood Watch": "#2E8B57",
  "Flood Warning": "#00FF00",
  "Flood Advisory": "#00FF7F",
  "Flood Statement": "#00FF00",
  "Extreme Wind Warning": "#FF8C00",
  "High Wind Warning": "#DAA520",
  "Wind Advisory": "#D2B48C",
  "Severe Weather Statement": "#00FFFF",
  "Special Weather Statement": "#FFE4B5",
  "Hazardous Weather Outlook": "#EEE8AA",
  "Hurricane Warning": "#DC143C",
  "Hurricane Watch": "#FF00FF",
  "Tropical Storm Warning": "#B22222",
  "Tropical Storm Watch": "#F08080",
  "Storm Surge Warning": "#B524F7",
  "Storm Surge Watch": "#DB7FF7",
  "Extreme Heat Warning": "#C71585",
  "Heat Advisory": "#FF7F50",
  "Winter Storm Warning": "#FF69B4",
  "Winter Weather Advisory": "#7B68EE",
  "Dense Fog Advisory": "#708090",
  "Rip Current Statement": "#40E0D0",
  "Red Flag Warning": "#FF1493",
  "Fire Weather Watch": "#FFDEAD",
  "Gale Warning": "#DDA0DD",
  "Special Marine Warning": "#FFA500",
  "Short Term Forecast": "#98FB98"
};

export const GRAPHICS_TABS = [
  // Hazard Outlooks
  { id: 'tab-severe', label: 'Severe Impacts', group: 'Hazard Outlooks', icon: '🌩️' },
  { id: 'tab-ero', label: 'Observed Rain & Outlooks', group: 'Hazard Outlooks', icon: '🌊' },
  { id: 'tab-hydro', label: 'River Flooding', group: 'Hazard Outlooks', icon: '🏞️' },
  { id: 'tab-tropical', label: 'Tropical Outlook', group: 'Hazard Outlooks', icon: '🌀' },
  { id: 'tab-fire', label: 'Fire Weather', group: 'Hazard Outlooks', icon: '🔥' },
  { id: 'tab-heatrisk', label: 'Heat Risk', group: 'Hazard Outlooks', icon: '🥵' },
  { id: 'tab-winterimpacts', label: 'Winter Impacts', group: 'Hazard Outlooks', icon: '❄️' },
  // National Overviews
  { id: 'tab-synoptic', label: 'Surface Analysis', group: 'National Overviews', icon: '🗺️' },
  { id: 'tab-national', label: 'National Forecast', group: 'National Overviews', icon: '🇺🇸' },
  // Forecast Elements
  { id: 'tab-rain', label: 'Rain Amounts', group: 'Forecast Elements', icon: '💧' },
  { id: 'tab-precip', label: 'Precip Chances', group: 'Forecast Elements', icon: '☂️' },
  { id: 'tab-snow', label: 'Snow Amounts', group: 'Forecast Elements', icon: '🏔️' },
  { id: 'tab-ice', label: 'Ice Amounts', group: 'Forecast Elements', icon: '🧊' },
  { id: 'tab-wind', label: 'Max Wind Gusts', group: 'Forecast Elements', icon: '💨' },
  { id: 'tab-high', label: 'High Temps', group: 'Forecast Elements', icon: '🌡️' },
  { id: 'tab-maxapp', label: 'Max Apparent', group: 'Forecast Elements', icon: '☀️' },
  { id: 'tab-low', label: 'Low Temps', group: 'Forecast Elements', icon: '📉' },
  { id: 'tab-minapp', label: 'Min Apparent', group: 'Forecast Elements', icon: '🥶' },
  // CPC Climate & Extended
  { id: 'tab-614cpc', label: '6-14 Day Outlooks', group: 'CPC Climate & Extended', icon: '📅' },
  { id: 'tab-814hazards', label: '8-14 Day Hazards', group: 'CPC Climate & Extended', icon: '⚠️' },
  { id: 'tab-seasonal', label: 'Monthly / Seasonal', group: 'CPC Climate & Extended', icon: '🗓️' },
  { id: 'tab-drought', label: 'Drought Monitor', group: 'CPC Climate & Extended', icon: '🏜️' }
] as const;
