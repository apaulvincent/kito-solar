// src/components/results/PvSizingCard.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Sun, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export function PvSizingCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setPanelCountOverride = useCalculatorStore((s) => s.setPanelCountOverride);

  const { pvSizing, stringSizing } = calculationResult;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
              ARRAY CAPACITY & STRING TOPOLOGY
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Photovoltaic Sizing Matrix</h3>
          </div>
        </div>

        <button
          onClick={() => setSelectedNodeKey('pv_array')}
          className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors"
        >
          Locate on 3D Diagram <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Prominent Sizing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Minimum Panels */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                Minimum Panels
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold">
                MPPT Startup
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {pvSizing.minPanels} <span className="text-sm font-normal text-slate-500">modules</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {pvSizing.explanation.min}
            </p>
          </div>
          <button
            onClick={() => setPanelCountOverride(pvSizing.minPanels)}
            className="mt-4 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors text-center shadow-subtle"
          >
            Apply Minimum ({pvSizing.minPanels})
          </button>
        </div>

        {/* Card 2: Recommended Panels */}
        <div className="p-4 rounded-xl border-2 border-amber-500/80 dark:border-amber-500/70 bg-amber-50/40 dark:bg-amber-950/30 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-800 dark:text-amber-300 font-bold">
                Recommended Panels
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500 text-white font-bold shadow-subtle">
                100% Inverter Match
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-amber-800 dark:text-amber-300 mt-1">
              {pvSizing.recommendedPanels}{' '}
              <span className="text-sm font-normal text-amber-700/80 dark:text-amber-400">modules</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed font-medium">
              {pvSizing.explanation.recommended}
            </p>
          </div>
          <button
            onClick={() => setPanelCountOverride(pvSizing.recommendedPanels)}
            className="mt-4 text-xs font-mono font-bold text-white bg-amber-600 hover:bg-amber-700 py-1.5 px-3 rounded-lg transition-colors text-center shadow-sm"
          >
            Apply Recommended ({pvSizing.recommendedPanels})
          </button>
        </div>

        {/* Card 3: Maximum Panels */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                Maximum Panels
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold">
                PV Input Limit
              </span>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
              {pvSizing.maxPanels} <span className="text-sm font-normal text-slate-500">modules</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {pvSizing.explanation.max}
            </p>
          </div>
          <button
            onClick={() => setPanelCountOverride(pvSizing.maxPanels)}
            className="mt-4 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors text-center shadow-subtle"
          >
            Apply Maximum ({pvSizing.maxPanels})
          </button>
        </div>
      </div>

      {/* String Architecture Breakdown */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-900 dark:text-white font-bold uppercase tracking-wider">
            String Architecture & Voltage Window Verification
          </span>
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
              stringSizing.withinMpptRange
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
            }`}
          >
            {stringSizing.withinMpptRange ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                MPPT VOLTAGE COMPLIANT
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                CHECK MPPT WINDOW
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Recommended Strings</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {stringSizing.recommendedStrings} Strings
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Modules Per String</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {stringSizing.panelsPerString} in series
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Operating Vmp per String</span>
            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
              {stringSizing.voltagePerStringVmp} V
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Open Circuit Voc per String</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {stringSizing.voltagePerStringVoc} V
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          {stringSizing.explanation}
        </p>
      </div>
    </div>
  );
}
