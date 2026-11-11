import { formatPeso } from '@/lib/utils';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { BASE_NODE_SPECS, InspectorContent } from '@/lib/diagramNodeSpecs';
import { BookOpen, Cable, Info, ShieldCheck, X } from 'lucide-react';
import { Component3DPreview } from './Component3DPreview';

function getFallbackInspectorContent(nodeKey: string): InspectorContent {
  return {
    title: nodeKey.toUpperCase().replace(/_/g, ' '),
    category: 'System Component',
    purpose: 'System electrical node in the single line diagram.',
    calculatedInput: 'Standard electrical parameter',
    recommendedRating: 'Specified by NEC / PEC standards',
    explanation: 'Sized in accordance with system design.',
    wireConduit: '',
    codeReference: 'NEC / PEC / IEC Electrical Standards',
  };
}

export function ComponentInspector() {
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const setAtsSource = useCalculatorStore((s) => s.setAtsSource);

  if (!selectedNodeKey) return null;

  const spec = BASE_NODE_SPECS[selectedNodeKey];
  const content = spec
    ? spec.getInspectorContent(calculationResult, gridVoltageV, mainBreakerA)
    : getFallbackInspectorContent(String(selectedNodeKey));
  const imagePath = spec?.imagePath || '/assets/accessories/pv-dc-breaker.svg';

  const matchingCostItem = calculationResult.costSummary.items.find((item) =>
    spec?.costItemKey
      ? item.key === spec.costItemKey
      : item.key === selectedNodeKey || item.key === `pv_${selectedNodeKey}`
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-colors duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
                {content.category}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{content.title}</h3>
            </div>
          </div>
          <button
            onClick={() => setSelectedNodeKey(null)}
            aria-label="Close inspector"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="w-full sm:w-36 h-36 flex-shrink-0">
              <Component3DPreview
                nodeKey={selectedNodeKey}
                fallbackImagePath={imagePath}
                title={content.title}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold">
                RECOMMENDED SPECIFICATION
              </div>
              <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {content.recommendedRating}
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                {content.calculatedInput}
              </div>
              {matchingCostItem && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                    EST. PRICE:
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                    Unit: {formatPeso(matchingCostItem.unitPricePhp)}
                  </span>
                  {matchingCostItem.quantity > 1 && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      Total ({matchingCostItem.quantity}×): {formatPeso(matchingCostItem.totalPricePhp)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedNodeKey === 'ats' && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Active ATS Source Position
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Switch power source feeding the main distribution & building loads:
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setAtsSource('solar')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    atsSource === 'solar'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  SOLAR (LEFT)
                </button>
                <button
                  type="button"
                  onClick={() => setAtsSource('utility')}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    atsSource === 'utility'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  UTILITY (RIGHT)
                </button>
              </div>
            </div>
          )}

          {content.codeReference && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Applicable Electrical Code & Standards
              </div>
              <p className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 font-medium">
                {content.codeReference}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Engineering Purpose
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {content.purpose}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Calculation Basis & Derivation
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {content.explanation}
            </p>
          </div>

          {content.wireConduit && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                <Cable className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Associated Conductor / Enclosure
              </div>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-medium">
                {content.wireConduit}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Planning guide based on standard 125% continuous duty rule
          </span>
          <button
            onClick={() => setSelectedNodeKey(null)}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-subtle"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
