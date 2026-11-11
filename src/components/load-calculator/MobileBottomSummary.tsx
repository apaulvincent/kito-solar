import React, { useState, useCallback } from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useDismissable } from '@/hooks/useDismissable';
import { SizingSummaryDashboard } from './SizingSummaryDashboard';
import { ChevronUp, X } from 'lucide-react';

export const MobileBottomSummary: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const getSizingResult = useApplianceLoadStore((s) => s.getSizingResult);
  const result = getSizingResult();

  const handleClose = useCallback(() => setIsOpen(false), []);
  useDismissable({
    isOpen,
    onClose: handleClose,
    closeOnOutsideClick: false,
  });

  return (
    <>
      {/* Sticky Bottom Bar for Mobile Only (hidden on lg and above) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex items-center gap-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Daily Load</div>
              <div className="font-mono font-extrabold text-slate-900 dark:text-white">
                {result.totalDailyKwh} kWh
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Inverter</div>
              <div className="font-mono font-extrabold text-slate-900 dark:text-white">
                {result.recommendedInverterKw} kW
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">PV Array</div>
              <div className="font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {result.recommendedPvKwp} kWp
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-tight shadow-sm active:scale-95 transition-transform"
          >
            <span>View Spec</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          onClick={handleClose}
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-slate-50 dark:bg-[#0c1220] p-4 border-t border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                System Sizing & Hardware Summary
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <SizingSummaryDashboard />
          </div>
        </div>
      )}
    </>
  );
};
