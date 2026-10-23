// src/features/financial-roi/components/MonthlyBillComparisonBar.tsx
import { ArrowDownRight, Sparkles, TrendingUp } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';

export function MonthlyBillComparisonBar() {
  const activeSim = useFinancialRoiStore((s) => s.getActiveSimulation());
  const config = useFinancialRoiStore((s) => s.config);

  const {
    year1MonthlyBillBeforePhp,
    year1MonthlyBillAfterPhp,
    year1MonthlySavingsPhp,
    lcoePhpPerKwh,
    cashflowSeries,
  } = activeSim;

  // Year 20 inflated retail rate
  const year20Point = cashflowSeries[20] || cashflowSeries[cashflowSeries.length - 1];
  const year20Rate = year20Point?.inflatedRetailRatePhp || config.retailRatePhp * 2.4;

  const billReductionPercent = year1MonthlyBillBeforePhp > 0
    ? Math.round((year1MonthlySavingsPhp / year1MonthlyBillBeforePhp) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-xs space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Year 1 Electric Bill Impact
          </h3>
          <p className="text-xs text-slate-500">
            Immediate cashflow comparison before and after solar commissioning
          </p>
        </div>

        {/* LCOE Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solar LCOE: <strong>₱{lcoePhpPerKwh.toFixed(2)}/kWh</strong> vs. Grid: <strong>₱{config.retailRatePhp.toFixed(2)}/kWh</strong></span>
        </div>
      </div>

      {/* 3 Metric Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Current Monthly Electric Bill
          </span>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
            ₱{year1MonthlyBillBeforePhp.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Baseline before solar installation</span>
        </div>

        <div className="p-3.5 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/25">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
              Monthly Utility Savings
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              -{billReductionPercent}%
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₱{year1MonthlySavingsPhp.toLocaleString()} / mo
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400">
            ~₱{activeSim.year1AnnualSavingsPhp.toLocaleString()} saved in Year 1
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            New Estimated Electric Bill
          </span>
          <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
            ₱{year1MonthlyBillAfterPhp.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Residual grid charges & night consumption</span>
        </div>
      </div>

      {/* Long-term Tariff Inflation Callout */}
      <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>
          At {config.annualTariffInflationPercent}% annual utility inflation, your grid tariff will rise from{' '}
          <strong className="text-slate-900 dark:text-white font-mono">₱{config.retailRatePhp.toFixed(2)}/kWh</strong> to approximately{' '}
          <strong className="text-slate-900 dark:text-white font-mono">₱{year20Rate.toFixed(2)}/kWh</strong> by Year 20, locking in accelerating savings.
        </span>
      </div>
    </div>
  );
}
