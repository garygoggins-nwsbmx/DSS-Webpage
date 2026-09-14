import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScKsF303Tt4EPwS3SK3YMBrxqlnhbpVh2liLWPWIVtiUpgB7A/viewform?embedded=true";
const DIRECT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScKsF303Tt4EPwS3SK3YMBrxqlnhbpVh2liLWPWIVtiUpgB7A/viewform";

export const DssRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dss-modal-title"
    >
      {/* Click outside backdrop */}
      <div 
        className="absolute inset-0" 
        onClick={onClose}
        aria-hidden="true" 
      />

      {/* Modal Card Window */}
      <div 
        className="relative w-full max-w-4xl h-[92vh] sm:h-[88vh] max-h-[920px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col z-10 animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#002B49] to-slate-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 border-b border-sky-400/20 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="dss-modal-title" className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white m-0 truncate">
                  NWS Decision Support Services (DSS) Request Form
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-sky-200/80 m-0 font-medium truncate mt-0.5">
                NWS Birmingham, AL • Incidents, Public Safety Events &amp; Exercise Support
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              title="Reload form"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer border border-white/10"
              aria-label="Reload form"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <a
              href={DIRECT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Open form in new window"
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer border border-white/10 flex items-center gap-1.5 text-xs font-semibold no-underline"
              aria-label="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden md:inline">Open in Tab</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer border border-rose-500 shadow-xs"
              aria-label="Close modal window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Container with Loading State */}
        <div className="relative flex-1 w-full bg-slate-50 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-10 gap-3">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-800 m-0">Connecting to Google Form...</p>
                <p className="text-xs text-slate-500 m-0 mt-1">Loading secure partner intake interface</p>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={FORM_URL}
            title="NWS Decision Support Services (DSS) Request Form"
            className="w-full h-full border-0 block"
            onLoad={() => setIsLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        {/* Footer info bar */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 text-[11px] sm:text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>For time-critical active emergencies requiring immediate briefing, call the Operations Desk at (205) 664-3010.</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-300 shadow-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
