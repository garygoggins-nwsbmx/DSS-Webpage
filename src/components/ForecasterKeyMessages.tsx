import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronRight, FileText, Sparkles, MessageSquare } from 'lucide-react';
import { GraphicastItem } from '../types';

interface Props {
  onOpenLightbox: (src: string, title: string) => void;
}

export const ForecasterKeyMessages: React.FC<Props> = ({ onOpenLightbox }) => {
  const [selectedOffice, setSelectedOffice] = useState<'BMX' | 'HUN' | 'MOB' | 'TAE'>('BMX');
  const [keyMessagesText, setKeyMessagesText] = useState<string>('');
  const [isLoadingAfd, setIsLoadingAfd] = useState<boolean>(true);
  const [graphicasts, setGraphicasts] = useState<GraphicastItem[]>([]);
  const [isLoadingGraphicasts, setIsLoadingGraphicasts] = useState<boolean>(true);

  // Load AFD Key Messages when selected office changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAfd(true);
    setKeyMessagesText('');

    async function loadAFD() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(`https://api.weather.gov/products/types/AFD/locations/${selectedOffice}`, {
          headers: { Accept: 'application/geo+json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('AFD list failed');
        const data = await res.json();
        const latestItem = data && data['@graph'] && data['@graph'][0];

        if (latestItem && latestItem['@id']) {
          const pController = new AbortController();
          const pTimeout = setTimeout(() => pController.abort(), 7000);
          const prodRes = await fetch(latestItem['@id'], {
            headers: { Accept: 'application/geo+json' },
            signal: pController.signal
          });
          clearTimeout(pTimeout);

          if (prodRes.ok) {
            const prodData = await prodRes.json();
            const text = prodData.productText || '';

            // Extract .KEY MESSAGES
            const kmMatch = text.match(/\.KEY MESSAGES[\.\s]*\n([\s\S]*?)(?:\n\.[A-Z]|\$\$|&&)/i);
            let bluf = '';
            if (kmMatch && kmMatch[1]) {
              bluf = kmMatch[1].trim();
            } else {
              const fallbackMatch = text.match(/\.(?:SHORT TERM|DISCUSSION|SYNOPSIS|NEAR TERM)[\.\s]*\n([\s\S]*?)(?:\n\.[A-Z]|\$\$|&&)/i);
              if (fallbackMatch && fallbackMatch[1]) {
                bluf = fallbackMatch[1].trim().split(/\n\s*\n/)[0];
              }
            }

            if (isMounted && bluf) {
              setKeyMessagesText(bluf);
              setIsLoadingAfd(false);
              return;
            }
          }
        }

        if (isMounted) {
          setKeyMessagesText(`Forecaster discussions are currently in effect. Click "Full AFD" above for the complete meteorological evaluation from NWS ${selectedOffice}.`);
        }
      } catch (err) {
        console.warn(`AFD fetch notice for ${selectedOffice}:`, err);
        if (isMounted) {
          setKeyMessagesText(`Latest Area Forecast Discussion for NWS ${selectedOffice} can be accessed directly on Weather.gov via the "Full AFD" button above.`);
        }
      } finally {
        if (isMounted) setIsLoadingAfd(false);
      }
    }

    loadAFD();
    return () => {
      isMounted = false;
    };
  }, [selectedOffice]);

  // Load Graphicasts for selected office
  useEffect(() => {
    let isMounted = true;
    setIsLoadingGraphicasts(true);
    setGraphicasts([]);

    async function loadGraphicasts() {
      const officeLower = selectedOffice.toLowerCase();
      const nowSec = Math.floor(Date.now() / 1000);
      let items: GraphicastItem[] = [];

      try {
        const xmlUrl = `https://www.weather.gov/source/${officeLower}/graphicast/graphicast.xml?_t=${Date.now()}`;
        const res = await fetch(xmlUrl, {
          headers: { Accept: 'application/xml, text/xml, */*' }
        });
        if (res.ok) {
          const xmlText = await res.text();
          const blocks = [...xmlText.matchAll(/<graphicast>([\s\S]*?)<\/graphicast>/gi)];
          for (const b of blocks) {
            const c = b[1];
            const num = c.match(/<graphicNumber>([\s\S]*?)<\/graphicNumber>/i)?.[1]?.trim() || '1';
            const titleMatch = c.match(/<title>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/title>/i) || c.match(/<title>([\s\S]*?)<\/title>/i);
            const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || `Graphic ${num}`;
            const descMatch = c.match(/<description>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/description>/i) || c.match(/<description>([\s\S]*?)<\/description>/i);
            const desc = (descMatch?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const start = parseInt(c.match(/<StartTime>([\s\S]*?)<\/StartTime>/i)?.[1]?.trim() || '0', 10);
            const end = parseInt(c.match(/<EndTime>([\s\S]*?)<\/EndTime>/i)?.[1]?.trim() || '0', 10);
            const frontPage = c.match(/<FrontPage>([\s\S]*?)<\/FrontPage>/i)?.[1]?.trim();

            let fullImgMatch = c.match(/<FullImage>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]>[\s\S]*?<\/FullImage>/i) || c.match(/<FullImage>([\s\S]*?)<\/FullImage>/i);
            let imgSrc = fullImgMatch?.[1]?.trim();
            if (!imgSrc || imgSrc.length < 5 || !imgSrc.startsWith('http')) {
              imgSrc = `https://www.weather.gov/images/${officeLower}/graphicast/${num}.png`;
            }

            const isActive = (start > 0 && end > 0 && start <= nowSec && end >= nowSec) ||
                             (start === 0 && end === 0 && frontPage === 'true');
            if (isActive) {
              items.push({ num, title, imgSrc, desc });
            }
          }
        }
      } catch (e) {
        console.warn('Direct XML fetch notice:', e);
      }

      // Fallback: standard graphicast numbers 1-3 if direct XML was blocked or empty
      if (items.length === 0) {
        items = [
          {
            num: '1',
            title: `Primary Hazardous Weather Graphic`,
            imgSrc: `https://www.weather.gov/images/${officeLower}/graphicast/1.png`,
            desc: `Current operational hazardous weather outlook and forecast graphics for NWS ${selectedOffice} CWA.`
          },
          {
            num: '2',
            title: `Severe / Precipitation Outlook`,
            imgSrc: `https://www.weather.gov/images/${officeLower}/graphicast/2.png`,
            desc: `Day-to-day weather hazards, timing, and threat levels.`
          }
        ];
      }

      if (isMounted) {
        setGraphicasts(items);
        setIsLoadingGraphicasts(false);
      }
    }

    loadGraphicasts();
    return () => {
      isMounted = false;
    };
  }, [selectedOffice]);

  // Format text into bullet points or paragraphs
  const renderFormattedTakeaway = () => {
    if (!keyMessagesText) return null;
    const paragraphs = keyMessagesText.split(/\n\s*\n/);
    return paragraphs.map((para, pIdx) => {
      const lines = para.trim().split('\n');
      const isBulletList = lines.length > 1 && lines.every(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
      if (isBulletList) {
        return (
          <ul key={pIdx} className="list-disc pl-5 my-2 space-y-1 text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
            {lines.map((l, lIdx) => (
              <li key={lIdx}>{l.replace(/^[-*]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={pIdx} className="my-2 text-sm sm:text-base leading-relaxed text-slate-800 font-medium">
          {para.replace(/\n/g, ' ')}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-sky-200/90 rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 min-h-[640px] sm:min-h-[720px] lg:min-h-[780px]">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight m-0">
              NWS Forecaster Key Messages ({selectedOffice})
            </h2>
            <p className="text-[11px] text-sky-200/80 m-0">
              Area Forecast Discussion bottom-line takeaway
            </p>
          </div>
        </div>

        {/* Office Switcher & Full AFD Link */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-white/20 text-xs font-bold gap-1 shadow-md backdrop-blur-xs">
            {(['BMX', 'HUN', 'MOB', 'TAE'] as const).map((office) => (
              <button
                key={office}
                onClick={() => setSelectedOffice(office)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                  selectedOffice === office
                    ? 'bg-sky-500 text-white shadow-md border border-sky-300/40'
                    : 'text-slate-200 hover:text-white bg-white/10 hover:bg-white/20'
                }`}
              >
                {office}
              </button>
            ))}
          </div>

          <a
            href={`https://forecast.weather.gov/product.php?site=${selectedOffice}&issuedby=${selectedOffice}&product=AFD&format=CI&version=1&glossary=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-extrabold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 no-underline backdrop-blur-xs shrink-0 cursor-pointer"
          >
            <span>Full AFD</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-sky-50/40 to-white text-slate-800 flex-grow overflow-y-auto max-h-[700px]">
        {/* Dynamic Graphicasts Showcase */}
        <div className="mb-5 pb-5 border-b border-sky-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
              NWS {selectedOffice} Operational Graphicasts
            </span>
            <span className="text-[11px] text-slate-500 font-semibold bg-sky-100/70 border border-sky-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>Scroll to view</span>
              <ChevronRight className="w-3 h-3 text-sky-600" />
            </span>
          </div>

          <div className="flex overflow-x-auto gap-3.5 pb-2 pt-1 snap-x scroll-smooth">
            {isLoadingGraphicasts ? (
              <div className="py-6 w-full text-center text-xs text-sky-700 bg-sky-50 rounded-xl animate-pulse">
                Loading NWS {selectedOffice} Graphicasts...
              </div>
            ) : graphicasts.length > 0 ? (
              graphicasts.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onOpenLightbox(item.imgSrc, `NWS ${selectedOffice} - ${item.title}`)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-400 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer min-w-[240px] sm:min-w-[260px] max-w-[280px] shrink-0 snap-start"
                >
                  <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-3 py-2 flex items-center justify-between shrink-0 border-b border-slate-800">
                    <span className="text-[11px] font-bold text-white truncate max-w-[85%]" title={item.title}>
                      {item.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                  <div className="bg-slate-900 flex items-center justify-center p-1 h-36 sm:h-40 overflow-hidden relative shrink-0 border-b border-slate-800">
                    <img
                      src={item.imgSrc}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 rounded-xs"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/400x300/002B49/FFFFFF?text=Graphicast+${item.num}`;
                      }}
                    />
                  </div>
                  {item.desc && (
                    <div className="p-2.5 bg-slate-50 text-[10px] text-slate-600 line-clamp-3 leading-normal flex-grow" title={item.desc}>
                      {item.desc}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-3 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl border border-slate-200 w-full">
                No active Graphicast images currently posted.
              </div>
            )}
          </div>
        </div>

        {/* Discussion Section */}
        <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-sky-600" />
          <span>Discussion Bottom-Line Takeaway</span>
        </div>

        <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
          {isLoadingAfd ? (
            <div className="text-slate-400 italic py-4 flex items-center gap-2 animate-pulse text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
              Retrieving latest Area Forecast Discussion for NWS {selectedOffice}...
            </div>
          ) : (
            renderFormattedTakeaway()
          )}
        </div>
      </div>
    </div>
  );
};
