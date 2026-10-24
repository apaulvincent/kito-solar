// src/features/financial-roi/components/QuickBillSliderBanner.tsx
import { Zap, SlidersHorizontal, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useFinancialRoiStore, useFinancialRoiSimulation } from '../store/useFinancialRoiStore';

export function QuickBillSliderBanner() {
  const standaloneMonthlyBillPhp = useFinancialRoiStore((s) => s.standaloneMonthlyBillPhp);
  const setStandaloneMonthlyBill = useFinancialRoiStore((s) => s.setStandaloneMonthlyBill);
  const useStandaloneBillOverride = useFinancialRoiStore((s) => s.useStandaloneBillOverride);
  const setUseStandaloneBillOverride = useFinancialRoiStore((s) => s.setUseStandaloneBillOverride);
  const { sizingInput, config } = useFinancialRoiSimulation();

  const estimatedMonthlyKwh = Math.round(standaloneMonthlyBillPhp / Math.max(1, config.retailRatePhp));

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-5 sm:p-7 shadow-sm transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Eyebrow & Telemetry Context */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20">
                <Zap className="w-3 h-3 fill-current" />
                System Sizing &amp; Energy Baseline
              </span>

              {sizingInput.sourceLabel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {sizingInput.sourceLabel}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {useStandaloneBillOverride
                ? 'Simulating system sizing directly from your monthly utility bill with a 40% daytime / 60% evening residential load curve.'
                : 'Synchronized with your active engineering workbench, appliance load schedule, and local Peak Sun Hours.'}
            </p>
          </div>

          {/* Right: Recessed Pill Readouts + Island Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Compact Live Hardware Pill Strip */}
            <div className="hidden xl:flex items-center gap-1 p-1.5 rounded-full bg-slate-100/80 dark:bg-white/[0.03] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06] text-xs font-mono">
              <div className="px-3 py-1 rounded-full bg-white dark:bg-white/[0.06] text-slate-900 dark:text-white font-bold shadow-2xs">
                {sizingInput.pvKwp} kWp PV
              </div>
              <div className="px-3 py-1 text-slate-600 dark:text-slate-300">
                {sizingInput.inverterKw} kW Inv
              </div>
              <div className="px-3 py-1 text-slate-500 dark:text-slate-400">
                {sizingInput.dailyTotalKwh} kWh/day
              </div>
            </div>

            {/* Island Button-in-Button Toggle */}
            <button
              type="button"
              onClick={() => setUseStandaloneBillOverride(!useStandaloneBillOverride)}
              className={`group inline-flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5 text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
                useStandaloneBillOverride
                  ? 'bg-amber-500 text-slate-950 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
            >
              <span>{useStandaloneBillOverride ? 'Quick Bill Slider Active' : 'Use Quick Bill Slider'}</span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:scale-105 ${
                  useStandaloneBillOverride
                    ? 'bg-slate-950/15 text-slate-950'
                    : 'bg-white/15 dark:bg-slate-950/10'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* Expandable Recessed Slider Deck */}
        {useStandaloneBillOverride && (
          <div className="mt-6 pt-6 border-t border-slate-900/[0.06] dark:border-white/[0.06] space-y-5">
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/90 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <label
                  htmlFor="monthly-bill-slider"
                  className="text-[11px] uppercase tracking-[0.16em] font-bold text-slate-500 dark:text-slate-400"
                >
                  Target Monthly Electric Bill
                </label>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                    ₱{standaloneMonthlyBillPhp.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    ≈ {estimatedMonthlyKwh.toLocaleString()} kWh / mo
                  </span>
                </div>
              </div>

              <input
                id="monthly-bill-slider"
                type="range"
                min={1500}
                max={60000}
                step={500}
                value={standaloneMonthlyBillPhp}
                onChange={(e) => setStandaloneMonthlyBill(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <span>₱1,500 / mo</span>
                <span>₱15,000 / mo</span>
                <span>₱30,000 / mo</span>
                <span>₱45,000 / mo</span>
                <span>₱60,000 / mo</span>
              </div>
            </div>

            {/* 4-Pillar Recessed Telemetry Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-1">
                  Recommended PV
                </span>
                <p className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {sizingInput.pvKwp} <span className="text-xs font-normal text-slate-400">kWp</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-1">
                  Inverter Capacity
                </span>
                <p className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {sizingInput.inverterKw} <span className="text-xs font-normal text-slate-400">kW</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-1">
                  Daily Consumption
                </span>
                <p className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {sizingInput.dailyTotalKwh} <span className="text-xs font-normal text-slate-400">kWh</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06]">
                <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-1">
                  Day / Night Split
                </span>
                <p className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {sizingInput.dailyDaytimeKwh} <span className="text-xs font-normal text-slate-400">/</span> {sizingInput.dailyNighttimeKwh}{' '}
                  <span className="text-xs font-normal text-slate-400">kWh</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
