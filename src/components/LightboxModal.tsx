import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { LightboxState } from '../types';

interface Props {
  lightbox: LightboxState;
  onClose: () => void;
}

export const LightboxModal: React.FC<Props> = ({ lightbox, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (lightbox.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightbox.isOpen, onClose]);

  if (!lightbox.isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-6xl w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-3xl font-bold bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors z-[60]"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative flex items-center justify-center w-full min-h-[40vh] max-h-[85vh]">
          {lightbox.layers && lightbox.layers.length > 0 ? (
            <div className="relative flex items-center justify-center rounded-xl shadow-2xl border-4 border-slate-200 bg-white overflow-hidden max-h-[85vh]">
              {lightbox.layers.map((s, idx) => (
                <img
                  key={s}
                  src={s}
                  alt={lightbox.title}
                  className={
                    idx === 0
                      ? 'block w-auto h-auto max-w-full max-h-[85vh] object-contain'
                      : `absolute inset-0 w-full h-full object-cover pointer-events-none ${
                          s.includes('rfc_qpe') ? 'mix-blend-multiply opacity-30' : ''
                        } ${s.includes('TIGERweb') ? 'filter brightness-0 opacity-100' : ''}`
                  }
                />
              ))}
            </div>
          ) : (
            <img
              src={lightbox.src}
              alt={lightbox.title}
              className="w-[1200px] max-w-full max-h-[85vh] rounded-xl shadow-2xl border-4 border-slate-200 object-contain bg-white"
            />
          )}
        </div>

        <p className="mt-4 text-white text-base sm:text-lg font-bold tracking-wide drop-shadow-md text-center m-0 relative z-[60]">
          {lightbox.title}
        </p>
      </div>
    </div>
  );
};
