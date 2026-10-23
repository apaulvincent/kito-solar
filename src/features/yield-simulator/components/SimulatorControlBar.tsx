// src/features/yield-simulator/components/SimulatorControlBar.tsx
import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Sun,
  CloudSun,
  CloudRain,
  Radio,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import {
  EmsDispatchMode,
  SimulationSpeed,
  SystemTopologyMode,
  TelemetryTimeStep,
  WeatherScenario,
} from '../types/yieldSimulator';

interface SimulatorControlBarProps {
  currentStep: TelemetryTimeStep;
  locationName: string;
  isLiveWeatherLoading: boolean;
  liveWeatherError: string | null;
  onRetryLiveWeather: () => void;
}

const WEATHER_OPTIONS: {
  id: WeatherScenario;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  {
    id: 'clear_sky',
    label: 'Clear Summer',
    sub: '100% Peak Sun',
    icon: Sun,
  },
  {
    id: 'partly_cloudy',
    label: 'Partly Cloudy',
    sub: 'Cumulus Passes',
    icon: CloudSun,
  },
  {
    id: 'monsoon_overcast',
    label: 'Monsoon Sky',
    sub: '25% Diffuse',
    icon: CloudRain,
  },
  {
    id: 'live_open_meteo',
    label: 'Live Forecast',
    sub: 'Open-Meteo API',
    icon: Radio,
  },
];

const QUICK_TIME_JUMPS = [
  { step: 26, label: '06:30 Morning' },
  { step: 48, label: '12:00 Peak Sun' },
  { step: 58, label: '14:30 Afternoon' },
  { step: 78, label: '19:30 Evening AC' },
  { step: 8, label: '02:00 Overnight' },
];

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({
  currentStep,
  locationName,
  isLiveWeatherLoading,
  liveWeatherError,
  onRetryLiveWeather,
}) => {
  const [isHardwareExpanded, setIsHardwareExpanded] = useState(false);

  const isPlaying = useYieldSimulatorStore((s) => s.isPlaying);
  const togglePlay = useYieldSimulatorStore((s) => s.togglePlay);
  const playbackSpeed = useYieldSimulatorStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useYieldSimulatorStore((s) => s.setPlaybackSpeed);
  const currentStepIndex = useYieldSimulatorStore((s) => s.currentStepIndex);
  const setCurrentStepIndex = useYieldSimulatorStore(
    (s) => s.setCurrentStepIndex
  );
  const stepForward = useYieldSimulatorStore((s) => s.stepForward);
  const stepBackward = useYieldSimulatorStore((s) => s.stepBackward);

  const weatherScenario = useYieldSimulatorStore((s) => s.weatherScenario);
  const setWeatherScenario = useYieldSimulatorStore((s) => s.setWeatherScenario);
  const emsMode = useYieldSimulatorStore((s) => s.emsMode);
  const setEmsMode = useYieldSimulatorStore((s) => s.setEmsMode);
  const systemTopology = useYieldSimulatorStore((s) => s.systemTopology);
  const setSystemTopology = useYieldSimulatorStore((s) => s.setSystemTopology);
  const isZeroExport = useYieldSimulatorStore((s) => s.isZeroExport);
  const setIsZeroExport = useYieldSimulatorStore((s) => s.setIsZeroExport);

  const pvArrayKwp = useYieldSimulatorStore((s) => s.pvArrayKwp);
  const inverterKw = useYieldSimulatorStore((s) => s.inverterKw);
  const batteryCapacityKwh = useYieldSimulatorStore(
    (s) => s.batteryCapacityKwh
  );
  const setSystemSpecs = useYieldSimulatorStore((s) => s.setSystemSpecs);
  const syncFromSolarStudio = useYieldSimulatorStore(
    (s) => s.syncFromSolarStudio
  );
  const syncFromLoadCalculator = useYieldSimulatorStore(
    (s) => s.syncFromLoadCalculator
  );

  const speeds: SimulationSpeed[] = [1, 5, 15];

  return (
    <section
      aria-label="Simulation Playback and Dispatch Controls"
      className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
    >
      <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] space-y-6">
        {/* Top Row: Transport Controls + Live Clock + Scrubber Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
          {/* Left (xl: 5 cols): Play Pill + Step + Speed + Digital Clock */}
          <div className="xl:col-span-5 flex flex-wrap items-center gap-3">
            {/* Nested Button-in-Button Play/Pause Pill */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={
                isPlaying ? 'Pause 24-hour simulation' : 'Play 24-hour simulation'
              }
              className="group min-h-[46px] pl-5 pr-2 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-extrabold text-xs tracking-tight flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <span>{isPlaying ? 'Pause Simulation' : 'Play 24h Day'}</span>
              <span className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-slate-950" strokeWidth={1.75} />
                ) : (
                  <Play className="w-3.5 h-3.5 text-slate-950 translate-x-0.5" strokeWidth={1.75} />
                )}
              </span>
            </button>

            {/* Step Back / Step Forward */}
            <div className="flex items-center rounded-full bg-slate-100 dark:bg-slate-900 p-1 ring-1 ring-slate-900/5 dark:ring-white/10">
              <button
                type="button"
                onClick={stepBackward}
                title="Step back 15 minutes"
                aria-label="Step back 15 minutes"
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer"
              >
                <SkipBack className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={stepForward}
                title="Step forward 15 minutes"
                aria-label="Step forward 15 minutes"
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Speed Selector (1x, 5x, 15x) */}
            <div
              role="group"
              aria-label="Simulation Playback Speed"
              className="flex items-center rounded-full bg-slate-100 dark:bg-slate-900 p-1 ring-1 ring-slate-900/5 dark:ring-white/10"
            >
              {speeds.map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`min-h-[36px] px-3 py-1 rounded-full font-mono text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Active Clock Telemetry */}
            <div className="pl-2 border-l border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                <Clock className="w-3 h-3 text-amber-600" strokeWidth={1.75} />
                <span>TIME OF DAY</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {currentStep.timeLabel}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {currentStep.irradianceWm2.toFixed(0)} W/m² · {currentStep.ambientTempC.toFixed(1)}°C
                </span>
              </div>
            </div>
          </div>

          {/* Right (xl: 7 cols): Interactive 24-Hour Scrubber + 1-Click Time Jump Pills */}
          <div className="xl:col-span-7 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Jump to key hours or drag the 15-minute timeline:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_TIME_JUMPS.map((jump) => {
                  const isActive = Math.abs(currentStepIndex - jump.step) <= 1;
                  return (
                    <button
                      key={jump.step}
                      type="button"
                      onClick={() => setCurrentStepIndex(jump.step)}
                      className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/40 font-bold'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      {jump.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={95}
                step={1}
                value={currentStepIndex}
                onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
                aria-label="24-hour simulation time scrubber in 15-minute steps"
                className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
                <span>00:00 Midnight</span>
                <span>06:00 Sunrise</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  12:00 Solar Noon
                </span>
                <span>18:00 Sunset</span>
                <span>23:45 Night</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Weather Condition Cards + EMS Priority + Export Policy */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Weather Selector (lg: 6 cols) */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Sky & Weather Physics
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                Location: {locationName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {WEATHER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = weatherScenario === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWeatherScenario(opt.id)}
                    className={`min-h-[54px] p-2.5 rounded-2xl text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/12 dark:bg-amber-500/15 ring-1 ring-amber-500/50 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-900/5 dark:ring-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400'
                        }`}
                        strokeWidth={1.75}
                      />
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div className="mt-1.5">
                      <div className="text-xs font-bold leading-tight truncate">
                        {opt.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* R-27: Explicit Loading / Error / Active states for Live Open-Meteo API */}
            {weatherScenario === 'live_open_meteo' && (
              <div className="pt-1">
                {isLiveWeatherLoading ? (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/25 rounded-xl px-3.5 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" strokeWidth={1.75} />
                    <span>
                      Fetching live hourly shortwave radiation from Open-Meteo for {locationName}...
                    </span>
                  </div>
                ) : liveWeatherError ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-rose-800 dark:text-rose-200 bg-rose-500/10 ring-1 ring-rose-500/30 rounded-xl px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" strokeWidth={1.75} />
                      <span>
                        Live weather feed unavailable ({liveWeatherError}). Using synthetic clear-sky curve.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onRetryLiveWeather}
                        className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-[11px] font-bold hover:bg-rose-500 cursor-pointer"
                      >
                        Retry Fetch
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeatherScenario('clear_sky')}
                        className="px-3 py-1 rounded-full ring-1 ring-rose-400/40 text-[11px] font-semibold hover:bg-rose-500/10 cursor-pointer"
                      >
                        Use Clear Sky
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-500/25 rounded-xl px-3.5 py-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" strokeWidth={1.75} />
                    <span>
                      Live Open-Meteo radiation telemetry active for {locationName}.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EMS Operating Mode + Export Limiter + Hardware Toggle (lg: 6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7 space-y-2">
              <label
                htmlFor="ems-dispatch-select"
                className="block text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                2. Inverter Energy Management (EMS) Mode
              </label>
              <select
                id="ems-dispatch-select"
                value={emsMode}
                onChange={(e) => setEmsMode(e.target.value as EmsDispatchMode)}
                className="w-full min-h-[54px] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 ring-1 ring-slate-900/10 dark:ring-white/10 text-xs font-bold text-slate-900 dark:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <option value="self_consumption">
                  Solar First (Home Load -&gt; Battery -&gt; Grid)
                </option>
                <option value="backup_ups_priority">
                  Storm Watch UPS (Hold 100% Battery for Outages)
                </option>
                <option value="peak_shaving">
                  Time-of-Use Peak Shaving (10:00 AM - 9:00 PM)
                </option>
              </select>
            </div>

            <div className="sm:col-span-5 space-y-2">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                3. Utility Grid Export Policy
              </span>
              <button
                type="button"
                onClick={() => setIsZeroExport(!isZeroExport)}
                className={`w-full min-h-[54px] px-3.5 py-2.5 rounded-2xl text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] flex items-center justify-between cursor-pointer ${
                  isZeroExport
                    ? 'bg-amber-500/12 ring-1 ring-amber-500/50 text-amber-900 dark:text-amber-200'
                    : 'bg-emerald-500/10 ring-1 ring-emerald-500/35 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                    <span className="truncate">
                      {isZeroExport ? 'Zero-Export Active' : 'Net Metering On'}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono opacity-80 truncate mt-0.5">
                    {isZeroExport
                      ? 'CT sensor blocks grid export'
                      : 'Exports surplus daytime kW'}
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 flex-shrink-0">
                  {isZeroExport ? '0W LIMIT' : 'EXPORT'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Hardware Strip: Clean Summary Pills + Collapsible Spec Customizer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                Simulated Hardware:
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {systemTopology === 'grid_tie'
                  ? 'Grid-Tie Topology'
                  : systemTopology === 'off_grid'
                  ? 'Off-Grid Island'
                  : 'Hybrid + LiFePO4'}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 ring-1 ring-amber-500/25 font-mono text-xs font-bold text-amber-800 dark:text-amber-300">
                {pvArrayKwp.toFixed(2)} kWp Solar Array
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {inverterKw.toFixed(1)} kW Inverter
              </span>
              {systemTopology !== 'grid_tie' && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {batteryCapacityKwh.toFixed(2)} kWh Battery
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHardwareExpanded(!isHardwareExpanded)}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />
                <span>{isHardwareExpanded ? 'Hide Hardware Specs' : 'Adjust Hardware Sizes'}</span>
              </button>

              <button
                type="button"
                onClick={syncFromSolarStudio}
                className="group min-h-[38px] pl-3.5 pr-1.5 py-1 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
              >
                <span>Sync Solar Studio</span>
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                </span>
              </button>

              <button
                type="button"
                onClick={syncFromLoadCalculator}
                className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                <span>Sync Load Calculator</span>
              </button>
            </div>
          </div>

          {/* Expandable Hardware Tuning Tray */}
          {isHardwareExpanded && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-900/5 dark:ring-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="sim-topology-select"
                  className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1"
                >
                  System Architecture
                </label>
                <select
                  id="sim-topology-select"
                  value={systemTopology}
                  onChange={(e) =>
                    setSystemTopology(e.target.value as SystemTopologyMode)
                  }
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="hybrid">Hybrid + LiFePO4 Battery</option>
                  <option value="grid_tie">Grid-Tie (No Battery)</option>
                  <option value="off_grid">Off-Grid Stand-Alone</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="sim-pv-kwp"
                  className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1"
                >
                  Solar Array Size (kWp)
                </label>
                <input
                  id="sim-pv-kwp"
                  type="number"
                  min={0.5}
                  max={50}
                  step={0.1}
                  value={pvArrayKwp}
                  onChange={(e) =>
                    setSystemSpecs({ pvArrayKwp: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-inv-kw"
                  className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1"
                >
                  Inverter AC Rating (kW)
                </label>
                <input
                  id="sim-inv-kw"
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  value={inverterKw}
                  onChange={(e) =>
                    setSystemSpecs({ inverterKw: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-batt-kwh"
                  className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1"
                >
                  LiFePO4 Storage (kWh)
                </label>
                <input
                  id="sim-batt-kwh"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  disabled={systemTopology === 'grid_tie'}
                  value={batteryCapacityKwh}
                  onChange={(e) =>
                    setSystemSpecs({
                      batteryCapacityKwh: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 font-mono text-xs font-bold text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
