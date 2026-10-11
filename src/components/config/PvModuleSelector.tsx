// src/components/config/PvModuleSelector.tsx
import { useMemo } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SunMedium, Award } from 'lucide-react';

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
        {/* Brand */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">Module Brand</label>
          <select
            value={selectedModule.brand}
            onChange={(e) => {
              const matched = modules.filter((m) => m.brand === e.target.value);
              if (matched.length > 0) setModule(matched[0]);
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

        {/* Model */}
        <div>
          <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-semibold">Module Model</label>
          <select
            value={selectedModule.model}
            onChange={(e) => {
              const m = modules.find((mod) => mod.model === e.target.value);
              if (m) setModule(m);
            }}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors font-mono shadow-sm"
          >
            {brandModels.map((m) => (
              <option key={m.model} value={m.model} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                {m.model} ({m.pv_wattage_w} Wp)
              </option>
            ))}
          </select>
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
