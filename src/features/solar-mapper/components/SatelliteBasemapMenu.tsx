import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronUp, Globe, Layers } from 'lucide-react';
import { BasemapProvider } from '../types/solarMapper';
import { BASEMAP_OPTIONS } from '../utils/mercator';

interface SatelliteBasemapMenuProps {
  basemapProvider: BasemapProvider;
  onSelectProvider: (provider: BasemapProvider) => void;
}

export const SatelliteBasemapMenu: React.FC<SatelliteBasemapMenuProps> = ({
  basemapProvider,
  onSelectProvider,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentName =
    BASEMAP_OPTIONS.find((o) => o.id === basemapProvider)?.name || 'Google Satellite (HD)';

  return (
    <div className="absolute bottom-4 left-4 z-30 select-none" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2.5 w-72 sm:w-80 rounded-xl bg-slate-900/95 dark:bg-[#0B0F18] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="px-3.5 py-2 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold tracking-[0.18em] text-slate-300">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Map Layer Provider</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              High-Res PH
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {BASEMAP_OPTIONS.map((opt) => {
              const isSelected = basemapProvider === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectProvider(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-xs'
                      : 'hover:bg-white/[0.05] border border-transparent text-slate-300'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-white/10 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold truncate">{opt.name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate font-normal">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-white/15 text-slate-200 hover:text-white backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-amber-500/40 active:scale-95 cursor-pointer group"
        title="Switch satellite or road map provider"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        <Layers className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-medium">{currentName}</span>
        <ChevronUp
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>
    </div>
  );
};
