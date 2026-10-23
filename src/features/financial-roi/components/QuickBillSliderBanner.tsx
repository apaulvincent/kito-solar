// src/features/financial-roi/components/QuickBillSliderBanner.tsx
import { Zap, RefreshCw, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';

export function QuickBillSliderBanner() {
  const standaloneMonthlyBillPhp = useFinancialRoiStore((s) => s.standaloneMonthlyBillPhp);
  const setStandaloneMonthlyBill = useFinancialRoiStore((s) => s.setStandaloneMonthlyBill);
  const useStandaloneBillOverride = useFinancialRoiStore((s) => s.useStandaloneBillOverride);
  const setUseStandaloneBillOverride = useFinancialRoiStore((s) => s.setUseStandaloneBillOverride);
  const sizingInput = useFinancialRoiStore((s) => s.getSystemSizingInput());
  const config = useFinancialRoiStore((s) => s.config);

  const estimatedMonthlyKwh = Math.round(standaloneMonthlyBillPhp / Math.max(1, config.retailRatePhp));

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Telemetry & Mode Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              System Sizing & Energy Baseline
            </h2>
            {sizingInput.sourceLabel && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                {sizingInput.sourceLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {useStandaloneBillOverride
              ? 'Using quick standalone monthly electric bill slider to estimate daytime and nighttime power usage.'
              : 'Automatically pulling verified load schedules and peak sun hours from your active workbench.'}
          </p>
        </div>

        {/* Right: Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseStandaloneBillOverride(!useStandaloneBillOverride)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              useStandaloneBillOverride
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{useStandaloneBillOverride ? 'Manual Bill Override Active' : 'Switch to Quick Bill Slider'}</span>
          </button>
        </div>
      </div>

      {/* Standalone Slider View when override is active */}
      {useStandaloneBillOverride && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="monthly-bill-slider" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Approximate Monthly Electric Bill:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                ₱{standaloneMonthlyBillPhp.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                (~{estimatedMonthlyKwh} kWh/mo)
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
            className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>₱1,500</span>
            <span>₱15,000</span>
            <span>₱30,000</span>
            <span>₱45,000</span>
            <span>₱60,000</span>
          </div>

          {/* Sizing Readout Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Estimated PV Array</span>
              <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                {sizingInput.pvKwp} kWp
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Inverter Sizing</span>
              <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                {sizingInput.inverterKw} kW
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Daily Total Load</span>
              <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                {sizingInput.dailyTotalKwh} kWh/day
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Day / Night Split</span>
              <p className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                {sizingInput.dailyDaytimeKwh} / {sizingInput.dailyNighttimeKwh} kWh
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
