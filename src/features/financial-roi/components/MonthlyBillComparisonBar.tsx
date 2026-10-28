// src/features/financial-roi/components/MonthlyBillComparisonBar.tsx
import { Sparkles, TrendingUp, ArrowDownRight } from 'lucide-react';
import { useFinancialRoiSimulation } from '../store/useFinancialRoiStore';

export function MonthlyBillComparisonBar() {
  const { activeSim, config } = useFinancialRoiSimulation();

  const {
    year1MonthlyBillBeforePhp,
    year1MonthlyBillAfterPhp,
    year1MonthlySavingsPhp,
    lcoePhpPerKwh,
    cashflowSeries,
  } = activeSim;

  const year10Point = cashflowSeries[10] || cashflowSeries[cashflowSeries.length - 1];
  const year10Rate = year10Point?.inflatedRetailRatePhp || config.retailRatePhp * 1.55;

  const billReductionPercent =
    year1MonthlyBillBeforePhp > 0
      ? Math.round((year1MonthlySavingsPhp / year1MonthlyBillBeforePhp) * 100)
      : 0;

  const afterRatioPercent = Math.max(4, Math.min(100, 100 - billReductionPercent));

  return (
    <div className="h-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-5 sm:p-7 shadow-sm transition-all duration-300 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Header & LCOE Badge */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <ArrowDownRight className="w-3 h-3" />
                Immediate Bill Offset
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Year 1 Electric Bill Impact
              </h3>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-white/[0.04] text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                LCOE <strong className="text-emerald-600 dark:text-emerald-400">₱{lcoePhpPerKwh.toFixed(2)}</strong> vs{' '}
                <strong>₱{config.retailRatePhp.toFixed(2)}</strong>/kWh
              </span>
            </div>
          </div>

          {/* Visual Stacked Bill Bars */}
          <div className="space-y-4">
            {/* Before Solar Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-slate-400">
                  Current Monthly Utility Bill
                </span>
                <span className="text-base font-black font-mono tabular-nums text-slate-900 dark:text-white">
                  ₱{year1MonthlyBillBeforePhp.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">/ mo</span>
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-slate-200/80 dark:bg-white/[0.08] overflow-hidden">
                <div className="h-full w-full rounded-full bg-slate-400 dark:bg-slate-600" />
              </div>
            </div>

            {/* After Solar + Savings Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-emerald-600 dark:text-emerald-400">
                  New Bill After Solar (-{billReductionPercent}%)
                </span>
                <span className="text-base font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  ₱{year1MonthlyBillAfterPhp.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-400">/ mo</span>
                </span>
              </div>
              <div className="h-3.5 w-full rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 p-0.5 flex items-center overflow-hidden">
                <div
                  style={{ width: `${afterRatioPercent}%` }}
                  className="h-full rounded-full bg-amber-500 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  title={`Remaining Bill: ₱${year1MonthlyBillAfterPhp.toLocaleString()}`}
                />
              </div>
            </div>
          </div>

          {/* Highlighted Monthly & Annual Savings Bento Box */}
          <div className="p-4 rounded-2xl bg-emerald-500/[0.05] dark:bg-emerald-500/[0.06] flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-[0.16em] text-emerald-700 dark:text-emerald-300 block mb-0.5">
                Monthly Cashflow Retained
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                +₱{year1MonthlySavingsPhp.toLocaleString()}
                <span className="text-xs font-normal text-slate-500 ml-1">/ mo</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-[0.14em] text-slate-400 block mb-0.5">
                Year 1 Total Saved
              </span>
              <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                ₱{activeSim.year1AnnualSavingsPhp.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Inflation Callout */}
        <div className="pt-4 border-t border-slate-900/[0.05] dark:border-white/[0.05] flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            At <strong className="text-slate-800 dark:text-slate-200 font-mono">{config.annualTariffInflationPercent}%/yr</strong> tariff inflation, grid electricity climbs from{' '}
            <strong className="text-slate-900 dark:text-white font-mono">₱{config.retailRatePhp.toFixed(2)}</strong> to{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-mono">₱{year10Rate.toFixed(2)}/kWh</strong> by Year 10.
          </p>
        </div>
      </div>
  );
}
