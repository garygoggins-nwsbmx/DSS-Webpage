import React from 'react';
import { ExternalLink, FileText, AlertTriangle, Video, Presentation } from 'lucide-react';

export const OperationalBriefings: React.FC = () => {
  return (
    <section 
      id="operational-briefings"
      className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden max-w-[98%] mx-auto mb-8 scroll-mt-16 sm:scroll-mt-20"
    >
      {/* Briefing Section Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#002B49] to-slate-900 px-6 py-4.5 border-b border-sky-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-inner">
            <Presentation className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
              NWS Operational Briefings &amp; Partner Webinars
            </h2>
            <p className="text-xs text-sky-200/80 mt-1 m-0 font-normal">
              Live slide packages and recorded webinars for emergency managers, first responders, and statewide decision makers
            </p>
          </div>
        </div>
      </div>

      {/* Briefings Grid: Daily Slides, Hazardous Slides & Webinar Video */}
      <div className="p-5 sm:p-6 bg-slate-50/60">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Alabama Daily Weather Briefing Slides */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-[#002B49] to-slate-900 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white m-0 line-clamp-1">
                    Daily Weather Briefing
                  </h3>
                  <div className="text-[10px] text-sky-300/90 font-semibold">
                    Statewide Forecast Slides
                  </div>
                </div>
              </div>
              <a
                href="https://www.weather.gov/media/bmx/Alabama_Briefing_Slides.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded-xl transition border border-sky-400/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1.5"
                title="Open Alabama Daily Briefing Slides in new tab"
              >
                <span>Pop Out</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-[360px] sm:h-[420px] bg-slate-900 relative">
              <iframe
                src="https://www.weather.gov/media/bmx/Alabama_Briefing_Slides.pdf"
                title="Alabama Daily Briefing Slides"
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {/* 2. NWS Hazardous Weather Briefing Slides */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 hover:shadow-xl">
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white m-0 line-clamp-1">
                    Hazardous Weather Briefing
                  </h3>
                  <div className="text-[10px] text-amber-300/90 font-semibold">
                    Severe Weather Slide Deck
                  </div>
                </div>
              </div>
              <a
                href="https://www.weather.gov/media/bmx/webinar.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-amber-700 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl transition border border-amber-500/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1.5"
                title="Open Hazardous Weather Briefing Slides in new tab"
              >
                <span>Pop Out</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-[360px] sm:h-[420px] bg-slate-900 relative">
              <iframe
                src="https://www.weather.gov/media/bmx/webinar.pdf"
                title="Hazardous Weather Briefing Slides"
                className="w-full h-full border-0"
              />
            </div>
          </div>

          {/* 3. Partner Webinar Recording */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-slate-200 transition-all duration-300 hover:shadow-xl md:col-span-2 lg:col-span-1">
            <div className="bg-gradient-to-r from-red-900 via-red-950 to-slate-950 px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300 shrink-0">
                  <Video className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-white m-0 line-clamp-1">
                    Partner Webinar Briefing
                  </h3>
                  <div className="text-[10px] text-red-300/90 font-semibold">
                    Latest Video Recording
                  </div>
                </div>
              </div>
              <a
                href="https://www.gotostage.com/channel/8df611ca9bbd43b18626db808be951a5/recording/377241fc91ed4e8fb64404578036c42f/watch?source=CHANNEL"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-red-700 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-xl transition border border-red-500/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1.5"
                title="Watch Partner Webinar on GoToStage in new tab"
              >
                <span>Watch External</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-[360px] sm:h-[420px] bg-black">
              <iframe
                src="https://www.gotostage.com/channel/8df611ca9bbd43b18626db808be951a5/recording/377241fc91ed4e8fb64404578036c42f/watch?source=CHANNEL"
                title="Partner Webinar Recording"
                className="w-full h-full border-0"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
