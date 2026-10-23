// src/features/financial-roi/components/ExportModeComparisonCards.tsx
import { ShieldAlert, Zap, BatteryCharging, ArrowRight, Check } from 'lucide-react';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { ExportStrategy } from '../types/financialRoi';

export function ExportModeComparisonCards() {
  const activeScenarioComparison = useFinancialRoiStore((s) => s.activeScenarioComparison);
  const setActiveScenarioComparison = useFinancialRoiStore((s) => s.setActiveScenarioComparison);
  const scenarios = useFinancialRoiStore((s) => s.getAllScenarioSimulations());

  const strategies: { key: ExportStrategy; icon: any; title: string; subtitle: string }[] = [
    {
      key: 'zero_export',
      icon: ShieldAlert,
      title: 'Grid-Tie Zero-Export',
      subtitle: 'Lowest CAPEX • Daytime Only',
    },
    {
      key: 'net_metering',
      icon: Zap,
      title: 'Grid-Tie Net Metering',
      subtitle: 'ERC Export Credits • Highest ROI',
    },
    {
      key: 'hybrid_battery',
      icon: BatteryCharging,
      title: 'Hybrid + LiFePO4 Battery',
      subtitle: 'Nighttime Savings • Brownout Backup',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Architecture Financial Comparison
          </h3>
          <p className="text-xs text-slate-500">
            Compare payback speed, 25-year profit, and capital expenditure across solar topologies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {strategies.map(({ key, icon: Icon, title, subtitle }) => {
          const sim = scenarios[key];
          const isSelected = activeScenarioComparison === key;

          return (
            <div
              key={key}
              onClick={() => setActiveScenarioComparison(key)}
              className={`relative rounded-xl border p-4.5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] shadow-sm ring-1 ring-amber-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top Title & Badge */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{title}</h4>
                      <p className="text-[10px] text-slate-500">{subtitle}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </div>

                {/* KPI Metrics Stack */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Initial Turnkey Cost:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₱{sim.initialCapexPhp.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Year 1 Monthly Savings:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₱{sim.year1MonthlySavingsPhp.toLocaleString()} / mo
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Breakeven Time:</span>
                    <span
                      className={`font-mono font-extrabold ${
                        sim.paybackYears && sim.paybackYears <= 6
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sim.paybackFormatted}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">25-Yr Net Profit:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₱{sim.netProfit25YearsPhp.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-500">Solar LCOE:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ₱{sim.lcoePhpPerKwh.toFixed(2)} / kWh
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveScenarioComparison(key);
                }}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                <span>{isSelected ? 'Modeling Active' : 'Select Architecture'}</span>
                {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
