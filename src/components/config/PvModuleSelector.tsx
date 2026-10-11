// src/components/config/PvModuleSelector.tsx
import { useMemo } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SunMedium, Award } from 'lucide-react';
import { parseNumericValue } from '@/lib/utils';
import { Autocomplete, HighlightMatch } from '@/components/common/Autocomplete';
import { SolarModuleRecord } from '@/types/supabase';

export function PvModuleSelector() {
  const modules = useCalculatorStore((s) => s.modules);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const setModule = useCalculatorStore((s) => s.setModule);
  const step1DetailMode = useCalculatorStore((s) => s.step1DetailMode);

  const brands = useMemo(() => {
    const set = new Set(modules.map((m) => m.brand));
    return Array.from(set).sort();
  }, [modules]);

  const brandModels = useMemo(() => {
    return modules.filter((m) => m.brand === selectedModule.brand);
  }, [modules, selectedModule.brand]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <SunMedium className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          PV Solar Module Selection
        </label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
          MONO-PERC / TOPCon
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Brand Autocomplete */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Module Brand
          </label>
          <Autocomplete<string>
            options={brands}
            value={selectedModule.brand}
            onChange={(newBrand) => {
              if (newBrand) {
                const matched = modules.filter((m) => m.brand === newBrand);
                if (matched.length > 0) setModule(matched[0]);
              }
            }}
            getOptionLabel={(b) => b}
            placeholder="Search module brand..."
          />
        </div>

        {/* Model Autocomplete with Custom Rendered Options and Live Sorting */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">
            Module Model
          </label>
          <Autocomplete<SolarModuleRecord>
            options={brandModels}
            value={selectedModule}
            onChange={(matched) => {
              if (matched) setModule(matched);
            }}
            getOptionLabel={(m) => m.model}
            getOptionKey={(m) => m.model}
            isOptionEqualToValue={(a, b) => a.model === b.model}
            placeholder="Type model or wattage to filter..."
            renderOption={(mod, { inputValue }) => {
              const w = parseNumericValue(mod.pv_wattage_w);
              return (
                <div className="w-full py-1.5 space-y-1.5">
                  {/* Full-width module model name */}
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                    <HighlightMatch text={mod.model} query={inputValue} />
                  </div>

                  {/* Full-width electrical specs */}
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                    <span>Voc: {mod.voc_v}V</span>
                    <span>•</span>
                    <span>Vmp: {mod.vmp_v}V</span>
                    <span>•</span>
                    <span>Isc: {mod.isc_a}A</span>
                  </div>

                  {/* Chips placed below on their own row */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {w} Wp
                    </span>
                    {mod.efficiency_pct && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                        {mod.efficiency_pct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Solar Panel Card */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{selectedModule.model}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({selectedModule.brand})</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-bold">
            <Award className="w-3.5 h-3.5" />
            {selectedModule.efficiency_pct}% Efficiency
          </div>
        </div>

        {step1DetailMode === 'detailed' ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Wattage (Pmax)</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedModule.pv_wattage_w} W</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Voc (Open Ckt)</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedModule.voc_v} V</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Vmp (Max Power)</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedModule.vmp_v} V</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Isc (Short Ckt)</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedModule.isc_a} A</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-subtle">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Imp (Max Current)</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedModule.imp_a} A</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400">
              Power: <strong className="text-slate-900 dark:text-white font-bold">{selectedModule.pv_wattage_w} Wp</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              Vmp: <strong className="text-slate-900 dark:text-white font-bold">{selectedModule.vmp_v} V</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-slate-600 dark:text-slate-400">
              Imp: <strong className="text-slate-900 dark:text-white font-bold">{selectedModule.imp_a} A</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
