// src/components/summary/SystemSummary.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Sun, Zap, Battery, Ratio, ShieldAlert, Cpu, Leaf } from 'lucide-react';
import { calculateCarbonOffset } from '@/engine/carbonOffset';

export function SystemSummary() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const { summary, warnings } = calculationResult;

  const carbon = calculateCarbonOffset({
    totalArrayPowerKw: summary.totalArrayPowerKw,
  });

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400 font-bold">
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
            <Sun className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
            {summary.totalArrayPowerKw} <span className="text-xs font-normal text-slate-400">kWp</span>
          </div>
          <div className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-semibold mt-1 break-words">
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
          <div className="text-[10px] font-mono text-sky-700 dark:text-sky-400 font-semibold mt-1 break-words">
            {summary.inverterModel}
          </div>
        </div>

        {/* KPI 3: DC / AC Ratio */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">DC/AC Ratio</span>
            <Ratio className="w-4 h-4 text-amber-700 dark:text-amber-400" />
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
          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-1 break-words">
            {calculationResult.battery.hasBattery
              ? `${calculationResult.battery.bankVoltageV}V / ${calculationResult.battery.totalCapacityAh}Ah`
              : 'Grid-Tied Direct'}
          </div>
        </div>

        {/* KPI 5: DC Breaker */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-medium">DC Breaker</span>
            <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
            {calculationResult.dc.breakerRatingA}{' '}
            <span className="text-xs font-normal text-slate-400">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1">
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
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1">
            Load: {calculationResult.ac.computedCurrentA} A
          </div>
        </div>
      </div>

      {/* Environmental Offset Banner */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Environmental Offset (DOE GEF: {carbon.gridEmissionFactor} kg CO2/kWh)
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
            {carbon.annualGenerationKwh.toLocaleString()} kWh/yr Clean Generation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Annual CO2 Avoided</div>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {carbon.annualCo2AvoidedTons} <span className="text-[10px] font-normal text-slate-500">MT/yr</span>
            </div>
            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
              {carbon.annualCo2AvoidedKg.toLocaleString()} kg CO2e
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">25-Yr Lifetime CO2</div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {carbon.lifetimeCo2AvoidedTons} <span className="text-[10px] font-normal text-slate-500">MT</span>
            </div>
            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
              {carbon.lifetimeGenerationKwh.toLocaleString()} kWh lifetime
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Trees Seedling Eq.</div>
            <div className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
              {carbon.treesSeedlingsGrown10Yr.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-slate-500">trees</span>
            </div>
            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
              Grown for 10 years
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Fossil Fuel Avoided</div>
            <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {carbon.coalAvoidedMetricTons} <span className="text-[10px] font-normal text-slate-500">MT coal</span>
            </div>
            <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-0.5">
              {carbon.barrelsOilAvoided} barrels oil eq.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
