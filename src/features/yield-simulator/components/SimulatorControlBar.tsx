// src/features/yield-simulator/components/SimulatorControlBar.tsx
import React, { useState } from 'react';
import {
  Play,
  Pause,
  Sun,
  CloudSun,
  CloudRain,
  Radio,
  ShieldAlert,
  RefreshCw,
  SlidersHorizontal,
  Sunrise,
  Sunset,
  Moon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  WeatherScenario,
  EmsDispatchMode,
  SimulationSpeed,
  SystemTopologyMode,
  TelemetryTimeStep,
} from '../types/yieldSimulator';

interface SimulatorControlBarProps {
  currentStepIndex: number;
  currentStep: TelemetryTimeStep;
  isPlaying: boolean;
  playbackSpeed: SimulationSpeed;
  weatherScenario: WeatherScenario;
  emsMode: EmsDispatchMode;
  systemTopology: SystemTopologyMode;
  isZeroExport: boolean;
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  isLiveWeatherLoading: boolean;
  isLiveWeatherError: boolean;
  liveLocationName: string;
  onStepChange: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: SimulationSpeed) => void;
  onWeatherChange: (weather: WeatherScenario) => void;
  onEmsChange: (mode: EmsDispatchMode) => void;
  onTopologyChange: (topology: SystemTopologyMode) => void;
  onZeroExportToggle: (enabled: boolean) => void;
  onSpecsChange: (specs: {
    pvArrayKwp?: number;
    inverterKw?: number;
    batteryCapacityKwh?: number;
  }) => void;
  onSyncFromSolarStudio: () => void;
}

const WEATHER_OPTIONS: {
  key: WeatherScenario;
  label: string;
  hint: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}[] = [
  { key: 'clear_sky', label: 'Sunny Day', hint: '5.5 Peak Sun Hrs', icon: Sun },
  { key: 'partly_cloudy', label: 'Passing Clouds', hint: '4.2 Peak Sun Hrs', icon: CloudSun },
  { key: 'monsoon_overcast', label: 'Rainy / Monsoon', hint: '1.8 Peak Sun Hrs', icon: CloudRain },
  { key: 'live_open_meteo', label: 'Live Local Sky', hint: 'Open-Meteo GPS', icon: Radio },
];

const EMS_MODES: {
  key: EmsDispatchMode;
  label: string;
  description: string;
}[] = [
  {
    key: 'self_consumption',
    label: 'Smart Home Priority',
    description: 'Powers home first, charges battery with extra solar, and uses battery at night',
  },
  {
    key: 'peak_shaving',
    label: 'Evening Peak Saver',
    description: 'Saves battery power during the day so it covers expensive 6PM–10PM evening rates',
  },
  {
    key: 'backup_ups_priority',
    label: '100% Outage Reserve',
    description: 'Keeps battery full at 100% all day and only discharges during a grid brownout',
  },
];

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

function format12HourTime(hourDecimal: number): {
  time12: string;
  period: string;
  phaseLabel: string;
} {
  const totalMinutes = Math.round(hourDecimal * 60);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const time12 = `${hours12}:${String(minutes).padStart(2, '0')}`;

  let phaseLabel = 'Overnight Standby';
  if (hourDecimal >= 5.5 && hourDecimal < 8.5) phaseLabel = 'Morning Ramp-Up';
  else if (hourDecimal >= 8.5 && hourDecimal < 11.0) phaseLabel = 'Mid-Morning Generation';
  else if (hourDecimal >= 11.0 && hourDecimal < 14.0) phaseLabel = 'Peak Midday Sun';
  else if (hourDecimal >= 14.0 && hourDecimal < 17.5) phaseLabel = 'Afternoon Solar';
  else if (hourDecimal >= 17.5 && hourDecimal < 22.0) phaseLabel = 'Evening Peak Load';

  return { time12, period, phaseLabel };
}

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({
  currentStepIndex,
  currentStep,
  isPlaying,
  playbackSpeed,
  weatherScenario,
  emsMode,
  systemTopology,
  isZeroExport,
  pvArrayKwp,
  inverterKw,
  batteryCapacityKwh,
  isLiveWeatherLoading,
  isLiveWeatherError,
  liveLocationName,
  onStepChange,
  onTogglePlay,
  onSpeedChange,
  onWeatherChange,
  onEmsChange,
  onTopologyChange,
  onZeroExportToggle,
  onSpecsChange,
  onSyncFromSolarStudio,
}) => {
  const [showHardwareDrawer, setShowHardwareDrawer] = useState(false);
  const { time12, period, phaseLabel } = format12HourTime(currentStep.hourDecimal);
  const activeEmsInfo = EMS_MODES.find((m) => m.key === emsMode) ?? EMS_MODES[0];

  return (
    <section
      aria-label="Time & Weather Controls"
      className="rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)] divide-y divide-slate-100 dark:divide-white/[0.06]"
    >
      {/* =====================================================================
          PART 1: TIME OF DAY SCRUBBER & 1-CLICK TIME JUMP PILLS
         ===================================================================== */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Play/Pause Button + Speed + Big Friendly Clock */}
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

          {/* Right: 1-Click Time of Day Jump Pills */}
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
                  <span className="text-[10px] font-mono tabular-nums opacity-70">
                    {preset.time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive 24-Hour Scrubber Slider */}
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
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              12:00 PM Peak Sun
            </span>
            <span>6:00 PM Sunset</span>
            <span>11:45 PM</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          PART 2: WEATHER, BATTERY OPERATING MODE & SYSTEM SPECS
         ===================================================================== */}
      <div className="p-5 sm:p-6 bg-slate-50/60 dark:bg-white/[0.015] space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Weather Picker (5 cols) */}
          <div className="xl:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                1. Weather Condition
              </label>
              {weatherScenario === 'live_open_meteo' && (
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  {isLiveWeatherLoading
                    ? 'Fetching satellite data...'
                    : isLiveWeatherError
                      ? 'Using clear-sky fallback'
                      : `GPS: ${liveLocationName}`}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WEATHER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = weatherScenario === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onWeatherChange(opt.key)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all duration-300 cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                        : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-amber-500'}`}
                      strokeWidth={1.75}
                    />
                    <span className="text-xs font-semibold leading-tight mt-0.5">{opt.label}</span>
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        active ? 'text-slate-900/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Battery & Inverter Mode (5 cols) */}
          <div className="xl:col-span-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                2. How Your Inverter Uses Battery &amp; Grid
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={isZeroExport}
                onClick={() => onZeroExportToggle(!isZeroExport)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  isZeroExport
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                }`}
              >
                <ShieldAlert className="w-3 h-3" strokeWidth={1.75} />
                <span>Zero-Export Limit: {isZeroExport ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EMS_MODES.map((m) => {
                const active = systemTopology !== 'grid_tie' && emsMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      if (systemTopology === 'grid_tie') {
                        onTopologyChange('hybrid');
                      }
                      onEmsChange(m.key);
                    }}
                    className={`p-3 rounded-xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      active
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-xs'
                        : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-snug">{m.label}</span>
                  </button>
                );
              })}

              {/* 4th option: Grid-Tie Only */}
              <button
                type="button"
                onClick={() =>
                  onTopologyChange(systemTopology === 'grid_tie' ? 'hybrid' : 'grid_tie')
                }
                className={`p-3 rounded-xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                  systemTopology === 'grid_tie'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-semibold shadow-xs'
                    : 'bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-xs font-semibold leading-snug">Grid-Tie (No Battery)</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {systemTopology === 'grid_tie'
                ? 'Daytime solar only; shuts down automatically during utility blackouts (IEEE 1547).'
                : activeEmsInfo.description}
            </p>
          </div>

          {/* System Hardware Quick Summary + Customize Button (2 cols) */}
          <div className="xl:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              3. Active Equipment
            </label>
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.04] space-y-2">
              <div className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200 space-y-0.5">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Solar: </span>
                  <span className="font-bold">{pvArrayKwp.toFixed(2)} kWp</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Inverter: </span>
                  <span className="font-bold">{inverterKw.toFixed(1)} kW</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Battery: </span>
                  <span className="font-bold">
                    {systemTopology !== 'grid_tie' ? `${batteryCapacityKwh.toFixed(1)} kWh` : 'None'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowHardwareDrawer((v) => !v)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 text-amber-500" strokeWidth={1.75} />
                  <span>Edit Sizes</span>
                  {showHardwareDrawer ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onSyncFromSolarStudio}
                  title="Pull specs from Solar Tool"
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Hardware Sliders */}
        {showHardwareDrawer && (
          <div className="pt-4 border-t border-slate-200/70 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.03] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Solar Array Size
                </span>
                <span className="font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {pvArrayKwp.toFixed(2)} kWp
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={30.0}
                step={0.25}
                value={pvArrayKwp}
                onChange={(e) =>
                  onSpecsChange({ pvArrayKwp: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.03] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Hybrid Inverter Rating
                </span>
                <span className="font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  {inverterKw.toFixed(1)} kW AC
                </span>
              </div>
              <input
                type="range"
                min={3.0}
                max={25.0}
                step={0.5}
                value={inverterKw}
                onChange={(e) =>
                  onSpecsChange({ inverterKw: Number(e.target.value) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-white/[0.03] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  LiFePO4 Battery Bank
                </span>
                <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {systemTopology !== 'grid_tie'
                    ? `${batteryCapacityKwh.toFixed(1)} kWh`
                    : '0 kWh (Grid-Tie)'}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={2.56}
                value={systemTopology !== 'grid_tie' ? batteryCapacityKwh : 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val <= 0) {
                    onTopologyChange('grid_tie');
                    onSpecsChange({ batteryCapacityKwh: 0 });
                  } else {
                    if (systemTopology === 'grid_tie') {
                      onTopologyChange('hybrid');
                    }
                    onSpecsChange({ batteryCapacityKwh: val });
                  }
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
