// src/features/yield-simulator/components/BrownoutStressTestCard.tsx
import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  PowerOff,
  Sliders,
} from 'lucide-react';
import {
  DailySimulationSummary,
  DiagnosticInsight,
} from '../types/yieldSimulator';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';

interface BrownoutStressTestCardProps {
  summary: DailySimulationSummary;
}

function formatHourOption(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return `${String(whole).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export const BrownoutStressTestCard: React.FC<BrownoutStressTestCardProps> = ({
  summary,
}) => {
  const brownout = useYieldSimulatorStore((s) => s.brownout);
  const setBrownout = useYieldSimulatorStore((s) => s.setBrownout);
  const instantBlackoutActive = useYieldSimulatorStore(
    (s) => s.instantBlackoutActive
  );
  const toggleInstantBlackout = useYieldSimulatorStore(
    (s) => s.toggleInstantBlackout
  );
  const setCurrentStepIndex = useYieldSimulatorStore(
    (s) => s.setCurrentStepIndex
  );
  const minReserveSocPercent = useYieldSimulatorStore(
    (s) => s.minReserveSocPercent
  );
  const batteryCapacityKwh = useYieldSimulatorStore(
    (s) => s.batteryCapacityKwh
  );
  const setSystemSpecs = useYieldSimulatorStore((s) => s.setSystemSpecs);
  const setSystemTopology = useYieldSimulatorStore((s) => s.setSystemTopology);
  const shiftFlexibleLoadsToMidday = useYieldSimulatorStore(
    (s) => s.shiftFlexibleLoadsToMidday
  );

  const appliances = useApplianceLoadStore((s) => s.items);

  const handleDiagnosticAction = (diag: DiagnosticInsight) => {
    if (diag.actionType === 'shift_loads_midday') {
      const flexibleIds = appliances
        .filter((a) => a.hoursPerDay <= 8 && !a.isCriticalBackup)
        .map((a) => a.id);
      shiftFlexibleLoadsToMidday(
        flexibleIds.length > 0 ? flexibleIds : appliances.slice(0, 2).map((a) => a.id)
      );
    } else if (diag.actionType === 'add_battery_module') {
      setSystemSpecs({ batteryCapacityKwh: batteryCapacityKwh + 5.12 });
    } else if (diag.actionType === 'switch_to_hybrid') {
      setSystemTopology('hybrid');
      setSystemSpecs({ batteryCapacityKwh: 10.24 });
    } else if (diag.actionType === 'shed_non_critical') {
      setBrownout({ shedNonCriticalLoads: true });
    }
  };

  const hourOptions = Array.from({ length: 48 }, (_, i) => i * 0.5);

  return (
    <section
      aria-label="Grid Brownout Stress Tester and Engineering Diagnostics"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
    >
      {/* Left (lg: 5 cols): Brownout Window Scheduler & Outage Stress Test Controls */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Grid Brownout & Islanding Stress Test
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule a utility outage window to verify overnight battery autonomy
            </p>
          </div>

          <span
            className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold border ${
              summary.brownoutSurvived
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
            }`}
          >
            {summary.brownoutSurvived
              ? 'OUTAGE SURVIVED'
              : `${summary.blackoutUnmetMinutes} MIN DARK`}
          </span>
        </div>

        {/* Scheduled Outage Toggle + Window Pickers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="enable-brownout-window"
              className="text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              Enable Scheduled Brownout Window
            </label>
            <button
              id="enable-brownout-window"
              type="button"
              role="switch"
              aria-checked={brownout.enabled}
              onClick={() => setBrownout({ enabled: !brownout.enabled })}
              className={`min-h-[36px] px-3 py-1 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                brownout.enabled
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {brownout.enabled ? 'WINDOW ACTIVE' : 'DISABLED'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="brownout-start-select"
                className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1"
              >
                OUTAGE START TIME
              </label>
              <select
                id="brownout-start-select"
                value={brownout.startHour}
                onChange={(e) =>
                  setBrownout({
                    enabled: true,
                    startHour: parseFloat(e.target.value),
                  })
                }
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>
                    {formatHourOption(h)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="brownout-end-select"
                className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1"
              >
                GRID RESTORE TIME
              </label>
              <select
                id="brownout-end-select"
                value={brownout.endHour}
                onChange={(e) =>
                  setBrownout({
                    enabled: true,
                    endHour: parseFloat(e.target.value),
                  })
                }
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>
                    {formatHourOption(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Automatic Non-Critical Load Shedding & Reserve Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Shed Non-Critical
                </span>
                <span className="text-[11px] text-slate-500">
                  Power EPS loads only
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={brownout.shedNonCriticalLoads}
                onClick={() =>
                  setBrownout({
                    shedNonCriticalLoads: !brownout.shedNonCriticalLoads,
                  })
                }
                className={`min-h-[34px] px-2.5 py-1 rounded-md font-mono text-[11px] font-bold cursor-pointer ${
                  brownout.shedNonCriticalLoads
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {brownout.shedNonCriticalLoads ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-2">
              <label
                htmlFor="reserve-soc-input"
                className="text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                Min Reserve SoC:
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="reserve-soc-input"
                  type="number"
                  min={10}
                  max={60}
                  step={5}
                  value={minReserveSocPercent}
                  onChange={(e) =>
                    setSystemSpecs({
                      minReserveSocPercent: parseInt(e.target.value, 10) || 20,
                    })
                  }
                  className="w-16 min-h-[34px] px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-right text-slate-900 dark:text-white"
                />
                <span className="font-mono text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* 1-Click Evening Outage Preset + Instant Blackout Trigger */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setBrownout({
                  enabled: true,
                  startHour: 18.0,
                  endHour: 23.5,
                  shedNonCriticalLoads: true,
                });
                setCurrentStepIndex(76); // Jump to 19:00 (7:00 PM) evening outage
              }}
              className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Test 6PM-11:30PM Evening Outage</span>
            </button>

            <button
              type="button"
              onClick={toggleInstantBlackout}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                instantBlackoutActive
                  ? 'bg-rose-600 text-white'
                  : 'border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <PowerOff className="w-3.5 h-3.5" />
              <span>{instantBlackoutActive ? 'Clear Blackout' : 'Outage Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right (lg: 7 cols): Smart Diagnostic Insights & "Unused Solar" Optimizer */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-4">
        <div className="pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Automated Engineering Diagnostics & Unused Solar Optimizer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Computed from the 96-step simulation run (clipping, zero-export curtailment, and backup margin)
          </p>
        </div>

        {summary.diagnostics.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                Balanced 24-Hour Dispatch (No Clipping or Curtailment Bottlenecks Detected)
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Solar PV harvest is fully absorbed by daytime household loads, battery charging, and net export without hitting inverter ceiling limits or battery protection floors.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.diagnostics.map((diag) => {
              const borderStyle =
                diag.severity === 'critical'
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : diag.severity === 'warning'
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : diag.severity === 'success'
                  ? 'border-emerald-500/35 bg-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50';

              const Icon =
                diag.severity === 'critical'
                  ? ShieldAlert
                  : diag.severity === 'warning'
                  ? AlertTriangle
                  : diag.severity === 'success'
                  ? CheckCircle2
                  : Info;

              const iconColor =
                diag.severity === 'critical'
                  ? 'text-rose-600 dark:text-rose-400'
                  : diag.severity === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : diag.severity === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-blue-600 dark:text-blue-400';

              return (
                <div
                  key={diag.id}
                  className={`p-3.5 rounded-xl border ${borderStyle} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {diag.title}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {diag.detail}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Recommendation: {diag.recommendation}
                      </p>
                    </div>
                  </div>

                  {diag.actionLabel && diag.actionType && (
                    <button
                      type="button"
                      onClick={() => handleDiagnosticAction(diag)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold whitespace-nowrap self-start sm:self-center cursor-pointer"
                    >
                      {diag.actionLabel}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
