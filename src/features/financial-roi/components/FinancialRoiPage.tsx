import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileDown,
  TrendingUp,
} from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useAuthStore } from '@/store/useAuthStore';
import { LoginRequiredPrompt } from '@/components/common/LoginRequiredPrompt';
import { useFinancialRoiStore, useFinancialRoiSimulation } from '../store/useFinancialRoiStore';
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
  const { activeSim, allScenarios, config, sizingInput } = useFinancialRoiSimulation();

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      setActiveView('login');
    }
  }, [isAuthLoading, user, setActiveView]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#050505]">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-white/10 p-7 shadow-2xl">
          <LoginRequiredPrompt
            title="Sign in to access Financial ROI Studio"
            description="Simulate 10-year utility tariff inflation, ERC net metering generation credits, and LiFePO4 battery payback curves with your engineering account."
            registerLabel="Register Free Account"
          />
        </div>
      </div>
    );
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
    <main className="relative flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-8 sm:space-y-10">
      {/* Subtle Ambient Radial Mesh Glow (Fixed Pointer-Events-None) */}
      <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-[780px] h-[340px] bg-gradient-to-tr from-amber-500/[0.07] via-emerald-500/[0.04] to-transparent blur-3xl rounded-full -z-10" />

      {/* Editorial Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-900/[0.06] dark:border-white/[0.06]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] border border-slate-200/60 dark:border-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio Home</span>
            </button>

            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <TrendingUp className="w-3 h-3" />
              10-Year Financial Modeling
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Financial ROI &amp; Tariff Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Compare Zero-Export curtailment, Philippine ERC Net Metering generation credits, and Hybrid LiFePO4 storage across a 10-year tariff inflation horizon.
          </p>
        </div>

        {/* Island Action Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200/80 dark:hover:bg-white/[0.08] border border-slate-200/60 dark:border-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="group inline-flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 shadow-[0_12px_24px_-6px_rgba(245,158,11,0.45)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span>{isExportingPdf ? 'Generating PDF Proposal...' : 'Download Financial Proposal'}</span>
            <span className="w-7 h-7 rounded-full bg-slate-950/15 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
              <FileDown className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>

      {/* Section 1: System Sizing Baseline & Standalone Quick Bill Slider */}
      <QuickBillSliderBanner />

      {/* Section 2: Architecture Side-by-Side Comparison Matrix */}
      <ExportModeComparisonCards />

      {/* Section 3: Flagship 10-Year Cumulative Cashflow & Breakeven Curve */}
      <CashflowTimelineChart />

      {/* Section 4: Asymmetrical Bento — Bill Impact (5 cols) + Energy Fate (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5">
          <MonthlyBillComparisonBar />
        </div>
        <div className="lg:col-span-7">
          <EnergyFateBreakdownBar />
        </div>
      </div>

      {/* Section 5: Asymmetrical Bento — Utility Tariffs (7 cols) + Turnkey CAPEX (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <TariffPresetSelector />
        </div>
        <div className="lg:col-span-5">
          <CapexBreakdownCard />
        </div>
      </div>
    </main>
  );
};
