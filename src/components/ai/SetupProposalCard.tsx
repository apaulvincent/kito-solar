// src/components/ai/SetupProposalCard.tsx
import React, { useState } from 'react';
import { ProjectSizingResult } from '@/types/solar-ai';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Coins,
  SunMedium,
  Layers,
  BatteryCharging,
  Maximize2,
} from 'lucide-react';
import { formatPeso } from '@/lib/utils';

interface SetupProposalCardProps {
  proposal: ProjectSizingResult;
}

export const SetupProposalCard: React.FC<SetupProposalCardProps> = ({ proposal }) => {
  const applySizingProposal = useCalculatorStore((state) => state.applySizingProposal);
  const lastAppliedProposal = useCalculatorStore((state) => state.lastAppliedProposal);
  const [isApplied, setIsApplied] = useState(false);

  const isAlreadyActive = Boolean(
    isApplied ||
      (lastAppliedProposal &&
        lastAppliedProposal.engineeringSpecs.actualArrayKwp === proposal.engineeringSpecs.actualArrayKwp &&
        lastAppliedProposal.billOfMaterials.panel.quantity === proposal.billOfMaterials.panel.quantity)
  );

  const handleApply = () => {
    applySizingProposal(proposal);
    setIsApplied(true);
  };

  const { engineeringSpecs, billOfMaterials, financialRoi, inputSummary } = proposal;
  const isHybrid = inputSummary.systemType === 'hybrid';
  const isOffGrid = inputSummary.systemType === 'off-grid';

  return (
    <div className="relative my-3 group">
      {/* Outer Machined Double-Bezel Shell */}
      <div className="rounded-[1.75rem] p-1.5 bg-gradient-to-br from-amber-500/15 via-slate-200/50 to-slate-200/20 dark:from-amber-500/10 dark:via-slate-800/60 dark:to-slate-900/40 ring-1 ring-slate-300/80 dark:ring-white/10 shadow-lg shadow-black/5 dark:shadow-black/40 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        {/* Inner Core Enclosure */}
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-white/95 dark:bg-[#0B101E]/95 p-4 sm:p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] space-y-4">
          {/* Header Eyebrow & System Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
                <SunMedium className="w-3 h-3 text-amber-500 animate-pulse" />
                {engineeringSpecs.actualArrayKwp} kWp {inputSummary.systemType.toUpperCase()}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {inputSummary.location}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>{engineeringSpecs.billOffsetPercentage}% Bill Offset</span>
            </div>
          </div>

          {/* Hardware Configuration Capsules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Panel Capsule */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <Layers className="w-3 h-3 text-amber-500" />
                <span>PV Array</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                {billOfMaterials.panel.quantity}x {billOfMaterials.panel.model}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                {billOfMaterials.panel.wattageWp}W ({formatPeso(billOfMaterials.panel.subtotalPhp)})
              </p>
            </div>

            {/* Inverter Capsule */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <Zap className="w-3 h-3 text-indigo-500" />
                <span>Inverter</span>
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                {billOfMaterials.inverter.model}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                {billOfMaterials.inverter.ratedAcKw}kW AC ({formatPeso(billOfMaterials.inverter.subtotalPhp)})
              </p>
            </div>

            {/* Battery / Storage Capsule */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                <BatteryCharging className="w-3 h-3 text-emerald-500" />
                <span>Battery Bank</span>
              </div>
              {billOfMaterials.battery ? (
                <>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {billOfMaterials.battery.totalStorageKwh} kWh LiFePO4
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">
                    {billOfMaterials.battery.quantity}x {billOfMaterials.battery.model} ({formatPeso(billOfMaterials.battery.subtotalPhp)})
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Grid-Tie Only</p>
                  <p className="text-[11px] font-mono text-slate-400">Zero Battery Storage</p>
                </>
              )}
            </div>
          </div>

          {/* Key Metrics Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Monthly Savings
              </span>
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatPeso(financialRoi.estimatedMonthlySavingsPhp)}
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 block">/ month</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 ring-1 ring-amber-500/20">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Payback Period
              </span>
              <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                {financialRoi.paybackPeriodYears} Years
              </span>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 block">
                ROI Break-even
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Roof Footprint
              </span>
              <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                ~{engineeringSpecs.requiredRoofAreaSqm} m²
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                With 15% Clearance
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] ring-1 ring-slate-200/60 dark:ring-white/5">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Total Turnkey
              </span>
              <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
                {formatPeso(billOfMaterials.totalSystemCostPhp)}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Equip + BOS + Labor
              </span>
            </div>
          </div>

          {/* MPPT Safety & String Compliance Pill */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.02] text-[11px] text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">MPPT String Check: </span>
              {engineeringSpecs.stringConfigurations.map((sc, idx) => (
                <span key={idx} className="font-mono text-[10px] mr-2">
                  MPPT {sc.mpptIndex}: {sc.panelsInSeries}S (Cold {sc.stringVocColdV}V / Hot {sc.stringVmpHotV}V)
                </span>
              ))}
            </div>
          </div>

          {/* Island Button: Apply to Workbench CTA */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {isAlreadyActive ? 'Active in current workspace' : 'Ready to load into workbench'}
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isAlreadyActive}
              className={`w-full sm:w-auto inline-flex items-center justify-between gap-3 px-5 py-2.5 rounded-full font-semibold text-xs tracking-wide shadow-md transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                isAlreadyActive
                  ? 'bg-emerald-600 text-white cursor-default opacity-90'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 ring-1 ring-amber-400/50 group/btn'
              }`}
            >
              <span>{isAlreadyActive ? '✓ Applied to Calculator' : 'Apply Setup to Calculator'}</span>
              <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-0.5">
                {isAlreadyActive ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
