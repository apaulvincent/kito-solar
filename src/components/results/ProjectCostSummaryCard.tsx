// src/components/results/ProjectCostSummaryCard.tsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Hammer,
  ShieldAlert,
  X,
  TrendingUp,
} from 'lucide-react';
import { formatPeso } from '@/lib/utils';

export function ProjectCostSummaryCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { costSummary, summary } = calculationResult;
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-card dark:shadow-card-dark space-y-6 transition-colors duration-200">
      {/* Pinned Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
              FINANCIALS &amp; BILL OF MATERIALS (BOM)
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Estimated Project Investment
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 font-semibold">
            CURRENCY: PHP (₱)
          </span>
          {costSummary.isFullyEstimated ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              FULLY PRICED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              {costSummary.tbdItemCount} {costSummary.tbdItemCount === 1 ? 'ITEM' : 'ITEMS'} TBD
            </span>
          )}
        </div>
      </div>

      {/* Main Grand Total Banner */}
      <div className="p-5 sm:p-6 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-950 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-amber-700 dark:text-amber-400 uppercase font-bold tracking-wider block">
            ESTIMATED SYSTEM TOTAL INVESTMENT
          </span>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1 flex items-baseline gap-2 flex-wrap">
            <span>{formatPeso(costSummary.grandTotalPhp)}</span>
            {!costSummary.isFullyEstimated && (
              <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">
                (+ {costSummary.tbdItemCount} {costSummary.tbdItemCount === 1 ? 'item' : 'items'} TBD)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Includes sized solar modules ({summary.totalPanels} panels • {summary.totalArrayPowerKw} kWp), inverter, racking hardware, and balance-of-system switchgear.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 font-mono text-xs font-semibold shadow-sm transition-all self-start md:self-auto cursor-pointer active:scale-95"
        >
          <Receipt className="w-3.5 h-3.5 text-amber-500" />
          <span>View Itemized Pricing</span>
        </button>
      </div>

      {/* Financial ROI & Payback Section */}
      {costSummary.financialRoi && (
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              FINANCIAL SAVINGS &amp; ROI ANALYSIS
            </span>
            {costSummary.financialRoi.canComputeRoi ? (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                ✓ FULLY PRICED ROI
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-bold">
                ⚠ PAYBACK TBD (REQUIRES HARDWARE PRICING)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Monthly Savings */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Est. Monthly Bill Offset
              </span>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatPeso(costSummary.financialRoi.estimatedMonthlySavingsPhp)}
                <span className="text-xs font-normal text-slate-500"> / mo</span>
              </div>
            </div>

            {/* Annual Savings */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Est. Annual Bill Savings
              </span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {formatPeso(costSummary.financialRoi.annualSavingsPhp)}
                <span className="text-xs font-normal text-slate-500"> / yr</span>
              </div>
            </div>

            {/* Simple Payback */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Simple Payback Period
              </span>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                {costSummary.financialRoi.canComputeRoi && costSummary.financialRoi.paybackPeriodYears !== null ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    {costSummary.financialRoi.paybackPeriodYears} Years
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 text-sm font-semibold">
                    TBD
                  </span>
                )}
              </div>
            </div>
          </div>

          {!costSummary.financialRoi.canComputeRoi && (
            <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              {costSummary.financialRoi.roiUnavailableReason ||
                `Payback period cannot be calculated while ${costSummary.tbdItemCount} component(s) are marked TBD (unpriced). All hardware prices must be defined to compute ROI.`}
            </p>
          )}
        </div>
      )}

      {/* 3 Discipline Sub-Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Major Equipment Subtotal */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Major Equipment
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {formatPeso(costSummary.equipmentSubtotalPhp)}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Inverter ({summary.inverterModel}), PV modules ({summary.totalPanels}×), and battery bank if selected.
          </p>
        </div>

        {/* Mounting Hardware Subtotal */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <Hammer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Roof Racking Hardware
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {formatPeso(costSummary.mountingSubtotalPhp)}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Rails, L-feet brackets, mid/end clamps, splices, and equipment grounding lugs.
          </p>
        </div>

        {/* Balance of System Switchgear */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
              Switchgear &amp; Protection
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {formatPeso(costSummary.switchgearSubtotalPhp)}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            DC breakers, isolators, SPDs, conduit, ground rod, AC breakers, and transfer switch.
          </p>
        </div>
      </div>

      {/* Itemized Bill of Materials Modal */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="itemized-pricing-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-7 space-y-4 animate-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                      BILL OF MATERIALS (BOM)
                    </span>
                    <h3
                      id="itemized-pricing-modal-title"
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
                    >
                      Itemized Component Pricing Schedule
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex text-[11px] font-mono px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 font-semibold">
                    {costSummary.items.length} Line Items
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close modal"
                    aria-label="Close dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Table Area */}
              <div className="overflow-y-auto max-h-[55vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider z-10">
                    <tr>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                    {costSummary.items.map((item) => (
                      <tr
                        key={item.key}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                          {formatPeso(item.unitPricePhp)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {item.isTbd ? (
                            <span className="text-amber-600 dark:text-amber-400">TBD</span>
                          ) : (
                            formatPeso(item.totalPricePhp)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
                    Total Estimated BOM:
                  </span>
                  <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                    {formatPeso(costSummary.grandTotalPhp)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs font-mono transition-all cursor-pointer text-center"
                >
                  Close Schedule
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default ProjectCostSummaryCard;


