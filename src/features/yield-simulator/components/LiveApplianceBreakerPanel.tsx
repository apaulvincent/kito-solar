import React from 'react';
import { Clock, Plus, Power, RotateCcw, Zap } from 'lucide-react';
import { ApplianceItem } from '@/lib/applianceSizingEngine';
import { TelemetryTimeStep } from '../types/yieldSimulator';

interface LiveApplianceBreakerPanelProps {
  appliances: ApplianceItem[];
  currentStep: TelemetryTimeStep;
  inverterKw: number;
  disabledApplianceIds: string[];
  forcedOnApplianceIds: string[];
  shiftedToMiddayIds: string[];
  onToggleDisabled: (id: string) => void;
  onToggleForcedOn: (id: string) => void;
  onShiftToMidday: (id: string) => void;
  onResetOverrides: () => void;
  onAddQuickPreset: (presetId: string) => void;
}

export const QUICK_ADD_BREAKER_PRESETS: readonly { presetId: string; label: string }[] = [
  { presetId: 'ac_split_1hp_inverter', label: '+1HP Aircon' },
  { presetId: 'water_pump_submersible_1hp', label: '+1HP Pump' },
  { presetId: 'induction_cooker_1burner', label: '+2kW Cooker' },
];

export const LiveApplianceBreakerPanel: React.FC<LiveApplianceBreakerPanelProps> = ({
  appliances,
  currentStep,
  inverterKw,
  disabledApplianceIds,
  forcedOnApplianceIds,
  shiftedToMiddayIds,
  onToggleDisabled,
  onToggleForcedOn,
  onShiftToMidday,
  onResetOverrides,
  onAddQuickPreset,
}) => {
  const hasOverrides =
    disabledApplianceIds.length > 0 ||
    forcedOnApplianceIds.length > 0 ||
    shiftedToMiddayIds.length > 0;

  const loadPct =
    inverterKw > 0 ? Math.min(100, (currentStep.totalHomeLoadKw / inverterKw) * 100) : 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 flex flex-col justify-between gap-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)] h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Home Appliance Switchboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flip appliances on or off to test how your solar and battery respond
            </p>
          </div>

          {hasOverrides && (
            <button
              type="button"
              onClick={onResetOverrides}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {/* Live Inverter Capacity Meter */}
        <div className="rounded-xl bg-slate-50 dark:bg-[#131B2B] p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Active Load at {currentStep.timeLabel}
            </span>
            <span className="font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-400">
              {currentStep.totalHomeLoadKw.toFixed(2)} kW / {inverterKw.toFixed(1)} kW max
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentStep.isOverloadFault
                  ? 'bg-rose-500'
                  : loadPct > 80
                    ? 'bg-amber-500'
                    : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(3, loadPct)}%` }}
            />
          </div>
        </div>

        {/* Appliance List (No double borders — clean rows) */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[340px] overflow-y-auto pr-1">
          {appliances.map((item) => {
            const isDisabled = disabledApplianceIds.includes(item.id);
            const isForcedOn = forcedOnApplianceIds.includes(item.id);
            const isShifted = shiftedToMiddayIds.includes(item.id);
            const liveWatts = currentStep.applianceWatts[item.id] ?? 0;
            const liveKw = liveWatts / 1000;
            const isRunningNow = liveKw > 0.005 && !isDisabled;
            const totalNominalWatts = item.runningWatts * item.quantity;

            return (
              <div
                key={item.id}
                className={`py-3 flex items-center justify-between gap-3 transition-opacity ${
                  isDisabled ? 'opacity-45' : 'opacity-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isDisabled
                          ? 'bg-slate-300 dark:bg-slate-600'
                          : isRunningNow
                            ? 'bg-cyan-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-0.5 pl-4 text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                    <span>{totalNominalWatts}W rated</span>
                    {isRunningNow && (
                      <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                        • Drawing {liveKw.toFixed(2)} kW now
                      </span>
                    )}
                    {item.hoursPerDay < 18 && totalNominalWatts >= 250 && !isDisabled && (
                      <button
                        type="button"
                        onClick={() => onShiftToMidday(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium cursor-pointer transition-colors ${
                          isShifted
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 hover:text-amber-500'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                        <span>{isShifted ? 'Moved to Midday' : 'Move to Daytime'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleForcedOn(item.id)}
                    title="Force this appliance ON at the current time step"
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isForcedOn
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-300'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" strokeWidth={1.75} />
                      <span>{isForcedOn ? 'Testing' : 'Test Now'}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isDisabled}
                    onClick={() => onToggleDisabled(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                      isDisabled
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <Power className="w-3 h-3" strokeWidth={1.75} />
                    <span>{isDisabled ? 'OFF' : 'ON'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Quick Add Test Loads */}
      <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block">
          Quickly add a heavy appliance to test capacity:
        </span>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_ADD_BREAKER_PRESETS.map((preset) => (
            <button
              key={preset.presetId}
              type="button"
              onClick={() => onAddQuickPreset(preset.presetId)}
              className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] hover:bg-amber-500/15 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
