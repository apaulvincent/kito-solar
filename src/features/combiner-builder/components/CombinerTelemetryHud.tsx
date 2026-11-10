// src/features/combiner-builder/components/CombinerTelemetryHud.tsx
import { useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Gauge,
  Battery,
  ArrowRightLeft,
  Activity,
  Layers,
} from 'lucide-react';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { evaluateCombinerWiringDRC } from '../utils/combinerDrcEngine';

export function CombinerTelemetryHud() {
  const components = useCombinerBoxStore((s) => s.components);
  const wires = useCombinerBoxStore((s) => s.wires);
  const atsSourceState = useCombinerBoxStore((s) => s.atsSourceState);
  const setIsDrcModalOpen = useCombinerBoxStore((s) => s.setIsDrcModalOpen);

  // Run real-time DRC
  const drcResult = useMemo(() => {
    return evaluateCombinerWiringDRC(components, wires);
  }, [components, wires]);

  // Telemetry metric computations
  const totalSlotsUsed = components.reduce(
    (acc, c) => (c.mountZone === 'rail_top' || c.mountZone === 'rail_middle' ? acc + (c.widthMm > 70 ? 6 : 2) : acc),
    0,
  );

  const dcDevices = components.filter(
    (c) => c.category === 'dc_mcb' || c.category === 'dc_isolator',
  );
  const dcSpds = components.filter((c) => c.category === 'dc_spd');
  const batteryMccb = components.find((c) => c.category === 'battery_mccb');
  const protectors = components.filter((c) => c.category === 'digital_protector');
  const meters = components.filter((c) => c.category === 'din_meter');
  const ats = components.find((c) => c.category === 'ats_cb' || c.category === 'ats_solenoid');

  const allSpds = components.filter((c) => c.category === 'dc_spd' || c.category === 'ac_spd');
  const peWires = wires.filter((w) => w.wireColor === '#22c55e');

  const atsSourceLabel =
    atsSourceState === 'source_a'
      ? 'Source A (Inverter / Solar)'
      : atsSourceState === 'source_b'
      ? 'Source B (Utility Grid)'
      : 'Manual Disconnected (0)';

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 select-none">
      {/* 1. Box Configuration */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Enclosure Format</span>
          <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">24-Way Metal Box</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
            Slots: <span className="text-sky-700 dark:text-sky-400 font-bold">{totalSlotsUsed}</span> / 36 Modules
          </div>
        </div>
      </div>

      {/* 2. PV DC Protection */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">PV DC Protection</span>
          <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {dcDevices.length > 0 ? `${dcDevices.length}x DC Isolation @ 1000V` : 'No PV Isolated'}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
            {dcSpds.length}x DC SPD (Surge)
          </div>
        </div>
      </div>

      {/* 3. Digital Metering & VA Protectors OR Battery MCCB */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
            {batteryMccb ? 'Battery Protection' : 'VA Guard & Metering'}
          </span>
          {batteryMccb ? (
            <Battery className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {batteryMccb
              ? `${batteryMccb.ratedAmps}A 2P MCCB`
              : `${protectors.length}x Protector • ${meters.length}x Meter`}
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">
            {batteryMccb ? 'Max 8.1kW @ 51.2V DC' : 'Live Grid & Load Readout'}
          </div>
        </div>
      </div>

      {/* 4. ATS Automatic Transfer Mode */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">ATS Power Priority</span>
          <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
            {ats ? `${ats.ratedAmps}A Dual-Power` : 'No ATS Switch'}
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono truncate mt-0.5" title={atsSourceLabel}>
            {atsSourceLabel}
          </div>
        </div>
      </div>

      {/* 5. Earthing & Surge Bonding */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs backdrop-blur-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Earth Bonding</span>
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {allSpds.length}x Surge Devices
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
            PE Grounds: {peWires.length} Bonded
          </div>
        </div>
      </div>

      {/* 6. Wiring DRC Badge */}
      <button
        type="button"
        onClick={() => setIsDrcModalOpen(true)}
        className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer ${
          drcResult.errorCount > 0
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600/80 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-900 dark:text-rose-200'
            : drcResult.warningCount > 0
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-500/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-500/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            Wiring DRC Engine
          </span>
          {drcResult.errorCount > 0 ? (
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          )}
        </div>
        <div>
          <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
            {drcResult.errorCount > 0 ? (
              <span className="text-rose-700 dark:text-rose-400">FAULTS DETECTED ({drcResult.errorCount})</span>
            ) : drcResult.warningCount > 0 ? (
              <span className="text-amber-800 dark:text-amber-400">ADVISORIES ({drcResult.warningCount})</span>
            ) : (
              <span className="text-emerald-800 dark:text-emerald-400">PARAMETERS NORMAL</span>
            )}
          </div>
          <div className="text-[10px] text-slate-700 dark:text-slate-300 font-mono group-hover:underline mt-0.5">
            Click to inspect rules →
          </div>
        </div>
      </button>
    </div>
  );
}
