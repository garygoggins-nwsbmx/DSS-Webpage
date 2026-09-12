export interface StationMeta {
  id: string;
  name: string;
  cwa: string;
}

export interface ObservationData {
  id: string;
  name: string;
  temp: string;
  desc: string;
  wind: string;
  dew: string;
  feels: string;
  iconUrl?: string;
  isFresh: boolean;
  recHigh: string;
  recLow: string;
}

export interface GraphicastItem {
  num: string;
  title: string;
  imgSrc: string;
  desc: string;
}

export interface RadarSite {
  code: string;
  shortName: string;
  label: string;
}

export interface TropicalSystem {
  code: string;
  num: number;
  name: string;
  atId?: string;
  alId?: string;
  advisoryNumber?: string;
  winds?: string;
  movement?: string;
  pressure?: string;
  issuanceTime?: string;
  rawText?: string;
  isDemo?: boolean;
}

export interface LightboxState {
  isOpen: boolean;
  title: string;
  src?: string;
  layers?: string[];
}

export type GraphicsTabId =
  | 'tab-severe'
  | 'tab-ero'
  | 'tab-hydro'
  | 'tab-tropical'
  | 'tab-fire'
  | 'tab-heatrisk'
  | 'tab-winterimpacts'
  | 'tab-synoptic'
  | 'tab-national'
  | 'tab-rain'
  | 'tab-precip'
  | 'tab-snow'
  | 'tab-ice'
  | 'tab-wind'
  | 'tab-high'
  | 'tab-maxapp'
  | 'tab-low'
  | 'tab-minapp'
  | 'tab-614cpc'
  | 'tab-814hazards'
  | 'tab-seasonal'
  | 'tab-drought';
