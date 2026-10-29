// src/features/solar-mapper/components/SeasonalIrradianceChart.tsx
import React, { useState } from 'react';
import {
  Sun,
  CloudRain,
  TrendingUp,
  Thermometer,
  Zap,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { PshDesignBasis } from '../types/solarMapper';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';

export const SeasonalIrradianceChart: React.FC = () => {
  const {
    irradianceProfile,
    designBasis,
    setDesignBasis,
    getSelectedPsh,
  } = useSolarMapperStore();

  const setLoadCalculatorConfig = useApplianceLoadStore((s) => s.setConfig);
  const [synced, setSynced] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!irradianceProfile) return null;

  const {
    monthlySeries,
    annualAvgRawPsh,
    annualAvgEffectivePsh,
    worstMonth,
    bestMonth,
    p25EffectivePsh,
  } = irradianceProfile;

  // Max value for chart scaling (typically 6.5 or 7.0 PSH)
  const maxPsh = Math.max(6.5, ...monthlySeries.map((m) => Math.max(m.rawGhiKwhM2, m.effectivePsh)));

  const handleSyncToCalculators = (e: React.MouseEvent) => {
    e.stopPropagation();
    const selectedPsh = getSelectedPsh();
    setLoadCalculatorConfig({ peakSunHours: selectedPsh });
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  const basisOptions: {
    key: PshDesignBasis;
    title: string;
    pshValue: number;
    recommendedFor: string;
    description: string;
  }[] = [
    {
      key: 'annual_avg',
      title: 'Annual Average',
      pshValue: annualAvgEffectivePsh,
      recommendedFor: 'Grid-Tie (Net Metering)',
      description: 'Maximizes annual financial ROI by averaging all 12 dry & wet months.',
    },
    {
      key: 'p25_conservative',
      title: 'P25 Conservative',
      pshValue: p25EffectivePsh,
      recommendedFor: 'Hybrid Solar Storage',
      description: '25th percentile conservative design to prevent mid-year battery deficits.',
    },
    {
      key: 'worst_month',
      title: 'Monsoon Worst-Month',
      pshValue: worstMonth.effectivePsh,
      recommendedFor: 'Off-Grid (Essential)',
      description: `Guarantees autonomy during rainy monsoon seasons (${worstMonth.monthLabel} low).`,
    },
  ];

  const activeBasis = basisOptions.find((b) => b.key === designBasis);

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-xs transition-all overflow-hidden">
      {/* Collapsible Header (Closed by Default) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors focus:outline-hidden"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                12-Month Solar Irradiance Profile
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {getSelectedPsh()} PSH • {activeBasis?.title || 'Annual Average'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              20-Year NASA Climatology • Seasonal monsoon dips & ambient heat derating
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center flex-shrink-0">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {isExpanded ? 'Hide Monthly Breakdown' : 'Show Monthly Breakdown'}
          </span>
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-amber-500' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-6">
          {/* Top Sync Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a design basis to calibrate roof sizing against seasonal monsoon dips.
            </p>
            <button
              type="button"
              onClick={handleSyncToCalculators}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex-shrink-0 ${
                synced
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/15'
              }`}
            >
              {synced ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Applied {getSelectedPsh()} PSH to Calculators!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Apply {getSelectedPsh()} PSH to System Sizing</span>
                </>
              )}
            </button>
          </div>

          {/* Climatology Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Dry Peak Peak (Best)</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                {bestMonth.effectivePsh}{' '}
                <span className="text-xs font-normal text-slate-400">PSH ({bestMonth.monthLabel})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                <span>Monsoon Low (Worst)</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
                {worstMonth.effectivePsh}{' '}
                <span className="text-xs font-normal text-slate-400">PSH ({worstMonth.monthLabel})</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                <span>Avg Thermal Loss</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-rose-600 dark:text-rose-400">
                -
                {Math.round(
                  ((annualAvgRawPsh - annualAvgEffectivePsh) / annualAvgRawPsh) * 1000
                ) / 10}
                %
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Annual Effective</span>
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {annualAvgEffectivePsh}{' '}
                <span className="text-xs font-normal text-slate-400">hrs/day</span>
              </div>
            </div>
          </div>

          {/* 12-Month Interactive Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-slate-300 dark:bg-slate-700" />
                  <span>Raw Solar GHI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500" />
                  <span>Effective PSH (Derated)</span>
                </div>
              </div>
              <span className="font-mono text-[11px]">Peak Sun Hours (kWh/m²/day)</span>
            </div>

            <div className="h-44 flex items-end gap-1.5 sm:gap-2.5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              {monthlySeries.map((m) => {
                const rawHeightPct = (m.rawGhiKwhM2 / maxPsh) * 100;
                const effectiveHeightPct = (m.effectivePsh / maxPsh) * 100;
                const isLowest = m.monthLabel === worstMonth.monthLabel;
                const isHighest = m.monthLabel === bestMonth.monthLabel;

                return (
                  <div
                    key={m.monthIndex}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Micro Tooltip */}
                    <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none p-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-white shadow-xl z-20 whitespace-nowrap">
                      <div className="font-bold text-amber-400">{m.monthLabel}</div>
                      <div>Raw GHI: {m.rawGhiKwhM2} PSH</div>
                      <div>Effective: {m.effectivePsh} PSH</div>
                      <div>Temp: {m.ambientTempC}°C (Cell: {m.estimatedCellTempC}°C)</div>
                    </div>

                    {/* Bars */}
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Raw Bar */}
                      <div
                        style={{ height: `${rawHeightPct}%` }}
                        className="w-1/2 max-w-[12px] bg-slate-200 dark:bg-slate-700/60 rounded-t-sm transition-all group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                      />
                      {/* Effective Derated Bar */}
                      <div
                        style={{ height: `${effectiveHeightPct}%` }}
                        className={`w-1/2 max-w-[12px] rounded-t-sm transition-all ${
                          isLowest
                            ? 'bg-blue-500 shadow-xs shadow-blue-500/20'
                            : isHighest
                            ? 'bg-amber-400 shadow-xs shadow-amber-400/20'
                            : 'bg-amber-500 group-hover:bg-amber-400'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                      {m.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Design Basis Selector */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              System Sizing Design Basis
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {basisOptions.map((opt) => {
                const isSelected = designBasis === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDesignBasis(opt.key)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.title}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400">
                        {opt.pshValue} PSH
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 mb-1">
                      Best for: {opt.recommendedFor}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
