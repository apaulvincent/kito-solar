// src/components/diagram/Schematic2DView.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { Sun, Shield, Cpu, BatteryCharging, Network, Cable, Home } from 'lucide-react';

export function Schematic2DView() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);

  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  const triggerSelect = (key: DiagramNodeKey) => {
    setSelectedNodeKey(key);
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#090D16] relative p-6 overflow-x-auto flex items-center justify-center select-none transition-colors duration-200">
      {/* Precision Blueprint Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Main Single-Line Circuit Flow */}
      <div className="relative z-10 flex items-center gap-6 min-w-[1000px] py-8">
        {/* Node 1: PV Array */}
        <div
          onClick={() => triggerSelect('pv_array')}
          onMouseEnter={() => setHoveredNodeKey('pv_array')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`group flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'pv_array'
              ? 'border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2">
            <Sun className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">PV ARRAY</span>
          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-medium">
            {calculationResult.summary.totalArrayPowerKw} kWp
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            {calculationResult.summary.totalPanels} Modules
          </span>
        </div>

        {/* Busbar Line 1 */}
        <div className="h-0.5 w-10 bg-amber-500 relative flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        </div>

        {/* Node 2: DC Breaker */}
        <div
          onClick={() => triggerSelect('dc_breaker')}
          onMouseEnter={() => setHoveredNodeKey('dc_breaker')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'dc_breaker'
              ? 'border-red-600 dark:border-red-500 ring-2 ring-red-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC BREAKER</span>
          <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold">
            {calculationResult.dc.breakerRatingA} A
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            {calculationResult.dc.computedCurrentA} A Icont
          </span>
        </div>

        {/* Busbar Line 2 */}
        <div className="h-0.5 w-10 bg-amber-500" />

        {/* Node 3: DC Isolator */}
        <div
          onClick={() => triggerSelect('dc_isolator')}
          onMouseEnter={() => setHoveredNodeKey('dc_isolator')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'dc_isolator'
              ? 'border-amber-600 dark:border-amber-500 ring-2 ring-amber-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC ISOLATOR</span>
          <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">
            {calculationResult.dc.isolatorRatingA} A
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">1000V DC 4P</span>
        </div>

        {/* Busbar Line 3 */}
        <div className="h-0.5 w-10 bg-amber-500" />

        {/* Node 4: Solar Inverter (Central Hub) */}
        <div className="flex flex-col items-center relative">
          <div
            onClick={() => triggerSelect('inverter')}
            onMouseEnter={() => setHoveredNodeKey('inverter')}
            onMouseLeave={() => setHoveredNodeKey(null)}
            className={`flex flex-col items-center p-4 rounded-2xl border-2 bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-all ${
              selectedNodeKey === 'inverter'
                ? 'border-amber-600 dark:border-amber-500 ring-4 ring-amber-500/20 scale-105'
                : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:shadow-lg'
            }`}
          >
            <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm mb-2">
              <Cpu className="w-7 h-7" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {calculationResult.summary.inverterModel}
            </span>
            <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-black mt-0.5">
              {calculationResult.summary.inverterPowerKw} kW AC
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 mt-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {calculationResult.systemType} INVERTER
            </span>
          </div>

          {/* Hybrid Battery Dropdown Branch */}
          {isHybrid && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pt-3">
              <div className="w-0.5 h-6 bg-emerald-500" />
              <div
                onClick={() => triggerSelect('battery')}
                onMouseEnter={() => setHoveredNodeKey('battery')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={`p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all flex flex-col items-center min-w-[130px] ${
                  selectedNodeKey === 'battery'
                    ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20 scale-105'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-500'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                  BATTERY BANK
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh
                </span>
                <span className="text-[9px] text-slate-400">
                  MCCB: {calculationResult.battery.recommendedBreakerA} A
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Busbar Line 4: AC Feed */}
        <div className="h-0.5 w-10 bg-sky-500" />

        {/* Node 5: AC Breaker */}
        <div
          onClick={() => triggerSelect('ac_breaker')}
          onMouseEnter={() => setHoveredNodeKey('ac_breaker')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'ac_breaker'
              ? 'border-sky-600 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC BREAKER</span>
          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
            {calculationResult.ac.breakerRatingA} A
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            {calculationResult.ac.computedCurrentA} A Icont
          </span>
        </div>

        {/* Busbar Line 5 */}
        <div className="h-0.5 w-10 bg-sky-500" />

        {/* Node 6: AC Isolator */}
        <div
          onClick={() => triggerSelect('ac_isolator')}
          onMouseEnter={() => setHoveredNodeKey('ac_isolator')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'ac_isolator'
              ? 'border-sky-600 dark:border-sky-500 ring-2 ring-sky-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC ISOLATOR</span>
          <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 font-bold">
            {calculationResult.ac.isolatorRatingA} A
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Manual Rotary</span>
        </div>

        {/* Busbar Line 6 */}
        <div className="h-0.5 w-10 bg-sky-500" />

        {/* Node 7: ATS */}
        <div
          onClick={() => triggerSelect('ats')}
          onMouseEnter={() => setHoveredNodeKey('ats')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'ats'
              ? 'border-purple-600 dark:border-purple-500 ring-2 ring-purple-500/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
            <Cable className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">ATS SWITCH</span>
          <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
            {calculationResult.ac.atsConfigured ? `${calculationResult.ac.atsRatingA} A` : 'BYPASS'}
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">Dual Supply</span>
        </div>

        {/* Busbar Line 7 */}
        <div className="h-0.5 w-10 bg-sky-500" />

        {/* Node 8: Main Distribution Panel */}
        <div
          onClick={() => triggerSelect('main_panel')}
          onMouseEnter={() => setHoveredNodeKey('main_panel')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`flex flex-col items-center p-3.5 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
            selectedNodeKey === 'main_panel'
              ? 'border-slate-800 dark:border-slate-400 ring-2 ring-slate-400/20 shadow-md scale-105'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow'
          }`}
        >
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-2">
            <Network className="w-6 h-6" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">MAIN PANEL</span>
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold">230V AC</span>
          <span className="text-[9px] text-slate-400 mt-0.5">Distribution</span>
        </div>

        {/* Split to Grid & Load */}
        <div className="flex flex-col gap-5 pl-2">
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-6 bg-slate-400" />
            <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Network className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">UTILITY GRID</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-0.5 w-6 bg-sky-500" />
            <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">BUILDING LOAD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
