import React, { useState, useEffect } from 'react';
import { Thermometer, Clock, ExternalLink } from 'lucide-react';
import { ALABAMA_STATIONS } from '../data/weatherData';
import { ObservationData } from '../types';

export const CurrentObservations: React.FC = () => {
  const [obsList, setObsList] = useState<ObservationData[]>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Updating feed...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const formatACISRecord = (entry: any) => {
    if (!entry) return '--';
    let list: any[] = [];
    if (Array.isArray(entry)) {
      if (Array.isArray(entry[0])) {
        list = entry;
      } else if (typeof entry[0] === 'string') {
        list = [entry];
      }
    }
    if (list.length === 0) return '--';
    const topVal = list[0][0];
    if (topVal === 'M' || topVal === undefined || topVal === null || topVal === '') return '--';

    const tiedYears: string[] = [];
    for (const item of list) {
      if (item[0] === topVal && item[1]) {
        const yr = item[1].split('-')[0];
        if (yr && !tiedYears.includes(yr)) {
          tiedYears.push(yr);
        }
      }
    }
    const yearStr = tiedYears.length > 0 ? ` (${tiedYears.join(', ')})` : '';
    return `${topVal}°${yearStr}`;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentYear = now.getFullYear();

        // 1. Fetch live METARs
        const fetchPromises = ALABAMA_STATIONS.map(async (st) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`https://api.weather.gov/stations/${st.id}/observations/latest`, {
              headers: { Accept: 'application/geo+json' },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (res && res.ok) {
              return await res.json();
            }
            return null;
          } catch {
            return null;
          }
        });

        // 2. Fetch ACIS daily records
        const acisPromise = (async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const payload = {
              sids: 'KBHM,KHSV,KMGM,KMOB,KTCL,KANB,KDHN',
              sdate: `1850-${month}-${day}`,
              edate: `${currentYear}-${month}-${day}`,
              elems: [
                { name: 'maxt', interval: [1, 0, 0], smry: { reduce: 'max', add: 'date', n: 5 }, smry_only: 1 },
                { name: 'mint', interval: [1, 0, 0], smry: { reduce: 'min', add: 'date', n: 5 }, smry_only: 1 }
              ]
            };
            const res = await fetch('https://data.rcc-acis.org/MultiStnData', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) return {};
            const json = await res.json();
            const recordMap: Record<string, { high: string; low: string }> = {};
            if (json && json.data) {
              const stnIds = ['KBHM', 'KHSV', 'KMGM', 'KMOB', 'KTCL', 'KANB', 'KDHN'];
              json.data.forEach((stnData: any, i: number) => {
                const id = stnIds[i];
                if (id && stnData && stnData.smry) {
                  recordMap[id] = {
                    high: formatACISRecord(stnData.smry[0]),
                    low: formatACISRecord(stnData.smry[1])
                  };
                }
              });
            }
            return recordMap;
          } catch (e) {
            console.warn('ACIS records fetch notice:', e);
            return {};
          }
        })();

        const [results, acisRecords] = await Promise.all([Promise.all(fetchPromises), acisPromise]);

        const formatted: ObservationData[] = results.map((data, index) => {
          const st = ALABAMA_STATIONS[index];
          let temp = '--';
          let desc = 'Not Available';
          let wind = '--';
          let dew = '--';
          let feels = '--';
          let iconUrl: string | undefined = undefined;
          let isFresh = false;

          if (data && data.properties) {
            const obTimestamp = data.properties.timestamp;
            if (obTimestamp) {
              const obTime = new Date(obTimestamp);
              const ageMs = now.getTime() - obTime.getTime();
              if (!isNaN(obTime.getTime()) && ageMs >= 0 && ageMs <= 2.5 * 60 * 60 * 1000) {
                isFresh = true;
              }
            }
          }

          if (data && data.properties) {
            const c = data.properties.temperature?.value;
            const feelsC =
              data.properties.heatIndex?.value !== null
                ? data.properties.heatIndex?.value
                : data.properties.windChill?.value !== null
                ? data.properties.windChill?.value
                : c;
            const dewC = data.properties.dewpoint?.value;

            if (c !== null && c !== undefined) temp = `${Math.round((c * 9) / 5 + 32)}°F`;
            if (feelsC !== null && feelsC !== undefined) feels = `${Math.round((feelsC * 9) / 5 + 32)}°`;
            if (dewC !== null && dewC !== undefined) dew = `${Math.round((dewC * 9) / 5 + 32)}°`;

            desc = data.properties.textDescription || 'Fair';
            iconUrl = data.properties.icon;

            const windKmh = data.properties.windSpeed?.value;
            if (windKmh !== null && windKmh !== undefined) {
              const mph = Math.round(windKmh * 0.621371);
              if (mph === 0) {
                wind = 'Calm';
              } else {
                const windDirDeg = data.properties.windDirection?.value;
                let windDirStr = '';
                if (windDirDeg !== null && windDirDeg !== undefined) {
                  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                  windDirStr = dirs[Math.floor(windDirDeg / 22.5 + 0.5) % 16] + ' ';
                }
                wind = `${windDirStr}${mph} mph`;
              }
            }
          }

          const stRecs = (acisRecords as Record<string, { high: string; low: string }>)[st.id] || { high: '--', low: '--' };

          return {
            id: st.id,
            name: st.name,
            temp,
            desc,
            wind,
            dew,
            feels,
            iconUrl,
            isFresh,
            recHigh: stRecs.high || '--',
            recLow: stRecs.low || '--'
          };
        });

        if (isMounted) {
          setObsList(formatted);
          setLastUpdatedTime(`As of ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Obs error:', err);
        if (isMounted) {
          setLastUpdatedTime('Feed Standby');
          setIsLoading(false);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 180000); // every 3 mins
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="max-w-[98%] mx-auto mb-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden flex flex-col transition-all duration-300">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-white">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
              <Thermometer className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight m-0 text-white flex items-center gap-2">
                Latest Alabama Observations &amp; Daily Records
              </h2>
              <p className="text-[11px] text-sky-200/80 m-0 font-normal">
                Live METAR surface sensors + Daily record high &amp; low (ACIS). Click station for 24-hr meteogram.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-300" />
            <span className="text-[11px] font-mono-code text-sky-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
              {lastUpdatedTime}
            </span>
          </div>
        </div>

        {/* Observations Grid */}
        <div className="p-4 sm:p-6 bg-slate-50/70">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {isLoading ? (
              <div className="text-center text-slate-400 py-6 col-span-full text-xs font-medium animate-pulse">
                Fetching live observation sensors from NWS &amp; ACIS records...
              </div>
            ) : (
              obsList.map((st) => (
                <a
                  key={st.id}
                  href={`https://www.weather.gov/wrh/timeseries?site=${st.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Click to view ${st.name} (${st.id}) observation time series`}
                  className="flex flex-col items-center p-3 sm:p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200/80 transition-all duration-200 hover:shadow-md hover:border-sky-400 hover:-translate-y-1 group no-underline text-inherit cursor-pointer relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-extrabold text-slate-900 text-xs truncate group-hover:text-sky-700 transition-colors">
                      {st.name}
                    </span>
                    <span className="text-[9px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      {st.id}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 my-1 w-full">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center">
                      {st.iconUrl ? (
                        <img
                          src={st.iconUrl}
                          alt={st.desc}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain bg-slate-100 rounded-full border border-slate-200"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-200">
                          N/A
                        </div>
                      )}
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {st.temp}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-600 text-center leading-tight mt-0.5 h-6 flex items-center justify-center line-clamp-1">
                    {st.desc}
                  </span>

                  <div className="mt-2 pt-2 border-t border-slate-100 w-full grid grid-cols-2 gap-1 text-[10px] text-slate-500 font-medium text-center">
                    <div className="bg-slate-50 py-0.5 rounded">
                      Dew: <strong className="text-slate-800">{st.dew}</strong>
                    </div>
                    <div className="bg-slate-50 py-0.5 rounded">
                      Feels: <strong className="text-slate-800">{st.feels}</strong>
                    </div>
                    <div className="col-span-2 bg-slate-50 py-0.5 rounded mt-0.5">
                      Wind: <strong className="text-slate-800">{st.wind}</strong>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-dashed border-slate-200 w-full flex flex-col gap-1 text-[9px] leading-tight">
                    <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/60 px-1.5 py-0.5 rounded text-slate-800">
                      <span className="font-bold text-rose-700">Rec High:</span>
                      <span className="font-extrabold text-slate-900 truncate ml-1" title="Record High">
                        {st.recHigh}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-sky-50/80 border border-sky-200/60 px-1.5 py-0.5 rounded text-slate-800">
                      <span className="font-bold text-sky-700">Rec Low:</span>
                      <span className="font-extrabold text-slate-900 truncate ml-1" title="Record Low">
                        {st.recLow}
                      </span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
