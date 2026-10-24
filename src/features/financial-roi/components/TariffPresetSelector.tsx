// src/features/financial-roi/components/TariffPresetSelector.tsx
import { Building2, TrendingUp, SunDim, Percent } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { UTILITY_PRESETS } from '../utils/utilityTariffPresets';

export function TariffPresetSelector() {
  const config = useFinancialRoiStore((s) => s.config);
  const setUtilityPreset = useFinancialRoiStore((s) => s.setUtilityPreset);
  const updateConfig = useFinancialRoiStore((s) => s.updateConfig);

  const selectedPreset = UTILITY_PRESETS.find((p) => p.id === config.selectedUtilityId);

  return (
    <div className="h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-5 sm:p-7 shadow-sm transition-all duration-300 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/20">
              <Building2 className="w-3 h-3" />
              Franchise Tariff Schedule
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Electric Utility Tariff &amp; Economics
            </h3>
          </div>
        </div>

        {/* Distribution Utility Preset Matrix */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">
              Distribution Utility / Cooperative
            </label>
            {selectedPreset && (
              <span className="text-[11px] font-mono text-slate-500 truncate max-w-[240px]">
                {selectedPreset.region}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {UTILITY_PRESETS.map((preset) => {
              const isSelected = config.selectedUtilityId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setUtilityPreset(preset.id)}
                  className={`p-3 rounded-2xl text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_10px_20px_-6px_rgba(245,158,11,0.4)] -translate-y-0.5'
                      : 'bg-slate-50/90 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="text-xs font-extrabold truncate">{preset.shortName}</div>
                  <div
                    className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                      isSelected ? 'text-slate-950/80 font-bold' : 'text-slate-400'
                    }`}
                  >
                    ₱{preset.retailRatePhp.toFixed(2)}/kWh
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recessed Tariff Rate Numeric Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06] space-y-1.5">
            <label
              htmlFor="retail-rate-input"
              className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400"
            >
              Retail Electricity Rate (₱/kWh)
            </label>
            <div className="relative flex items-center">
              <span className="text-sm font-mono font-bold text-amber-500 mr-1.5">₱</span>
              <input
                id="retail-rate-input"
                type="number"
                step="0.05"
                min="5.00"
                max="30.00"
                value={config.retailRatePhp}
                onChange={(e) => updateConfig({ retailRatePhp: Math.max(1, Number(e.target.value)) })}
                className="w-full text-lg font-black font-mono tabular-nums bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              100% offset during daytime self-consumption
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06] space-y-1.5">
            <label
              htmlFor="export-credit-input"
              className="block text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400"
            >
              ERC Export Generation Credit
            </label>
            <div className="relative flex items-center">
              <span className="text-sm font-mono font-bold text-indigo-500 mr-1.5">₱</span>
              <input
                id="export-credit-input"
                type="number"
                step="0.05"
                min="2.00"
                max="20.00"
                value={config.exportCreditRatePhp}
                onChange={(e) => updateConfig({ exportCreditRatePhp: Math.max(0.5, Number(e.target.value)) })}
                className="w-full text-lg font-black font-mono tabular-nums bg-transparent text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Credited per kWh exported via bi-directional meter
            </span>
          </div>
        </div>

        {/* Macro Economic Sliders */}
        <div className="space-y-4 pt-2 border-t border-slate-900/[0.05] dark:border-white/[0.05]">
          {/* Tariff Inflation */}
          <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.05] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                Annual Utility Tariff Inflation
              </span>
              <span className="font-mono font-black tabular-nums text-amber-600 dark:text-amber-400">
                {config.annualTariffInflationPercent.toFixed(1)}% / yr
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={config.annualTariffInflationPercent}
              onChange={(e) => updateConfig({ annualTariffInflationPercent: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0% Flat</span>
              <span>4.5% Historical PH Avg</span>
              <span>12% High Escalation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.05] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SunDim className="w-3.5 h-3.5 text-amber-500" />
                  PV Degradation
                </span>
                <span className="font-mono font-black tabular-nums text-slate-900 dark:text-white">
                  {config.annualPanelDegradationPercent.toFixed(2)}%/yr
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.5}
                step={0.05}
                value={config.annualPanelDegradationPercent}
                onChange={(e) => updateConfig({ annualPanelDegradationPercent: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.05] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-indigo-500" />
                  Discount Rate (NPV)
                </span>
                <span className="font-mono font-black tabular-nums text-slate-900 dark:text-white">
                  {config.discountRatePercent.toFixed(1)}%/yr
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={config.discountRatePercent}
                onChange={(e) => updateConfig({ discountRatePercent: Number(e.target.value) })}
                className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
  );
}
