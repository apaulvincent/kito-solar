// src/components/results/WarningsPanel.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export function WarningsPanel() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { warnings } = calculationResult;

  if (warnings.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex items-center gap-3 shadow-subtle transition-colors duration-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">All System Constraints Verified</h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            No design conflicts, voltage exceedances, or thermal curtailment hazards detected with the current configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400 font-bold">
            AUTOMATED AUDIT
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Design Health & Safety Advisories</h3>
        </div>

        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {warnings.length} Active {warnings.length === 1 ? 'Notice' : 'Notices'}
        </span>
      </div>

      <div className="space-y-3">
        {warnings.map((w) => {
          const isError = w.severity === 'error';
          const isWarning = w.severity === 'warning';

          return (
            <div
              key={w.id}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors shadow-subtle ${
                isError
                  ? 'border-red-200 dark:border-red-800/60 bg-red-50/70 dark:bg-red-950/30'
                  : isWarning
                  ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30'
                  : 'border-sky-200 dark:border-sky-800/60 bg-sky-50/70 dark:bg-sky-950/30'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isError ? (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                      isError
                        ? 'bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-200'
                        : isWarning
                        ? 'bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                        : 'bg-sky-200/80 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200'
                    }`}
                  >
                    {w.severity.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{w.title}</h4>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  {w.message}
                </p>

                {w.recommendation && (
                  <div className="text-[11px] font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-subtle mt-2">
                    <span className="text-amber-700 dark:text-amber-400 font-bold">Action: </span>
                    {w.recommendation}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
