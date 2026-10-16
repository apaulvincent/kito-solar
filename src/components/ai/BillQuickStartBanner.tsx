// src/components/ai/BillQuickStartBanner.tsx
import React, { useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BatteryCharging,
  Layers,
} from 'lucide-react';

const QUICK_PRESETS = [
  { label: '₱7,000 / mo', bill: 7000, desc: 'Residential Hybrid' },
  { label: '₱12,000 / mo', bill: 12000, desc: '5kW Deye System' },
  { label: '₱20,000 / mo', bill: 20000, desc: '8kW Hybrid + Battery' },
  { label: '₱35,000 / mo', bill: 35000, desc: '12kW Commercial 3P' },
];

export const BillQuickStartBanner: React.FC = () => {
  const setIsCopilotOpen = useCalculatorStore((state) => state.setIsCopilotOpen);
  const [customBill, setCustomBill] = useState('');

  const handleOpenCopilot = () => {
    setIsCopilotOpen(true);
  };

  const handlePresetClick = (bill: number) => {
    setIsCopilotOpen(true);
  };

  return (
    <section aria-label="AI Solar Sizing Studio" className="relative my-8 sm:my-12">
      {/* Outer Machined Double-Bezel Shell */}
      <div className="rounded-[2.25rem] p-2 sm:p-3 bg-gradient-to-br from-amber-500/20 via-slate-200/50 to-orange-500/15 dark:from-amber-500/15 dark:via-slate-800/60 dark:to-[#070B14]/90 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-2xl shadow-black/5 dark:shadow-black/40 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {/* Inner Core Enclosure */}
        <div className="rounded-[calc(2.25rem-0.75rem)] bg-white/95 dark:bg-[#0B101E]/95 p-6 sm:p-8 lg:p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column (Editorial & Copy) */}
            <div className="lg:col-span-7 space-y-4 text-left">
              {/* Microscopic Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>AI Solar Sizing Studio • Grounded in PH Tariffs & PEC 6.90</span>
              </div>

              {/* High-Contrast Bold Headline */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.18]">
                Design & size your complete solar installation directly from your monthly bill.
              </h2>

              {/* Plain-Language Explanatory Copy */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Specify your electricity spend and brownout requirements. Jenny matches in-stock Tier-1 hardware, verifies MPPT string limits, and calculates your 5-year ROI.
              </p>

              {/* Trust Markers / Engineering Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/70 dark:ring-white/5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Deye, Growatt & Solis Inverters</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/70 dark:ring-white/5">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                  <span>LiFePO4 Brownout Backup</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] ring-1 ring-slate-200/70 dark:ring-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>PEC 6.90 Voltage Validation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Quick-Start Bento Control */}
            <div className="lg:col-span-5">
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 dark:bg-white/[0.03] ring-1 ring-slate-200/80 dark:ring-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Quick Monthly Presets
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                    Instant Sizing
                  </span>
                </div>

                {/* 2x2 Preset Pill Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {QUICK_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetClick(preset.bill)}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-900/80 hover:bg-amber-500/10 dark:hover:bg-amber-500/15 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] group cursor-pointer"
                    >
                      <div className="text-xs font-bold font-mono text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {preset.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {preset.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Primary Island Button CTA with Button-in-Button Architecture */}
                <button
                  type="button"
                  onClick={handleOpenCopilot}
                  className="w-full inline-flex items-center justify-between px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 ring-1 ring-amber-400/50 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Ask Jenny · Size Your System</span>
                  </span>

                  {/* Nested Trailing Icon Capsule */}
                  <span className="w-8 h-8 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </span>
                </button>

                <p className="text-center text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                  100% Free • No registration required to size
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
