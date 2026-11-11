import { DollarSign, Wrench } from 'lucide-react';
import { DEFAULT_PANEL_WATTAGE_W } from '@/lib/solarConstants';
import { useFinancialRoiSimulation, useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { CAPEX_BENCHMARKS } from '../utils/utilityTariffPresets';

export function CapexBreakdownCard() {
  const updateConfig = useFinancialRoiStore((s) => s.updateConfig);
  const { activeSim, sizingInput, config } = useFinancialRoiSimulation();
  const { capex } = activeSim;
  const isHybrid = config.exportStrategy.includes('hybrid');
  const horizonYears = CAPEX_BENCHMARKS.simulationHorizonYears;

  return (
    <div className="h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-5 sm:p-7 shadow-sm transition-all duration-300 flex flex-col justify-between space-y-6">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <DollarSign className="w-3 h-3" />
              Capital Expenditure
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              System Turnkey CAPEX &amp; Replacements
            </h3>
          </div>

          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-xs font-bold">
            <button
              type="button"
              onClick={() => updateConfig({ useCustomCapex: false })}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                !config.useCustomCapex
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Auto-Estimate
            </button>
            <button
              type="button"
              onClick={() =>
                updateConfig({
                  useCustomCapex: true,
                  customCapexPhp: config.customCapexPhp || capex.totalCapexPhp,
                })
              }
              className={`px-3.5 py-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                config.useCustomCapex
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Custom Quote
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-slate-50/90 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-slate-400 block mb-1">
              {config.useCustomCapex ? 'Custom Installer Contract Quote' : 'Estimated Turnkey EPC Outlay'}
            </span>
            {config.useCustomCapex ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-black text-amber-500">₱</span>
                <input
                  type="number"
                  step="5000"
                  min="50000"
                  max="5000000"
                  value={config.customCapexPhp || ''}
                  onChange={(e) => updateConfig({ customCapexPhp: Number(e.target.value) })}
                  className="w-44 px-3 py-1 text-2xl font-mono font-black tabular-nums bg-white dark:bg-slate-900 border border-amber-500/40 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  placeholder="250000"
                />
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                ₱{capex.totalCapexPhp.toLocaleString()}
              </div>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-1">
              Equipment Basis
            </span>
            <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
              {sizingInput.pvKwp} kWp PV • {sizingInput.inverterKw} kW Inv
              {isHybrid && sizingInput.batteryKwh > 0 && ` • ${sizingInput.batteryKwh} kWh`}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 border-b border-slate-900/[0.04] dark:border-white/[0.04]">
            <span>
              Tier-1 N-Type TOPCon Modules ({sizingInput.pvKwp} kWp • ~
              {Math.round((sizingInput.pvKwp * 1000) / DEFAULT_PANEL_WATTAGE_W)}×{' '}
              {DEFAULT_PANEL_WATTAGE_W}W @ ₱{CAPEX_BENCHMARKS.pvArrayPerKwpPhp / 1000}k/kWp)
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              ₱{capex.pvArrayPhp.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 border-b border-slate-900/[0.04] dark:border-white/[0.04]">
            <span>
              Solar Inverter ({sizingInput.inverterKw} kW{' '}
              {isHybrid
                ? `Hybrid @ ₱${CAPEX_BENCHMARKS.hybridInverterPerKwPhp / 1000}k/kW`
                : `Grid-Tie @ ₱${CAPEX_BENCHMARKS.gridTieInverterPerKwPhp / 1000}k/kW`}
              )
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              ₱{capex.inverterPhp.toLocaleString()}
            </span>
          </div>
          {isHybrid && (
            <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 border-b border-slate-900/[0.04] dark:border-white/[0.04]">
              <span>
                LiFePO4 51.2V Battery Storage ({sizingInput.batteryKwh} kWh @ ₱
                {CAPEX_BENCHMARKS.batteryPerKwhPhp / 1000}k/kWh)
              </span>
              <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                ₱{capex.batteryPhp.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 border-b border-slate-900/[0.04] dark:border-white/[0.04]">
            <span>
              Aluminum Railing, Clamps &amp; Protection BOS (₱
              {(CAPEX_BENCHMARKS.bosAndMountingPerKwpPhp / 1000).toFixed(1)}k/kWp)
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              ₱{capex.bosAndMountingPhp.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between py-1.5 text-slate-500 dark:text-slate-400 border-b border-slate-900/[0.04] dark:border-white/[0.04]">
            <span>
              Engineering &amp; Commissioning ({Math.round(CAPEX_BENCHMARKS.laborAndPermitsRatio * 100)}%)
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
              ₱{capex.laborAndPermitsPhp.toLocaleString()}
            </span>
          </div>
          {config.exportStrategy.includes('net_metering') && (
            <div className="flex justify-between py-1.5 text-amber-600 dark:text-amber-400 font-semibold">
              <span>ERC Bi-Directional Meter &amp; DU Processing</span>
              <span className="font-mono font-bold tabular-nums">
                ₱{capex.netMeteringSetupPhp.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-900/[0.05] dark:border-white/[0.05] space-y-3">
        <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-amber-500" />
          <span>{horizonYears}-Year Hardware Renewal Schedule</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors">
            <input
              type="checkbox"
              checked={config.includeInverterReplacement}
              onChange={(e) => updateConfig({ includeInverterReplacement: e.target.checked })}
              className="accent-amber-500 mt-0.5 rounded"
            />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white block">
                Year {config.inverterReplacementYear} Inverter Renewal
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {Math.round(CAPEX_BENCHMARKS.inverterReplacementRatio * 100)}% cost (≈ ₱
                {Math.round(
                  capex.inverterInitialCostPhp * CAPEX_BENCHMARKS.inverterReplacementRatio
                ).toLocaleString()}
                )
              </span>
            </div>
          </label>

          {isHybrid ? (
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors">
              <input
                type="checkbox"
                checked={config.includeBatteryReplacement}
                onChange={(e) => updateConfig({ includeBatteryReplacement: e.target.checked })}
                className="accent-amber-500 mt-0.5 rounded"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Year {config.batteryReplacementYear} LiFePO4 Renewal
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  {Math.round(CAPEX_BENCHMARKS.batteryReplacementRatio * 100)}% cost (≈ ₱
                  {Math.round(
                    capex.batteryInitialCostPhp * CAPEX_BENCHMARKS.batteryReplacementRatio
                  ).toLocaleString()}
                  )
                </span>
              </div>
            </label>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50/40 dark:bg-white/[0.01] text-[11px] text-slate-400 flex items-center">
              No battery replacement required on grid-tie topologies.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
