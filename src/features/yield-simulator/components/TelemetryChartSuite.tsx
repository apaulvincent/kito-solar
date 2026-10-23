// src/features/yield-simulator/components/TelemetryChartSuite.tsx
import React, { useRef } from 'react';
import {
  BrownoutSchedule,
  TelemetryTimeStep,
} from '../types/yieldSimulator';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { isHourInWindow } from '../utils/yieldSimulationEngine';

interface TelemetryChartSuiteProps {
  steps: TelemetryTimeStep[];
  currentStepIndex: number;
  minReserveSocPercent: number;
  brownout: BrownoutSchedule;
  hasBattery: boolean;
}

export const TelemetryChartSuite: React.FC<TelemetryChartSuiteProps> = ({
  steps,
  currentStepIndex,
  minReserveSocPercent,
  brownout,
  hasBattery,
}) => {
  const setCurrentStepIndex = useYieldSimulatorStore(
    (s) => s.setCurrentStepIndex
  );
  const powerChartRef = useRef<SVGSVGElement | null>(null);
  const socChartRef = useRef<SVGSVGElement | null>(null);

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex] || steps[0];

  // Dimensions for SVG viewBox
  const W = 860;
  const H = 220;
  const PAD_L = 46;
  const PAD_R = 18;
  const PAD_T = 18;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const maxPowerKw = Math.max(
    4.0,
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
  const yCeilingKw = Math.ceil(maxPowerKw * 1.12);

  const stepToX = (idx: number) => PAD_L + (idx / 95) * plotW;
  const kwToY = (kw: number) =>
    PAD_T + plotH - (Math.max(0, Math.min(yCeilingKw, kw)) / yCeilingKw) * plotH;
  const socToY = (soc: number) =>
    PAD_T + plotH - (Math.max(0, Math.min(100, soc)) / 100) * plotH;

  const buildPolyline = (yGetter: (s: TelemetryTimeStep) => number) =>
    steps.map((s, idx) => `${stepToX(idx).toFixed(1)},${yGetter(s).toFixed(1)}`).join(' ');

  const buildAreaPath = (yGetter: (s: TelemetryTimeStep) => number, baselineY: number) => {
    const pts = steps.map(
      (s, idx) => `${stepToX(idx).toFixed(1)},${yGetter(s).toFixed(1)}`
    );
    return `M ${stepToX(0).toFixed(1)},${baselineY.toFixed(1)} L ${pts.join(
      ' L '
    )} L ${stepToX(95).toFixed(1)},${baselineY.toFixed(1)} Z`;
  };

  const potentialPvArea = buildAreaPath((s) => kwToY(s.potentialPvKw), PAD_T + plotH);
  const actualPvArea = buildAreaPath((s) => kwToY(s.actualPvKw), PAD_T + plotH);
  const actualPvLine = buildPolyline((s) => kwToY(s.actualPvKw));
  const potentialPvLine = buildPolyline((s) => kwToY(s.potentialPvKw));
  const loadLine = buildPolyline((s) => kwToY(s.activeLoadKw));
  const gridImportLine = buildPolyline((s) => kwToY(s.gridImportKw));
  const batteryAbsLine = buildPolyline((s) => kwToY(Math.abs(s.batteryPowerKw)));

  const socArea = buildAreaPath((s) => socToY(s.batterySocPercent), PAD_T + plotH);
  const socLine = buildPolyline((s) => socToY(s.batterySocPercent));

  const cursorX = stepToX(currentStepIndex);
  const reserveY = socToY(minReserveSocPercent);

  const handleSvgPointer = (
    e: React.MouseEvent<SVGSVGElement>,
    svgEl: SVGSVGElement | null
  ) => {
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const normalized = Math.max(0, Math.min(1, (relX - PAD_L) / plotW));
    const targetIdx = Math.round(normalized * 95);
    setCurrentStepIndex(targetIdx);
  };

  const timeTicks = [
    { step: 0, label: '00:00' },
    { step: 16, label: '04:00' },
    { step: 32, label: '08:00' },
    { step: 48, label: '12:00' },
    { step: 64, label: '16:00' },
    { step: 80, label: '20:00' },
    { step: 95, label: '23:45' },
  ];

  return (
    <section
      aria-label="Synchronized 24-Hour Power Dispatch and Battery State of Charge Telemetry Charts"
      className="grid grid-cols-1 xl:grid-cols-2 gap-5"
    >
      {/* CHART 1: 24-HOUR POWER DISPATCH STACK (kW) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Where does solar power flow every 15 minutes, and when is midday harvest clipped?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any point along the 24-hour curve to scrub to that 15-minute step
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              PV: {currentStep.actualPvKw.toFixed(2)} kW
            </span>
            {currentStep.clippedPvKw > 0.02 && (
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold">
                Clipped: {currentStep.clippedPvKw.toFixed(2)} kW
              </span>
            )}
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
              Load: {currentStep.activeLoadKw.toFixed(2)} kW
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
              Batt: {Math.abs(currentStep.batteryPowerKw).toFixed(2)} kW
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" />
              Grid In: {currentStep.gridImportKw.toFixed(2)} kW
            </span>
          </div>
        </div>

        <svg
          ref={powerChartRef}
          viewBox={`0 0 ${W} ${H}`}
          onClick={(e) => handleSvgPointer(e, powerChartRef.current)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleSvgPointer(e, powerChartRef.current);
          }}
          className="w-full h-52 cursor-crosshair select-none"
          role="img"
          aria-label="24-hour power dispatch stack chart in kilowatts"
        >
          <defs>
            <pattern
              id="clippedHatchPattern"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeOpacity="0.45"
              />
            </pattern>
          </defs>

          {/* Horizontal Y-Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const valKw = yCeilingKw * frac;
            const y = kwToY(valKw);
            return (
              <g key={idx}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={frac === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
                >
                  {valKw.toFixed(1)}kW
                </text>
              </g>
            );
          })}

          {/* Potential PV Area (Hatched Amber showing Clipped/Throttled ceiling) */}
          <path d={potentialPvArea} fill="url(#clippedHatchPattern)" />
          <polyline
            fill="none"
            stroke="#D97706"
            strokeWidth="1.25"
            strokeDasharray="3 3"
            points={potentialPvLine}
          />

          {/* Harvested PV Area & Curve */}
          <path d={actualPvArea} fill="#D97706" fillOpacity="0.16" />
          <polyline
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
            points={actualPvLine}
          />

          {/* Battery Absolute Power Curve */}
          {hasBattery && (
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="1.8"
              strokeDasharray="4 2"
              points={batteryAbsLine}
            />
          )}

          {/* Grid Import Curve */}
          <polyline
            fill="none"
            stroke="#DC2626"
            strokeWidth="1.8"
            points={gridImportLine}
          />

          {/* Household Load Demand Curve */}
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.2"
            points={loadLine}
          />

          {/* Shared Time Scrubber Vertical Cursor */}
          <line
            x1={cursorX}
            y1={PAD_T}
            x2={cursorX}
            y2={PAD_T + plotH}
            stroke="#0F172A"
            className="dark:stroke-white"
            strokeWidth="1.75"
          />
          <circle
            cx={cursorX}
            cy={kwToY(currentStep.actualPvKw)}
            r="4.5"
            fill="#D97706"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
          <circle
            cx={cursorX}
            cy={kwToY(currentStep.activeLoadKw)}
            r="4.5"
            fill="#2563EB"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* X-Axis Time Labels */}
          {timeTicks.map((t) => (
            <text
              key={t.step}
              x={stepToX(t.step)}
              y={H - 8}
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>

      {/* CHART 2: BATTERY STATE OF CHARGE (0%-100% SoC) & BROWNOUT WINDOW */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Does the LiFePO4 battery stay above the {minReserveSocPercent}% reserve floor through the night?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {hasBattery
                ? `Dashed crimson line marks ${minReserveSocPercent}% minimum protection floor`
                : 'Grid-Tie mode active (0 kWh battery storage)'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              SoC @ {currentStep.timeLabel}: {currentStep.batterySocPercent.toFixed(0)}%
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              Min Floor: {minReserveSocPercent}%
            </span>
          </div>
        </div>

        <svg
          ref={socChartRef}
          viewBox={`0 0 ${W} ${H}`}
          onClick={(e) => handleSvgPointer(e, socChartRef.current)}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleSvgPointer(e, socChartRef.current);
          }}
          className="w-full h-52 cursor-crosshair select-none"
          role="img"
          aria-label="24-hour battery state of charge percentage chart"
        >
          {/* Shaded Crimson Vertical Band for Scheduled Brownout Window */}
          {brownout.enabled &&
            steps.map((s, idx) => {
              if (!isHourInWindow(s.hourDecimal, brownout.startHour, brownout.endHour)) {
                return null;
              }
              const x0 = stepToX(idx);
              const wStep = plotW / 95 + 0.5;
              return (
                <rect
                  key={idx}
                  x={x0}
                  y={PAD_T}
                  width={wStep}
                  height={plotH}
                  fill="#DC2626"
                  fillOpacity="0.12"
                />
              );
            })}

          {/* Horizontal Y-Axis SoC Grid Lines (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = socToY(pct);
            return (
              <g key={pct}>
                <line
                  x1={PAD_L}
                  y1={y}
                  x2={W - PAD_R}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray={pct === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Minimum Safe Reserve SoC Floor Line */}
          <line
            x1={PAD_L}
            y1={reserveY}
            x2={W - PAD_R}
            y2={reserveY}
            stroke="#DC2626"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text
            x={W - PAD_R - 4}
            y={reserveY - 5}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-rose-600 dark:fill-rose-400"
          >
            Reserve Floor ({minReserveSocPercent}% SoC)
          </text>

          {/* Battery SoC Area & Curve */}
          {hasBattery && (
            <>
              <path d={socArea} fill="#059669" fillOpacity="0.15" />
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                points={socLine}
              />
            </>
          )}

          {/* Shared Time Scrubber Vertical Cursor */}
          <line
            x1={cursorX}
            y1={PAD_T}
            x2={cursorX}
            y2={PAD_T + plotH}
            stroke="#0F172A"
            className="dark:stroke-white"
            strokeWidth="1.75"
          />
          {hasBattery && (
            <circle
              cx={cursorX}
              cy={socToY(currentStep.batterySocPercent)}
              r="5"
              fill="#059669"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
          )}

          {/* X-Axis Time Labels */}
          {timeTicks.map((t) => (
            <text
              key={t.step}
              x={stepToX(t.step)}
              y={H - 8}
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
};
