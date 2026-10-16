// src/components/ai/SetupProposalCard.tsx
import React, { useState } from 'react';
import { ProjectSizingResult } from '@/types/solar-ai';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  SunMedium,
  Layers,
  BatteryCharging,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { formatPeso } from '@/lib/utils';

interface SetupProposalCardProps {
  proposal: ProjectSizingResult;
}

export const SetupProposalCard: React.FC<SetupProposalCardProps> = ({ proposal }) => {
  const applySizingProposal = useCalculatorStore((state) => state.applySizingProposal);
  const lastAppliedProposal = useCalculatorStore((state) => state.lastAppliedProposal);
  const setActiveView = useCalculatorStore((state) => state.setActiveView);
  const [justApplied, setJustApplied] = useState(false);

  // Exact matching: card is considered active only if this exact proposal was loaded
  const isApplied =
    justApplied ||
    (lastAppliedProposal !== null && lastAppliedProposal.projectId === proposal.projectId);

  const handleApply = () => {
    applySizingProposal(proposal);
    setActiveView('tool');
    setJustApplied(true);
  };

  const { engineeringSpecs, billOfMaterials, financialRoi, inputSummary } = proposal;

  return (
    <div className="relative my-3 group">
      {/* Outer Machined Double-Bezel Shell */}
      <div className="rounded-[2rem] p-1.5 sm:p-2 bg-gradient-to-br from-amber-500/20 via-slate-200/50 to-slate-300/30 dark:from-amber-500/15 dark:via-slate-800/60 dark:to-[#070B14]/80 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-xl shadow-black/5 dark:shadow-black/40 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {/* Inner Core Enclosure */}
        <div className="rounded-[calc(2rem-0.5rem)] bg-white/95 dark:bg-[#0B101E]/95 p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] space-y-4">
          
          {/* Header Eyebrow & System Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                <SunMedium className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                {engineeringSpecs.actualArrayKwp} kWp {inputSummary.systemType.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {inputSummary.location}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full ring-1 ring-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{engineeringSpecs.billOffsetPercentage}% Bill Offset</span>
            </div>
          </div>

          {/* Hardware Configuration Bento (Spacious 2-column + full-width battery) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {/* Panel Capsule */}
            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] ring-1 ring-slate-200/70 dark:ring-white/5 space-y-1">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  PV String Array
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                  {billOfMaterials.panel.quantity} Panels
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                {billOfMaterials.panel.brand} {billOfMaterials.panel.model}
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <span>{billOfMaterials.panel.wattageWp}W Rating</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPeso(billOfMaterials.panel.subtotalPhp)}</span>
              </div>
            </div>

            {/* Inverter Capsule */}
            <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] ring-1 ring-slate-200/70 dark:ring-white/5 space-y-1">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  Inverter Unit
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                  {billOfMaterials.inverter.ratedAcKw}kW AC
                </span>
              </div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                {billOfMaterials.inverter.brand} {billOfMaterials.inverter.model}
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Dual MPPT Tracker</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{formatPeso(billOfMaterials.inverter.subtotalPhp)}</span>
              </div>
            </div>

            {/* Battery / Storage Capsule (Full Width for complete visibility) */}
            <div className="sm:col-span-2 p-3 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] ring-1 ring-slate-200/70 dark:ring-white/5 space-y-1">
              <div className="flex items-center justify-between gap-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                  Energy Storage System
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">
                  {billOfMaterials.battery ? `${billOfMaterials.battery.totalStorageKwh} kWh LiFePO4` : 'Grid-Tie'}
                </span>
              </div>
              {billOfMaterials.battery ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {billOfMaterials.battery.quantity}x {billOfMaterials.battery.brand} {billOfMaterials.battery.model}
                  </p>
                  <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {formatPeso(billOfMaterials.battery.subtotalPhp)}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Zero battery backup configured. Powers active daytime loads directly.
                </p>
              )}
            </div>
          </div>

          {/* Key Financial & Engineering Metrics (2x2 Asymmetric Bento — No Awkward Squeezing) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Metric 1: Monthly Savings */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Estimated Monthly Savings
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                  {formatPeso(financialRoi.estimatedMonthlySavingsPhp)}
                </span>
                <span className="text-xs text-emerald-600/80 dark:text-emerald-400/70 font-medium">/ month</span>
              </div>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 block">
                Annual estimate: ~{formatPeso(financialRoi.annualSavingsPhp)} / year
              </span>
            </div>

            {/* Metric 2: Payback Period */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 ring-1 ring-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Simple Payback Period
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold font-mono text-amber-700 dark:text-amber-300">
                  {financialRoi.paybackPeriodYears} Years
                </span>
              </div>
              <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80 block">
                25-Yr Net Gain: {formatPeso(financialRoi.twentyFiveYearNetSavingsPhp)}
              </span>
            </div>

            {/* Metric 3: Required Roof Area */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Roof Footprint Required
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  ~{engineeringSpecs.requiredRoofAreaSqm} m²
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Includes 15% perimeter walk clearance
              </span>
            </div>

            {/* Metric 4: Total Turnkey Investment */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Total Turnkey Investment
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {formatPeso(billOfMaterials.totalSystemCostPhp)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Hardware, BOS, Mounting & Wiring
              </span>
            </div>
          </div>

          {/* MPPT Safety & String Compliance Banner */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>MPPT String Sizing Verification (PEC Article 6.90)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 pl-5">
              {engineeringSpecs.stringConfigurations.map((sc, idx) => (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-2">
                  <span>MPPT {sc.mpptIndex}: {sc.panelsInSeries} Panels in Series</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Cold Voc: {sc.stringVocColdV}V / Hot Vmp: {sc.stringVmpHotV}V (SAFE)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Island Button: Full-Width Luxurious Action CTA */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={handleApply}
              className={`w-full flex items-center justify-between px-6 py-3.5 rounded-full font-bold text-xs tracking-wider uppercase shadow-lg transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                isApplied
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white ring-1 ring-amber-400/50 shadow-amber-500/30 group/cta'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>{isApplied ? '✓ Loaded into Active Workbench' : 'Load Setup into 3D Workbench'}</span>
              </div>

              {/* Nested Button-in-Button Capsule */}
              <span className="w-7 h-7 rounded-full bg-black/15 dark:bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover/cta:translate-x-1">
                {isApplied ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-white" />
                )}
              </span>
            </button>

            <p className="text-center text-[10px] text-slate-500 dark:text-slate-400">
              {isApplied
                ? `System active: Inverter, ${billOfMaterials.panel.quantity}x panels, and electrical layout are synchronized with the 3D studio.`
                : 'Loads this inverter, solar panel count, and battery bank directly into your interactive 3D model and calculation deck.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
