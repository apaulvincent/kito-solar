// src/components/load-calculator/InverterStressMeter.tsx
import React from 'react';
import { SizingResult } from '@/lib/applianceSizingEngine';
import { Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  result: SizingResult;
}

export const InverterStressMeter: React.FC<Props> = ({ result }) => {
  const {
    continuousRunningWatts,
    peakSystemSurgeWatts,
    recommendedInverterKw,
    inverterLoadPercentage,
    inverterSurgePercentage,
    largestSurgeApplianceName,
    largestSurgeSpikeWatts,
  } = result;

  const invContinuousWatts = recommendedInverterKw * 1000;
  const invSurgeWatts = invContinuousWatts * 2.0;

  const getBarColor = (pct: number) => {
    if (pct > 90) return 'bg-rose-500';
    if (pct > 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColor = (pct: number) => {
    if (pct > 90) return 'text-rose-600 dark:text-rose-400';
    if (pct > 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
          <Gauge className="w-4 h-4 text-amber-500" />
          <span>Inverter Load & Surge Stress Meter</span>
        </div>
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {recommendedInverterKw} kW Rating
        </span>
      </div>

      {/* Bar 1: Continuous Running Load */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 dark:text-slate-400">
            Continuous Load:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {continuousRunningWatts.toLocaleString()}W
            </strong>
          </span>
          <span className={`font-mono font-bold ${getTextColor(inverterLoadPercentage)}`}>
            {inverterLoadPercentage}% continuous
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${getBarColor(
              inverterLoadPercentage
            )}`}
            style={{ width: `${Math.min(100, Math.max(0, inverterLoadPercentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0W</span>
          <span>Target: &lt;80% continuous</span>
          <span>{invContinuousWatts.toLocaleString()}W max</span>
        </div>
      </div>

      {/* Bar 2: Peak Starting Inrush Surge */}
      <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 dark:text-slate-400">
            Peak Startup Surge:{' '}
            <strong className="font-mono text-slate-900 dark:text-white">
              {peakSystemSurgeWatts.toLocaleString()}W
            </strong>
          </span>
          <span className={`font-mono font-bold ${getTextColor(inverterSurgePercentage)}`}>
            {inverterSurgePercentage}% surge limit
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${getBarColor(
              inverterSurgePercentage
            )}`}
            style={{ width: `${Math.min(100, Math.max(0, inverterSurgePercentage))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0W</span>
          <span>Peak withstand (2.0x)</span>
          <span>{invSurgeWatts.toLocaleString()}W</span>
        </div>
      </div>

      {/* Highest Surge Spike Callout */}
      {largestSurgeApplianceName && largestSurgeSpikeWatts > 100 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
            <strong>{largestSurgeApplianceName}</strong> introduces a{' '}
            <strong className="font-mono text-amber-700 dark:text-amber-400">
              +{largestSurgeSpikeWatts.toLocaleString()}W
            </strong>{' '}
            inductive startup spike. The recommended {recommendedInverterKw} kW inverter safely absorbs this inrush without tripping.
          </div>
        </div>
      )}
    </div>
  );
};
