import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  CheckCircle2,
} from 'lucide-react';
import { useRoofVsLoadContext } from '@/store/systemSizingSelector';
import { useSolarMapperStore } from '../store/useSolarMapperStore';

export const RoofVsLoadComparisonCard: React.FC = () => {
  const getSummary = useSolarMapperStore((s) => s.getSummary);
  const summary = getSummary();

  const { loadResult, setActiveView } = useRoofVsLoadContext();

  const requiredPanels = loadResult.recommendedPanelCount;
  const roofMaxPanels = summary.totalMaxPanels;
  const requiredKwp = loadResult.recommendedPvKwp;
  const roofMaxKwp = summary.totalMaxKwp;

  if (summary.sections.length === 0 || summary.totalSlopedAreaSqm === 0) {
    return null;
  }

  const hasSpaceDeficit = roofMaxPanels < requiredPanels;
  const sparePanels = roofMaxPanels - requiredPanels;

  return (
    <div
      className={`px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${
        hasSpaceDeficit
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {hasSpaceDeficit ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-bold">
            {hasSpaceDeficit ? 'Space Deficit Alert:' : 'Roof Verified:'}
          </span>
          <span>
            {roofMaxPanels} panels ({roofMaxKwp.toFixed(2)} kWp) capacity vs. {requiredPanels} panels ({requiredKwp.toFixed(2)} kWp) required
          </span>
          <span className="font-mono text-[11px] opacity-80">
            ({hasSpaceDeficit ? `-${Math.abs(sparePanels)} panels deficit` : `+${sparePanels} extra panels headroom`})
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setActiveView('load-calculator')}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 border border-current/20 text-xs font-semibold transition-all shrink-0 active:scale-95"
      >
        <Calculator className="w-3.5 h-3.5 text-amber-500" />
        <span>Load Calculator</span>
        <ArrowRight className="w-3 h-3 ml-0.5 opacity-60" />
      </button>
    </div>
  );
};
