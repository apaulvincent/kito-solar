// src/features/financial-roi/components/CapexBreakdownCard.tsx
import { Wrench, ShieldCheck, DollarSign, Edit3, Sparkles } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { calculateTurnkeyCapex } from '../utils/financialEngine';

export function CapexBreakdownCard() {
  const config = useFinancialRoiStore((s) => s.config);
  const updateConfig = useFinancialRoiStore((s) => s.updateConfig);
  const sizingInput = useFinancialRoiStore((s) => s.getSystemSizingInput());

  const capex = calculateTurnkeyCapex(sizingInput, config, config.exportStrategy);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              System Turnkey CAPEX & Replacements
            </h3>
            <p className="text-[11px] text-slate-500">
              Philippine EPC market benchmarks or exact installer contract quotes
            </p>
          </div>
        </div>

        {/* Toggle between Auto-Estimate vs Custom Quote */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => updateConfig({ useCustomCapex: false })}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              !config.useCustomCapex
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Auto-Estimate
          </button>
          <button
            type="button"
            onClick={() => updateConfig({ useCustomCapex: true, customCapexPhp: config.customCapexPhp || capex.totalCapexPhp })}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              config.useCustomCapex
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Custom Quote
          </button>
        </div>
      </div>

      {/* Total CAPEX Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            {config.useCustomCapex ? 'Installer Contract Quote (Turnkey)' : 'Auto-Estimated Turnkey Investment'}
          </span>
          {config.useCustomCapex ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-mono font-extrabold text-slate-900 dark:text-white">₱</span>
              <input
                type="number"
                step="5000"
                min="50000"
                max="5000000"
                value={config.customCapexPhp || ''}
                onChange={(e) => updateConfig({ customCapexPhp: Number(e.target.value) })}
                className="w-48 px-3 py-1 text-lg font-mono font-extrabold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="250000"
              />
            </div>
          ) : (
            <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
              ₱{capex.totalCapexPhp.toLocaleString()}
            </div>
          )}
        </div>

        <div className="text-right sm:text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Hardware Sizing Basis</span>
          <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
            {sizingInput.pvKwp} kWp PV • {sizingInput.inverterKw} kW Inv
            {config.exportStrategy.includes('hybrid') && sizingInput.batteryKwh > 0 && ` • ${sizingInput.batteryKwh} kWh LiFePO4`}
          </div>
        </div>
      </div>

      {/* Itemized Hardware Table */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span>Tier-1 N-Type TOPCon Panels ({sizingInput.pvKwp} kWp):</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{capex.pvArrayPhp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span>Solar Inverter ({sizingInput.inverterKw} kW {config.exportStrategy.includes('hybrid') ? 'Hybrid' : 'Grid-Tie'}):</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{capex.inverterPhp.toLocaleString()}</span>
        </div>
        {config.exportStrategy.includes('hybrid') && (
          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <span>LiFePO4 51.2V Battery Pack ({sizingInput.batteryKwh} kWh):</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{capex.batteryPhp.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span>Aluminum Rails, Clamps & Electrical BOS:</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{capex.bosAndMountingPhp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
          <span>Engineering, LGU Permits & Commissioning (12%):</span>
          <span className="font-mono font-semibold text-slate-900 dark:text-white">₱{capex.laborAndPermitsPhp.toLocaleString()}</span>
        </div>
        {config.exportStrategy.includes('net_metering') && (
          <div className="flex justify-between py-1 text-amber-700 dark:text-amber-400 font-medium border-b border-slate-100 dark:border-slate-800">
            <span>DU Net Metering Bi-Directional Meter & Processing:</span>
            <span className="font-mono font-bold">₱{capex.netMeteringSetupPhp.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Hardware Replacement Toggles */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-slate-500" />
          <span>Scheduled 25-Year Lifecycle Replacements:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeInverterReplacement}
              onChange={(e) => updateConfig({ includeInverterReplacement: e.target.checked })}
              className="accent-amber-500 mt-0.5"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Year 12 Inverter Renewal</span>
              <p className="text-[11px] text-slate-500">
                Models inverter replacement at 65% of original cost (~₱{(capex.inverterInitialCostPhp * 0.65).toLocaleString()}).
              </p>
            </div>
          </label>

          {config.exportStrategy.includes('hybrid') ? (
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeBatteryReplacement}
                onChange={(e) => updateConfig({ includeBatteryReplacement: e.target.checked })}
                className="accent-amber-500 mt-0.5"
              />
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Year 11 Battery Cell Renewal</span>
                <p className="text-[11px] text-slate-500">
                  Refurbishment after 5,000 cycles at 60% cost (~₱{(capex.batteryInitialCostPhp * 0.60).toLocaleString()}).
                </p>
              </div>
            </label>
          ) : (
            <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center">
              Battery replacement not applicable for grid-tie configurations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
