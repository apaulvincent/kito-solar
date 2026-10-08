// src/components/results/MountingBomCard.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Hammer, Info } from 'lucide-react';

export function MountingBomCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { mounting } = calculationResult;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
              BILL OF MATERIALS (BOM) & HARDWARE HARDENING
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Roof Mounting Accessories ({mounting.panelCount} Modules)
            </h3>
          </div>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 font-semibold">
          ALUMINUM 6005-T5 / SS304
        </span>
      </div>

      {/* 6 Accessory Cards in Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mounting.items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-all space-y-3 shadow-subtle"
          >
            <div>
              {/* Image & Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden shadow-subtle">
                  <img
                    src={item.imagePath}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = item.imagePath.replace('.webp', '.svg');
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                    {item.key.toUpperCase().replace('_', ' ')}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
                    {item.quantity}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase">
                      {item.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specification Pill */}
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-3 shadow-subtle">
                {item.specification}
              </div>

              {/* Explanation */}
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {item.explanation}
              </p>
            </div>

            {/* Calculation Basis Footer */}
            <div className="flex items-start gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{item.calculationBasis}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
