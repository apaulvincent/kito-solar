// src/features/solar-mapper/components/RoofVsLoadComparisonCard.tsx
import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Calculator,
} from 'lucide-react';
import { useSolarMapperStore } from '../store/useSolarMapperStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';

export const RoofVsLoadComparisonCard: React.FC = () => {
  const { getSummary, panelWattage } = useSolarMapperStore();
  const summary = getSummary();

  const getLoadSizingResult = useApplianceLoadStore((s) => s.getSizingResult);
  const loadResult = getLoadSizingResult();
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const requiredPanels = loadResult.recommendedPanelCount;
  const roofMaxPanels = summary.totalMaxPanels;
  const requiredKwp = loadResult.recommendedPvKwp;
  const roofMaxKwp = summary.totalMaxKwp;

  if (summary.sections.length === 0 || summary.totalSlopedAreaSqm === 0) {
    return (
      <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
            <Maximize2 className="w-4 h-4 text-amber-500" />
            <span>Roof Space vs. Electrical Load Verification</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Draw your roof section on the satellite map to verify if your roof can physically hold your required {requiredPanels} panels ({requiredKwp} kWp).
          </p>
        </div>
      </div>
    );
  }

  const hasSpaceDeficit = roofMaxPanels < requiredPanels;
  const sparePanels = roofMaxPanels - requiredPanels;
  const spareKwp = Math.round(((sparePanels * panelWattage) / 1000) * 100) / 100;

  return (
    <div
      className={`p-5 rounded-2xl border backdrop-blur-md shadow-xs transition-all ${
        hasSpaceDeficit
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
              hasSpaceDeficit
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {hasSpaceDeficit ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1">
            <div className="text-sm font-bold flex items-center gap-2">
              <span>
                {hasSpaceDeficit
                  ? 'Roof Space Deficit Alert'
                  : 'Roof Fit Verified & Compatible'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-900/60 border border-current/20">
                {roofMaxPanels} roof capacity vs. {requiredPanels} load req.
              </span>
            </div>

            <p className="text-xs opacity-90 leading-relaxed max-w-3xl">
              {hasSpaceDeficit ? (
                <>
                  Your appliance load requires <strong>{requiredPanels} panels</strong> ({requiredKwp} kWp), but your traced roof only fits <strong>{roofMaxPanels} panels</strong> ({roofMaxKwp} kWp). Consider tracing a second roof face (e.g. garage/carport), switching to higher-efficiency 600W panels, or shaving non-essential heavy motor loads.
                </>
              ) : (
                <>
                  Your traced roof can hold up to <strong>{roofMaxPanels} panels</strong> ({roofMaxKwp} kWp) with safe perimeter setbacks. Your current load requires <strong>{requiredPanels} panels</strong> ({requiredKwp} kWp), leaving <strong>+{sparePanels} extra panels</strong> (+{spareKwp} kWp) of headroom for future expansion or EV charging!
                </>
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('load-calculator')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-xs flex-shrink-0 active:scale-95"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-500" />
          <span>View Load Calculator</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
