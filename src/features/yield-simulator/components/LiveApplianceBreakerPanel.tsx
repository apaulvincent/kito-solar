// src/features/yield-simulator/components/LiveApplianceBreakerPanel.tsx
import React from 'react';
import {
  Power,
  RotateCcw,
  Plus,
  Home,
  Building2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { StepLoadBreakdown } from '../utils/loadProfileDistributor';

interface LiveApplianceBreakerPanelProps {
  currentLoadBreakdown: StepLoadBreakdown;
  timeLabel: string;
}

export const LiveApplianceBreakerPanel: React.FC<
  LiveApplianceBreakerPanelProps
> = ({ currentLoadBreakdown, timeLabel }) => {
  const appliances = useApplianceLoadStore((s) => s.items);
  const loadProfile = useApplianceLoadStore((s) => s.loadProfile);
  const addPreset = useApplianceLoadStore((s) => s.addPreset);

  const disabledApplianceIds = useYieldSimulatorStore(
    (s) => s.disabledApplianceIds
  );
  const forcedOnApplianceIds = useYieldSimulatorStore(
    (s) => s.forcedOnApplianceIds
  );
  const shiftedToMiddayIds = useYieldSimulatorStore(
    (s) => s.shiftedToMiddayIds
  );
  const toggleApplianceBreaker = useYieldSimulatorStore(
    (s) => s.toggleApplianceBreaker
  );
  const toggleApplianceForceOn = useYieldSimulatorStore(
    (s) => s.toggleApplianceForceOn
  );
  const resetBreakerOverrides = useYieldSimulatorStore(
    (s) => s.resetBreakerOverrides
  );

  const hasOverrides =
    disabledApplianceIds.length > 0 ||
    forcedOnApplianceIds.length > 0 ||
    shiftedToMiddayIds.length > 0;

  // R-27: Explicit Empty State explaining why household load is 0W and giving 1-click actions
  if (appliances.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Smart Breaker Panel (MCB Load Tray)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No household appliances are currently configured in your Load Calculator, so simulated AC load is 0.00 kW. Load a starter household profile below to test circuit breakers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadProfile('small_home_wfh')}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Load WFH Home Profile</span>
          </button>
          <button
            type="button"
            onClick={() => loadProfile('standard_family_home')}
            className="min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Family Home (2 ACs)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Smart Breaker Panel (Live Load Toggles)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Flip miniature circuit breakers ON/OFF or force-run heavy loads at{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {timeLabel}
            </span>
          </p>
        </div>

        {hasOverrides && (
          <button
            type="button"
            onClick={resetBreakerOverrides}
            className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Breakers</span>
          </button>
        )}
      </div>

      {/* Quick High-Wattage Test Injectors */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
          Quick Spike Test:
        </span>
        <button
          type="button"
          onClick={() => addPreset('induction_cooker_1800w')}
          className="min-h-[32px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/50 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-amber-600" />
          <span>1,800W Induction</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset('water_pump_0_5hp')}
          className="min-h-[32px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/50 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-amber-600" />
          <span>750W Water Pump</span>
        </button>
        <button
          type="button"
          onClick={() => addPreset('washing_machine_auto')}
          className="min-h-[32px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/50 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-amber-600" />
          <span>500W Washer</span>
        </button>
      </div>

      {/* MCB Breaker List */}
      <div className="space-y-2 max-h-[395px] overflow-y-auto pr-1">
        {appliances.map((item) => {
          const isTrippedOff = disabledApplianceIds.includes(item.id);
          const isForcedOn = forcedOnApplianceIds.includes(item.id);
          const isShifted = shiftedToMiddayIds.includes(item.id);
          const liveWatts = currentLoadBreakdown.applianceWatts[item.id] ?? 0;
          const ratedWatts = item.quantity * item.runningWatts;
          const isDrawingPower = liveWatts > 0;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                isTrippedOff
                  ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/20 opacity-60'
                  : isDrawingPower
                  ? 'border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-500/[0.03]'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
              }`}
            >
              {/* Left: Breaker Status & Appliance Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    {item.name}
                  </span>
                  {item.isCriticalBackup && (
                    <span
                      title="Critical backup load (stays powered during brownout)"
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>EPS</span>
                    </span>
                  )}
                  {isShifted && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      12:30 PM Solar Shift
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Rated: {ratedWatts}W</span>
                  <span>·</span>
                  <span
                    className={
                      isDrawingPower
                        ? 'font-bold text-amber-700 dark:text-amber-400'
                        : ''
                    }
                  >
                    Live @ {timeLabel}: {liveWatts}W
                  </span>
                </div>
              </div>

              {/* Right: Force-Run Now Button & MCB Breaker Toggle */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleApplianceForceOn(item.id)}
                  title={
                    isForcedOn
                      ? 'Return appliance to automatic time-of-day schedule'
                      : 'Force appliance ON across all steps to test instant load spike'
                  }
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg border font-mono text-[10px] font-bold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                    isForcedOn
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>{isForcedOn ? 'FORCED ON' : 'TEST SPIKE'}</span>
                  </span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={!isTrippedOff}
                  aria-label={`Toggle ${item.name} circuit breaker`}
                  onClick={() => toggleApplianceBreaker(item.id)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                    !isTrippedOff
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{!isTrippedOff ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
