import React from 'react';
import { 
  ArrowRight, 
  FileText, 
  MapPin, 
  Bell, 
  ChevronRight
} from 'lucide-react';

interface Props {
  onOpenEsriGuide?: () => void;
}

export const HeroHeader: React.FC<Props> = ({ onOpenEsriGuide }) => {
  return (
    <div className="space-y-4 max-w-[98%] mx-auto mt-2">
      {/* Partner Registration Notification Bar */}
      <div 
        id="alertBanner"
        className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-medium px-4 py-3 rounded-2xl border border-amber-300 shadow-md transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-400 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0 shadow-xs">
              <Bell className="w-3 h-3" /> NWS Connect
            </span>
            <span className="text-slate-950 font-semibold text-xs sm:text-sm leading-snug">
              <strong>Core Partner Notice:</strong> Register to receive real-time email notifications for severe weather threats and partner briefings.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://partnerservices.nws.noaa.gov/registration?code=59QRADUF"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 no-underline hover:-translate-y-0.5"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Command Center Hero Header */}
      <header className="relative text-white shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-[#0369a1] via-[#002B49] to-[#001222] border-b-2 border-sky-400/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/15 via-transparent to-rose-500/10 pointer-events-none" />
        
        <div className="px-5 sm:px-8 py-6 sm:py-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            {/* Logo and Office Info */}
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative shrink-0">
                <img
                  src="https://www.weather.gov/images/bmx/nwslogo.png"
                  alt="NWS Logo"
                  className="w-20 h-20 sm:w-22 sm:h-22 object-contain drop-shadow-xl"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://placehold.co/100x100/002B49/FFFFFF?text=NWS';
                  }}
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="text-[11px] font-black tracking-widest uppercase text-sky-300 bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-400/30">
                    NOAA / NWS BMX
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                    Core Partner Portal
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white m-0 drop-shadow-sm">
                  Decision Support Services
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed mt-2 m-0 font-normal">
                  Operational briefing materials, forecast hazards, graphics, and current conditions for State of Alabama core partners and emergency managers.
                </p>
              </div>
            </div>

            {/* Integrated DSS Action Launchpads */}
            <div className="flex flex-col items-stretch gap-2.5 w-full sm:w-80 lg:w-72 xl:w-80 shrink-0">
              {/* Action 1: DSS Request Form */}
              <a
                href="http://www.weather.gov/bmx/dssrequest"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-rose-400/60 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 shadow-md backdrop-blur-md no-underline text-white hover:-translate-y-0.5 cursor-pointer"
              >
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-left pr-1 min-w-0 flex-1 block">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white group-hover:text-rose-300 transition-colors whitespace-nowrap">
                      DSS Request Form
                    </span>
                    <span className="text-[9px] font-black uppercase bg-rose-500/30 text-rose-200 border border-rose-400/30 px-1.5 py-0.5 rounded">
                      Core Partners
                    </span>
                  </span>
                  <span className="text-[11px] text-sky-200/80 m-0 font-normal leading-tight mt-0.5 truncate block">
                    Submit incident or exercise support
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </a>

              {/* Action 2: DSS Forecast Points */}
              <a
                href="https://www.weather.gov/forecastpoints?lat=33.347&lon=-86.780&clat=33.442&clon=-86.659&zoom=13.5&basemap=terrain&bbox=-19719439,1706090,-1372338,10673494&layers=RangeRings,USStates,ForecastPointPolygon,ForecastPoint,Domain,&order=1,2,4,5,6,10,11,12,3&obs=ttffffft&countyNames=t"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400/60 p-2.5 sm:p-3 rounded-2xl transition-all duration-200 shadow-md backdrop-blur-md no-underline text-white hover:-translate-y-0.5 cursor-pointer"
              >
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-left pr-1 min-w-0 flex-1 block">
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors whitespace-nowrap">
                      DSS Forecast Points
                    </span>
                    <span className="text-[9px] font-black uppercase bg-amber-500/30 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded">
                      Interactive
                    </span>
                  </span>
                  <span className="text-[11px] text-sky-200/80 m-0 font-normal leading-tight mt-0.5 truncate block">
                    Point &amp; click meteograms
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </a>
            </div>

          </div>
        </div>
      </header>
    </div>
  );
};
