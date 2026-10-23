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

  if (appliances.length === 0) {
    return (
      <div className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-6 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Smart Breaker Panel (Live Appliance Tray)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No household appliances are currently configured in your Load Calculator, so simulated AC load is 0.00 kW. Load a starter household profile below to test circuit breakers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => loadProfile('small_home_wfh')}
              className="min-h-[42px] px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Load WFH Home Profile</span>
            </button>
            <button
              type="button"
              onClick={() => loadProfile('standard_family_home')}
              className="min-h-[42px] px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
              <span>Load Family Home (2 ACs)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Smart Breaker Panel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flip circuit breakers ON/OFF or test a live load spike at{' '}
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {timeLabel}
              </span>
            </p>
          </div>

          {hasOverrides && (
            <button
              type="button"
              onClick={resetBreakerOverrides}
              className="min-h-[36px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
              <span>Reset Breakers</span>
            </button>
          )}
        </div>

        {/* Quick High-Wattage Test Injectors */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mr-1">
            Add Heavy Load:
          </span>
          <button
            type="button"
            onClick={() => addPreset('induction_cooker_1800w')}
            className="min-h-[32px] px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 hover:ring-amber-500/40 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-amber-600" strokeWidth={1.75} />
            <span>1,800W Induction</span>
          </button>
          <button
            type="button"
            onClick={() => addPreset('water_pump_0_5hp')}
            className="min-h-[32px] px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 hover:ring-amber-500/40 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-amber-600" strokeWidth={1.75} />
            <span>750W Pump</span>
          </button>
          <button
            type="button"
            onClick={() => addPreset('washing_machine_auto')}
            className="min-h-[32px] px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 hover:ring-amber-500/40 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all duration-300 cursor-pointer"
          >
            <Plus className="w-3 h-3 text-amber-600" strokeWidth={1.75} />
            <span>500W Washer</span>
          </button>
        </div>

        {/* MCB Breaker List */}
        <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
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
                className={`p-3.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between gap-3 ${
                  isTrippedOff
                    ? 'bg-slate-50/50 dark:bg-slate-900/20 ring-1 ring-slate-900/5 dark:ring-white/5 opacity-55'
                    : isDrawingPower
                    ? 'bg-amber-500/[0.05] dark:bg-amber-500/[0.04] ring-1 ring-amber-500/35'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 ring-1 ring-slate-900/5 dark:ring-white/5'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {item.name}
                    </span>
                    {item.isCriticalBackup && (
                      <span
                        title="Critical backup load (stays powered during brownout)"
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      >
                        <ShieldCheck className="w-3 h-3" strokeWidth={1.75} />
                        <span>EPS</span>
                      </span>
                    )}
                    {isShifted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
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
                      Now @ {timeLabel}: {liveWatts}W
                    </span>
                  </div>
                </div>

                {/* Right: Spike Test + Breaker Switch */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleApplianceForceOn(item.id)}
                    title={
                      isForcedOn
                        ? 'Return appliance to scheduled hours'
                        : 'Force appliance ON right now to test instant load spike'
                    }
                    className={`min-h-[36px] px-3 py-1 rounded-full font-mono text-[10px] font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer ${
                      isForcedOn
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" strokeWidth={1.75} />
                      <span>{isForcedOn ? 'FORCED ON' : 'RUN NOW'}</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isTrippedOff}
                    aria-label={`Toggle ${item.name} circuit breaker`}
                    onClick={() => toggleApplianceBreaker(item.id)}
                    className={`min-h-[36px] px-3 py-1 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer ${
                      !isTrippedOff
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{!isTrippedOff ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
