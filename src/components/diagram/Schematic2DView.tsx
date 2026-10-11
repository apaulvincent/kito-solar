// src/components/diagram/Schematic2DView.tsx
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { DiagramNodeKey } from '@/types/diagram';
import { Sun, Shield, Cpu, BatteryCharging, Network, Cable, Home, Zap } from 'lucide-react';

export function Schematic2DView() {
  const calculationResult = useCalculatorStore((s) => s.calculationResult);
  const selectedNodeKey = useCalculatorStore((s) => s.selectedNodeKey);
  const hoveredNodeKey = useCalculatorStore((s) => s.hoveredNodeKey);
  const setSelectedNodeKey = useCalculatorStore((s) => s.setSelectedNodeKey);
  const setHoveredNodeKey = useCalculatorStore((s) => s.setHoveredNodeKey);
  const atsSource = useCalculatorStore((s) => s.atsSource);
  const toggleAtsSource = useCalculatorStore((s) => s.toggleAtsSource);

  const isHybrid = calculationResult.systemType === 'hybrid' && calculationResult.battery.hasBattery;

  const triggerSelect = (key: DiagramNodeKey) => {
    setSelectedNodeKey(key);
  };

  const getNodeClasses = (key: DiagramNodeKey, baseColor = 'amber') => {
    const isSelected = selectedNodeKey === key;
    const isHovered = hoveredNodeKey === key;

    let borderRing = 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow';
    if (isSelected) {
      if (baseColor === 'amber') borderRing = 'border-amber-600 dark:border-amber-500 ring-4 ring-amber-500/25 shadow-lg scale-105';
      else if (baseColor === 'red') borderRing = 'border-red-600 dark:border-red-500 ring-4 ring-red-500/25 shadow-lg scale-105';
      else if (baseColor === 'emerald') borderRing = 'border-emerald-600 dark:border-emerald-500 ring-4 ring-emerald-500/25 shadow-lg scale-105';
      else if (baseColor === 'sky') borderRing = 'border-sky-600 dark:border-sky-500 ring-4 ring-sky-500/25 shadow-lg scale-105';
      else if (baseColor === 'purple') borderRing = 'border-purple-600 dark:border-purple-500 ring-4 ring-purple-500/25 shadow-lg scale-105';
      else borderRing = 'border-slate-800 dark:border-slate-400 ring-4 ring-slate-400/25 shadow-lg scale-105';
    } else if (isHovered) {
      borderRing = 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/30 shadow-md scale-[1.03]';
    }

    return `flex flex-col items-center p-3 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all select-none ${borderRing}`;
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-[#090D16] relative p-6 overflow-x-auto flex flex-col items-center justify-start select-none transition-colors duration-200">
      {/* Precision Blueprint Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Schematic Container with Fixed Layout Spine */}
      <div className="relative z-10 flex flex-col items-center gap-8 min-w-[1180px] py-4">
        {/* Title & Sequence Breadcrumb */}
        <div className="w-full flex items-center justify-between px-4 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Single-Line Diagram (SLD)
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              NEC 690 / PEC / IEC 62548 Compliant Sequence
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-amber-500 rounded-sm" /> DC Bus (0-1000V)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-emerald-500 rounded-sm" /> Battery Bus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-sky-500 rounded-sm" /> AC Bus (230V)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-emerald-600 border border-emerald-400 border-dashed rounded-sm" /> PE Ground
            </span>
          </div>
        </div>

        {/* Main Horizontal Single-Line Circuit Flow */}
        <div className="flex items-center gap-3 w-full justify-between pt-2">
          {/* Node 1: PV Array */}
          <div className="flex flex-col items-center relative">
            <div
              onClick={() => triggerSelect('pv_array')}
              onMouseEnter={() => setHoveredNodeKey('pv_array')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('pv_array', 'sky')}
            >
              <div className="w-11 h-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1.5">
                <Sun className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">GEN • 01</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">PV ARRAY</span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                {calculationResult.summary.totalArrayPowerKw} kWp
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                {calculationResult.summary.totalPanels} Modules
              </span>
            </div>
            {/* Grounding drop tap */}
            <div className="w-0.5 h-12 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>

          {/* DC Busbar Line 1: PV Array -> DC Isolator */}
          <div className="h-0.5 flex-1 max-w-[48px] bg-amber-500 relative flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>

          {/* Node 2: DC Rotary Isolator Switch (First in DC sequence per NEC 690) */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => triggerSelect('dc_isolator')}
              onMouseEnter={() => setHoveredNodeKey('dc_isolator')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('dc_isolator', 'amber')}
            >
              <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">DISC • Q1</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC ISOLATOR</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                {calculationResult.dc.isolatorRatingA} A
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                1000V DC 4-Pole
              </span>
            </div>
            <div className="h-14" />
          </div>

          {/* DC Busbar Line 2: DC Isolator -> DC Protection Cluster */}
          <div className="h-0.5 flex-1 max-w-[40px] bg-amber-500" />

          {/* Node 3: DC Protection Cluster (DC Breaker in Series + DC SPD in Parallel) */}
          <div className="flex flex-col items-center gap-2">
            {/* DC Circuit Breaker (Series path) */}
            <div
              onClick={() => triggerSelect('dc_breaker')}
              onMouseEnter={() => setHoveredNodeKey('dc_breaker')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('dc_breaker', 'red')}
            >
              <div className="w-11 h-11 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 mb-1.5">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">OCPD • CB1</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">DC BREAKER</span>
              <span className="text-[11px] font-mono text-red-600 dark:text-red-400 font-bold">
                {calculationResult.dc.breakerRatingA} A
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                {calculationResult.dc.computedCurrentA} A Icont
              </span>
            </div>

            {/* Parallel Branch Line to DC SPD */}
            <div className="w-0.5 h-2 bg-amber-500" />

            {/* DC Surge Protective Device (SPD) - Connected in parallel to Ground */}
            <div
              onClick={() => triggerSelect('dc_spd')}
              onMouseEnter={() => setHoveredNodeKey('dc_spd')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('dc_spd', 'emerald')}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">DC SPD</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {calculationResult.dc.spdRating}
              </span>
              <span className="text-[8px] font-mono text-slate-400">Type 2 Arrester</span>
            </div>

            {/* SPD Ground discharge lead down to grounding busbar */}
            <div className="w-0.5 h-3 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>

          {/* DC Busbar Line 3: DC Protection -> Inverter MPPT Input */}
          <div className="h-0.5 flex-1 max-w-[40px] bg-amber-500 relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>

          {/* Node 4: Central Solar Inverter with Hybrid Battery Branch */}
          <div className="flex flex-col items-center relative">
            <div
              onClick={() => triggerSelect('inverter')}
              onMouseEnter={() => setHoveredNodeKey('inverter')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={`flex flex-col items-center p-3.5 rounded-2xl border-2 bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-all ${
                selectedNodeKey === 'inverter'
                  ? 'border-amber-600 dark:border-amber-500 ring-4 ring-amber-500/25 scale-105 shadow-xl'
                  : hoveredNodeKey === 'inverter'
                  ? 'border-amber-500 ring-2 ring-amber-400/30 scale-[1.02] shadow-md'
                  : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:shadow-lg'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm mb-1.5">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">INV • 01</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {calculationResult.summary.inverterModel}
              </span>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-black mt-0.5">
                {calculationResult.summary.inverterPowerKw} kW AC
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                {calculationResult.systemType} INVERTER
              </span>
            </div>

            {/* Hybrid Battery Dropdown Branch */}
            {isHybrid ? (
              <div className="flex flex-col items-center pt-2">
                {/* Conduit link from Inverter DC port to Battery Breaker */}
                <div className="w-0.5 h-3 bg-emerald-500" />

                {/* Node: Battery Breaker (MCCB) */}
                <div
                  onClick={() => triggerSelect('battery_breaker')}
                  onMouseEnter={() => setHoveredNodeKey('battery_breaker')}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  className={getNodeClasses('battery_breaker', 'emerald')}
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">BATTERY MCCB</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {calculationResult.battery.recommendedBreakerA} A
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">DC Molded Case</span>
                </div>

                {/* Conduit link from Battery Breaker to Battery Storage Bank */}
                <div className="w-0.5 h-3 bg-emerald-500" />

                {/* Node: Battery Storage Bank */}
                <div
                  onClick={() => triggerSelect('battery')}
                  onMouseEnter={() => setHoveredNodeKey('battery')}
                  onMouseLeave={() => setHoveredNodeKey(null)}
                  className={getNodeClasses('battery', 'emerald')}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1">
                    <BatteryCharging className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">
                    BATTERY BANK
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {(calculationResult.battery.totalEnergyWh / 1000).toFixed(1)} kWh
                  </span>
                  <span className="text-[8px] text-slate-400">
                    {calculationResult.battery.bankVoltageV}V Nominal
                  </span>
                </div>

                {/* Grounding tap from battery chassis */}
                <div className="w-0.5 h-3 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-16 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </div>
            )}
          </div>

          {/* AC Busbar Line 4: Inverter -> AC Protection Cluster */}
          <div className="h-0.5 flex-1 max-w-[40px] bg-sky-500 relative flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          </div>

          {/* Node 5: AC Protection Cluster (AC Breaker + AC SPD in Parallel) */}
          <div className="flex flex-col items-center gap-2">
            {/* AC Circuit Breaker (Series path) */}
            <div
              onClick={() => triggerSelect('ac_breaker')}
              onMouseEnter={() => setHoveredNodeKey('ac_breaker')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('ac_breaker', 'sky')}
            >
              <div className="w-11 h-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-1.5">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">OCPD • CB2</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC BREAKER</span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                {calculationResult.ac.breakerRatingA} A
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                {calculationResult.ac.computedCurrentA} A Icont
              </span>
            </div>

            {/* Parallel Branch Line to AC SPD */}
            <div className="w-0.5 h-2 bg-sky-500" />

            {/* AC Surge Protective Device (SPD) */}
            <div
              onClick={() => triggerSelect('ac_spd')}
              onMouseEnter={() => setHoveredNodeKey('ac_spd')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('ac_spd', 'emerald')}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-slate-800 dark:text-slate-200">AC SPD</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {calculationResult.ac.spdRating}
              </span>
              <span className="text-[8px] font-mono text-slate-400">Type 2 Arrester</span>
            </div>

            {/* SPD Ground discharge lead down to grounding busbar */}
            <div className="w-0.5 h-3 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>

          {/* AC Busbar Line 5: AC Protection -> AC Isolator */}
          <div className="h-0.5 flex-1 max-w-[40px] bg-sky-500" />

          {/* Node 6: AC Isolator Switch */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => triggerSelect('ac_isolator')}
              onMouseEnter={() => setHoveredNodeKey('ac_isolator')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('ac_isolator', 'amber')}
            >
              <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">DISC • Q2</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">AC ISOLATOR</span>
              <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                {calculationResult.ac.isolatorRatingA} A
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                Rotary Disconnect
              </span>
            </div>
            <div className="h-14" />
          </div>

          {/* AC Busbar Line 6: AC Isolator -> ATS */}
          <div
            className={`h-0.5 flex-1 max-w-[40px] transition-all duration-300 ${
              atsSource === 'solar'
                ? 'bg-sky-500 shadow-[0_0_4px_rgba(2,132,199,0.5)]'
                : 'border-t border-dashed border-slate-400 dark:border-slate-600 bg-transparent opacity-40'
            }`}
          />

          {/* Node 7: ATS Switch */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => {
                triggerSelect('ats');
                toggleAtsSource();
              }}
              onMouseEnter={() => setHoveredNodeKey('ats')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('ats', atsSource === 'solar' ? 'amber' : 'emerald')}
              title="Click to toggle ATS Transfer Switch source"
            >
              <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-1.5">
                <Cable className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">XFER • ATS</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">ATS SWITCH</span>
              <span
                className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded mt-0.5 shadow-sm transition-colors ${
                  atsSource === 'solar'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                }`}
              >
                {atsSource === 'solar' ? 'SOLAR (LEFT)' : 'UTILITY (RIGHT)'}
              </span>
              <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
                Click to switch
              </span>
            </div>
            <div className="h-14" />
          </div>

          {/* AC Busbar Line 7: ATS -> Main Panel */}
          <div className="h-0.5 flex-1 max-w-[40px] bg-sky-500" />

          {/* Node 8: Main Distribution Panel */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => triggerSelect('main_panel')}
              onMouseEnter={() => setHoveredNodeKey('main_panel')}
              onMouseLeave={() => setHoveredNodeKey(null)}
              className={getNodeClasses('main_panel', 'slate')}
            >
              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-1.5">
                <Network className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400">MDB • 01</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">MAIN PANEL</span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">
                230V AC
              </span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution
              </span>
            </div>
            {/* Ground bonding tap */}
            <div className="w-0.5 h-12 bg-emerald-600/60 border-l border-dashed border-emerald-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          </div>

          {/* Split Feeds to Utility Grid & Building Load */}
          <div className="flex flex-col gap-4 pl-1">
            {/* Utility Grid Feed */}
            <div className="flex items-center gap-2">
              <div
                className={`h-0.5 w-5 transition-all duration-300 ${
                  atsSource === 'utility'
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                    : 'bg-slate-300 dark:bg-slate-700 opacity-40'
                }`}
              />
              <div
                onClick={() => triggerSelect('grid')}
                onMouseEnter={() => setHoveredNodeKey('grid')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={`flex items-center gap-2 p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
                  selectedNodeKey === 'grid'
                    ? 'border-slate-800 dark:border-slate-300 ring-2 ring-slate-400/30 scale-105'
                    : hoveredNodeKey === 'grid'
                    ? 'border-slate-400 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <Network className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">UTILITY GRID</span>
                  <span className="text-[9px] font-mono text-slate-500">230V Interconnect</span>
                </div>
              </div>
            </div>

            {/* Building Load Feed */}
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-5 bg-sky-500" />
              <div
                onClick={() => triggerSelect('load')}
                onMouseEnter={() => setHoveredNodeKey('load')}
                onMouseLeave={() => setHoveredNodeKey(null)}
                className={`flex items-center gap-2 p-2 rounded-xl border bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-all ${
                  selectedNodeKey === 'load'
                    ? 'border-sky-600 dark:border-sky-400 ring-2 ring-sky-400/30 scale-105'
                    : hoveredNodeKey === 'load'
                    ? 'border-sky-400 scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-sky-400'
                }`}
              >
                <Home className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">BUILDING LOAD</span>
                  <span className="text-[9px] font-mono text-slate-500">Facility Demand</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Equipment Grounding Busbar (PE / EGC) Along The Base */}
        <div
          onClick={() => triggerSelect('grounding')}
          onMouseEnter={() => setHoveredNodeKey('grounding')}
          onMouseLeave={() => setHoveredNodeKey(null)}
          className={`w-full rounded-xl border p-3 flex items-center justify-between cursor-pointer transition-all ${
            selectedNodeKey === 'grounding'
              ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-4 ring-emerald-500/20 shadow-md scale-[1.01]'
              : hoveredNodeKey === 'grounding'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-400/20'
              : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-sm">
              <Shield className="w-3.5 h-3.5" />
              PE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  EQUIPMENT GROUNDING BUSBAR (SOLID COPPER PE BUS)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {calculationResult.dc.groundConductorSpec} Conductor
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Continuous equipotential bond linking PV racking frame, DC SPD, Inverter chassis, BESS enclosure, AC SPD, and Main Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <span>⏚ EARTH GROUND ROD</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">(&lt; 5 Ω Resistance)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
