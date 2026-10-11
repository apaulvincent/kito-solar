// src/components/results/AcResultsCard.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { Network, Shield, Cable, ArrowRight } from 'lucide-react';
import { DiagramNodeKey } from '@/types/diagram';

export function AcResultsCard() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const step2DetailMode = useCalculatorStore((s) => s.step2DetailMode);

  const { ac } = calculationResult;

  const triggerLocate = (key: DiagramNodeKey) => {
    setSelectedNodeKey(key);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-card dark:shadow-card-dark space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-sky-700 dark:text-sky-400 font-bold">
              ALTERNATING CURRENT DISTRIBUTION & UTILITY INTERCONNECT
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AC Electrical Calculations</h3>
          </div>
        </div>

        <button
          onClick={() => triggerLocate('ac_breaker')}
          className="text-xs font-mono font-semibold text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:underline flex items-center gap-1 transition-colors"
        >
          Locate on 3D Diagram <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* AC Grid Breaker */}
        <div
          onClick={() => triggerLocate('ac_breaker')}
          onMouseEnter={() => setHoveredNodeKey('ac_breaker')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'ac_breaker'
              ? 'border-sky-600 dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Inverter AC Grid Breaker</span>
            <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1">
            {ac.breakerRatingA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Computed: {ac.computedCurrentA} A ({ac.rawCurrentA} A × 125%)
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.breaker}
            </p>
          )}
        </div>

        {/* AC Wire */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Inverter AC Feeder Conductor</span>
            <Cable className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 break-words leading-tight">
            {ac.wireSpec}
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
            THHN/THWN Copper Multi-Conductor
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.wire}
            </p>
          )}
        </div>

        {/* AC Isolator */}
        <div
          onClick={() => triggerLocate('ac_isolator')}
          onMouseEnter={() => setHoveredNodeKey('ac_isolator')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'ac_isolator'
              ? 'border-sky-600 dark:border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>AC Isolator Switch</span>
            <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {ac.isolatorRatingA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Manual Rotary Lockable
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.isolator}
            </p>
          )}
        </div>

        {/* AC SPD */}
        <div
          onClick={() => triggerLocate('ac_spd')}
          onMouseEnter={() => setHoveredNodeKey('ac_spd')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'ac_spd'
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>AC Surge Protector (SPD)</span>
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {ac.spdRating}
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Type 2 Cartridge (Grid Matched)
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.spd}
            </p>
          )}
        </div>

        {/* ATS (Transfer Switch) */}
        <div
          onClick={() => triggerLocate('ats')}
          onMouseEnter={() => setHoveredNodeKey('ats')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedNodeKey === 'ats'
              ? 'border-purple-600 dark:border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-400/20 shadow-md scale-102'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Automatic Transfer Switch</span>
            <Cable className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {ac.atsConfigured ? `${ac.atsRatingA} A` : 'Optional'}
          </div>
          <div className="text-xs font-mono text-purple-700 dark:text-purple-400 font-semibold mt-1">
            {ac.atsNote}
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.ats}
            </p>
          )}
        </div>

        {/* EPS / Backup Breaker */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
            <span>Inverter EPS Backup Breaker</span>
            <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {ac.epsBreakerRatingA} A
          </div>
          <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mt-1">
            Dedicated Critical Loads Port
          </div>
          {step2DetailMode === 'detailed' && (
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 font-sans leading-relaxed">
              {ac.explanation.eps}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
