// src/components/load-calculator/SystemGoalSelector.tsx
import React, { useState } from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { PrimaryGoal, GridReliability } from '@/lib/applianceSizingEngine';
import {
  ShieldCheck,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sun,
  Sparkles,
  CircleDollarSign,
  BatteryCharging,
  Compass,
} from 'lucide-react';

const GOAL_OPTIONS: {
  id: PrimaryGoal;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'bill_savings',
    label: 'Lower Electric Bill',
    sub: 'Maximize daytime solar offset',
    icon: CircleDollarSign,
  },
  {
    id: 'bill_and_backup',
    label: 'Bill Savings + Backup',
    sub: 'Uninterrupted power during brownouts',
    icon: BatteryCharging,
  },
  {
    id: 'off_grid',
    label: '100% Independence',
    sub: 'Remote property or zero grid utility',
    icon: Compass,
  },
];

const GRID_OPTIONS: { id: GridReliability; label: string; hint: string }[] = [
  { id: 'stable', label: 'Stable Grid', hint: 'Rare or zero outages' },
  { id: 'occasional_outages', label: 'Occasional Brownouts', hint: '1–4 hrs monthly' },
  { id: 'frequent_outages', label: 'Frequent Outages', hint: '4–12+ hrs or regular blackouts' },
  { id: 'no_grid', label: 'No Grid Connection', hint: 'Off-grid location' },
];

export const SystemGoalSelector: React.FC = () => {
  const config = useApplianceLoadStore((s) => s.config);
  const setConfig = useApplianceLoadStore((s) => s.setConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="rounded-[1.75rem] p-1.5 bg-slate-100/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* Header with Micro-Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-[0.18em]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Step 1: System Objectives</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Primary Goal & Local Grid Condition
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Solar & Battery Factors</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Primary Goal Selector Cards */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              What do you want your solar system to achieve?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = config.primaryGoal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setConfig({ primaryGoal: opt.id })}
                    className={`relative p-3.5 rounded-2xl text-left border transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/[0.07] ring-1 ring-amber-500/40 shadow-xs'
                        : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <opt.icon className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Reliability Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Grid Reliability in Your Area
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GRID_OPTIONS.map((g) => {
                const isSelected = config.gridReliability === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setConfig({ gridReliability: g.id })}
                    className={`px-3 py-2.5 rounded-xl text-left border transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20'
                    }`}
                  >
                    <div className="text-xs truncate">{g.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {g.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced Engineering Inputs */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                  <span>Peak Sun Hours (PSH)</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {config.peakSunHours} hrs/day
                  </span>
                </label>
                <input
                  type="range"
                  min="3.0"
                  max="6.0"
                  step="0.1"
                  value={config.peakSunHours}
                  onChange={(e) => setConfig({ peakSunHours: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>3.0h (Rainy)</span>
                  <span>4.5h (PH Avg)</span>
                  <span>6.0h (Arid)</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Standard Panel Wattage
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([550, 580, 600] as const).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setConfig({ panelWattage: w })}
                      className={`py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        config.panelWattage === w
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {w}W
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Simultaneity Factor
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfig({ simultaneityFactor: 1.0 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors truncate ${
                      config.simultaneityFactor === 1.0
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title="100% Worst-Case Peak"
                  >
                    100% Peak
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ simultaneityFactor: 0.75 })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors truncate ${
                      config.simultaneityFactor === 0.75
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title="75% Diverse Duty Factor"
                  >
                    75% Diverse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
