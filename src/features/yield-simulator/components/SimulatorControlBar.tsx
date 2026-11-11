import React from 'react';
import {
  EmsDispatchMode,
  SimulationSpeed,
  SystemTopologyMode,
  TelemetryTimeStep,
  WeatherScenario,
} from '../types/yieldSimulator';
import { SimulatorSettingsBar } from './SimulatorSettingsBar';
import { TimeScrubberBar } from './TimeScrubberBar';

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
}) => (
  <section
    aria-label="Time & Weather Controls"
    className="rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)] divide-y divide-slate-100 dark:divide-white/[0.06]"
  >
    <TimeScrubberBar
      currentStepIndex={currentStepIndex}
      currentStep={currentStep}
      isPlaying={isPlaying}
      playbackSpeed={playbackSpeed}
      onStepChange={onStepChange}
      onTogglePlay={onTogglePlay}
      onSpeedChange={onSpeedChange}
    />
    <SimulatorSettingsBar
      weatherScenario={weatherScenario}
      emsMode={emsMode}
      systemTopology={systemTopology}
      isZeroExport={isZeroExport}
      pvArrayKwp={pvArrayKwp}
      inverterKw={inverterKw}
      batteryCapacityKwh={batteryCapacityKwh}
      isLiveWeatherLoading={isLiveWeatherLoading}
      isLiveWeatherError={isLiveWeatherError}
      liveLocationName={liveLocationName}
      onWeatherChange={onWeatherChange}
      onEmsChange={onEmsChange}
      onTopologyChange={onTopologyChange}
      onZeroExportToggle={onZeroExportToggle}
      onSpecsChange={onSpecsChange}
      onSyncFromSolarStudio={onSyncFromSolarStudio}
    />
  </section>
);
