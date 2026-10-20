// src/components/load-calculator/ActiveLoadList.tsx
import React from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { ApplianceIcon } from './ApplianceIcon';
import {
  Minus,
  Plus,
  Trash2,
  Zap,
  Clock,
  Sun,
  Moon,
  Info,
  Sparkles,
  Home,
  Building2,
  Trees,
} from 'lucide-react';

export const ActiveLoadList: React.FC = () => {
  const items = useApplianceLoadStore((s) => s.items);
  const updateItem = useApplianceLoadStore((s) => s.updateItem);
  const removeItem = useApplianceLoadStore((s) => s.removeItem);
  const loadProfile = useApplianceLoadStore((s) => s.loadProfile);

  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] p-1.5 bg-slate-100/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-[#0c1220] p-8 text-center space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Appliances Added Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Select presets above or load a pre-configured starter profile to size your solar system in seconds.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => loadProfile('small_home_wfh')}
              className="px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Small Home / WFH</span>
            </button>
            <button
              type="button"
              onClick={() => loadProfile('standard_family_home')}
              className="px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Load Family Home (2 ACs)</span>
            </button>
            <button
              type="button"
              onClick={() => loadProfile('offgrid_cabin_farm')}
              className="px-3.5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/15 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Trees className="w-3.5 h-3.5 text-emerald-500" />
              <span>Load Off-Grid Cabin / Farm</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] p-1.5 bg-slate-100/80 dark:bg-slate-900/50 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] uppercase font-bold tracking-[0.18em]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Step 3: Active Load List</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Configured Household Appliances ({items.length})
            </h2>
          </div>
        </div>

        {/* Load List Cards */}
        <div className="space-y-3">
          {items.map((item) => {
            const totalRunWatts = item.quantity * item.runningWatts;
            const peakItemWatts = Math.round(item.runningWatts * item.surgeMultiplier);
            const dailyItemWh = Math.round(totalRunWatts * item.hoursPerDay * item.dutyCycle);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  item.isCriticalBackup
                    ? 'border-amber-500/40 bg-amber-500/[0.03] dark:bg-amber-500/[0.02]'
                    : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20'
                }`}
              >
                {/* Top Row: Title, Surge Pill, Critical Toggle, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 bg-amber-500/10 border border-amber-500/25 dark:border-amber-500/20 flex items-center justify-center text-amber-500">
                      <ApplianceIcon
                        presetId={item.presetId}
                        category={item.category}
                        name={item.name}
                        className="w-5 h-5 text-amber-500"
                        strokeWidth={1.75}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                        {item.name}
                      </span>

                      {item.surgeMultiplier > 1.2 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          title={`Surge multiplier: ${item.surgeMultiplier}x (${peakItemWatts}W startup spike)`}
                        >
                          {item.surgeMultiplier}x Spike ({peakItemWatts}W)
                        </span>
                      )}

                      {item.dutyCycle < 1.0 && (
                        <span
                          className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                          title={`Compressor duty cycle factor: ${(item.dutyCycle * 100).toFixed(0)}% runtime`}
                        >
                          {(item.dutyCycle * 100).toFixed(0)}% duty cycle
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Critical Backup Toggle */}
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { isCriticalBackup: !item.isCriticalBackup })}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        item.isCriticalBackup
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs shadow-amber-500/25 ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={
                        item.isCriticalBackup
                          ? 'Protected load: Backed up during grid brownouts'
                          : 'Non-critical: Runs on solar and grid, does not require battery sizing'
                      }
                    >
                      <Zap className="w-3 h-3 stroke-[1.75]" />
                      <span>{item.isCriticalBackup ? 'Critical Backup' : 'Standard'}</span>
                    </button>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove appliance"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                  {/* Quantity Stepper (sm: 3 cols) */}
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Qty:</span>
                    <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Running Watts Input (sm: 3 cols) */}
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Watts:</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="20000"
                        value={item.runningWatts}
                        onChange={(e) => updateItem(item.id, { runningWatts: parseInt(e.target.value) || 1 })}
                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-hidden focus:ring-1 focus:ring-amber-500 pr-5"
                      />
                      <span className="absolute right-1.5 top-1 font-mono text-[10px] text-slate-400 pointer-events-none">
                        W
                      </span>
                    </div>
                  </div>

                  {/* Hours per Day Slider (sm: 3 cols) */}
                  <div className="sm:col-span-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Usage:
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {item.hoursPerDay} hrs/d
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.25"
                      max="24"
                      step="0.25"
                      value={item.hoursPerDay}
                      onChange={(e) => updateItem(item.id, { hoursPerDay: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Daytime Ratio Pills (sm: 3 cols) */}
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { daytimeRatio: 0.8 })}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                        item.daytimeRatio >= 0.7
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Used mostly during daytime (8 AM - 4 PM)"
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Day</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { daytimeRatio: 0.5 })}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                        item.daytimeRatio > 0.3 && item.daytimeRatio < 0.7
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Balanced 50/50 day and night use"
                    >
                      <span>50/50</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(item.id, { daytimeRatio: 0.2 })}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                        item.daytimeRatio <= 0.3
                          ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-500/30'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title="Used mostly during evening and night"
                    >
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span>Night</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Metric Footer */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span>
                    Continuous Draw:{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-bold">
                      {totalRunWatts.toLocaleString()}W
                    </strong>
                  </span>
                  <span>
                    Daily Energy:{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-bold">
                      {(dailyItemWh / 1000).toFixed(2)} kWh/day
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
