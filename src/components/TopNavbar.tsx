import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  MessageSquare, 
  CloudRain, 
  Presentation, 
  Thermometer, 
  Layers, 
  MapPin, 
  ChevronRight, 
  ExternalLink,
  Phone,
  FileText,
  Bell
} from 'lucide-react';

interface NavSection {
  id: string;
  name: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'key-messages',
    name: 'Forecaster Key Messages',
    shortName: 'Key Messages',
    icon: MessageSquare,
    description: 'AFD bottom-line takeaways & graphicasts'
  },
  {
    id: 'interactive-radar-map',
    name: 'Statewide Hazard & Radar',
    shortName: 'Radar & Alerts',
    icon: CloudRain,
    description: 'Live NWS warnings & QC MRMS radar'
  },
  {
    id: 'operational-briefings',
    name: 'Operational Briefings',
    shortName: 'Briefings',
    icon: Presentation,
    description: 'Daily slides, hazardous packets & webinars'
  },
  {
    id: 'observations',
    name: 'Current Observations',
    shortName: 'Observations',
    icon: Thermometer,
    description: 'Live METAR surface sensors & climate records'
  },
  {
    id: 'statewidegraphics',
    name: 'Statewide Forecast Graphics',
    shortName: 'Forecast Graphics',
    icon: Layers,
    description: 'Multi-agency DSS maps (BMX, SPC, WPC, NHC, CPC)'
  },
  {
    id: 'cwa-maps',
    name: 'County Warning Areas',
    shortName: 'CWA Map',
    icon: MapPin,
    description: 'NWS office boundaries & contact directory'
  }
];

interface TopNavbarProps {
  onOpenDssForm?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenDssForm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('key-messages');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Track active section via scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const scrollPosition = window.scrollY + 140; // offset for navbar height
      for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
        const section = document.getElementById(NAV_SECTIONS[i].id);
        if (section) {
          const top = section.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(NAV_SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 64; // px
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  const currentNav = NAV_SECTIONS.find(s => s.id === activeSection) || NAV_SECTIONS[0];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-200 ${
      isScrolled 
        ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl' 
        : 'bg-slate-950 border-b border-slate-800'
    }`}>
      <div className="max-w-[98%] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 text-left cursor-pointer group"
              aria-label="Scroll to top of NWS Birmingham, AL DSS Portal"
            >
              <img
                src="https://www.weather.gov/images/bmx/nwslogo.png"
                alt="NWS Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://placehold.co/100x100/002B49/FFFFFF?text=NWS';
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-sky-300 transition-colors">
                    NWS Birmingham, AL
                  </span>
                  <span className="hidden xs:inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-300 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-600/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  Decision Support Services
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav 
            className="hidden xl:flex items-center gap-1"
            aria-label="Primary Desktop Navigation"
          >
            {NAV_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-sm border border-sky-400/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <span>{section.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar & Mobile Pancake Button */}
          <div className="flex items-center gap-2">
            
            {/* Quick Link: DSS Request Form (Hidden on small mobile, visible on sm+) */}
            <button
              onClick={() => onOpenDssForm?.()}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-rose-100 bg-gradient-to-r from-rose-950/80 to-slate-900 hover:from-rose-900 hover:to-slate-800 px-3 py-1.5 rounded-xl transition border border-rose-500/40 hover:border-rose-400 shadow-xs whitespace-nowrap cursor-pointer"
              title="Open DSS Request Form in-page window"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>DSS Request</span>
            </button>

            {/* Mobile Active Section Chip (Shows user current context) */}
            <div className="xl:hidden flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-300 max-w-[130px] sm:max-w-[170px] truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="truncate">{currentNav.shortName}</span>
            </div>

            {/* Pancake / Hamburger Menu Toggle Button */}
            <button
              id="mobile-pancake-menu-button"
              onClick={() => setIsOpen(prev => !prev)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close main navigation menu" : "Open main navigation menu"}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition-all cursor-pointer min-w-[44px] min-h-[44px] justify-center border shadow-xs ${
                isOpen
                  ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-slate-600'
              }`}
            >
              {isOpen ? (
                <>
                  <X className="w-5 h-5 text-white" />
                  <span className="hidden sm:inline">Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-5 h-5 text-sky-400" />
                  <span className="hidden sm:inline font-bold">Menu</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Over / Slide-Down Pancake Menu Drawer */}
      {isOpen && (
        <>
          {/* Backdrop Dimmer */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 top-14 sm:top-16 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity duration-200 animate-fadeIn"
            aria-hidden="true"
          />

          {/* Pancake Menu Dropdown Container */}
          <div
            className="fixed top-14 sm:top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950 border-b border-slate-800 shadow-2xl z-50 px-4 py-5 transition-all duration-200 transform translate-y-0"
            role="dialog"
            aria-label="Section Navigation Drawer"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                    Page Navigation
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    • Tap to jump to section
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold p-1 rounded-md cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              {/* Section Navigation Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NAV_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-950/50 text-white'
                          : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-800 text-sky-400 group-hover:bg-slate-700'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-sm font-black truncate ${
                            isActive ? 'text-sky-300' : 'text-white group-hover:text-sky-300'
                          }`}>
                            {section.name}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-black uppercase text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-400/40 shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 leading-snug">
                          {section.description}
                        </p>
                      </div>

                      <ChevronRight className={`w-4 h-4 my-auto shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? 'text-sky-400' : 'text-slate-500'
                      }`} />
                    </button>
                  );
                })}
              </div>

              {/* Quick Core Partner Action Links */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Emergency Manager &amp; Core Partner Tools
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenDssForm?.();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 hover:from-rose-900/80 hover:to-slate-850 border border-rose-500/40 hover:border-rose-400 text-white text-xs font-bold transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>DSS Request Form (Window)</span>
                    </div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-rose-300 bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Open
                    </span>
                  </button>

                  <a
                    href="https://www.weather.gov/forecastpoints?lat=33.347&lon=-86.780&clat=33.442&clon=-86.659&zoom=13.5&basemap=terrain&bbox=-19719439,1706090,-1372338,10673494&layers=RangeRings,USStates,ForecastPointPolygon,ForecastPoint,Domain,&order=1,2,4,5,6,10,11,12,3&obs=ttffffft&countyNames=t"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-white text-xs font-bold transition-all no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>DSS Forecast Points</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>

                  <a
                    href="https://partnerservices.nws.noaa.gov/registration?code=59QRADUF"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-white text-xs font-bold transition-all no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-sky-400" />
                      <span>NWS Connect Registration</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>

                  <a
                    href="tel:2056643010"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-white text-xs font-bold transition-all no-underline"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Call NWS BMX Operations</span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">24/7 Desk</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </header>
  );
};
