// src/components/ai/SolarCopilotButton.tsx
import React from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Sparkles, SunMedium } from 'lucide-react';

export const SolarCopilotButton: React.FC = () => {
  const isCopilotOpen = useCalculatorStore((state) => state.isCopilotOpen);
  const toggleCopilot = useCalculatorStore((state) => state.toggleCopilot);

  if (isCopilotOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Outer Machined Ring with Ambient Solar Glow */}
      <div className="rounded-full p-1 bg-gradient-to-r from-amber-500/30 via-slate-200/50 to-amber-600/30 dark:from-amber-500/20 dark:via-slate-800/40 dark:to-amber-500/30 ring-1 ring-amber-500/40 dark:ring-amber-500/30 shadow-xl shadow-amber-500/15 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
        <button
          type="button"
          onClick={toggleCopilot}
          aria-label="Ask Jenny - Kito Solar Assistant"
          className="rounded-full px-4 py-2.5 bg-white/95 dark:bg-[#090E1D]/95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex items-center gap-2.5 text-xs font-bold tracking-wide text-slate-800 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-400 active:scale-95 transition-all duration-300"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-sm shadow-amber-500/30 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <div className="flex flex-col text-left">
            <span className="leading-none flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-slate-100">
              Ask Jenny
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            </span>
            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 font-normal leading-tight mt-0.5">
              Size from monthly bill
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
