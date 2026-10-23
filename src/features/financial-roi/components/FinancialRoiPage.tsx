// src/features/financial-roi/components/FinancialRoiPage.tsx
import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileDown,
  TrendingUp,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { QuickBillSliderBanner } from './QuickBillSliderBanner';
import { ExportModeComparisonCards } from './ExportModeComparisonCards';
import { CashflowTimelineChart } from './CashflowTimelineChart';
import { MonthlyBillComparisonBar } from './MonthlyBillComparisonBar';
import { EnergyFateBreakdownBar } from './EnergyFateBreakdownBar';
import { TariffPresetSelector } from './TariffPresetSelector';
import { CapexBreakdownCard } from './CapexBreakdownCard';
import { downloadFinancialProposalPdf } from '../utils/financialPdfExport';

export const FinancialRoiPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const resetToDefaults = useFinancialRoiStore((s) => s.resetToDefaults);
  const activeSim = useFinancialRoiStore((s) => s.getActiveSimulation());
  const allScenarios = useFinancialRoiStore((s) => s.getAllScenarioSimulations());
  const config = useFinancialRoiStore((s) => s.config);
  const sizingInput = useFinancialRoiStore((s) => s.getSystemSizingInput());

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Authentication Lock: Page is strictly available to logged-in users
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setActiveView('login');
    }
  }, [isAuthLoading, user, setActiveView]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleDownloadPdf = () => {
    try {
      setIsExportingPdf(true);
      downloadFinancialProposalPdf({
        activeSim,
        allScenarios,
        config,
        sizingInput,
        userEmail: user.email || undefined,
        userName: user.user_metadata?.full_name || undefined,
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-6">
      {/* Top Studio Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Financial ROI & Tariff Simulator
              </h1>
              <p className="text-[11px] text-slate-500">
                25-year cashflow projections, ERC net metering credits, and lifecycle equipment replacements
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Reset & Download PDF */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download Financial Proposal (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: System Sizing Baseline & Standalone Quick Bill Slider */}
      <QuickBillSliderBanner />

      {/* Section 2: Architecture Side-by-Side Comparison (Zero-Export vs. Net Metering vs. Hybrid) */}
      <ExportModeComparisonCards />

      {/* Section 3: 25-Year Cumulative Cashflow & Breakeven Timeline Chart */}
      <CashflowTimelineChart />

      {/* Section 4: Grid Impact & Energy Fate Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonthlyBillComparisonBar />
        <EnergyFateBreakdownBar />
      </div>

      {/* Section 5: Tariff Presets & CAPEX Itemization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TariffPresetSelector />
        <CapexBreakdownCard />
      </div>
    </main>
  );
};
