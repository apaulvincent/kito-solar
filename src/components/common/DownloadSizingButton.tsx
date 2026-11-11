import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { downloadSizingPdf } from '@/services/pdfExportService';
import { computeYieldSummarySnapshot } from '@/features/yield-simulator/store/yieldSnapshot';
import { FileDown, CheckCircle2, Loader2, Lock, X, LogIn, UserPlus } from 'lucide-react';

interface DownloadSizingButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
  authUser?: any;
}

export function DownloadSizingButton({
  className = '',
  variant = 'primary',
  authUser,
}: DownloadSizingButtonProps) {
  const storeUser = useAuthStore((s) => s.user);
  const user = authUser !== undefined ? authUser : storeUser;
  const isLoggedIn = Boolean(user);

  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const batteryCount = useCalculatorStore((s) => s.batteryCount);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAuthModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen]);

  const handleDownload = () => {
    if (isExporting) return;

    try {
      setIsExporting(true);
      downloadSizingPdf({
        calculationResult,
        selectedInverter,
        selectedModule,
        selectedBattery,
        batteryCount,
        gridVoltageV,
        mainBreakerA,
        userEmail: user?.email,
        userName: user?.user_metadata?.full_name,
        yieldSummary: computeYieldSummarySnapshot(),
      });

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to generate sizing PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClick = () => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    handleDownload();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isExporting}
        aria-busy={isExporting}
        className={`inline-flex items-center gap-2 font-mono font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] select-none ${
          downloadSuccess
            ? 'bg-emerald-600 dark:bg-emerald-500 text-white border border-emerald-500'
            : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-500/80 dark:border-emerald-500/40 shadow-emerald-600/20'
        } ${
          variant === 'compact'
            ? 'px-3 py-1.5 text-xs'
            : 'px-4 py-2 text-xs sm:text-sm'
        } ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span>Generating PDF...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>PDF Downloaded!</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 flex-shrink-0" />
            <span>Download Sizing</span>
          </>
        )}
      </button>

      {/* Auth Required Modal */}
      {isAuthModalOpen && (() => {
        const modalJSX = (
          <div
            onClick={() => setIsAuthModalOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold block">
                      LOGIN REQUIRED
                    </span>
                    <h3
                      id="auth-modal-title"
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
                    >
                      Account Required
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close modal"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Explanatory Body */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                You need to have an account to download the sizing details and engineering schedules. Please log in to your account or register to continue.
              </p>

              {/* Actions (Consistent button size and font) */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setActiveView('login');
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Log In to Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setActiveView('register');
                  }}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register New Account</span>
                </button>
              </div>
            </div>
          </div>
        );

        if (typeof document !== 'undefined' && document.body) {
          return createPortal(modalJSX, document.body);
        }
        return modalJSX;
      })()}
    </>
  );
}
