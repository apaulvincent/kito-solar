// src/components/config/GridConfig.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Network, Sliders } from 'lucide-react';

export function GridConfig() {
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);
  const panelCountOverride = useCalculatorStore((s) => s.panelCountOverride);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);

  const setGridVoltage = useCalculatorStore((s) => s.setGridVoltage);
  const setMainBreaker = useCalculatorStore((s) => s.setMainBreaker);
  const setPanelCountOverride = useCalculatorStore((s) => s.setPanelCountOverride);

  const activePanels = calculationResult.pvSizing.activePanelCount;
  const minPanels = calculationResult.pvSizing.minPanels;
  const maxPanels = calculationResult.pvSizing.maxPanels;
  const recPanels = calculationResult.pvSizing.recommendedPanels;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Network className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Site Grid & Array Parameters
        </label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
          PHILIPPINES / IEC UTILITY BASELINE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Grid Voltage */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Grid Nominal Voltage (V)
          </label>
          <div className="flex items-center gap-2">
            <select
              value={gridVoltageV}
              onChange={(e) => setGridVoltage(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors font-mono shadow-sm"
            >
              <option value={220}>220 V (Single Phase)</option>
              <option value={230}>230 V (Single Phase — Standard)</option>
              <option value={240}>240 V (Single Phase)</option>
              <option value={380}>380 V (Three Phase)</option>
              <option value={400}>400 V (Three Phase)</option>
            </select>
          </div>
        </div>

        {/* Main Panel Breaker */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Main Panel Service Breaker (A)
          </label>
          <div className="flex items-center gap-2">
            <select
              value={mainBreakerA === null ? '' : mainBreakerA}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                setMainBreaker(val);
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors font-mono shadow-sm"
            >
              <option value="">-- None / ATS Bypass --</option>
              <option value={40}>40 A</option>
              <option value={50}>50 A</option>
              <option value={60}>60 A</option>
              <option value={63}>63 A</option>
              <option value={100}>100 A (Standard Residential)</option>
              <option value={125}>125 A</option>
              <option value={150}>150 A</option>
              <option value={200}>200 A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Array Module Count Sizing Fine-Tuning */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Configured Panel Quantity
          </div>
          <div className="flex items-center gap-2">
            {panelCountOverride !== null && (
              <button
                type="button"
                onClick={() => setPanelCountOverride(null)}
                className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline font-semibold"
              >
                Reset to Recommended ({recPanels})
              </button>
            )}
            <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-subtle">
              {activePanels} Panels ({(calculationResult.pvSizing.totalPvPowerW / 1000).toFixed(2)} kWp)
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={Math.max(1, minPanels - 2)}
            max={maxPanels + 4}
            value={activePanels}
            onChange={(e) => setPanelCountOverride(Number(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
            <span>Min: {minPanels}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Recommended: {recPanels}</span>
            <span>Max: {maxPanels}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
