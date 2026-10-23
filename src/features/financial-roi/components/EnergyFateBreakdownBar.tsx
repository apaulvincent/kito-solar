// src/features/financial-roi/components/EnergyFateBreakdownBar.tsx
import { AlertTriangle, ArrowUpRight, Sun } from 'lucide-react';
import { useFinancialRoiStore, useFinancialRoiSimulation } from '../store/useFinancialRoiStore';

export function EnergyFateBreakdownBar() {
  const setActiveScenarioComparison = useFinancialRoiStore((s) => s.setActiveScenarioComparison);
  const { activeSim, config } = useFinancialRoiSimulation();

  const { energySplitPercent, dailyKwhBreakdown, strategy } = activeSim;
  const isZeroExport = strategy === 'zero_export';
  const hasHighClipping = isZeroExport && energySplitPercent.clippedWasted > 15;

  const potentialRecoveredAnnualPhp = Math.round(
    dailyKwhBreakdown.clippedWastedKwh * 365 * config.exportCreditRatePhp
  );

  const fateBuckets = [
    {
      label: 'Direct Daytime',
      percent: energySplitPercent.directDaytime,
      kwh: dailyKwhBreakdown.directSelfUseKwh,
      valuation: `₱${config.retailRatePhp.toFixed(2)}/kWh`,
      dotClass: 'bg-emerald-500',
      barClass: 'bg-emerald-500',
    },
    {
      label: 'LiFePO4 Night',
      percent: energySplitPercent.batteryNighttime,
      kwh: dailyKwhBreakdown.batteryStoredKwh,
      valuation: `₱${config.retailRatePhp.toFixed(2)}/kWh`,
      dotClass: 'bg-blue-500',
      barClass: 'bg-blue-500',
    },
    {
      label: 'Grid Exported',
      percent: energySplitPercent.gridExported,
      kwh: dailyKwhBreakdown.gridExportedKwh,
      valuation: `₱${config.exportCreditRatePhp.toFixed(2)}/kWh`,
      dotClass: 'bg-indigo-500',
      barClass: 'bg-indigo-500',
    },
    {
      label: 'Curtailed / Clipped',
      percent: energySplitPercent.clippedWasted,
      kwh: dailyKwhBreakdown.clippedWastedKwh,
      valuation: '₱0.00/kWh',
      dotClass: 'bg-rose-500',
      barClass: 'bg-rose-500',
    },
  ];

  return (
    <div className="h-full p-1.5 sm:p-2 rounded-[2rem] bg-slate-900/[0.03] dark:bg-white/[0.03] ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] shadow-[0_24px_48px_-12px_rgba(15,23,42,0.05)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="h-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] bg-white dark:bg-[#0B0F17] p-5 sm:p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04] flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20">
                <Sun className="w-3 h-3" />
                Energy Dispatch Fate
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Daily Solar Energy Fate &amp; Utilization
              </h3>
            </div>

            <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-white/[0.04] text-slate-900 dark:text-white ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08]">
              {dailyKwhBreakdown.generationKwh} kWh / day Yield
            </div>
          </div>

          {/* Machined Recessed Segmented Bar */}
          <div className="p-2 rounded-2xl bg-slate-100/90 dark:bg-white/[0.03] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.06]">
            <div className="h-5 w-full rounded-xl overflow-hidden flex gap-0.5 bg-slate-200/60 dark:bg-slate-800/60">
              {fateBuckets.map(
                (bucket) =>
                  bucket.percent > 0 && (
                    <div
                      key={bucket.label}
                      style={{ width: `${bucket.percent}%` }}
                      className={`${bucket.barClass} transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}
                      title={`${bucket.label}: ${bucket.percent}% (${bucket.kwh} kWh/day)`}
                    />
                  )
              )}
            </div>
          </div>

          {/* 4-Card Fate Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {fateBuckets.map((bucket) => (
              <div
                key={bucket.label}
                className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.05] dark:ring-white/[0.05] space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${bucket.dotClass} shrink-0`} />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 truncate">
                    {bucket.label}
                  </span>
                </div>
                <div className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  {bucket.percent}%
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{bucket.kwh} kWh</span>
                  <span>{bucket.valuation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Curtailment Recovery Callout */}
        {hasHighClipping ? (
          <div className="p-4 rounded-2xl bg-amber-500/[0.07] dark:bg-amber-500/[0.08] ring-1 ring-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  {energySplitPercent.clippedWasted}% of your midday generation ({dailyKwhBreakdown.clippedWastedKwh} kWh/day) is throttled
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Zero-Export clips excess daytime solar. Enabling ERC Net Metering recovers{' '}
                  <strong className="font-mono font-bold text-amber-700 dark:text-amber-300">
                    +₱{potentialRecoveredAnnualPhp.toLocaleString()}/yr
                  </strong>{' '}
                  in utility credits.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-6">
              <button
                type="button"
                onClick={() => setActiveScenarioComparison('net_metering')}
                className="group inline-flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1 text-xs font-bold bg-amber-500 text-slate-950 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer"
              >
                <span>Switch to Net Metering</span>
                <span className="w-5 h-5 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScenarioComparison('hybrid_battery')}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 ring-1 ring-slate-900/10 dark:ring-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span>Store in LiFePO4 Battery</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-900/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Zero solar curtailment detected under active topology</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">100% Harvest Utilized</span>
          </div>
        )}
      </div>
    </div>
  );
}
