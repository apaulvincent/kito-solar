import { useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Battery, BatteryCharging, Plus, Minus, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Autocomplete, HighlightMatch } from '@/components/common/Autocomplete';
import { BatteryRecord } from '@/types/supabase';
import { isBatteryCapableInverter } from '@/engine/inverterHelpers';

export function BatterySelector() {
  const batteries = useCalculatorStore((s) => s.batteries);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const batteryCount = useCalculatorStore((s) => s.batteryCount);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const setBattery = useCalculatorStore((s) => s.setBattery);
  const setBatteryCount = useCalculatorStore((s) => s.setBatteryCount);
  const [isOpen, setIsOpen] = useState(false);

  const isBatteryCapable = isBatteryCapableInverter(selectedInverter);

  if (!isBatteryCapable) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-center space-y-1.5">
        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5">
          <Battery className="w-4 h-4 text-slate-400" />
          Battery Storage Disabled (Grid-Tied Model)
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          The selected inverter model ({selectedInverter.model}) is an on-grid string inverter without direct DC energy storage ports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <BatteryCharging className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Battery Storage Configuration
        </label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
          Required Range: {selectedInverter.battery_voltage_range} V
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
              Battery Pack Model
            </label>
            {selectedBattery && (
              <button
                type="button"
                onClick={() => setBattery(null)}
                className="text-[10px] font-mono text-amber-600 dark:text-amber-400 hover:underline"
              >
                Omit Battery (Export-Only)
              </button>
            )}
          </div>
          <Autocomplete<BatteryRecord>
            options={batteries}
            value={selectedBattery}
            onChange={(bat) => setBattery(bat)}
            getOptionLabel={(b) => b.model}
            getOptionKey={(b) => b.model}
            isOptionEqualToValue={(a, b) => a.model === b.model}
            placeholder="Search battery model or capacity (or clear for no battery)..."
            renderOption={(bat, { inputValue }) => {
              const kwh = (
                (bat.energy_wh || bat.nominal_voltage_v * bat.capacity_ah) /
                1000
              ).toFixed(1);
              return (
                <div className="w-full py-1 space-y-1">
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                    <HighlightMatch text={bat.model} query={inputValue} />
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{bat.nominal_voltage_v}V</span>
                      <span>•</span>
                      <span>{bat.capacity_ah}Ah</span>
                      <span>•</span>
                      <span>Breaker: {bat.recommended_breaker_a}A</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {kwh} kWh
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">Quantity</label>
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden h-[38px] shadow-sm">
            <button
              type="button"
              disabled={batteryCount <= 1 || !selectedBattery}
              onClick={() => setBatteryCount(batteryCount - 1)}
              className="px-2.5 h-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
              {selectedBattery ? batteryCount : 0}
            </span>
            <button
              type="button"
              disabled={!selectedBattery}
              onClick={() => setBatteryCount(batteryCount + 1)}
              className="px-2.5 h-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {selectedBattery ? (
        <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Hide' : 'Show'} ${selectedBattery.model} specifications`}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                {selectedBattery.model}
              </span>
              <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-bold shrink-0">
                Bank: {(((selectedBattery.energy_wh || 0) * batteryCount) / 1000).toFixed(1)} kWh
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hidden xs:inline">
                {isOpen ? 'Hide Specs' : 'View Specs'}
              </span>
              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                {isOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          </button>

          {isOpen && (
            <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Nominal Voltage</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBattery.nominal_voltage_v} V</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Single Capacity</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBattery.capacity_ah} Ah</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Max Discharge</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBattery.discharge_current_a} A</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Recommended MCCB</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedBattery.recommended_breaker_a} A</span>
                </div>
              </div>

              {selectedBattery.notes && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{selectedBattery.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
