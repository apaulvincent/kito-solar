// src/features/yield-simulator/components/PowerFlowDiagram.tsx
import React from 'react';
import {
  Sun,
  BatteryCharging,
  Cpu,
  Home,
  UtilityPole,
  AlertTriangle,
  PowerOff,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import {
  SystemTopologyMode,
  TelemetryTimeStep,
} from '../types/yieldSimulator';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';

interface PowerFlowDiagramProps {
  step: TelemetryTimeStep;
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  minReserveSocPercent: number;
  systemTopology: SystemTopologyMode;
  isZeroExport: boolean;
}

function formatRuntimeHours(hoursDecimal: number): string {
  if (!Number.isFinite(hoursDecimal) || hoursDecimal <= 0) return '0h 00m';
  if (hoursDecimal > 48) return '>48h';
  const totalMins = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Generates an intuitive, plain-English summary of what the inverter is doing at the current 15-min step.
 */
function buildLiveFlowExplanation(
  step: TelemetryTimeStep,
  hasBattery: boolean
): string {
  if (step.isAntiIslandingTripped) {
    return `At ${step.timeLabel}, utility grid power is down. Because this is a Grid-Tie inverter without a battery, IEEE 1547 anti-islanding protection has shut down solar generation (0.00 kW).`;
  }
  if (!step.isGridOnline) {
    const battDisKw = step.batteryPowerKw < 0 ? Math.abs(step.batteryPowerKw) : 0;
    return `At ${step.timeLabel}, utility grid is offline. The hybrid inverter is running in <10ms UPS island mode, supplying ${step.activeLoadKw.toFixed(
      2
    )} kW of load from ${step.actualPvKw.toFixed(2)} kW solar and ${battDisKw.toFixed(
      2
    )} kW battery discharge (${step.batterySocPercent.toFixed(0)}% SoC).`;
  }
  if (step.actualPvKw > 0.05) {
    const parts: string[] = [
      `At ${step.timeLabel}, solar panels are generating ${step.actualPvKw.toFixed(2)} kW`,
    ];
    if (step.batteryPowerKw > 0.05) {
      parts.push(
        `charging the battery with +${step.batteryPowerKw.toFixed(2)} kW (${step.batterySocPercent.toFixed(0)}% SoC)`
      );
    } else if (step.batteryPowerKw < -0.05) {
      parts.push(
        `assisted by ${Math.abs(step.batteryPowerKw).toFixed(2)} kW from the battery`
      );
    }
    if (step.gridExportKw > 0.05) {
      parts.push(`and exporting ${step.gridExportKw.toFixed(2)} kW to the grid`);
    } else if (step.zeroExportClippedKw > 0.05) {
      parts.push(
        `while throttling ${step.zeroExportClippedKw.toFixed(2)} kW due to Zero-Export`
      );
    }
    return `${parts.join(', ')}.`;
  }
  if (hasBattery && step.batteryPowerKw < -0.05) {
    return `At ${step.timeLabel} (nighttime), your LiFePO4 battery is discharging ${Math.abs(
      step.batteryPowerKw
    ).toFixed(2)} kW to power the house (${step.batterySocPercent.toFixed(
      0
    )}% SoC remaining).`;
  }
  return `At ${step.timeLabel}, solar output is 0.00 kW and the utility grid is supplying ${step.gridImportKw.toFixed(
    2
  )} kW to the house.`;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  step,
  pvArrayKwp,
  inverterKw,
  batteryCapacityKwh,
  minReserveSocPercent,
  systemTopology,
  isZeroExport,
}) => {
  const instantBlackoutActive = useYieldSimulatorStore(
    (s) => s.instantBlackoutActive
  );
  const toggleInstantBlackout = useYieldSimulatorStore(
    (s) => s.toggleInstantBlackout
  );
  const setSystemTopology = useYieldSimulatorStore((s) => s.setSystemTopology);
  const setSystemSpecs = useYieldSimulatorStore((s) => s.setSystemSpecs);

  const hasBattery = systemTopology !== 'grid_tie' && batteryCapacityKwh > 0.1;

  // Derived Node 1 (Solar PV) electrical string metrics
  const pvPercentOfRated =
    pvArrayKwp > 0 ? Math.min(100, (step.actualPvKw / pvArrayKwp) * 100) : 0;
  const mpptCount = inverterKw >= 5 ? 2 : 1;
  const pvStringVoltageV =
    step.actualPvKw > 0.02
      ? Number((385 - (step.cellTempC - 25) * 1.15).toFixed(0))
      : step.irradianceWm2 > 30
      ? 410
      : 0;
  const pvCurrentPerMpptA =
    pvStringVoltageV > 0
      ? Number(
          ((step.actualPvKw * 1000) / mpptCount / pvStringVoltageV).toFixed(1)
        )
      : 0;

  // Derived Node 2 (LiFePO4 Battery) runtime estimate
  const isCharging = step.batteryPowerKw > 0.01;
  const isDischarging = step.batteryPowerKw < -0.01;
  const absBattKw = Math.abs(step.batteryPowerKw);

  let batteryTimeLabel = 'Standby (0W)';
  if (hasBattery && isCharging) {
    const remainingToFullKwh =
      ((100 - step.batterySocPercent) / 100) * batteryCapacityKwh;
    const hrs = remainingToFullKwh / Math.max(0.05, absBattKw * 0.95);
    batteryTimeLabel = `Full in ${formatRuntimeHours(hrs)}`;
  } else if (hasBattery && isDischarging) {
    const remainingToReserveKwh = Math.max(
      0,
      ((step.batterySocPercent - minReserveSocPercent) / 100) *
        batteryCapacityKwh
    );
    const hrs = remainingToReserveKwh / Math.max(0.05, absBattKw);
    batteryTimeLabel = `${formatRuntimeHours(hrs)} to ${minReserveSocPercent}% floor`;
  }

  const batteryColorHex =
    step.batterySocPercent <= minReserveSocPercent + 2
      ? '#DC2626'
      : step.batterySocPercent < 50
      ? '#D97706'
      : '#059669';

  const getAnimDurationSec = (powerKw: number): number => {
    const absKw = Math.abs(powerKw);
    if (absKw < 0.02) return 0;
    const normalized = Math.min(1, absKw / Math.max(2, inverterKw));
    return Number((2.4 - normalized * 1.65).toFixed(2));
  };

  const pvDuration = getAnimDurationSec(step.actualPvKw);
  const battDuration = getAnimDurationSec(step.batteryPowerKw);
  const loadDuration = getAnimDurationSec(step.activeLoadKw);
  const gridNetKw =
    step.gridImportKw > 0.01
      ? step.gridImportKw
      : step.gridExportKw > 0.01
      ? -step.gridExportKw
      : 0;
  const gridDuration = getAnimDurationSec(gridNetKw);

  const isDaytime = step.hourDecimal >= 5.75 && step.hourDecimal <= 18.0;
  const sunProgress = isDaytime
    ? Math.max(0, Math.min(1, (step.hourDecimal - 5.75) / 12.25))
    : 0;

  const liveNarrative = buildLiveFlowExplanation(step, hasBattery);

  return (
    <div className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-5">
        {/* Top Header + Instant Blackout Trigger Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live 4-Node Power Flow Topology
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time energy routing across Solar MPPT, LiFePO4 Battery, Home Load, and Grid
            </p>
          </div>

          <button
            type="button"
            onClick={toggleInstantBlackout}
            className={`group min-h-[42px] pl-4 pr-2 py-1.5 rounded-full font-mono text-xs font-bold flex items-center gap-2.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
              !step.isGridOnline
                ? 'bg-rose-600 text-white'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/35 hover:bg-rose-500/20'
            }`}
          >
            <span>
              {instantBlackoutActive
                ? 'Restore Utility Grid'
                : 'Simulate Grid Blackout'}
            </span>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                !step.isGridOnline ? 'bg-white/20' : 'bg-rose-500/15'
              }`}
            >
              <PowerOff className="w-3.5 h-3.5" strokeWidth={1.75} />
            </span>
          </button>
        </div>

        {/* Intuitive Plain-English Live Status Strip */}
        <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong className="font-bold text-slate-900 dark:text-white mr-1.5">
            What is happening now:
          </strong>
          {liveNarrative}
        </div>

        {/* Edge Case 1: Grid-Tie Anti-Islanding Shutdown Banner */}
        {step.isAntiIslandingTripped && (
          <div
            role="alert"
            className="rounded-2xl ring-1 ring-rose-500/40 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <span className="font-bold block">
                  Anti-Islanding Shutdown Active (0.00 kW Output)
                </span>
                <span>
                  Standard Grid-Tie inverters must shut down immediately during a utility blackout to protect linemen. Switch to a Hybrid inverter + battery to keep solar running during brownouts.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSystemTopology('hybrid');
                setSystemSpecs({ batteryCapacityKwh: 10.24 });
              }}
              className="group min-h-[38px] pl-4 pr-1.5 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Switch to Hybrid + 10.24 kWh</span>
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </span>
            </button>
          </div>
        )}

        {/* Edge Case 3: Off-Grid Inverter Overload Fault Banner */}
        {step.isOverloadFault && (
          <div
            role="alert"
            className="rounded-2xl ring-1 ring-rose-500/40 bg-rose-500/10 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" strokeWidth={1.75} />
              <span>
                <strong>INVERTER OVERLOAD FAULT (Load &gt; {inverterKw.toFixed(1)} kW Rated):</strong>{' '}
                Active off-grid appliance draw exceeds inverter rating. Turn off a high-wattage load in the Breaker Panel or upgrade the inverter.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSystemSpecs({ inverterKw: inverterKw + 2 })}
              className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Upgrade to {(inverterKw + 2).toFixed(0)} kW Inverter
            </button>
          </div>
        )}

        {/* Central Recessed Studio Tray Holding the 4 Nodes & Animated SVG Busbar */}
        <div className="rounded-2xl bg-[#F8FAFC] dark:bg-[#090D16] ring-1 ring-slate-900/5 dark:ring-white/10 p-3.5 sm:p-5">
          {/* Top Row: Node 1 (Solar PV) and Node 3 (Home Load) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
            {/* NODE 1: SOLAR PV ARRAY */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/5 dark:ring-white/10 p-4 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/12 ring-1 ring-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Sun className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      SOLAR PV ARRAY
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {pvArrayKwp.toFixed(2)} kWp ({mpptCount}x MPPT)
                    </div>
                  </div>
                </div>

                {step.clippedPvKw > 0.08 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-500/30 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    {step.zeroExportClippedKw > 0.05
                      ? `THROTTLED -${step.clippedPvKw.toFixed(2)} kW`
                      : `CLIPPED -${step.clippedPvKw.toFixed(2)} kW`}
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="font-mono">
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {step.actualPvKw.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1.5">
                    kW ({Math.round(step.actualPvKw * 1000)} W)
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {pvPercentOfRated.toFixed(0)}% of kWp
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ width: `${Math.min(100, pvPercentOfRated)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">STRING V/I</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {pvStringVoltageV}V / {pvCurrentPerMpptA}A
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CELL TEMP</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {step.cellTempC.toFixed(1)}°C
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SUN ANGLE</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {isDaytime
                      ? `${Math.round(Math.sin(sunProgress * Math.PI) * 78)}°`
                      : 'Night'}
                  </strong>
                </div>
              </div>
            </div>

            {/* NODE 3: HOME APPLIANCE LOAD */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/5 dark:ring-white/10 p-4 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/12 ring-1 ring-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Home className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      HOME APPLIANCES
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Critical &amp; Standard Circuits
                    </div>
                  </div>
                </div>

                {step.unmetLoadKw > 0.02 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 ring-1 ring-rose-500/30 font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300">
                    UNMET {step.unmetLoadKw.toFixed(2)} kW
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    POWERED
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="font-mono">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    {step.activeLoadKw.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500 ml-1.5">
                    kW ({Math.round(step.activeLoadKw * 1000)} W)
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                  {((step.activeLoadKw / inverterKw) * 100).toFixed(0)}% Inv Cap
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-amber-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    width: `${
                      step.totalHomeLoadKw > 0
                        ? (step.criticalLoadKw /
                            Math.max(step.totalHomeLoadKw, inverterKw)) *
                          100
                        : 0
                    }%`,
                  }}
                />
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{
                    width: `${
                      step.totalHomeLoadKw > 0
                        ? (step.nonCriticalLoadKw /
                            Math.max(step.totalHomeLoadKw, inverterKw)) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    CRITICAL BACKUP
                  </span>
                  <strong className="text-amber-700 dark:text-amber-400">
                    {Math.round(step.criticalLoadKw * 1000)} W
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    NON-CRITICAL
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Math.round(step.nonCriticalLoadKw * 1000)} W
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER SCADA SVG BUSBAR & HYBRID INVERTER HUB */}
          <div className="my-2 relative flex items-center justify-center">
            <svg
              viewBox="0 0 680 176"
              className="w-full h-38 sm:h-42 overflow-visible"
              role="img"
              aria-label="Animated 4-node solar inverter busbar schematic"
            >
              {/* Static Busbar Tracks */}
              <path
                d="M 140 14 L 140 88 L 260 88"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 140 162 L 140 88 L 260 88"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 420 88 L 540 88 L 540 14"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 420 88 L 540 88 L 540 162"
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Animated Particle Stream 1: Solar PV -> Inverter */}
              {pvDuration > 0 && (
                <path
                  d="M 140 14 L 140 88 L 260 88"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="3.5"
                  strokeDasharray="7 13"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur={`${pvDuration}s`}
                    repeatCount="indefinite"
                  />
                </path>
              )}

              {/* Animated Particle Stream 2: Battery <-> Inverter */}
              {hasBattery && battDuration > 0 && (
                <path
                  d={
                    isCharging
                      ? 'M 260 88 L 140 88 L 140 162'
                      : 'M 140 162 L 140 88 L 260 88'
                  }
                  fill="none"
                  stroke={isCharging ? '#059669' : '#D97706'}
                  strokeWidth="3.5"
                  strokeDasharray="7 13"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur={`${battDuration}s`}
                    repeatCount="indefinite"
                  />
                </path>
              )}

              {/* Animated Particle Stream 3: Inverter -> Home Load */}
              {loadDuration > 0 && (
                <path
                  d="M 420 88 L 540 88 L 540 14"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeDasharray="7 13"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur={`${loadDuration}s`}
                    repeatCount="indefinite"
                  />
                </path>
              )}

              {/* Animated Particle Stream 4: Utility Grid <-> Inverter */}
              {step.isGridOnline && gridDuration > 0 && (
                <path
                  d={
                    step.gridImportKw > 0.01
                      ? 'M 540 162 L 540 88 L 420 88'
                      : 'M 420 88 L 540 88 L 540 162'
                  }
                  fill="none"
                  stroke={step.gridImportKw > 0.01 ? '#DC2626' : '#059669'}
                  strokeWidth="3.5"
                  strokeDasharray="7 13"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur={`${gridDuration}s`}
                    repeatCount="indefinite"
                  />
                </path>
              )}

              {/* Branch Power Callouts */}
              <g transform="translate(152, 44)">
                <rect
                  x="0"
                  y="0"
                  width="80"
                  height="20"
                  rx="10"
                  className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                />
                <text
                  x="40"
                  y="13.5"
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-amber-600 dark:fill-amber-400"
                >
                  +{step.actualPvKw.toFixed(2)} kW
                </text>
              </g>

              <g transform="translate(152, 112)">
                <rect
                  x="0"
                  y="0"
                  width="84"
                  height="20"
                  rx="10"
                  className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                />
                <text
                  x="42"
                  y="13.5"
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400"
                >
                  {hasBattery
                    ? `${step.batteryPowerKw >= 0 ? '+' : ''}${step.batteryPowerKw.toFixed(2)} kW`
                    : '0.00 kW'}
                </text>
              </g>

              <g transform="translate(448, 44)">
                <rect
                  x="0"
                  y="0"
                  width="80"
                  height="20"
                  rx="10"
                  className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                />
                <text
                  x="40"
                  y="13.5"
                  textAnchor="middle"
                  className="text-[10px] font-mono font-bold fill-blue-600 dark:fill-blue-400"
                >
                  {step.activeLoadKw.toFixed(2)} kW
                </text>
              </g>

              <g transform="translate(444, 112)">
                <rect
                  x="0"
                  y="0"
                  width="84"
                  height="20"
                  rx="10"
                  className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
                />
                <text
                  x="42"
                  y="13.5"
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${
                    !step.isGridOnline || step.gridImportKw > 0.01
                      ? 'fill-rose-600 dark:fill-rose-400'
                      : 'fill-emerald-600 dark:fill-emerald-400'
                  }`}
                >
                  {!step.isGridOnline
                    ? 'ISLANDED'
                    : step.gridImportKw > 0.01
                    ? `IN ${step.gridImportKw.toFixed(2)}kW`
                    : step.gridExportKw > 0.01
                    ? `EX ${step.gridExportKw.toFixed(2)}kW`
                    : '0.00 kW'}
                </text>
              </g>
            </svg>

            {/* Central Hybrid Inverter Hub Enclosure */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto rounded-2xl p-1 bg-slate-200/80 dark:bg-slate-800/80 ring-1 ring-slate-900/10 dark:ring-white/15">
                <div className="rounded-[calc(1rem-0.25rem)] bg-white dark:bg-[#0c1220] px-4 py-2.5 text-center min-w-[172px]">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Cpu className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                    <span>
                      {systemTopology === 'grid_tie'
                        ? 'GRID-TIE INVERTER'
                        : 'HYBRID INVERTER'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {inverterKw.toFixed(1)} kW Rated AC
                  </div>
                  <div className="text-[10px] font-mono font-semibold mt-0.5">
                    {!step.isGridOnline ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        UPS BACKUP (&lt;10ms)
                      </span>
                    ) : isZeroExport ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ZERO-EXPORT CT
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        GRID-SYNCHRONIZED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Node 2 (LiFePO4 Battery Bank) and Node 4 (Utility Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
            {/* NODE 2: LIFEPO4 BATTERY BANK */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/5 dark:ring-white/10 p-4 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center ring-1"
                    style={{
                      backgroundColor: `${batteryColorHex}15`,
                      color: batteryColorHex,
                    }}
                  >
                    <BatteryCharging className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      LIFEPO4 BATTERY BANK
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {hasBattery
                        ? `${batteryCapacityKwh.toFixed(2)} kWh (Reserve ${minReserveSocPercent}%)`
                        : 'No Battery Configured'}
                    </div>
                  </div>
                </div>

                {hasBattery && (
                  <span
                    className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: `${batteryColorHex}15`,
                      color: batteryColorHex,
                    }}
                  >
                    {isCharging
                      ? 'CHARGING'
                      : isDischarging
                      ? 'DISCHARGING'
                      : 'STANDBY'}
                  </span>
                )}
              </div>

              {hasBattery ? (
                <>
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="font-mono">
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: batteryColorHex }}
                      >
                        {step.batterySocPercent.toFixed(0)}%
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">
                        SoC ({step.batteryPowerKw >= 0 ? '+' : ''}
                        {Math.round(step.batteryPowerKw * 1000)} W)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {batteryTimeLabel}
                    </span>
                  </div>

                  <div className="relative w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                      style={{
                        width: `${Math.max(0, Math.min(100, step.batterySocPercent))}%`,
                        backgroundColor: batteryColorHex,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        VOLTAGE
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {step.batteryVoltageV.toFixed(1)} V
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        C-RATE
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {step.batteryCRate.toFixed(2)} C
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        STORED
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {(
                          (step.batterySocPercent / 100) *
                          batteryCapacityKwh
                        ).toFixed(2)}{' '}
                        kWh
                      </strong>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                  <span>
                    Grid-Tie system has no battery backup. Add LiFePO4 storage for night &amp; brownout power.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSystemTopology('hybrid');
                      setSystemSpecs({ batteryCapacityKwh: 10.24 });
                    }}
                    className="px-3 py-1 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-bold hover:bg-emerald-500 whitespace-nowrap cursor-pointer"
                  >
                    + Add 10.24 kWh
                  </button>
                </div>
              )}
            </div>

            {/* NODE 4: UTILITY GRID */}
            <div className="rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/5 dark:ring-white/10 p-4 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl ring-1 flex items-center justify-center ${
                      step.isGridOnline
                        ? 'bg-emerald-500/12 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/12 ring-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <UtilityPole className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      UTILITY FEEDER GRID
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      230V AC 60Hz Distribution
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold flex items-center gap-1.5 ${
                    step.isGridOnline
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      step.isGridOnline ? 'bg-emerald-500' : 'bg-rose-600'
                    }`}
                  />
                  <span>
                    {step.isGridOnline ? 'GRID ONLINE' : 'BROWNOUT'}
                  </span>
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div className="font-mono">
                  {!step.isGridOnline ? (
                    <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                      0.00 kW (Open Relay)
                    </span>
                  ) : step.gridImportKw > 0.01 ? (
                    <>
                      <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                        +{step.gridImportKw.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">
                        kW Importing
                      </span>
                    </>
                  ) : step.gridExportKw > 0.01 ? (
                    <>
                      <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        -{step.gridExportKw.toFixed(2)}
                      </span>
                      <span className="text-xs font-bold text-slate-500 ml-1.5">
                        kW Exporting
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">
                      0.00 kW (Zero Net Flow)
                    </span>
                  )}
                </div>
                {step.isGridOnline && (
                  <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.75} />
                    <span>230V</span>
                  </span>
                )}
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    step.gridImportKw > 0.01 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      ((step.gridImportKw + step.gridExportKw) /
                        Math.max(1, inverterKw)) *
                        100
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    IMPORTING
                  </span>
                  <strong className="text-rose-600 dark:text-rose-400">
                    {Math.round(step.gridImportKw * 1000)} W
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    EXPORTING
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {Math.round(step.gridExportKw * 1000)} W
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
