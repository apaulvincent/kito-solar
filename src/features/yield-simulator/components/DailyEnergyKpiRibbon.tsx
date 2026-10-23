// src/features/yield-simulator/components/DailyEnergyKpiRibbon.tsx
import React from 'react';
import {
  Sun,
  ShieldCheck,
  BatteryCharging,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { DailySimulationSummary, SystemTopologyMode } from '../types/yieldSimulator';

interface DailyEnergyKpiRibbonProps {
  summary: DailySimulationSummary;
  systemTopology: SystemTopologyMode;
}

export const DailyEnergyKpiRibbon: React.FC<DailyEnergyKpiRibbonProps> = ({
  summary,
  systemTopology,
}) => {
  const hasBattery = systemTopology !== 'grid_tie';
  const hasClippingOrCurtailment = summary.totalClippedPvKwh > 0.05;

  const cards = [
    {
      id: 'solar-yield',
      label: 'Solar Produced Today',
      value: `${summary.totalHarvestedPvKwh.toFixed(1)}`,
      unit: 'kWh',
      subtext: `Raw roof potential ${summary.totalPotentialPvKwh.toFixed(1)} kWh`,
      explain: 'Total clean electricity harvested from your roof panels over 24 hours.',
      icon: Sun,
      accentText: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      progressPct: Math.min(100, (summary.totalHarvestedPvKwh / 45) * 100),
      progressColor: 'bg-amber-500',
    },
    {
      id: 'self-powered',
      label: 'Home Energy Independence',
      value: `${summary.selfSufficiencyPercent.toFixed(0)}`,
      unit: '%',
      subtext: `${summary.solarSelfConsumptionPercent.toFixed(0)}% of solar used on-site`,
      explain: 'Share of your 24-hour household electricity covered by solar and battery.',
      icon: ShieldCheck,
      accentText: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      progressPct: Math.min(100, summary.selfSufficiencyPercent),
      progressColor: 'bg-emerald-500',
    },
    {
      id: 'battery-cycled',
      label: 'Stored Battery Power Used',
      value: hasBattery ? `${summary.batteryDischargedKwh.toFixed(1)}` : '0.0',
      unit: 'kWh',
      subtext: hasBattery
        ? `Charged +${summary.batteryChargedKwh.toFixed(1)} kWh from sun`
        : 'Grid-Tie mode (no battery)',
      explain: hasBattery
        ? 'Solar energy saved during the day and used to run your home at night.'
        : 'Switch to Hybrid mode in System Specs to store daytime solar for night use.',
      icon: BatteryCharging,
      accentText: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      progressPct: hasBattery
        ? Math.min(100, (summary.batteryDischargedKwh / 15) * 100)
        : 0,
      progressColor: 'bg-teal-500',
    },
    {
      id: 'grid-import',
      label: 'Bought from Utility Grid',
      value: `${summary.gridImportedKwh.toFixed(1)}`,
      unit: 'kWh',
      subtext: `Total home demand ${summary.totalLoadConsumedKwh.toFixed(1)} kWh`,
      explain: 'Remaining electricity drawn from your utility when solar and battery are low.',
      icon: ArrowDownLeft,
      accentText: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      progressPct:
        summary.totalLoadConsumedKwh > 0
          ? Math.min(100, (summary.gridImportedKwh / summary.totalLoadConsumedKwh) * 100)
          : 0,
      progressColor: 'bg-sky-500',
    },
    {
      id: 'export-or-loss',
      label: hasClippingOrCurtailment ? 'Unused / Clipped Solar' : 'Extra Solar Sent to Grid',
      value: hasClippingOrCurtailment
        ? `${summary.totalClippedPvKwh.toFixed(1)}`
        : `${summary.gridExportedKwh.toFixed(1)}`,
      unit: 'kWh',
      subtext: hasClippingOrCurtailment
        ? `Clipped ${summary.inverterClippedKwh.toFixed(1)} • Curtailed ${summary.zeroExportCurtailedKwh.toFixed(1)} kWh`
        : 'Surplus exported via Net Metering',
      explain: hasClippingOrCurtailment
        ? 'Midday solar that exceeded inverter capacity or Zero-Export limits.'
        : 'Excess daytime solar sent back to the utility grid for bill credits.',
      icon: hasClippingOrCurtailment ? AlertTriangle : ArrowUpRight,
      accentText: hasClippingOrCurtailment
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-indigo-600 dark:text-indigo-400',
      iconBg: hasClippingOrCurtailment
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      progressPct: hasClippingOrCurtailment
        ? Math.min(100, (summary.totalClippedPvKwh / 10) * 100)
        : Math.min(100, (summary.gridExportedKwh / 25) * 100),
      progressColor: hasClippingOrCurtailment ? 'bg-amber-500' : 'bg-indigo-500',
    },
  ];

  return (
    <section
      aria-label="24-Hour Daily Energy Summary"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 flex flex-col justify-between gap-4 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.06)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.45)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-snug">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight ${card.accentText}`}
                >
                  {card.value}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                  {card.unit}
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden mt-3 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${card.progressColor}`}
                  style={{ width: `${Math.max(4, card.progressPct)}%` }}
                />
              </div>

              <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 truncate">
                {card.subtext}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-1 line-clamp-2">
                {card.explain}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
};
