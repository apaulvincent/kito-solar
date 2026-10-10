// src/components/results/BatteryResultsCard.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { BatteryCharging, Shield, Cable, ArrowRight } from 'lucide-react';
import { DiagramNodeKey } from '@/types/diagram';

export function BatteryResultsCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);

  const { battery } = calculationResult;

  if (!battery.hasBattery) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-5 text-center space-y-2 transition-colors duration-200">
        <div className="inline-flex p-3 rounded-full bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 mb-1 shadow-subtle">
          <BatteryCharging className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Energy Storage Not Applicable</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          System is currently sized as a grid-tied installation or no battery bank has been configured. Select a hybrid inverter and attach battery units to calculate DC storage protection and cable gauges.
        </p>
      </div>
    );
  }

  const triggerLocate = (key: DiagramNodeKey) => {
    setSelectedNodeKey(key);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-700 dark:text-emerald-400 font-bold">
              ENERGY STORAGE PROTECTION & DC BUS CONDUCTION
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Battery Electrical Calculations</h3>
          </div>
        </div>

        <button
          onClick={() => triggerLocate('battery')}
          className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors"
        >
          Locate on 3D Diagram <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Battery Breaker */}
        <div
          onClick={() => triggerLocate('battery_breaker')}
          onMouseEnter={() => setHoveredNodeKey('battery_breaker')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'battery_breaker'
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Battery DC MCCB</span>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {battery.recommendedBreakerA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Discharge Rating: {battery.dischargeCurrentA} A
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
            {battery.explanation.breaker}
          </p>
        </div>

        {/* Battery Wire */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Battery DC Conductor</span>
            <Cable className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 break-words leading-tight">
            {battery.wireSpec}
          </div>
          <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
            High-Amp Flexible Welding / THHN
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
            {battery.explanation.wire}
          </p>
        </div>

        {/* Bank Capacity & Sizing */}
        <div
          onClick={() => triggerLocate('battery')}
          onMouseEnter={() => setHoveredNodeKey('battery')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'battery'
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Usable Energy Capacity</span>
            <BatteryCharging className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {(battery.totalEnergyWh / 1000).toFixed(1)} kWh
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            {battery.bankVoltageV} V Nominal / {battery.totalCapacityAh} Ah
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
            {battery.explanation.sizing}
          </p>
        </div>
      </div>
    </div>
  );
}
