import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { downloadSizingPdf } from '@/services/pdfExportService';
import { computeYieldSummarySnapshot } from '@/features/yield-simulator/store/yieldSnapshot';
import { useTimedFlag } from '@/hooks/useTimedFlag';
import { Modal } from './Modal';
import { LoginRequiredPrompt } from './LoginRequiredPrompt';
import { FileDown, CheckCircle2, Loader2 } from 'lucide-react';

interface DownloadSizingButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
  authUser?: User | null;
}

export function DownloadSizingButton({
  className = '',
  variant = 'primary',
  authUser,
}: DownloadSizingButtonProps) {
  const storeUser = useAuthStore((s) => s.user);
  const user = authUser !== undefined ? authUser : storeUser;
  const isLoggedIn = Boolean(user);

  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedInverter = useCalculatorStore((s) => s.selectedInverter);
  const selectedModule = useCalculatorStore((s) => s.selectedModule);
  const selectedBattery = useCalculatorStore((s) => s.selectedBattery);
  const batteryCount = useCalculatorStore((s) => s.batteryCount);
  const gridVoltageV = useCalculatorStore((s) => s.gridVoltageV);
  const mainBreakerA = useCalculatorStore((s) => s.mainBreakerA);

  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, triggerDownloadSuccess] = useTimedFlag(3000);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

      triggerDownloadSuccess();
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

      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        labelledBy="auth-modal-title"
        backdropClassName="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150"
        dialogClassName="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 animate-in zoom-in-95 duration-200"
      >
        <LoginRequiredPrompt
          titleId="auth-modal-title"
          title="Account Required"
          description="You need to have an account to download the sizing details and engineering schedules. Please log in to your account or register to continue."
          onClose={() => setIsAuthModalOpen(false)}
        />
      </Modal>
    </>
  );
}
