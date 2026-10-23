// src/features/yield-simulator/components/SimulatorControlBar.tsx
import React from 'react';
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
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'clear_sky',
    label: 'Clear Summer Peak',
    shortLabel: 'Clear Sky',
    icon: Sun,
  },
  {
    id: 'partly_cloudy',
    label: 'Partly Cloudy (Transients)',
    shortLabel: 'Cloudy',
    icon: CloudSun,
  },
  {
    id: 'monsoon_overcast',
    label: 'Monsoon / Habagat',
    shortLabel: 'Monsoon',
    icon: CloudRain,
  },
  {
    id: 'live_open_meteo',
    label: 'Live Local Weather (Open-Meteo)',
    shortLabel: 'Live Forecast',
    icon: Radio,
  },
];

const EMS_OPTIONS: {
  id: EmsDispatchMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'self_consumption',
    label: 'Solar First (Self-Consumption)',
    description: 'Load -> Battery -> Grid Export/Curtail',
  },
  {
    id: 'backup_ups_priority',
    label: 'Backup / Storm Watch (UPS)',
    description: 'Holds 98-100% SoC for sudden brownouts',
  },
  {
    id: 'peak_shaving',
    label: 'Time-of-Use (Peak Shaving)',
    description: 'Discharges battery during 10:00-21:00 peak tariff',
  },
];

export const SimulatorControlBar: React.FC<SimulatorControlBarProps> = ({
  currentStep,
  locationName,
  isLiveWeatherLoading,
  liveWeatherError,
  onRetryLiveWeather,
}) => {
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
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* Top Row: Time-Lapse Scrubber & Transport Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Left: Play/Pause, Step, Speed */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={togglePlay}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-sans font-bold text-xs flex items-center gap-2 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            aria-label={isPlaying ? 'Pause 24-hour simulation' : 'Play 24-hour simulation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play 24h</span>
              </>
            )}
          </button>

          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={stepBackward}
              title="Previous 15-minute interval"
              aria-label="Step back 15 minutes"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={stepForward}
              title="Next 15-minute interval"
              aria-label="Step forward 15 minutes"
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-md text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Playback Speed Selector (1x, 5x, 15x) */}
          <div
            role="group"
            aria-label="Playback Speed"
            className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5"
          >
            {speeds.map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setPlaybackSpeed(spd)}
                className={`min-h-[38px] px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Live Clock & Solar Irradiance Telemetry Readout */}
          <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                SIMULATION CLOCK
              </div>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentStep.timeLabel}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  ({currentStep.irradianceWm2.toFixed(0)} W/m² |{' '}
                  {currentStep.ambientTempC.toFixed(1)}°C)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: 96-Step Time Slider (00:00 to 23:45) */}
        <div className="flex-1 max-w-2xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>00:00</span>
            <span>06:00 Sunrise</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              12:00 Peak
            </span>
            <span>18:00 Sunset</span>
            <span>23:45</span>
          </div>
          <input
            type="range"
            min={0}
            max={95}
            step={1}
            value={currentStepIndex}
            onChange={(e) => setCurrentStepIndex(Number(e.target.value))}
            aria-label="24-hour simulation time scrubber in 15-minute steps"
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
          />
        </div>
      </div>

      {/* Middle Row: Weather Scenario Sandbox + EMS Mode + Zero-Export Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Weather Scenario Selector (lg: 6 cols) */}
        <div className="lg:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Weather & Irradiance Physics Mode
            </label>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
              Site: {locationName}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {WEATHER_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = weatherScenario === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWeatherScenario(opt.id)}
                  title={opt.label}
                  className={`min-h-[44px] px-2.5 py-2 rounded-lg border text-left transition-colors flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                    isSelected
                      ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs leading-tight truncate">
                    {opt.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* R-27: Explicit Loading / Error / Ready states for Live Open-Meteo API */}
          {weatherScenario === 'live_open_meteo' && (
            <div className="pt-1">
              {isLiveWeatherLoading ? (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                  <span>
                    Fetching live hourly shortwave radiation and cloud cover from Open-Meteo for {locationName}...
                  </span>
                </div>
              ) : liveWeatherError ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>
                      Live weather feed unavailable ({liveWeatherError}). Using synthetic clear-sky curve as fallback.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRetryLiveWeather}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono text-[11px] font-bold hover:bg-rose-500 cursor-pointer"
                    >
                      Retry Fetch
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeatherScenario('clear_sky')}
                      className="px-2.5 py-1 rounded border border-rose-400/40 text-[11px] font-semibold hover:bg-rose-500/10 cursor-pointer"
                    >
                      Switch to Clear Sky
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  <span>
                    Live Open-Meteo solar telemetry active for {locationName} (interpolated to 96 15-min steps).
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* EMS Dispatch Mode & Export Policy (lg: 6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7 space-y-1.5">
            <label
              htmlFor="ems-dispatch-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Inverter EMS Dispatch Priority
            </label>
            <select
              id="ems-dispatch-select"
              value={emsMode}
              onChange={(e) => setEmsMode(e.target.value as EmsDispatchMode)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {EMS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.description})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Grid Export Limiter
            </span>
            <button
              type="button"
              onClick={() => setIsZeroExport(!isZeroExport)}
              className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-between transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
                isZeroExport
                  ? 'border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                  : 'border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{isZeroExport ? 'Zero-Export (CT Clamp)' : 'Net Metering Export'}</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80">
                {isZeroExport ? '0W EXPORT' : 'EXPORT ON'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Hardware Digital Twin Specs & Quick Sync */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Topology Selector */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="sim-topology-select"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Topology:
            </label>
            <select
              id="sim-topology-select"
              value={systemTopology}
              onChange={(e) =>
                setSystemTopology(e.target.value as SystemTopologyMode)
              }
              className="min-h-[38px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <option value="hybrid">Hybrid + LiFePO4</option>
              <option value="grid_tie">Grid-Tie (No Battery)</option>
              <option value="off_grid">Off-Grid Island</option>
            </select>
          </div>

          {/* PV Array kWp */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="sim-pv-kwp"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              PV Array:
            </label>
            <div className="relative">
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
                className="w-20 min-h-[38px] px-2 py-1 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white text-right focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              <span className="absolute right-2 top-2.5 text-[10px] font-mono text-slate-500 pointer-events-none">
                kWp
              </span>
            </div>
          </div>

          {/* Inverter kW */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="sim-inv-kw"
              className="text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Inverter:
            </label>
            <div className="relative">
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
                className="w-20 min-h-[38px] px-2 py-1 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white text-right focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              />
              <span className="absolute right-2 top-2.5 text-[10px] font-mono text-slate-500 pointer-events-none">
                kW
              </span>
            </div>
          </div>

          {/* Battery kWh */}
          {systemTopology !== 'grid_tie' && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="sim-batt-kwh"
                className="text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Battery:
              </label>
              <div className="relative">
                <input
                  id="sim-batt-kwh"
                  type="number"
                  min={1}
                  max={100}
                  step={0.5}
                  value={batteryCapacityKwh}
                  onChange={(e) =>
                    setSystemSpecs({
                      batteryCapacityKwh: parseFloat(e.target.value) || 5.12,
                    })
                  }
                  className="w-22 min-h-[38px] px-2 py-1 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs font-bold text-slate-900 dark:text-white text-right focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                />
                <span className="absolute right-2 top-2.5 text-[10px] font-mono text-slate-500 pointer-events-none">
                  kWh
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sync Buttons from Existing Stores */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={syncFromSolarStudio}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Pull Solar Studio Specs</span>
          </button>
          <button
            type="button"
            onClick={syncFromLoadCalculator}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pull Load Sizing Specs</span>
          </button>
        </div>
      </div>
    </section>
  );
};
