import React from 'react';
import { ExternalLink, FileText, AlertTriangle, Video } from 'lucide-react';

export const OperationalBriefings: React.FC = () => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[98%] mx-auto mb-6">
      {/* 1. Alabama Daily Weather Briefing Slides */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200/80 transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-[#002B49] to-slate-900 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white m-0">
                Alabama Daily Weather Briefing Slides
              </h3>
            </div>
          </div>
          <a
            href="https://www.weather.gov/media/bmx/Alabama_Briefing_Slides.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded-xl transition border border-sky-400/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1"
          >
            <span>Pop Out PDF</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="w-full h-[340px] sm:h-[400px] bg-slate-900 relative">
          <iframe
            src="https://www.weather.gov/media/bmx/Alabama_Briefing_Slides.pdf"
            title="Alabama Daily Briefing Slides"
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* 2. NWS Birmingham Hazardous Weather Briefing Slides */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200/80 transition-all duration-300 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white m-0">
                Hazardous Weather Briefing Slides
              </h3>
            </div>
          </div>
          <a
            href="https://www.weather.gov/media/bmx/webinar.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-amber-700 hover:bg-amber-600 text-white font-bold py-1.5 px-3 rounded-xl transition border border-amber-500/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1"
          >
            <span>Pop Out PDF</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="w-full h-[340px] sm:h-[400px] bg-slate-900 relative">
          <iframe
            src="https://www.weather.gov/media/bmx/webinar.pdf"
            title="Hazardous Weather Briefing Slides"
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* 3. Partner Webinar Recording */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col border border-slate-200/80 transition-all duration-300 hover:shadow-2xl md:col-span-2 lg:col-span-1">
        <div className="bg-gradient-to-r from-red-900 via-red-950 to-slate-950 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300">
              <Video className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white m-0">
                Latest Partner Webinar Recording
              </h3>
            </div>
          </div>
          <a
            href="https://www.gotostage.com/channel/8df611ca9bbd43b18626db808be951a5/recording/377241fc91ed4e8fb64404578036c42f/watch?source=CHANNEL"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-red-700 hover:bg-red-600 text-white font-bold py-1.5 px-3 rounded-xl transition border border-red-500/40 no-underline shadow-xs whitespace-nowrap flex items-center gap-1"
          >
            <span>Watch External</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="w-full h-[340px] sm:h-[400px] bg-black">
          <iframe
            src="https://www.gotostage.com/channel/8df611ca9bbd43b18626db808be951a5/recording/377241fc91ed4e8fb64404578036c42f/watch?source=CHANNEL"
            title="Partner Webinar Recording"
            className="w-full h-full border-0"
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
};
