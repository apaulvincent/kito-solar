// src/features/combiner-builder/components/CombinerBox2DSchematic.tsx
import { useMemo } from 'react';
import { ArrowDown, ArrowUp, Zap, Shield, Gauge, Power } from 'lucide-react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { CombinerComponentInstance } from '../types';

export function CombinerBox2DSchematic() {
  const theme = useCalculatorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);
  const isEnergized = useCombinerBoxStore((s) => s.isEnergized);
  const atsSourceState = useCombinerBoxStore((s) => s.atsSourceState);
  const setAtsSourceState = useCombinerBoxStore((s) => s.setAtsSourceState);
  const selectedComponentId = useCombinerBoxStore((s) => s.selectedComponentId);
  const setSelectedComponent = useCombinerBoxStore((s) => s.setSelectedComponent);
  const toggleBreakerSwitch = useCombinerBoxStore((s) => s.toggleBreakerSwitch);

  const grouped = useMemo(() => {
    const top = components
      .filter((c) => c.mountZone === 'rail_top')
      .sort((a, b) => a.railSlotIndex - b.railSlotIndex);
    const middle = components
      .filter((c) => c.mountZone === 'rail_middle')
      .sort((a, b) => a.railSlotIndex - b.railSlotIndex);
    const bottom = components.filter((c) => c.mountZone === 'bottom_plate');
    const busbar = components.find((c) => c.mountZone === 'side_busbar');
    return { top, middle, bottom, busbar };
  }, [components]);

  const getBadgeTone = (comp: CombinerComponentInstance) => {
    if (comp.category === 'dc_mcb' || comp.category === 'dc_isolator' || comp.category === 'dc_spd') {
      return isDark
        ? 'border-amber-500/60 bg-amber-950/35 text-amber-200'
        : 'border-amber-600/60 bg-amber-50 text-amber-900';
    }
    if (comp.category === 'ats_cb' || comp.category === 'ats_solenoid') {
      return isDark
        ? 'border-emerald-500/70 bg-emerald-950/45 text-emerald-200'
        : 'border-emerald-700/70 bg-emerald-50 text-emerald-950';
    }
    if (comp.category === 'din_meter' || comp.category === 'digital_protector') {
      return isDark
        ? 'border-indigo-400/60 bg-indigo-950/40 text-indigo-200'
        : 'border-indigo-600/60 bg-indigo-50 text-indigo-950';
    }
    return isDark
      ? 'border-sky-500/60 bg-slate-900 text-slate-100'
      : 'border-sky-600/60 bg-white text-slate-900';
  };

  const renderNodeCard = (comp: CombinerComponentInstance) => {
    const isSelected = selectedComponentId === comp.id;
    const isAts = comp.category === 'ats_cb' || comp.category === 'ats_solenoid';
    const canToggle = !['dc_spd', 'ac_spd', 'pe_busbar', 'terminal_block', 'din_meter', 'digital_protector'].includes(comp.category);

    return (
      <div
        key={comp.id}
        onClick={() => setSelectedComponent(comp.id)}
        className={`rounded-xl border-2 p-2 min-w-[112px] flex-1 flex flex-col gap-1 cursor-pointer transition-all shadow-sm ${getBadgeTone(comp)} ${
          isSelected ? 'ring-2 ring-amber-500 scale-[1.02]' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between gap-1 text-[10px] font-mono uppercase opacity-80">
          <span>{comp.brand}</span>
          <span>{comp.ratedAmps > 0 ? `${comp.ratedAmps}A` : 'SPD'}</span>
        </div>
        <div className="text-xs font-bold leading-tight">{comp.name}</div>
        <div className="text-[10px] font-mono opacity-80">{comp.ratedVoltage}</div>
        {isAts ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAtsSourceState(
                atsSourceState === 'source_a'
                  ? 'source_b'
                  : atsSourceState === 'source_b'
                  ? 'off'
                  : 'source_a',
              );
            }}
            className="mt-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold cursor-pointer"
          >
            {atsSourceState === 'source_a'
              ? 'ACTIVE: INV (A)'
              : atsSourceState === 'source_b'
              ? 'ACTIVE: GRID (B)'
              : 'OFF (0)'}
          </button>
        ) : canToggle ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleBreakerSwitch(comp.id);
            }}
            className={`mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
              comp.isSwitchOn
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {comp.isSwitchOn ? 'CLOSED (ON)' : 'OPEN (TRIP)'}
          </button>
        ) : comp.category === 'din_meter' ? (
          <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300">
            1239.3W • 235.6V
          </div>
        ) : comp.category === 'digital_protector' ? (
          <div className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-rose-400">
            230V / {comp.ratedAmps}A
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={`w-full h-full overflow-auto p-5 select-none ${
        isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Live External Feed Banner (Grid In, Inverter In, PV Strings, Load Out) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className={`rounded-xl border-2 px-3 py-2 flex items-center justify-between ${
              isDark
                ? 'bg-sky-950/40 border-sky-500/70 text-sky-200'
                : 'bg-sky-50 border-sky-600 text-sky-950'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono font-bold uppercase">Grid In (230V AC)</div>
              <div className="text-xs font-bold">Utility L (Orange) + N (Blue)</div>
            </div>
            <ArrowDown className={`w-4 h-4 ${isEnergized ? 'animate-bounce text-sky-500' : ''}`} />
          </div>

          <div
            className={`rounded-xl border-2 px-3 py-2 flex items-center justify-between ${
              isDark
                ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                : 'bg-amber-50 border-amber-600 text-amber-950'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono font-bold uppercase">Inverter In (230V AC)</div>
              <div className="text-xs font-bold">Solar AC Out (Red + Blue)</div>
            </div>
            <ArrowDown className={`w-4 h-4 ${isEnergized ? 'animate-bounce text-amber-500' : ''}`} />
          </div>

          <div
            className={`rounded-xl border-2 px-3 py-2 flex items-center justify-between ${
              isDark
                ? 'bg-orange-950/40 border-orange-500/70 text-orange-200'
                : 'bg-orange-50 border-orange-600 text-orange-950'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono font-bold uppercase">PV String In (1000V DC)</div>
              <div className="text-xs font-bold">DC+ (Red) / DC- (Black)</div>
            </div>
            <Zap className="w-4 h-4 text-orange-500" />
          </div>

          <div
            className={`rounded-xl border-2 px-3 py-2 flex items-center justify-between ${
              isDark
                ? 'bg-purple-950/40 border-purple-500/70 text-purple-200'
                : 'bg-purple-50 border-purple-600 text-purple-950'
            }`}
          >
            <div>
              <div className="text-[10px] font-mono font-bold uppercase">Critical Load Out</div>
              <div className="text-xs font-bold">From 40A & 30A MCBs</div>
            </div>
            <ArrowUp className="w-4 h-4 text-purple-500" />
          </div>
        </div>

        {/* Combiner Box Perimeter Frame (2D Single-Line Schematic) */}
        <div
          className={`rounded-2xl border-4 p-4 space-y-5 shadow-lg ${
            isDark
              ? 'bg-slate-800/80 border-slate-500'
              : 'bg-slate-200/90 border-slate-600'
          }`}
        >
          {/* Top DIN Rail Schematic Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className={isDark ? 'text-sky-300' : 'text-sky-900'}>
                TOP DIN-RAIL: AC MAINS INPUT, ATS TRANSFER & INVERTER FEED
              </span>
              <span className="opacity-75">{wires.length} Active Conductors</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-stretch">
              {grouped.top.map((comp) => renderNodeCard(comp))}
            </div>
          </div>

          {/* Middle DIN Rail Schematic Row */}
          <div className="space-y-2 pt-3 border-t border-slate-400/40">
            <div className="text-xs font-mono font-bold">
              <span className={isDark ? 'text-amber-300' : 'text-amber-900'}>
                MIDDLE DIN-RAIL: PV DC ISOLATION, SURGE PROTECTION, METERING & SUB-LOADS
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-stretch">
              {grouped.middle.map((comp) => renderNodeCard(comp))}
            </div>
          </div>

          {/* Earth Busbar & Optional Bottom Mount */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-400/40 text-xs font-mono">
            {grouped.bottom.length > 0 ? (
              <div className="flex items-center gap-3">
                {grouped.bottom.map((comp) => renderNodeCard(comp))}
              </div>
            ) : (
              <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                <Power className="w-4 h-4" />
                <span>Combiner Box Configuration: PV + AC Mains + 100A ATS Only (External Battery Excluded)</span>
              </div>
            )}

            {grouped.busbar && (
              <div
                className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 font-bold ${
                  isDark
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-700 text-emerald-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{grouped.busbar.name} (Earth Ground Bonded)</span>
                <Gauge className="w-4 h-4 opacity-70" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
