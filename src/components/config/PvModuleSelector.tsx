// src/components/config/PvModuleSelector.tsx
import { useMemo, useState } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SunMedium, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { parseNumericValue } from '@/lib/utils';
import { Autocomplete, HighlightMatch } from '@/components/common/Autocomplete';
import { SolarModuleRecord } from '@/types/supabase';

export function PvModuleSelector() {
  const modules = useCalculatorStore((s) => s.modules);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const setModule = useCalculatorStore((s) => s.setModule);
  const [isOpen, setIsOpen] = useState(false);

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

      {/* Solar Panel Card (Collapsible Card) */}
      <div className="rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
          {/* Header Toggle Row */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Hide' : 'Show'} ${selectedModule.model} specifications`}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 truncate">
                {selectedModule.model}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                ({selectedModule.brand})
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-bold shrink-0">
                <Award className="w-3 h-3" />
                {selectedModule.efficiency_pct}% Eff.
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

          {/* Collapsible Technical Spec Grid */}
          {isOpen && (
            <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Wattage (Pmax)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedModule.pv_wattage_w} W</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Voc (Open Ckt)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedModule.voc_v} V</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Vmp (Max Power)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedModule.vmp_v} V</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Isc (Short Ckt)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedModule.isc_a} A</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Imp (Max Current)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedModule.imp_a} A</span>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
