// src/components/summary/SystemSummary.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Sun, Zap, Battery, Ratio, ShieldAlert, Cpu } from 'lucide-react';

export function SystemSummary() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { summary, warnings } = calculationResult;

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
            TELEMETRY HUD
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Live Engineering Summary</h2>
        </div>

        {/* System Health Badge */}
        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              <ShieldAlert className="w-3.5 h-3.5" />
              {errorCount} DESIGN HAZARD{errorCount > 1 ? 'S' : ''}
            </span>
          ) : warningCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <ShieldAlert className="w-3.5 h-3.5" />
              {warningCount} ADVISORY
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ELECTRICAL PARAMETERS NORMAL
            </span>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: PV Array Peak */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">Array Peak</span>
            <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.totalArrayPowerKw} <span className="text-xs font-normal text-slate-400">kWp</span>
          </div>
          <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold mt-1 truncate">
            {summary.totalPanels}x {summary.moduleModel}
          </div>
        </div>

        {/* KPI 2: Inverter Rating */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">Inverter AC</span>
            <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.inverterPowerKw} <span className="text-xs font-normal text-slate-400">kW</span>
          </div>
          <div className="text-[10px] font-mono text-sky-700 dark:text-sky-400 font-semibold mt-1 truncate">
            {summary.inverterModel}
          </div>
        </div>

        {/* KPI 3: DC / AC Ratio */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">DC/AC Ratio</span>
            <Ratio className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.dcAcRatio}
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
            {summary.dcAcRatio > 1.3 ? 'Aggressive DC Overload' : 'Optimal Solar Parity'}
          </div>
        </div>

        {/* KPI 4: Battery Storage */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">Battery Bank</span>
            <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {calculationResult.battery.hasBattery
              ? (calculationResult.battery.totalEnergyWh / 1000).toFixed(1)
              : '0.0'}{' '}
            <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-1 truncate">
            {calculationResult.battery.hasBattery
              ? `${calculationResult.battery.bankVoltageV}V / ${calculationResult.battery.totalCapacityAh}Ah`
              : 'Grid-Tied Direct'}
          </div>
        </div>

        {/* KPI 5: DC Breaker */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">DC Breaker</span>
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {calculationResult.dc.breakerRatingA}{' '}
            <span className="text-xs font-normal text-slate-400">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
            Load: {calculationResult.dc.computedCurrentA} A
          </div>
        </div>

        {/* KPI 6: AC Breaker */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">AC Breaker</span>
            <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">
            {calculationResult.ac.breakerRatingA}{' '}
            <span className="text-xs font-normal text-slate-400">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
            Load: {calculationResult.ac.computedCurrentA} A
          </div>
        </div>
      </div>
    </div>
  );
}
