// src/features/yield-simulator/components/DailyEnergyKpiRibbon.tsx
import React from 'react';
import { DailySimulationSummary } from '../types/yieldSimulator';

interface DailyEnergyKpiRibbonProps {
  summary: DailySimulationSummary;
  tariffPhpPerKwh: number;
}

export const DailyEnergyKpiRibbon: React.FC<DailyEnergyKpiRibbonProps> = ({
  summary,
  tariffPhpPerKwh,
}) => {
  const dailySavingsPhp = Math.max(
    0,
    (summary.totalLoadConsumedKwh - summary.gridImportedKwh) * tariffPhpPerKwh
  );

  return (
    <section
      aria-label="24-Hour Energy Balance Ledger"
      className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10"
    >
      <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Primary Focal Metric: 24-Hour Self-Sufficiency */}
          <div className="lg:pr-8 lg:border-r border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-mono font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              HOME ENERGY INDEPENDENCE
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
                {summary.selfSufficiencyPercent.toFixed(1)}%
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold">
                PHP {dailySavingsPhp.toFixed(0)}/day saved
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Share of 24-hour household load powered by solar and battery
            </p>
          </div>

          {/* 5 Supporting Telemetry Columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono">
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SOLAR HARVEST
              </div>
              <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {summary.totalHarvestedPvKwh.toFixed(2)} kWh
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Sky potential: {summary.totalPotentialPvKwh.toFixed(1)} kWh
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                CLIPPED / WASTED
              </div>
              <div
                className={`text-lg font-extrabold mt-0.5 ${
                  summary.totalClippedPvKwh > 0.5
                    ? 'text-amber-700 dark:text-amber-300'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {summary.totalClippedPvKwh.toFixed(2)} kWh
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {summary.curtailmentStartTime
                  ? `100% SoC @ ${summary.curtailmentStartTime}`
                  : 'Zero curtailment'}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                HOME CONSUMPTION
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.totalLoadConsumedKwh.toFixed(2)} kWh
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct solar: {summary.directSolarToLoadKwh.toFixed(1)} kWh
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                BATTERY CYCLING
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{summary.batteryChargedKwh.toFixed(1)} / -
                {summary.batteryDischargedKwh.toFixed(1)} kWh
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                SoC: {summary.minBatterySocPercent.toFixed(0)}% to{' '}
                {summary.maxBatterySocPercent.toFixed(0)}%
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                UTILITY GRID
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {summary.gridImportedKwh.toFixed(2)} kWh In
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Exported: {summary.gridExportedKwh.toFixed(2)} kWh
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
