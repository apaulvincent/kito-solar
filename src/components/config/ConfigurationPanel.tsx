// src/components/config/ConfigurationPanel.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { InverterSelector } from './InverterSelector';
import { PvModuleSelector } from './PvModuleSelector';
import { BatterySelector } from './BatterySelector';
import { GridConfig } from './GridConfig';
import { Settings2, List, SlidersHorizontal } from 'lucide-react';

export function ConfigurationPanel() {
  const step1DetailMode = useCalculatorStore((s) => s.step1DetailMode);
  const setStep1DetailMode = useCalculatorStore((s) => s.setStep1DetailMode);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card dark:shadow-card-dark overflow-hidden transition-colors duration-200 flex flex-col lg:h-[calc(100vh-6rem)]">
      {/* Pinned Header (Stays Fixed at Top) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex-shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm flex-shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
              STEP 1: SYSTEM SPECIFICATION
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Equipment Configurator</h2>
          </div>
        </div>

        {/* Detail Level Toggle: Summary vs Detailed Specs (Icon-Only) */}
        <div className="flex items-center self-start sm:self-auto gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => setStep1DetailMode('min')}
            title="Summary view"
            aria-label="Summary view"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              step1DetailMode === 'min'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setStep1DetailMode('detailed')}
            title="Detailed technical specifications"
            aria-label="Detailed technical specifications"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              step1DetailMode === 'detailed'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Form Sections — Independently Scrollable Content */}
      <div className="p-5 space-y-6 flex-1 overflow-y-auto overscroll-auto">
        <InverterSelector />
        <div className="border-t border-slate-100 dark:border-slate-800/80" />
        <PvModuleSelector />
        <div className="border-t border-slate-100 dark:border-slate-800/80" />
        <BatterySelector />
        <div className="border-t border-slate-100 dark:border-slate-800/80" />
        <GridConfig />
      </div>
    </div>
  );
}

export default ConfigurationPanel;
