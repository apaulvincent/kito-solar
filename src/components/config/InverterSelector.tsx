// src/components/config/InverterSelector.tsx
import { useMemo } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Cpu } from 'lucide-react';
import { parseNumericValue } from '@/lib/utils';

export function InverterSelector() {
  const inverters = useCalculatorStore((s) => s.inverters);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const setInverter = useCalculatorStore((s) => s.setInverter);

  const brands = useMemo(() => {
    const set = new Set(inverters.map((i) => i.brand));
    return Array.from(set).sort();
  }, [inverters]);

  const models = useMemo(() => {
    return inverters.filter((i) => i.brand === selectedInverter.brand);
  }, [inverters, selectedInverter.brand]);

  const isBatteryCapable = Boolean(
    selectedInverter.battery_type &&
    selectedInverter.battery_voltage_range &&
    selectedInverter.battery_type.toLowerCase() !== 'none'
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Solar Inverter Selection
        </label>
        <span
          className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold border ${
            isBatteryCapable
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
          }`}
        >
          {isBatteryCapable ? 'HYBRID STORAGE' : 'ON-GRID STRING'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Brand Dropdown */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">Inverter Brand</label>
          <select
            value={selectedInverter.brand}
            onChange={(e) => {
              const brandModels = inverters.filter((i) => i.brand === e.target.value);
              if (brandModels.length > 0) {
                setInverter(brandModels[0]);
              }
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors shadow-sm"
          >
            {brands.map((b) => (
              <option key={b} value={b} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Model Dropdown */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">Inverter Model</label>
          <select
            value={selectedInverter.model}
            onChange={(e) => {
              const matched = inverters.find((i) => i.model === e.target.value);
              if (matched) setInverter(matched);
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors font-mono shadow-sm"
          >
            {models.map((m) => (
              <option key={m.model} value={m.model} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                {m.model} ({(parseNumericValue(m.rated_ac_power_w) / 1000).toFixed(1)} kW)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inverter Technical Spec Sheet */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
        <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{selectedInverter.model}</span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Grid: {selectedInverter.grid_connection_form || 'L+N+PE'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Rated AC Power</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {(parseNumericValue(selectedInverter.rated_ac_power_w) / 1000).toFixed(1)} kW
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Max AC Current</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedInverter.max_ac_current_a} A
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Max PV Input</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {(selectedInverter.max_pv_input_power_w / 1000).toFixed(1)} kW
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Max PV Voltage</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedInverter.max_pv_input_voltage_v} V
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">MPPT Range</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedInverter.mppt_voltage_range} V
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Startup Voltage</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedInverter.startup_voltage_v} V
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">MPPT Config</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedInverter.mppt_tracker_string_config || '1 / 1'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Battery Support</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {selectedInverter.battery_voltage_range ? `${selectedInverter.battery_voltage_range} V` : 'None'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
