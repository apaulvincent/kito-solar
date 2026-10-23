// src/features/yield-simulator/components/TelemetryChartSuite.tsx
import React, { useRef } from 'react';
import { Sun, BatteryCharging } from 'lucide-react';
import {
  BrownoutSchedule,
  TelemetryTimeStep,
  SystemTopologyMode,
} from '../types/yieldSimulator';
import { isHourInWindow } from '../utils/yieldSimulationEngine';

interface TelemetryChartSuiteProps {
  steps: TelemetryTimeStep[];
  currentStepIndex: number;
  inverterKw: number;
  systemTopology: SystemTopologyMode;
  brownoutSchedule: BrownoutSchedule;
  onSelectStep: (stepIndex: number) => void;
}

export const TelemetryChartSuite: React.FC<TelemetryChartSuiteProps> = ({
  steps,
  currentStepIndex,
  inverterKw,
  systemTopology,
  brownoutSchedule,
  onSelectStep,
}) => {
  const powerChartRef = useRef<SVGSVGElement | null>(null);
  const socChartRef = useRef<SVGSVGElement | null>(null);

  if (!steps || steps.length === 0) return null;

  const hasBattery = systemTopology !== 'grid_tie';
  const currentStep = steps[currentStepIndex] || steps[0];

  const W = 860;
  const H = 240;
  const PAD_L = 46;
  const PAD_R = 18;
  const PAD_T = 18;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const maxPowerKw = Math.max(
    4.0,
    inverterKw * 1.1,
    ...steps.map((s) =>
      Math.max(
        s.potentialPvKw,
        s.actualPvKw,
        s.totalHomeLoadKw,
        Math.abs(s.batteryPowerKw),
        s.gridImportKw
      )
    )
  );
  const yCeilingKw = Math.ceil(maxPowerKw * 1.1);

  const stepToX = (idx: number) => PAD_L + (idx / 95) * plotW;
  const kwToY = (kw: number) =>
    PAD_T + plotH - (Math.max(0, Math.min(yCeilingKw, kw)) / yCeilingKw) * plotH;
  const socToY = (soc: number) =>
    PAD_T + plotH - (Math.max(0, Math.min(100, soc)) / 100) * plotH;

  const buildPolyline = (yGetter: (s: TelemetryTimeStep) => number) =>
    steps
      .map((s, idx) => `${stepToX(idx).toFixed(1)},${yGetter(s).toFixed(1)}`)
      .join(' ');

  const buildAreaPath = (
    yGetter: (s: TelemetryTimeStep) => number,
    baselineY: number
  ) => {
    const pts = steps.map(
      (s, idx) => `${stepToX(idx).toFixed(1)},${yGetter(s).toFixed(1)}`
    );
    return `M ${stepToX(0).toFixed(1)},${baselineY.toFixed(1)} L ${pts.join(
      ' L '
    )} L ${stepToX(95).toFixed(1)},${baselineY.toFixed(1)} Z`;
  };

  const handleSvgClick = (
    e: React.MouseEvent<SVGSVGElement>,
    ref: React.RefObject<SVGSVGElement | null>
  ) => {
    const svg = ref.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (relX - PAD_L) / plotW;
    const idx = Math.max(0, Math.min(95, Math.round(ratio * 95)));
    onSelectStep(idx);
  };

  const baselineY = PAD_T + plotH;
  const cursorX = stepToX(currentStepIndex);
  const inverterLimitY = kwToY(inverterKw);
  const reserveSocY = socToY(20);

  return (
    <section
      aria-label="24-Hour Solar and Battery Charts"
      className="grid grid-cols-1 xl:grid-cols-12 gap-6"
    >
      {/* =====================================================================
          CHART 1: 24-HOUR SOLAR vs HOME DEMAND (7 cols)
         ===================================================================== */}
      <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 space-y-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Sun className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                24-Hour Power Curve: Solar vs. Home Demand
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click any hour on the chart to jump the simulator clock to that moment
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Solar ({currentStep.actualPvKw.toFixed(2)} kW)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              Home Load ({currentStep.totalHomeLoadKw.toFixed(2)} kW)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Grid Import ({currentStep.gridImportKw.toFixed(2)} kW)
            </span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            ref={powerChartRef}
            viewBox={`0 0 ${W} ${H}`}
            onClick={(e) => handleSvgClick(e, powerChartRef)}
            className="w-full h-auto cursor-pointer select-none"
            role="img"
            aria-label="24-Hour Solar and Home Load Chart"
          >
            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const kwVal = yCeilingKw * f;
              const y = kwToY(kwVal);
              return (
                <g key={f}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={W - PAD_R}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200/80 dark:text-white/[0.06]"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={PAD_L - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
                  >
                    {kwVal.toFixed(1)}kW
                  </text>
                </g>
              );
            })}

            {/* Outage highlight bands */}
            {brownoutSchedule.enabled &&
              steps.map((s, idx) => {
                if (
                  !isHourInWindow(
                    s.hourDecimal,
                    brownoutSchedule.startHour,
                    brownoutSchedule.endHour
                  )
                )
                  return null;
                return (
                  <rect
                    key={idx}
                    x={stepToX(idx) - plotW / 190}
                    y={PAD_T}
                    width={plotW / 95 + 0.5}
                    height={plotH}
                    fill="rgba(239,68,68,0.12)"
                  />
                );
              })}

            {/* Potential unclipped PV dashed curve */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
              points={buildPolyline((s) => kwToY(s.potentialPvKw))}
            />

            {/* Actual harvested PV area & line */}
            <path
              d={buildAreaPath((s) => kwToY(s.actualPvKw), baselineY)}
              fill="rgba(245, 158, 11, 0.22)"
            />
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.4"
              points={buildPolyline((s) => kwToY(s.actualPvKw))}
            />

            {/* Grid import area */}
            <path
              d={buildAreaPath((s) => kwToY(s.gridImportKw), baselineY)}
              fill="rgba(56, 189, 248, 0.16)"
            />
            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.6"
              points={buildPolyline((s) => kwToY(s.gridImportKw))}
            />

            {/* Home Load curve */}
            <polyline
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2.2"
              points={buildPolyline((s) => kwToY(s.totalHomeLoadKw))}
            />

            {/* Inverter AC limit line */}
            {inverterKw <= yCeilingKw && (
              <line
                x1={PAD_L}
                y1={inverterLimitY}
                x2={W - PAD_R}
                y2={inverterLimitY}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                strokeOpacity="0.45"
              />
            )}

            {/* Current time step vertical playhead */}
            <line
              x1={cursorX}
              y1={PAD_T}
              x2={cursorX}
              y2={baselineY}
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <circle
              cx={cursorX}
              cy={kwToY(currentStep.actualPvKw)}
              r="4.5"
              fill="#F59E0B"
            />
            <circle
              cx={cursorX}
              cy={kwToY(currentStep.totalHomeLoadKw)}
              r="4"
              fill="#06B6D4"
            />

            {/* X-axis time labels */}
            {[0, 16, 32, 48, 64, 80, 95].map((idx) => (
              <text
                key={idx}
                x={stepToX(idx)}
                y={H - 6}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {steps[idx]?.timeLabel}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* =====================================================================
          CHART 2: 24-HOUR BATTERY STATE OF CHARGE (5 cols)
         ===================================================================== */}
      <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 space-y-5 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
              <BatteryCharging className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Battery Level Throughout the Day (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tracks when your battery fills up from the sun and drains at night
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold tabular-nums">
            {hasBattery ? `${currentStep.batterySocPercent.toFixed(0)}% Now` : 'No Battery'}
          </span>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            ref={socChartRef}
            viewBox={`0 0 ${W} ${H}`}
            onClick={(e) => handleSvgClick(e, socChartRef)}
            className="w-full h-auto cursor-pointer select-none"
            role="img"
            aria-label="24-Hour Battery State of Charge Chart"
          >
            {[0, 25, 50, 75, 100].map((socVal) => {
              const y = socToY(socVal);
              return (
                <g key={socVal}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={W - PAD_R}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200/80 dark:text-white/[0.06]"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={PAD_L - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
                  >
                    {socVal}%
                  </text>
                </g>
              );
            })}

            {/* Minimum reserve floor */}
            <line
              x1={PAD_L}
              y1={reserveSocY}
              x2={W - PAD_R}
              y2={reserveSocY}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeOpacity="0.65"
            />

            {/* SoC area and line */}
            <path
              d={buildAreaPath((s) => socToY(s.batterySocPercent), baselineY)}
              fill="rgba(16, 185, 129, 0.22)"
            />
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              points={buildPolyline((s) => socToY(s.batterySocPercent))}
            />

            {/* Playhead */}
            <line
              x1={cursorX}
              y1={PAD_T}
              x2={cursorX}
              y2={baselineY}
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <circle
              cx={cursorX}
              cy={socToY(currentStep.batterySocPercent)}
              r="4.5"
              fill="#10B981"
            />

            {[0, 16, 32, 48, 64, 80, 95].map((idx) => (
              <text
                key={idx}
                x={stepToX(idx)}
                y={H - 6}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {steps[idx]?.timeLabel}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};
