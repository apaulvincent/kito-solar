// src/features/financial-roi/components/ExportModeComparisonCards.tsx
import { ShieldAlert, Zap, BatteryCharging, ArrowUpRight, Check } from 'lucide-react';
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
          <span className="inline-flex items-center rounded-full px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] font-bold bg-slate-900/[0.05] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
            Topology Matrix
          </span>
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Architecture Financial Comparison
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a topology to inspect its 25-year cumulative cashflow trajectory
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
              className={`group p-1.5 sm:p-2 rounded-[2rem] cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isSelected
                  ? 'bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-amber-500/5 ring-1 ring-amber-500/50 shadow-[0_24px_48px_-12px_rgba(245,158,11,0.18)] -translate-y-0.5'
                  : 'bg-slate-900/[0.03] dark:bg-white/[0.03] ring-1 ring-slate-900/[0.06] dark:ring-white/[0.08] hover:ring-slate-900/15 dark:hover:ring-white/15 hover:-translate-y-0.5'
              }`}
            >
              <div
                className={`h-full rounded-[calc(2rem-0.375rem)] sm:rounded-[calc(2rem-0.5rem)] p-5 sm:p-6 flex flex-col justify-between transition-colors duration-500 ${
                  isSelected
                    ? 'bg-white dark:bg-[#0D131F] shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] ring-1 ring-amber-500/20'
                    : 'bg-white/95 dark:bg-[#0B0F17] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.04]'
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
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 shadow-[0_8px_16px_-4px_rgba(245,158,11,0.45)]'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 ring-1 ring-slate-900/[0.05] dark:ring-white/[0.08]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Hero Payback & 25-Yr Net Profit Split */}
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] ring-1 ring-slate-900/[0.04] dark:ring-white/[0.05]">
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
                        25-Yr Profit
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">
                        ₱{(sim.netProfit25YearsPhp / 1000000).toFixed(2)}M
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

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-900/[0.05] dark:border-white/[0.05]">
                      <span className="text-slate-500 dark:text-slate-400">Levelized Solar Cost (LCOE)</span>
                      <span className="font-mono font-extrabold tabular-nums text-slate-900 dark:text-white">
                        ₱{sim.lcoePhpPerKwh.toFixed(2)} / kWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Island Button-in-Button CTA */}
                <div className="pt-5 mt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveScenarioComparison(key);
                    }}
                    className={`w-full rounded-full pl-5 pr-1.5 py-1.5 text-xs font-bold flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    <span>{isSelected ? 'Active Simulation Curve' : 'Inspect Cashflow Curve'}</span>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105 ${
                        isSelected
                          ? 'bg-slate-950/15 text-slate-950'
                          : 'bg-slate-900/[0.06] dark:bg-white/10 text-slate-700 dark:text-white'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
