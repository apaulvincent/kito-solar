// src/features/financial-roi/components/ExportModeComparisonCards.tsx
import { ShieldAlert, Zap, BatteryCharging, Check, ArrowRight } from 'lucide-react';
import { useFinancialRoiStore, useFinancialRoiSimulation } from '../store/useFinancialRoiStore';
import { ExportStrategy } from '../types/financialRoi';

export function ExportModeComparisonCards() {
  const activeScenarioComparison = useFinancialRoiStore((s) => s.activeScenarioComparison);
  const setActiveScenarioComparison = useFinancialRoiStore((s) => s.setActiveScenarioComparison);
  const { allScenarios: scenarios } = useFinancialRoiSimulation();

  const strategies: {
    key: ExportStrategy;
    icon: any;
    tag: string;
    title: string;
    subtitle: string;
  }[] = [
    {
      key: 'zero_export',
      icon: ShieldAlert,
      tag: 'Architecture 01',
      title: 'Grid-Tie Zero-Export',
      subtitle: 'Lowest CAPEX • Daytime Self-Use Only',
    },
    {
      key: 'net_metering',
      icon: Zap,
      tag: 'Architecture 02',
      title: 'Grid-Tie Net Metering',
      subtitle: 'ERC Export Credits • Fastest Payback',
    },
    {
      key: 'hybrid_battery',
      icon: BatteryCharging,
      tag: 'Architecture 03',
      title: 'Hybrid + LiFePO4 Bank',
      subtitle: 'Nighttime Offset • Outage Resilience',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div className="space-y-1">
          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08]">
            Topology Matrix
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Architecture Financial Comparison
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select an architecture to plot its 10-year cumulative cashflow trajectory below
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {strategies.map(({ key, icon: Icon, tag, title, subtitle }) => {
          const sim = scenarios[key];
          const isSelected = activeScenarioComparison === key;

          return (
            <div
              key={key}
              onClick={() => setActiveScenarioComparison(key)}
              className={`group rounded-3xl cursor-pointer transition-all duration-300 p-6 flex flex-col justify-between border ${
                isSelected
                  ? 'border-2 border-amber-500 bg-amber-500/[0.03] dark:bg-[#0E1420] shadow-lg shadow-black/[0.04] dark:shadow-black/25'
                  : 'border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className="space-y-5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 block">
                      {tag}
                    </span>
                    <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Hero Payback & 10-Yr Net Profit Split (Single surface, zero double borders) */}
                <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400 block mb-0.5">
                      Breakeven
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-black font-mono tabular-nums tracking-tight ${
                        isSelected
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {sim.paybackFormatted}
                    </span>
                  </div>

                  <div className="border-l border-slate-200/80 dark:border-white/[0.06] pl-3">
                    <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400 block mb-0.5">
                      10-Yr Profit
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                      {Math.abs(sim.netProfit10YearsPhp) >= 1000000
                        ? `₱${(sim.netProfit10YearsPhp / 1000000).toFixed(2)}M`
                        : `₱${Math.round(sim.netProfit10YearsPhp / 1000)}k`}
                    </span>
                  </div>
                </div>

                {/* Precision Telemetry Ledger */}
                <div className="space-y-2.5 text-xs pt-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 dark:text-slate-400">Turnkey Investment</span>
                    <span className="font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      ₱{sim.initialCapexPhp.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-500 dark:text-slate-400">Year 1 Monthly Savings</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +₱{sim.year1MonthlySavingsPhp.toLocaleString()}/mo
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <span className="text-slate-500 dark:text-slate-400">Levelized Solar Cost (LCOE)</span>
                    <span className="font-mono font-extrabold tabular-nums text-slate-900 dark:text-white">
                      ₱{sim.lcoePhpPerKwh.toFixed(2)} / kWh
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator Bar (Clean, intentional, sensible) */}
              <div className="pt-4 mt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                {isSelected ? (
                  <>
                    <span className="inline-flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Active on Cashflow Chart</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Check className="w-3 h-3" />
                      <span>Selected</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors font-medium">
                      Plot on cashflow chart
                    </span>
                    <span className="text-slate-400 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-all duration-300 group-hover:translate-x-1 flex items-center gap-1 text-[11px] font-medium">
                      <span>Select</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
