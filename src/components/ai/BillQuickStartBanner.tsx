// src/components/ai/BillQuickStartBanner.tsx
import React, { useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Sparkles, ArrowRight, Sun, ShieldCheck } from 'lucide-react';

export const BillQuickStartBanner: React.FC = () => {
  const setIsCopilotOpen = useCalculatorStore((state) => state.setIsCopilotOpen);
  const [billInput, setBillInput] = useState('');

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCopilotOpen(true);
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] p-1.5 bg-gradient-to-r from-amber-500/15 via-slate-200/50 to-indigo-500/15 dark:from-amber-500/10 dark:via-slate-800/40 dark:to-indigo-500/10 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white/95 dark:bg-[#090E1C]/95 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-500" />
              AI Sales Engineer
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Philippine Tariff & PEC 6.90 Grounded
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Design & size your complete solar installation directly from your monthly bill
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Specify your electricity spend and brownout requirements. The AI copilot matches in-stock Tier-1 hardware, verifies MPPT string limits, and calculates your 25-year ROI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="inline-flex items-center justify-between gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] group"
          >
            <span>Size with AI Copilot</span>
            <span className="w-6 h-6 rounded-full bg-black/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
