import { useMemo, useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { parseNumericValue } from '@/lib/utils';
import { Autocomplete, HighlightMatch } from '@/components/common/Autocomplete';
import { SolarInverterRecord } from '@/types/supabase';
import { isBatteryCapableInverter } from '@/engine/inverterHelpers';

export function InverterSelector() {
  const inverters = useCalculatorStore((s) => s.inverters);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const setInverter = useCalculatorStore((s) => s.setInverter);
  const [isOpen, setIsOpen] = useState(false);

  const brands = useMemo(() => {
    const set = new Set(inverters.map((i) => i.brand));
    return Array.from(set).sort();
  }, [inverters]);

  const models = useMemo(() => {
    return inverters.filter((i) => i.brand === selectedInverter.brand);
  }, [inverters, selectedInverter.brand]);

  const isBatteryCapable = isBatteryCapableInverter(selectedInverter);

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
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Inverter Brand
          </label>
          <Autocomplete<string>
            options={brands}
            value={selectedInverter.brand}
            onChange={(newBrand) => {
              if (newBrand) {
                const brandModels = inverters.filter((i) => i.brand === newBrand);
                if (brandModels.length > 0) {
                  setInverter(brandModels[0]);
                }
              }
            }}
            getOptionLabel={(b) => b}
            placeholder="Search brand (e.g. Deye, Growatt)..."
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Inverter Model
          </label>
          <Autocomplete<SolarInverterRecord>
            options={models}
            value={selectedInverter}
            onChange={(matched) => {
              if (matched) setInverter(matched);
            }}
            getOptionLabel={(m) => m.model}
            getOptionKey={(m) => m.model}
            isOptionEqualToValue={(a, b) => a.model === b.model}
            placeholder="Type model or kW to filter..."
            renderOption={(inv, { inputValue }) => {
              const kw = (parseNumericValue(inv.rated_ac_power_w) / 1000).toFixed(1);
              const isHybrid = isBatteryCapableInverter(inv);
              return (
                <div className="w-full py-1.5 space-y-1.5">
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                    <HighlightMatch text={inv.model} query={inputValue} />
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>{inv.mppt_tracker_string_config || 'Standard MPPT'}</span>
                    <span>•</span>
                    <span>{inv.mppt_voltage_range}V MPPT</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {kw} kW
                    </span>
                    {isHybrid && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Hybrid
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? 'Hide' : 'Show'} ${selectedInverter.model} specifications`}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
              {selectedInverter.model}
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
              Grid: {selectedInverter.grid_connection_form || 'L+N+PE'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hidden xs:inline">
              {isOpen ? 'Hide Specs' : 'View Specs'}
            </span>
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Rated AC Power</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(parseNumericValue(selectedInverter.rated_ac_power_w) / 1000).toFixed(1)} kW
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Max AC Current</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInverter.max_ac_current_a} A
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Max PV Input</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(selectedInverter.max_pv_input_power_w / 1000).toFixed(1)} kW
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Max PV Voltage</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInverter.max_pv_input_voltage_v} V
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">MPPT Range</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInverter.mppt_voltage_range} V
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Startup Voltage</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInverter.startup_voltage_v} V
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">MPPT Config</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedInverter.mppt_tracker_string_config || '1 / 1'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Battery Support</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedInverter.battery_voltage_range ? `${selectedInverter.battery_voltage_range} V` : 'None'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
