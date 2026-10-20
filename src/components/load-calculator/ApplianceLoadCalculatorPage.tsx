// src/components/load-calculator/ApplianceLoadCalculatorPage.tsx
import React from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { SystemGoalSelector } from './SystemGoalSelector';
import { StarterProfilesBar } from './StarterProfilesBar';
import { AppliancePresetPicker } from './AppliancePresetPicker';
import { ActiveLoadList } from './ActiveLoadList';
import { SizingSummaryDashboard } from './SizingSummaryDashboard';
import { MobileBottomSummary } from './MobileBottomSummary';
import { EngineeringDisclaimer } from '@/components/common/EngineeringDisclaimer';
import { KitoApplianceGradientDefs } from './ApplianceIcon';
import { ArrowLeft, Sparkles, Calculator, Zap, Shield, HelpCircle } from 'lucide-react';

export const ApplianceLoadCalculatorPage: React.FC = () => {
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Global SVG Gradient Defs */}
      <KitoApplianceGradientDefs />

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <Calculator className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Interactive Load & Sizing Studio
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] uppercase font-bold tracking-[0.2em] border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Interactive Appliance Sizing</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Appliance Load & Solar Sizing Calculator
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          Configure your household appliances with realistic running wattages, duty cycles, and motor startup surge multipliers. Get instant sizing recommendations for Grid-Tie, Hybrid, or Off-Grid systems with zero guesswork.
        </p>
      </div>

      {/* Quick Starter Profiles Bar */}
      <StarterProfilesBar />

      {/* 2-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-16 lg:pb-0">
        {/* Left Column (lg: 7 cols): Configuration & Load Builder */}
        <div className="lg:col-span-7 space-y-6">
          <SystemGoalSelector />
          <AppliancePresetPicker />
          <ActiveLoadList />
        </div>

        {/* Right Column (lg: 5 cols, Sticky Dashboard on Desktop) */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
          <SizingSummaryDashboard />
        </div>
      </div>

      {/* Mobile Sticky Summary Drawer Trigger */}
      <MobileBottomSummary />

      {/* Engineering Disclaimer */}
      <EngineeringDisclaimer />
    </main>
  );
};
