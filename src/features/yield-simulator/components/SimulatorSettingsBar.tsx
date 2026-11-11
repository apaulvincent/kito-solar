import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  CloudSun,
  Radio,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { EmsDispatchMode, SystemTopologyMode, WeatherScenario } from '../types/yieldSimulator';

interface SimulatorSettingsBarProps {
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

export const SimulatorSettingsBar: React.FC<SimulatorSettingsBarProps> = ({
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
  onWeatherChange,
  onEmsChange,
  onTopologyChange,
  onZeroExportToggle,
  onSpecsChange,
  onSyncFromSolarStudio,
}) => {
  const [showHardwareDrawer, setShowHardwareDrawer] = useState(false);
  const activeEmsInfo = EMS_MODES.find((m) => m.key === emsMode) ?? EMS_MODES[0];

  return (
    <div className="p-5 sm:p-6 bg-slate-50/60 dark:bg-white/[0.015] space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
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
              onChange={(e) => onSpecsChange({ pvArrayKwp: Number(e.target.value) })}
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
              onChange={(e) => onSpecsChange({ inverterKw: Number(e.target.value) })}
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
  );
};
