import React from 'react';
import { CloudSun, Moon, Pause, Play, Sun, Sunrise, Sunset } from 'lucide-react';
import { formatHourParts12h } from '@/lib/timeFormat';
import { SimulationSpeed, TelemetryTimeStep } from '../types/yieldSimulator';

interface TimeScrubberBarProps {
  currentStepIndex: number;
  currentStep: TelemetryTimeStep;
  isPlaying: boolean;
  playbackSpeed: SimulationSpeed;
  onStepChange: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
}

const QUICK_TIME_JUMPS: {
  label: string;
  time: string;
  stepIndex: number;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}[] = [
  { label: 'Sunrise', time: '6:30 AM', stepIndex: 26, icon: Sunrise },
  { label: 'Morning', time: '9:30 AM', stepIndex: 38, icon: Sun },
  { label: 'Peak Sun', time: '12:00 PM', stepIndex: 48, icon: Sun },
  { label: 'Afternoon', time: '2:30 PM', stepIndex: 58, icon: CloudSun },
  { label: 'Evening Peak', time: '7:30 PM', stepIndex: 78, icon: Sunset },
  { label: 'Overnight', time: '1:00 AM', stepIndex: 4, icon: Moon },
];

function getSolarPhaseLabel(hourDecimal: number): string {
  if (hourDecimal >= 5.5 && hourDecimal < 8.5) return 'Morning Ramp-Up';
  if (hourDecimal >= 8.5 && hourDecimal < 11.0) return 'Mid-Morning Generation';
  if (hourDecimal >= 11.0 && hourDecimal < 14.0) return 'Peak Midday Sun';
  if (hourDecimal >= 14.0 && hourDecimal < 17.5) return 'Afternoon Solar';
  if (hourDecimal >= 17.5 && hourDecimal < 22.0) return 'Evening Peak Load';
  return 'Overnight Standby';
}

export const TimeScrubberBar: React.FC<TimeScrubberBarProps> = ({
  currentStepIndex,
  currentStep,
  isPlaying,
  playbackSpeed,
  onStepChange,
  onTogglePlay,
  onSpeedChange,
}) => {
  const { time12, period } = formatHourParts12h(currentStep.hourDecimal);
  const phaseLabel = getSolarPhaseLabel(currentStep.hourDecimal);

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`group inline-flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5 text-xs font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.45)]'
                : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 shadow-sm'
            }`}
          >
            <span>{isPlaying ? 'Pause Day' : 'Play 24h Day'}</span>
            <span className="w-7 h-7 rounded-full bg-white/15 dark:bg-slate-950/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" strokeWidth={1.75} />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" strokeWidth={1.75} />
              )}
            </span>
          </button>

          <div
            className="inline-flex items-center rounded-full bg-slate-100 dark:bg-white/[0.05] p-1"
            role="group"
            aria-label="Simulation Speed"
          >
            {([1, 5, 15] as SimulationSpeed[]).map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onSpeedChange(spd)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold tabular-nums transition-all duration-300 cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-white dark:bg-amber-500 text-slate-900 dark:text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="flex items-baseline gap-2.5 pl-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
              {time12}
            </span>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              {period}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
              • {phaseLabel}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
              ({Math.round(currentStep.irradianceWm2)} W/m² • {currentStep.ambientTempC.toFixed(0)}°C)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 shrink-0">
            Jump to:
          </span>
          {QUICK_TIME_JUMPS.map((preset) => {
            const Icon = preset.icon;
            const isNear = Math.abs(currentStepIndex - preset.stepIndex) <= 2;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onStepChange(preset.stepIndex)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shrink-0 cursor-pointer ${
                  isNear
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'bg-slate-100/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
                <span>{preset.label}</span>
                <span className="text-[10px] font-mono tabular-nums opacity-70">{preset.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={95}
          step={1}
          value={currentStepIndex}
          onChange={(e) => onStepChange(Number(e.target.value))}
          aria-label="Scrub 24-hour time of day"
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer bg-gradient-to-r from-slate-300 via-amber-400 to-slate-300 dark:from-slate-800 dark:via-amber-500/60 dark:to-slate-800 accent-amber-500"
        />
        <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 px-0.5">
          <span>12:00 AM</span>
          <span>6:00 AM Sunrise</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">12:00 PM Peak Sun</span>
          <span>6:00 PM Sunset</span>
          <span>11:45 PM</span>
        </div>
      </div>
    </div>
  );
};
