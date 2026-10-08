// src/components/results/DcResultsCard.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Zap, Shield, Cable, ArrowRight, Check } from 'lucide-react';
import { DiagramNodeKey } from '@/types/diagram';

export function DcResultsCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);

  const { dc } = calculationResult;

  const triggerLocate = (key: DiagramNodeKey) => {
    setSelectedNodeKey(key);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-amber-600 dark:text-amber-400 font-bold">
              PHOTOVOLTAIC DC SIDE PROTECTION & CONDUCTION
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">DC Electrical Calculations</h3>
          </div>
        </div>

        <button
          onClick={() => triggerLocate('dc_breaker')}
          className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors"
        >
          Locate on 3D Diagram <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* DC Breaker */}
        <div
          onClick={() => triggerLocate('dc_breaker')}
          onMouseEnter={() => setHoveredNodeKey('dc_breaker')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'dc_breaker'
              ? 'border-red-500 bg-red-50/70 dark:bg-red-950/40 ring-2 ring-red-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>PV DC Circuit Breaker</span>
            <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black font-mono text-red-600 dark:text-red-400 mt-1">
            {dc.breakerRatingA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Computed: {dc.computedCurrentA} A ({dc.rawCurrentA} A Isc × 125%)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.breaker}
          </p>
        </div>

        {/* DC Homerun Wire */}
        <div
          onClick={() => triggerLocate('dc_conduit')}
          onMouseEnter={() => setHoveredNodeKey('dc_conduit')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>PV Homerun Conductor</span>
            <Cable className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 truncate" title={dc.wireSpec}>
            {dc.wireSpec.split(' cable')[0]}
          </div>
          <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold mt-1">
            {dc.wireNote}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.wire}
          </p>
        </div>

        {/* DC Isolator */}
        <div
          onClick={() => triggerLocate('dc_isolator')}
          onMouseEnter={() => setHoveredNodeKey('dc_isolator')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'dc_isolator'
              ? 'border-amber-600 dark:border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 ring-2 ring-amber-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>DC Isolator Switch</span>
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {dc.isolatorRatingA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Load-Break 1000V DC 4-Pole
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.isolator}
          </p>
        </div>

        {/* DC SPD */}
        <div
          onClick={() => triggerLocate('dc_spd')}
          onMouseEnter={() => setHoveredNodeKey('dc_spd')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'dc_spd'
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>DC Surge Protection (SPD)</span>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {dc.spdRating}
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Type 2 Cartridge (Inverter Vmax)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.spd}
          </p>
        </div>

        {/* DC Conduit */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Electrical Conduit</span>
            <Cable className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            {dc.conduitSpec}
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Standard: PVC (RMC / EMT / HDPE alt)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.conduit}
          </p>
        </div>

        {/* Grounding System */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Ground Conductor & Rod</span>
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white mt-1 truncate" title={dc.groundConductorSpec}>
            Wire: {dc.groundConductorSpec}
          </div>
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1 truncate" title={dc.groundRodSpec}>
            Rod: {dc.groundRodSpec}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-sans line-clamp-2">
            {dc.explanation.grounding}
          </p>
        </div>
      </div>
    </div>
  );
}
