// src/components/common/DownloadSizingButton.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { downloadSizingPdf } from '@/services/pdfExportService';
import { FileDown, Lock, CheckCircle2, Loader2 } from 'lucide-react';

interface DownloadSizingButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'secondary';
  authUser?: any;
}

export function DownloadSizingButton({ className = '', variant = 'primary', authUser }: DownloadSizingButtonProps) {
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
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    if (!isLoggedIn || isExporting) return;

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

  // Base styling for disabled vs enabled states following ui-ux-pro-max guidelines
  if (!isLoggedIn) {
    return (
      <div className="relative group inline-block">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Sign in required to download engineering sizing details"
          className={`inline-flex items-center gap-2 font-mono font-bold rounded-xl transition-all select-none opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 shadow-none ${
            variant === 'compact'
              ? 'px-3 py-1.5 text-xs'
              : 'px-4 py-2 text-xs sm:text-sm'
          } ${className}`}
        >
          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>Download Sizing</span>
        </button>

        {/* Informative Tooltip on Hover */}
        <div
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-2.5 py-1.5 rounded-lg bg-slate-900/95 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-sans font-medium text-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30"
        >
          <span>Please sign in to download the sizing details PDF</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-100" />
        </div>
      </div>
    );
  }

  // Enabled State
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isExporting}
      aria-busy={isExporting}
      title="Download full engineering calculation schedules & BOM in PDF format"
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
  );
}
