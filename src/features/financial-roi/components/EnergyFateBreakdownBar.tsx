// src/features/financial-roi/components/EnergyFateBreakdownBar.tsx
import { AlertTriangle, ArrowRight, Sun, Battery, CornerUpRight, Scissors } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';

export function EnergyFateBreakdownBar() {
  const activeSim = useFinancialRoiStore((s) => s.getActiveSimulation());
  const setActiveScenarioComparison = useFinancialRoiStore((s) => s.setActiveScenarioComparison);
  const config = useFinancialRoiStore((s) => s.config);

  const { energySplitPercent, dailyKwhBreakdown, strategy } = activeSim;
  const isZeroExport = strategy === 'zero_export';
  const hasHighClipping = isZeroExport && energySplitPercent.clippedWasted > 15;

  // Potential recovered savings if clipped energy were captured
  const potentialRecoveredAnnualPhp = Math.round(
    dailyKwhBreakdown.clippedWastedKwh * 365 * config.exportCreditRatePhp
  );

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Solar Energy Fate & Utilization
          </h3>
          <p className="text-xs text-slate-500">
            How your {dailyKwhBreakdown.generationKwh} kWh/day solar generation is consumed, stored, exported, or throttled
          </p>
        </div>
      </div>

      {/* 100% Horizontal Stacked Bar */}
      <div className="space-y-1.5">
        <div className="h-5 w-full rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800">
          {energySplitPercent.directDaytime > 0 && (
            <div
              style={{ width: `${energySplitPercent.directDaytime}%` }}
              className="bg-emerald-500 transition-all duration-300 relative group"
              title={`Direct Daytime: ${energySplitPercent.directDaytime}% (${dailyKwhBreakdown.directSelfUseKwh} kWh)`}
            />
          )}
          {energySplitPercent.batteryNighttime > 0 && (
            <div
              style={{ width: `${energySplitPercent.batteryNighttime}%` }}
              className="bg-blue-500 transition-all duration-300 relative group"
              title={`Battery Stored: ${energySplitPercent.batteryNighttime}% (${dailyKwhBreakdown.batteryStoredKwh} kWh)`}
            />
          )}
          {energySplitPercent.gridExported > 0 && (
            <div
              style={{ width: `${energySplitPercent.gridExported}%` }}
              className="bg-indigo-500 transition-all duration-300 relative group"
              title={`Grid Exported: ${energySplitPercent.gridExported}% (${dailyKwhBreakdown.gridExportedKwh} kWh)`}
            />
          )}
          {energySplitPercent.clippedWasted > 0 && (
            <div
              style={{ width: `${energySplitPercent.clippedWasted}%` }}
              className="bg-rose-500 transition-all duration-300 relative group"
              title={`Clipped / Throttled: ${energySplitPercent.clippedWasted}% (${dailyKwhBreakdown.clippedWastedKwh} kWh)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              Direct Use: <strong className="font-mono text-slate-900 dark:text-white">{energySplitPercent.directDaytime}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              Battery: <strong className="font-mono text-slate-900 dark:text-white">{energySplitPercent.batteryNighttime}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              Exported: <strong className="font-mono text-slate-900 dark:text-white">{energySplitPercent.gridExported}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-400 truncate">
              Clipped: <strong className="font-mono text-slate-900 dark:text-white">{energySplitPercent.clippedWasted}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Warning for Zero-Export Clipping */}
      {hasHighClipping && (
        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] dark:bg-amber-500/[0.07] text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                {energySplitPercent.clippedWasted}% of your daytime solar ({dailyKwhBreakdown.clippedWastedKwh} kWh/day) is being curtailed
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                Under Zero-Export, unused midday solar is throttled by your inverter limiter.
                Switching to ERC Net Metering could capture approximately{' '}
                <strong className="font-mono font-bold text-slate-900 dark:text-white">
                  ₱{potentialRecoveredAnnualPhp.toLocaleString()} / year
                </strong>{' '}
                in exported utility bill credits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 pl-6">
            <button
              type="button"
              onClick={() => setActiveScenarioComparison('net_metering')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
            >
              <span>Model ERC Net Metering</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveScenarioComparison('hybrid_battery')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <span>Model Hybrid Battery</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
