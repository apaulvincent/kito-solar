// src/features/yield-simulator/components/BrownoutStressTestCard.tsx
import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  PowerOff,
  Sliders,
  ArrowUpRight,
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
        flexibleIds.length > 0
          ? flexibleIds
          : appliances.slice(0, 2).map((a) => a.id)
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
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* Left (lg: 5 cols): Brownout Window Scheduler */}
      <div className="lg:col-span-5 rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-5">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Brownout Stress Test
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Schedule a utility power outage to verify overnight battery backup
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full font-mono text-[11px] font-bold ${
                summary.brownoutSurvived
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/40'
              }`}
            >
              {summary.brownoutSurvived
                ? 'OUTAGE SURVIVED'
                : `${summary.blackoutUnmetMinutes} MIN DARK`}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="enable-brownout-window"
                className="text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                Enable Scheduled Outage Window
              </label>
              <button
                id="enable-brownout-window"
                type="button"
                role="switch"
                aria-checked={brownout.enabled}
                onClick={() => setBrownout({ enabled: !brownout.enabled })}
                className={`min-h-[36px] px-3.5 py-1 rounded-full font-mono text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                  brownout.enabled
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {brownout.enabled ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="brownout-start-select"
                  className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1"
                >
                  OUTAGE START
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
                  className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white"
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
                  GRID RESTORE
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
                  className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white"
                >
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {formatHourOption(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 ring-1 ring-slate-900/5 dark:ring-white/5 flex items-center justify-between gap-2">
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
                  className={`min-h-[34px] px-3 py-1 rounded-full font-mono text-[11px] font-bold cursor-pointer ${
                    brownout.shedNonCriticalLoads
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {brownout.shedNonCriticalLoads ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 ring-1 ring-slate-900/5 dark:ring-white/5 flex items-center justify-between gap-2">
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
                        minReserveSocPercent:
                          parseInt(e.target.value, 10) || 20,
                      })
                    }
                    className="w-16 min-h-[34px] px-2 py-1 rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-right text-slate-900 dark:text-white"
                  />
                  <span className="font-mono text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBrownout({
                    enabled: true,
                    startHour: 18.0,
                    endHour: 23.5,
                    shedNonCriticalLoads: true,
                  });
                  setCurrentStepIndex(76);
                }}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                <span>Test 6PM-11:30PM Outage</span>
              </button>

              <button
                type="button"
                onClick={toggleInstantBlackout}
                className={`min-h-[42px] px-4 py-2 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
                  instantBlackoutActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/35 hover:bg-rose-500/20'
                }`}
              >
                <PowerOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>
                  {instantBlackoutActive ? 'Clear Blackout' : 'Outage Now'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right (lg: 7 cols): Automated Engineering Diagnostics & Unused Solar Optimizer */}
      <div className="lg:col-span-7 rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Automated Diagnostics &amp; Unused Solar Optimizer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Actionable recommendations detected across the 96-step daily simulation
            </p>
          </div>

          {summary.diagnostics.length === 0 ? (
            <div className="rounded-2xl ring-1 ring-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  Balanced 24-Hour Dispatch (No Clipping or Curtailment Bottlenecks)
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Solar PV harvest is fully absorbed by daytime household loads, battery charging, and net export without hitting inverter ceiling limits or battery protection floors.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.diagnostics.map((diag) => {
                const ringStyle =
                  diag.severity === 'critical'
                    ? 'ring-1 ring-rose-500/40 bg-rose-500/10'
                    : diag.severity === 'warning'
                    ? 'ring-1 ring-amber-500/40 bg-amber-500/10'
                    : diag.severity === 'success'
                    ? 'ring-1 ring-emerald-500/35 bg-emerald-500/10'
                    : 'ring-1 ring-slate-900/5 dark:ring-white/10 bg-slate-50/70 dark:bg-slate-900/50';

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
                    className={`p-4 rounded-2xl ${ringStyle} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`}
                        strokeWidth={1.75}
                      />
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {diag.title}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {diag.detail}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Action: {diag.recommendation}
                        </p>
                      </div>
                    </div>

                    {diag.actionLabel && diag.actionType && (
                      <button
                        type="button"
                        onClick={() => handleDiagnosticAction(diag)}
                        className="group min-h-[40px] pl-4 pr-1.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-2 whitespace-nowrap self-start sm:self-center transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
                      >
                        <span>{diag.actionLabel}</span>
                        <span className="w-6 h-6 rounded-full bg-slate-950/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-950" strokeWidth={1.75} />
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
