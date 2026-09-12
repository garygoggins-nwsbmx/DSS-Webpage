import React, { useState, useEffect } from 'react';
import { Radio, X } from 'lucide-react';
import { RADAR_SITES } from '../data/weatherData';

interface Props {
  isOpen: boolean;
  initialCode: string;
  onClose: () => void;
}

export const RadarModal: React.FC<Props> = ({ isOpen, initialCode, onClose }) => {
  const [currentCode, setCurrentCode] = useState(initialCode);

  useEffect(() => {
    setCurrentCode(initialCode);
  }, [initialCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSite = RADAR_SITES.find(s => s.code === currentCode) || RADAR_SITES[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full bg-slate-950 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 px-4 sm:px-6 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                Local Radar Live Stream
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white m-0">
                {currentSite.label}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {RADAR_SITES.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setCurrentCode(s.code)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    s.code === currentCode
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {s.shortName}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer ml-2"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Radar Image */}
        <div className="relative bg-black flex items-center justify-center p-2 sm:p-4 min-h-[50vh] max-h-[75vh]">
          <img
            src={`https://radar.weather.gov/ridge/standard/${currentCode}_loop.gif`}
            alt={`${currentSite.label} Loop`}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://placehold.co/800x800/002B49/FFFFFF?text=Radar+Unavailable';
            }}
          />
        </div>
      </div>
    </div>
  );
};
