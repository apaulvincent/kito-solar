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
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Focal Metric: Daily Self-Sufficiency */}
        <div className="lg:pr-6 lg:border-r border-slate-200 dark:border-slate-800 flex items-baseline gap-3">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              24-HOUR SELF-SUFFICIENCY
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
                {summary.selfSufficiencyPercent.toFixed(1)}%
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                PHP {dailySavingsPhp.toFixed(0)}/day avoided grid cost
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Telemetry Ledger Columns */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 font-mono">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SOLAR HARVESTED
            </div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {summary.totalHarvestedPvKwh.toFixed(2)} kWh
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Potential: {summary.totalPotentialPvKwh.toFixed(1)} kWh
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CLIPPED / CURTAILED
            </div>
            <div
              className={`text-base font-extrabold mt-0.5 ${
                summary.totalClippedPvKwh > 0.5
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {summary.totalClippedPvKwh.toFixed(2)} kWh
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {summary.curtailmentStartTime
                ? `Full at ${summary.curtailmentStartTime}`
                : 'No zero-export waste'}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              HOUSEHOLD LOAD
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {summary.totalLoadConsumedKwh.toFixed(2)} kWh
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Direct PV: {summary.directSolarToLoadKwh.toFixed(1)} kWh
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              BATTERY CYCLING
            </div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{summary.batteryChargedKwh.toFixed(1)} / -
              {summary.batteryDischargedKwh.toFixed(1)} kWh
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              SoC Range: {summary.minBatterySocPercent.toFixed(0)}%-
              {summary.maxBatterySocPercent.toFixed(0)}%
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              UTILITY GRID NET
            </div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              {summary.gridImportedKwh.toFixed(2)} kWh In
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Exported: {summary.gridExportedKwh.toFixed(2)} kWh
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
