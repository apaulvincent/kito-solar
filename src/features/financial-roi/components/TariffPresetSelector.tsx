// src/features/financial-roi/components/TariffPresetSelector.tsx
import { Building2, TrendingUp, SunDim, Percent, HelpCircle } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { UTILITY_PRESETS } from '../utils/utilityTariffPresets';

export function TariffPresetSelector() {
  const config = useFinancialRoiStore((s) => s.config);
  const setUtilityPreset = useFinancialRoiStore((s) => s.setUtilityPreset);
  const updateConfig = useFinancialRoiStore((s) => s.updateConfig);

  const selectedPreset = UTILITY_PRESETS.find((p) => p.id === config.selectedUtilityId);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Electric Utility Tariff & Economics
            </h3>
            <p className="text-[11px] text-slate-500">
              Select your distribution cooperative or customize rates & inflation models
            </p>
          </div>
        </div>
      </div>

      {/* Utility Preset Selector Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Distribution Utility / Cooperative:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {UTILITY_PRESETS.map((preset) => {
            const isSelected = config.selectedUtilityId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setUtilityPreset(preset.id)}
                className={`p-2.5 rounded-lg text-left border transition-all text-xs ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 font-bold text-slate-900 dark:text-white ring-1 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-semibold truncate">{preset.shortName}</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  ₱{preset.retailRatePhp.toFixed(2)} / kWh
                </div>
              </button>
            );
          })}
        </div>
        {selectedPreset?.description && (
          <p className="text-[11px] text-slate-500 italic pt-1">
            {selectedPreset.description}
          </p>
        )}
      </div>

      {/* Tariff Rate Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label htmlFor="retail-rate-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Retail Electricity Tariff (₱/kWh)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₱</span>
            <input
              id="retail-rate-input"
              type="number"
              step="0.05"
              min="5.00"
              max="30.00"
              value={config.retailRatePhp}
              onChange={(e) => updateConfig({ retailRatePhp: Math.max(1, Number(e.target.value)) })}
              className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-[10px] text-slate-500">Full retail rate saved during direct daytime consumption</span>
        </div>

        <div>
          <label htmlFor="export-credit-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Net Metering Generation Credit (₱/kWh)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">₱</span>
            <input
              id="export-credit-input"
              type="number"
              step="0.05"
              min="2.00"
              max="20.00"
              value={config.exportCreditRatePhp}
              onChange={(e) => updateConfig({ exportCreditRatePhp: Math.max(0.5, Number(e.target.value)) })}
              className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-[10px] text-slate-500">ERC generation charge credit for exported midday surplus</span>
        </div>
      </div>

      {/* Macro Economic Sliders */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Tariff Inflation */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Annual Utility Tariff Inflation Rate:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
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
            className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>0% (Flat)</span>
            <span>4.5% (Historical PH DU Average)</span>
            <span>12% (Severe)</span>
          </div>
        </div>

        {/* Panel Degradation & Discount Rate in 2 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <SunDim className="w-3.5 h-3.5 text-amber-500" />
                Panel Degradation:
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {config.annualPanelDegradationPercent.toFixed(2)}% / yr
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1.5}
              step={0.05}
              value={config.annualPanelDegradationPercent}
              onChange={(e) => updateConfig({ annualPanelDegradationPercent: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Tier-1 TOPCon warranty benchmark (~89.2% at Year 25)</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-indigo-500" />
                Discount Rate (NPV):
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {config.discountRatePercent.toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={config.discountRatePercent}
              onChange={(e) => updateConfig({ discountRatePercent: Number(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">Cost of capital / alternate risk-free investment rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
