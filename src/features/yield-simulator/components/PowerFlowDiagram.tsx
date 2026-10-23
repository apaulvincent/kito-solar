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

/**
 * Formats hours (decimal) into "Xh Ym" for battery Time-to-Full / Time-to-Reserve readout.
 */
function formatRuntimeHours(hoursDecimal: number): string {
  if (!Number.isFinite(hoursDecimal) || hoursDecimal <= 0) return '0h 00m';
  if (hoursDecimal > 48) return '>48h';
  const totalMins = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
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
      ? Number(
          (385 - (step.cellTempC - 25) * 1.15).toFixed(0)
        )
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
    batteryTimeLabel = `Time to 100%: ${formatRuntimeHours(hrs)}`;
  } else if (hasBattery && isDischarging) {
    const remainingToReserveKwh = Math.max(
      0,
      ((step.batterySocPercent - minReserveSocPercent) / 100) *
        batteryCapacityKwh
    );
    const hrs = remainingToReserveKwh / Math.max(0.05, absBattKw);
    batteryTimeLabel = `Time to ${minReserveSocPercent}% Reserve: ${formatRuntimeHours(hrs)}`;
  }

  // Battery gauge color based on PRD 3.1 (>50% Emerald, 25%-50% Amber, <=Reserve Crimson)
  const batteryColorHex =
    step.batterySocPercent <= minReserveSocPercent + 2
      ? '#DC2626'
      : step.batterySocPercent < 50
      ? '#D97706'
      : '#059669';

  // Particle animation duration helper (seconds): faster when kW is higher; 0 when idle
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

  // Sun position along daytime sky arc (06:00 to 18:00)
  const isDaytime = step.hourDecimal >= 5.75 && step.hourDecimal <= 18.0;
  const sunProgress = isDaytime
    ? Math.max(0, Math.min(1, (step.hourDecimal - 5.75) / 12.25))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-4">
      {/* Header Bar with Live Status & Instant Grid Blackout Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            4-Node SCADA Power Flow Topology
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live directional busbar telemetry at{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {step.timeLabel}
            </span>{' '}
            (Particle velocity scales with active kW)
          </p>
        </div>

        {/* Interactive Trigger Grid Blackout Switch */}
        <button
          type="button"
          onClick={toggleInstantBlackout}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-2 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
            !step.isGridOnline
              ? 'border-rose-600 bg-rose-600 text-white'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
          }`}
        >
          <PowerOff className="w-3.5 h-3.5" />
          <span>
            {instantBlackoutActive
              ? 'Restore Utility Grid'
              : 'Trigger Grid Blackout'}
          </span>
        </button>
      </div>

      {/* Edge Case 1: Grid-Tie Anti-Islanding Shutdown Banner */}
      {step.isAntiIslandingTripped && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
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
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Switch to Hybrid + 10.24 kWh
          </button>
        </div>
      )}

      {/* Edge Case 3: Off-Grid Inverter Overload Fault Banner */}
      {step.isOverloadFault && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>INVERTER OVERLOAD FAULT (Load &gt; {inverterKw.toFixed(1)} kW Rated):</strong>{' '}
              Active off-grid appliance draw exceeds inverter rating. Shed a high-wattage load in the Breaker Panel or step up inverter size.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSystemSpecs({ inverterKw: inverterKw + 2 })}
            className="min-h-[36px] px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Upgrade to {(inverterKw + 2).toFixed(0)} kW Inverter
          </button>
        </div>
      )}

      {/* Central SVG Animated Busbar Canvas + 4 Corner Telemetry Nodes */}
      <div className="relative rounded-xl border border-slate-200/90 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#090D16] p-3 sm:p-4">
        {/* Top Row: Node 1 (Solar PV) and Node 3 (Home Load) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* NODE 1: SOLAR PV ARRAY (TOP-LEFT) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    NODE 01 · SOLAR PV ARRAY
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {pvArrayKwp.toFixed(2)} kWp Rated ({mpptCount}x MPPT)
                  </div>
                </div>
              </div>

              {step.clippedPvKw > 0.08 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {step.zeroExportClippedKw > 0.05
                    ? `ZERO-EXPORT THROTTLED (-${step.clippedPvKw.toFixed(2)} kW)`
                    : `MPPT CLIPPED (-${step.clippedPvKw.toFixed(2)} kW)`}
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="font-mono">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {step.actualPvKw.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-1">
                  kW ({Math.round(step.actualPvKw * 1000)} W)
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {pvPercentOfRated.toFixed(0)}% of kWp
              </span>
            </div>

            {/* Progress bar + Sun Arc */}
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${Math.min(100, pvPercentOfRated)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
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
                <span className="text-slate-400 block text-[10px]">SUN ELEV</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {isDaytime
                    ? `${Math.round(Math.sin(sunProgress * Math.PI) * 78)}°`
                    : 'Night (0°)'}
                </strong>
              </div>
            </div>
          </div>

          {/* NODE 3: HOME APPLIANCE LOAD (TOP-RIGHT) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    NODE 03 · HOUSEHOLD AC LOAD
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Critical + Non-Critical Sub-Panels
                  </div>
                </div>
              </div>

              {step.unmetLoadKw > 0.02 ? (
                <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 font-mono text-[10px] font-bold text-rose-700 dark:text-rose-300">
                  UNMET: {step.unmetLoadKw.toFixed(2)} kW
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  100% SERVED
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="font-mono">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {step.activeLoadKw.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-1">
                  kW ({Math.round(step.activeLoadKw * 1000)} W)
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                {((step.activeLoadKw / inverterKw) * 100).toFixed(0)}% Inv Load
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{
                  width: `${
                    step.totalHomeLoadKw > 0
                      ? (step.criticalLoadKw / Math.max(step.totalHomeLoadKw, inverterKw)) * 100
                      : 0
                  }%`,
                }}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-150"
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

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  CRITICAL BACKUP (EPS)
                </span>
                <strong className="text-amber-700 dark:text-amber-400">
                  {Math.round(step.criticalLoadKw * 1000)} W (
                  {step.criticalLoadKw.toFixed(2)} kW)
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  NON-CRITICAL LOAD
                </span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {Math.round(step.nonCriticalLoadKw * 1000)} W (
                  {step.nonCriticalLoadKw.toFixed(2)} kW)
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER SCADA SVG BUSBAR & HYBRID INVERTER HUB */}
        <div className="my-2 relative flex items-center justify-center">
          <svg
            viewBox="0 0 680 180"
            className="w-full h-40 sm:h-44 overflow-visible"
            role="img"
            aria-label="Animated 4-node solar inverter busbar schematic"
          >
            {/* Static Busbar Tracks */}
            {/* Track 1: PV (Top-Left) -> Center Inverter */}
            <path
              d="M 140 16 L 140 90 L 265 90"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Track 2: Battery (Bottom-Left) <-> Center Inverter */}
            <path
              d="M 140 164 L 140 90 L 265 90"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Track 3: Center Inverter -> Home Load (Top-Right) */}
            <path
              d="M 415 90 L 540 90 L 540 16"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Track 4: Center Inverter <-> Utility Grid (Bottom-Right) */}
            <path
              d="M 415 90 L 540 90 L 540 164"
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Animated Particle Stream 1: Solar PV -> Inverter */}
            {pvDuration > 0 && (
              <path
                d="M 140 16 L 140 90 L 265 90"
                fill="none"
                stroke="#D97706"
                strokeWidth="4"
                strokeDasharray="8 14"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="22"
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
                    ? 'M 265 90 L 140 90 L 140 164'
                    : 'M 140 164 L 140 90 L 265 90'
                }
                fill="none"
                stroke={isCharging ? '#059669' : '#D97706'}
                strokeWidth="4"
                strokeDasharray="8 14"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="22"
                  to="0"
                  dur={`${battDuration}s`}
                  repeatCount="indefinite"
                />
              </path>
            )}

            {/* Animated Particle Stream 3: Inverter -> Home Load */}
            {loadDuration > 0 && (
              <path
                d="M 415 90 L 540 90 L 540 16"
                fill="none"
                stroke="#2563EB"
                strokeWidth="4"
                strokeDasharray="8 14"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="22"
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
                    ? 'M 540 164 L 540 90 L 415 90'
                    : 'M 415 90 L 540 90 L 540 164'
                }
                fill="none"
                stroke={step.gridImportKw > 0.01 ? '#DC2626' : '#059669'}
                strokeWidth="4"
                strokeDasharray="8 14"
                strokeLinecap="round"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="22"
                  to="0"
                  dur={`${gridDuration}s`}
                  repeatCount="indefinite"
                />
              </path>
            )}

            {/* Branch Power Callout Pills along Busbars */}
            <g transform="translate(152, 46)">
              <rect
                x="0"
                y="0"
                width="78"
                height="20"
                rx="4"
                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
              />
              <text
                x="39"
                y="13.5"
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-amber-600 dark:fill-amber-400"
              >
                PV {step.actualPvKw.toFixed(2)}kW
              </text>
            </g>

            <g transform="translate(152, 114)">
              <rect
                x="0"
                y="0"
                width="86"
                height="20"
                rx="4"
                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
              />
              <text
                x="43"
                y="13.5"
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-emerald-600 dark:fill-emerald-400"
              >
                {hasBattery
                  ? `${step.batteryPowerKw >= 0 ? '+' : ''}${step.batteryPowerKw.toFixed(2)}kW`
                  : 'NO BATT'}
              </text>
            </g>

            <g transform="translate(450, 46)">
              <rect
                x="0"
                y="0"
                width="78"
                height="20"
                rx="4"
                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
              />
              <text
                x="39"
                y="13.5"
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-blue-600 dark:fill-blue-400"
              >
                AC {step.activeLoadKw.toFixed(2)}kW
              </text>
            </g>

            <g transform="translate(442, 114)">
              <rect
                x="0"
                y="0"
                width="86"
                height="20"
                rx="4"
                className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-slate-700"
              />
              <text
                x="43"
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
                  : 'GRID 0.0kW'}
              </text>
            </g>
          </svg>

          {/* Central Hybrid Inverter Hub Overlay Card */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c1220] px-4 py-2.5 shadow-sm text-center min-w-[168px]">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  {systemTopology === 'grid_tie'
                    ? 'GRID-TIE INVERTER'
                    : 'HYBRID INVERTER HUB'}
                </span>
              </div>
              <div className="text-sm font-mono font-extrabold text-slate-900 dark:text-white mt-0.5">
                {inverterKw.toFixed(1)} kW Rated AC
              </div>
              <div className="text-[10px] font-mono font-semibold mt-0.5">
                {!step.isGridOnline ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    UPS BACKUP MODE (&lt;10ms)
                  </span>
                ) : isZeroExport ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    CT ZERO-EXPORT ACTIVE
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

        {/* Bottom Row: Node 2 (LiFePO4 Battery Bank) and Node 4 (Utility Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* NODE 2: LIFEPO4 BATTERY BANK (BOTTOM-LEFT) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border"
                  style={{
                    borderColor: `${batteryColorHex}40`,
                    backgroundColor: `${batteryColorHex}15`,
                    color: batteryColorHex,
                  }}
                >
                  <BatteryCharging className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    NODE 02 · LIFEPO4 BATTERY BANK
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {hasBattery
                      ? `${batteryCapacityKwh.toFixed(2)} kWh (Min Reserve ${minReserveSocPercent}%)`
                      : 'No Battery Configured (Grid-Tie)'}
                  </div>
                </div>
              </div>

              {hasBattery && (
                <span
                  className="px-2 py-0.5 rounded font-mono text-[10px] font-bold border"
                  style={{
                    borderColor: `${batteryColorHex}40`,
                    backgroundColor: `${batteryColorHex}15`,
                    color: batteryColorHex,
                  }}
                >
                  {isCharging
                    ? 'CHARGING'
                    : isDischarging
                    ? 'DISCHARGING'
                    : 'IDLE / STANDBY'}
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

                {/* Dynamic SoC Fill Gauge */}
                <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full transition-all duration-150"
                    style={{
                      width: `${Math.max(0, Math.min(100, step.batterySocPercent))}%`,
                      backgroundColor: batteryColorHex,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-slate-400 block text-[10px]">
                      PACK VOLTAGE
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {step.batteryVoltageV.toFixed(1)} V DC
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
                      STORED ENERGY
                    </span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {((step.batterySocPercent / 100) * batteryCapacityKwh).toFixed(2)}{' '}
                      kWh
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                <span>
                  Grid-Tie topology has 0 kWh backup storage. Excess solar exports or clips.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSystemTopology('hybrid');
                    setSystemSpecs({ batteryCapacityKwh: 10.24 });
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white font-mono text-[11px] font-bold hover:bg-emerald-500 whitespace-nowrap cursor-pointer"
                >
                  + Add 10.24 kWh LiFePO4
                </button>
              </div>
            )}
          </div>

          {/* NODE 4: UTILITY GRID (BOTTOM-RIGHT) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    step.isGridOnline
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <UtilityPole className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    NODE 04 · UTILITY FEEDER GRID
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    230V AC 60Hz Distribution Service
                  </div>
                </div>
              </div>

              {/* Real status indicator (R-31: marks actual online/offline grid state, no endless pulse) */}
              <span
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1.5 ${
                  step.isGridOnline
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    step.isGridOnline ? 'bg-emerald-500' : 'bg-rose-600'
                  }`}
                />
                <span>
                  {step.isGridOnline ? 'GRID ONLINE' : 'BROWNOUT OFFLINE'}
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
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      kW Importing ({Math.round(step.gridImportKw * 1000)} W)
                    </span>
                  </>
                ) : step.gridExportKw > 0.01 ? (
                  <>
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      -{step.gridExportKw.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ml-1">
                      kW Exporting ({Math.round(step.gridExportKw * 1000)} W)
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>230V / 60Hz</span>
                </span>
              )}
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
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

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  IMPORT FROM UTILITY
                </span>
                <strong className="text-rose-600 dark:text-rose-400">
                  {Math.round(step.gridImportKw * 1000)} W
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  EXPORT TO UTILITY
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
  );
};
