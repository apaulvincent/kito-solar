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
  Pencil,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatPeso } from '@/lib/utils';

export function ProjectCostSummaryCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const setCustomPrice = useCalculatorStore((s) => s.setCustomPrice);
  const customPrices = useCalculatorStore((s) => s.customPrices);
  const { costSummary, summary } = calculationResult;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kito_show_financial_roi_details');
        if (saved !== null) {
          return saved === 'true';
        }
      } catch (e) {}
    }
    return false; // ROI and Subtotals hidden by default
  });

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kito_show_financial_roi_details', String(next));
        } catch (e) {}
      }
      return next;
    });
  };
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');

  const handleStartEdit = (key: string, currentPrice: number | null | undefined) => {
    setEditingKey(key);
    setEditPriceInput(currentPrice && currentPrice > 0 ? String(currentPrice) : '');
  };

  const handleSaveEdit = (key: string) => {
    const trimmed = editPriceInput.trim();
    if (trimmed === '') {
      setCustomPrice(key, null);
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && parsed >= 0) {
        setCustomPrice(key, parsed);
      }
    }
    setEditingKey(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditPriceInput('');
  };

  const handleResetPrice = (key: string) => {
    setCustomPrice(key, null);
    setEditingKey(null);
  };

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
          {costSummary.custom3dSummary &&
            (costSummary.custom3dSummary.totalAddedComponents > 0 ||
              costSummary.custom3dSummary.totalWireCount > 0) && (
              <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-800 dark:text-amber-300">
                <span className="font-bold">3D Plant Additions:</span>
                <span>
                  +{costSummary.custom3dSummary.totalAddedComponents} hardware{' '}
                  {costSummary.custom3dSummary.totalAddedComponents === 1 ? 'unit' : 'units'}
                </span>
                {costSummary.custom3dSummary.totalWireCount > 0 && (
                  <span>
                    • {costSummary.custom3dSummary.totalWireCount} (+/-) wires (
                    {costSummary.custom3dSummary.positiveWireMeters}m Red +{' '}
                    {costSummary.custom3dSummary.negativeWireMeters}m Black)
                  </span>
                )}
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  (+{formatPeso(costSummary.custom3dSummary.addedSubtotalPhp)} reflected in total)
                </span>
              </div>
            )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={toggleOpen}
            aria-expanded={isOpen}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border font-mono text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95 ${
              isOpen
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
            }`}
          >
            {isOpen ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide ROI &amp; Subtotals</span>
                <ChevronUp className="w-3.5 h-3.5 opacity-60" />
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Show ROI &amp; Subtotals</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 font-mono text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            <span>View Itemized Pricing</span>
          </button>
        </div>
      </div>

      {/* Conditionally reveal Financial ROI and Discipline Sub-Totals */}
      {isOpen && (
        <>

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
        </>
      )}

      {/* Itemized Bill of Materials Modal */}
      {isModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300"
          >
            {/* Modal Dialog */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="itemized-pricing-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 p-5 sm:p-8 space-y-6 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                      <Receipt className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-amber-600 dark:text-amber-400 font-bold block mb-1">
                        BILL OF MATERIALS (BOM)
                      </span>
                      <h3
                        id="itemized-pricing-modal-title"
                        className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight"
                      >
                        Itemized Component Pricing Schedule
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {Object.keys(customPrices).length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        {Object.keys(customPrices).length} Custom {Object.keys(customPrices).length === 1 ? 'Price' : 'Prices'} (Project Only)
                      </span>
                    )}
                    <span className="inline-flex items-center text-xs font-mono px-3.5 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold">
                      {costSummary.items.length} Line Items
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingKey(null);
                      }}
                      className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all duration-200 cursor-pointer active:scale-95 ml-1"
                      title="Close modal"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5 stroke-[2]" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Table Area */}
                <div className="rounded-xl border border-slate-200/80 dark:border-white/10 overflow-y-auto max-h-[58vh] bg-white dark:bg-slate-950/70 flex flex-col flex-1 min-h-0">
                    <table className="table-fixed w-full text-left font-mono border-collapse">
                      <colgroup>
                        <col className="w-[40%] min-w-[280px]" />
                        <col className="w-[14%] min-w-[120px]" />
                        <col className="w-[12%] min-w-[100px]" />
                        <col className="w-[19%] min-w-[170px]" />
                        <col className="w-[15%] min-w-[130px]" />
                      </colgroup>
                      <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold z-10">
                        <tr>
                          <th className="py-3.5 px-5">Component</th>
                          <th className="py-3.5 px-4">Category</th>
                          <th className="py-3.5 px-4 text-right">Qty</th>
                          <th className="py-3.5 px-5 text-right">Unit Price</th>
                          <th className="py-3.5 px-5 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {costSummary.items.map((item) => (
                          <tr
                            key={item.key}
                            className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150 group/row"
                          >
                            <td className="py-3.5 px-5 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="truncate font-sans font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 block"
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                                {item.isCustomPrice && (
                                  <span
                                    className="flex-shrink-0 text-[9px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-bold uppercase tracking-wider"
                                    title="Custom price for this project only"
                                  >
                                    Custom
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right text-sm sm:text-base text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              {editingKey === item.key ? (
                                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-xs text-slate-400 font-mono select-none pointer-events-none">
                                      ₱
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={editPriceInput}
                                      onChange={(e) => setEditPriceInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit(item.key);
                                        if (e.key === 'Escape') handleCancelEdit();
                                      }}
                                      placeholder="0.00"
                                      className="w-24 sm:w-28 pl-6 pr-2 py-1 text-sm font-mono text-right rounded-xl border border-amber-500/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      autoFocus
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(item.key)}
                                    className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                                    title="Apply price"
                                    aria-label="Save price"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
                                    title="Cancel"
                                    aria-label="Cancel editing"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                  {item.isCustomPrice && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetPrice(item.key)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95 cursor-pointer"
                                      title="Reset to default benchmark price"
                                      aria-label="Reset price"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 stroke-[2]" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                                  <span
                                    className={
                                      item.isTbd
                                        ? 'text-amber-600 dark:text-amber-400 font-bold text-sm sm:text-base tracking-wide'
                                        : item.isCustomPrice
                                        ? 'text-sky-600 dark:text-sky-400 font-bold text-sm sm:text-base'
                                        : 'text-slate-700 dark:text-slate-200 font-semibold text-sm sm:text-base'
                                    }
                                  >
                                    {formatPeso(item.unitPricePhp)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(item.key, item.unitPricePhp)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all duration-200 active:scale-95 cursor-pointer"
                                    title={item.isTbd ? 'Set custom unit price' : 'Edit unit price'}
                                    aria-label={`Edit unit price for ${item.name}`}
                                  >
                                    <Pencil className="w-3.5 h-3.5 stroke-[1.75]" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right font-bold text-sm sm:text-base whitespace-nowrap text-slate-900 dark:text-white">
                              {item.isTbd ? (
                                <span className="text-amber-600 dark:text-amber-400 tracking-wide">TBD</span>
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
                <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                        TOTAL ESTIMATED BOM:
                      </span>
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                        {formatPeso(costSummary.grandTotalPhp)}
                      </span>
                    </div>
                    {Object.keys(customPrices).length > 0 && (
                      <span className="text-xs font-mono text-sky-600 dark:text-sky-400 font-medium">
                        • Saved to current project only
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingKey(null);
                    }}
                    className="px-8 py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs font-mono uppercase tracking-wider shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer text-center"
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


