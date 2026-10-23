// src/features/yield-simulator/components/PowerFlowDiagram.tsx
import React from 'react';
import {
  Sun,
  Home,
  BatteryCharging,
  Zap,
  ZapOff,
  AlertTriangle,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { SystemTopologyMode, TelemetryTimeStep } from '../types/yieldSimulator';

interface PowerFlowDiagramProps {
  step: TelemetryTimeStep;
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  systemTopology: SystemTopologyMode;
  isZeroExport: boolean;
  onTriggerInstantBrownout: () => void;
}

function getLiveStory(
  step: TelemetryTimeStep,
  hasBattery: boolean
): { headline: string; detail: string; tone: 'emerald' | 'amber' | 'rose' | 'sky' } {
  const isGridOutage = !step.isGridOnline;
  const battChargeKw = Math.max(0, step.batteryPowerKw);
  const battDischargeKw = Math.max(0, -step.batteryPowerKw);

  if (step.isAntiIslandingTripped) {
    return {
      headline: 'Grid Outage: Solar Shut Down for Safety (No Battery Installed)',
      detail:
        'Standard Grid-Tie inverters must turn off during a utility blackout (IEEE 1547 safety rule). Switch to Hybrid mode with a LiFePO4 battery to keep solar running during brownouts.',
      tone: 'rose',
    };
  }
  if (step.isOverloadFault) {
    return {
      headline: `Inverter Overload: Home Demand (${step.totalHomeLoadKw.toFixed(2)} kW) Exceeds Capacity`,
      detail:
        'Your active appliances are drawing more power than the inverter can deliver during an outage. Turn off heavy appliances on the right panel or upgrade the inverter.',
      tone: 'rose',
    };
  }
  if (step.isLowBatteryShutdown && isGridOutage) {
    return {
      headline: 'Battery Reserve Reached (Low-Voltage Protection)',
      detail:
        'Your battery has reached its safety reserve floor during the blackout and disconnected loads to protect battery health.',
      tone: 'rose',
    };
  }
  if (isGridOutage) {
    return {
      headline: 'Utility Blackout Active: Home Running 100% on Solar & Battery Island',
      detail: `The street grid is down, but your home stays powered (${step.activeLoadKw.toFixed(2)} kW) from ${
        step.actualPvKw > 0.05 ? `${step.actualPvKw.toFixed(2)} kW solar` : 'stored energy'
      }${battDischargeKw > 0.05 ? ` and ${battDischargeKw.toFixed(2)} kW battery backup` : ''}.`,
      tone: 'amber',
    };
  }
  if (step.inverterClippedKw > 0.05) {
    return {
      headline: `Peak Sun Clipping: Saving Inverter from ${step.inverterClippedKw.toFixed(2)} kW Excess DC`,
      detail: `Your solar panels are producing ${step.potentialPvKw.toFixed(2)} kW DC, and the inverter is running at its full AC limit (${step.actualPvKw.toFixed(2)} kW).`,
      tone: 'amber',
    };
  }
  if (step.zeroExportClippedKw > 0.05) {
    return {
      headline: `Zero-Export Active: Throttling ${step.zeroExportClippedKw.toFixed(2)} kW Extra Solar`,
      detail:
        'Your battery is full and Zero-Export mode prevents sending electricity to the grid, so the inverter automatically reduces output to match your home load.',
      tone: 'amber',
    };
  }
  if (step.actualPvKw >= step.activeLoadKw && step.actualPvKw > 0.1) {
    const extraParts: string[] = [];
    if (battChargeKw > 0.05) {
      extraParts.push(`charging your battery (+${battChargeKw.toFixed(2)} kW)`);
    }
    if (step.gridExportKw > 0.05) {
      extraParts.push(`exporting ${step.gridExportKw.toFixed(2)} kW to the utility grid`);
    }
    return {
      headline: '100% Solar Powered Right Now',
      detail: `Your roof panels (${step.actualPvKw.toFixed(2)} kW) are covering 100% of your home appliances (${step.activeLoadKw.toFixed(2)} kW)${
        extraParts.length > 0 ? ` while ${extraParts.join(' and ')}` : ''
      }.`,
      tone: 'emerald',
    };
  }
  if (battDischargeKw > 0.05 && hasBattery) {
    return {
      headline: `Running on Stored Battery Power (${step.batterySocPercent.toFixed(0)}% Remaining)`,
      detail: `Your LiFePO4 battery is discharging ${battDischargeKw.toFixed(2)} kW to power your home (${step.activeLoadKw.toFixed(2)} kW) so you avoid buying peak utility power.`,
      tone: 'emerald',
    };
  }
  return {
    headline: `Drawing ${step.gridImportKw.toFixed(2)} kW from the Utility Grid`,
    detail: `Solar output is ${step.actualPvKw.toFixed(2)} kW, so the utility grid is supplying ${step.gridImportKw.toFixed(2)} kW to run your active appliances (${step.activeLoadKw.toFixed(2)} kW).`,
    tone: 'sky',
  };
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  step,
  pvArrayKwp,
  inverterKw,
  batteryCapacityKwh,
  systemTopology,
  isZeroExport,
  onTriggerInstantBrownout,
}) => {
  const hasBattery = systemTopology !== 'grid_tie' && batteryCapacityKwh > 0;
  const isGridOutage = !step.isGridOnline;
  const story = getLiveStory(step, hasBattery);

  const solarActive = step.actualPvKw > 0.02;
  const loadActive = step.activeLoadKw > 0.02 && !step.isOverloadFault;
  const battCharging = step.batteryPowerKw > 0.02;
  const battDischarging = step.batteryPowerKw < -0.02;
  const battAbsKw = Math.abs(step.batteryPowerKw);
  const gridImporting = step.gridImportKw > 0.02;
  const gridExporting = step.gridExportKw > 0.02;

  const inverterLoadRatioPct =
    inverterKw > 0 ? Math.min(100, (step.totalHomeLoadKw / inverterKw) * 100) : 0;

  const storedKwh = hasBattery
    ? (step.batterySocPercent / 100) * batteryCapacityKwh
    : 0;

  const toneBannerStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
    rose: 'bg-rose-500/10 text-rose-800 dark:text-rose-200',
    sky: 'bg-sky-500/10 text-sky-800 dark:text-sky-200',
  }[story.tone];

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 space-y-6 shadow-[0_16px_40px_-15px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_50px_-15px_rgba(0,0,0,0.5)]">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Live Energy Flow at {step.timeLabel}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            See where every kilowatt of electricity is moving in your home right now
          </p>
        </div>

        <button
          type="button"
          onClick={onTriggerInstantBrownout}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer active:scale-[0.98] ${
            isGridOutage
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-300'
          }`}
        >
          <ZapOff className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>{isGridOutage ? 'Restore Utility Grid' : 'Test Grid Blackout Now'}</span>
        </button>
      </div>

      {/* Plain-English Live Status Banner */}
      <div className={`rounded-xl p-4 flex items-start gap-3.5 ${toneBannerStyles}`}>
        <div className="mt-0.5 shrink-0">
          {story.tone === 'rose' || story.tone === 'amber' ? (
            <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
          ) : (
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold leading-snug">{story.headline}</p>
          <p className="text-xs opacity-85 leading-relaxed">{story.detail}</p>
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE 4-NODE + CENTRAL INVERTER FLOW GRID
         ===================================================================== */}
      <div className="relative py-2">
        <svg
          viewBox="0 0 600 320"
          className="hidden sm:block absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <path
            d="M 155 80 L 300 160"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.07]"
            strokeWidth="3"
          />
          {solarActive && (
            <path
              d="M 155 80 L 300 160"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3.5"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="32"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}

          <path
            d="M 300 160 L 445 80"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.07]"
            strokeWidth="3"
          />
          {loadActive && (
            <path
              d="M 300 160 L 445 80"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="3.5"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="32"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}

          <path
            d="M 300 160 L 155 245"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.07]"
            strokeWidth="3"
          />
          {(battCharging || battDischarging) && (
            <path
              d={battCharging ? 'M 300 160 L 155 245' : 'M 155 245 L 300 160'}
              fill="none"
              stroke="#10B981"
              strokeWidth="3.5"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="32"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}

          <path
            d="M 300 160 L 445 245"
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-white/[0.07]"
            strokeWidth="3"
          />
          {(gridImporting || gridExporting) && !isGridOutage && (
            <path
              d={gridExporting ? 'M 300 160 L 445 245' : 'M 445 245 L 300 160'}
              fill="none"
              stroke={gridExporting ? '#10B981' : '#38BDF8'}
              strokeWidth="3.5"
              strokeDasharray="8 8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="32"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          )}
        </svg>

        {/* Top Row: Solar Array (Left) & Home Appliances (Right) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. SOLAR ROOF ARRAY */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-[#131B2B] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <Sun className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    1. Solar Panels
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {pvArrayKwp.toFixed(2)} kWp Roof Array
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  solarActive
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-500'
                }`}
              >
                {solarActive ? 'Generating' : 'Night / Idle'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {step.actualPvKw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                Cell Temp {step.cellTempC.toFixed(0)}°C
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, pvArrayKwp > 0 ? (step.actualPvKw / pvArrayKwp) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* 2. HOME APPLIANCES */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-[#131B2B] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                  <Home className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    2. Home Appliances
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    Active Household Demand
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  step.isOverloadFault
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                {step.isOverloadFault ? 'Overload Trip' : 'Powered'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
                  {step.totalHomeLoadKw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {inverterLoadRatioPct.toFixed(0)}% of inverter rating
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  step.isOverloadFault ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, inverterLoadRatioPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Hub: Hybrid Inverter Pill */}
        <div className="relative z-10 flex justify-center my-4">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-md">
            <Cpu className="w-4 h-4 text-amber-400 dark:text-amber-500" strokeWidth={1.75} />
            <div className="text-left">
              <span className="text-xs font-bold block leading-tight">
                {systemTopology === 'grid_tie' ? 'Grid-Tie Inverter' : 'Hybrid Inverter Hub'} (
                {inverterKw.toFixed(1)} kW AC)
              </span>
              <span className="text-[10px] font-mono tabular-nums opacity-75">
                {isZeroExport ? 'Zero-Export Active' : 'Net Metering Enabled'} •{' '}
                {inverterLoadRatioPct.toFixed(0)}% Load
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Battery Bank (Left) & Utility Grid (Right) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 3. BATTERY BANK */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-[#131B2B] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                  <BatteryCharging className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    3. LiFePO4 Battery
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {hasBattery
                      ? `${batteryCapacityKwh.toFixed(1)} kWh (${step.batteryVoltageV.toFixed(1)}V)`
                      : 'No Battery Installed'}
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  !hasBattery
                    ? 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-500'
                    : battCharging
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : battDischarging
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-500'
                }`}
              >
                {!hasBattery
                  ? 'Disabled'
                  : battCharging
                    ? `Charging +${battAbsKw.toFixed(2)} kW`
                    : battDischarging
                      ? `Supplying ${battAbsKw.toFixed(2)} kW`
                      : 'Standby'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {hasBattery ? `${step.batterySocPercent.toFixed(0)}%` : '0%'}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">State of Charge</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {hasBattery ? `${storedKwh.toFixed(1)} kWh stored` : 'Grid-Tie Mode'}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${hasBattery ? step.batterySocPercent : 0}%` }}
              />
            </div>
          </div>

          {/* 4. UTILITY GRID */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-[#131B2B] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isGridOutage
                      ? 'bg-rose-500/15 text-rose-500'
                      : 'bg-sky-500/15 text-sky-500'
                  }`}
                >
                  {isGridOutage ? (
                    <ZapOff className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Zap className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    4. Electric Utility Grid
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {isGridOutage ? 'Outage / Brownout Active' : '230V AC Utility Line'}
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isGridOutage
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                    : gridExporting
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : gridImporting
                        ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-200/70 dark:bg-white/[0.06] text-slate-500'
                }`}
              >
                {isGridOutage
                  ? 'GRID DOWN'
                  : gridExporting
                    ? 'Exporting Surplus'
                    : gridImporting
                      ? 'Importing Power'
                      : 'Zero Grid Draw'}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    isGridOutage
                      ? 'text-rose-500'
                      : gridExporting
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {isGridOutage
                    ? '0.00'
                    : gridExporting
                      ? step.gridExportKw.toFixed(2)
                      : step.gridImportKw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">kW</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                {isGridOutage
                  ? 'Islanded protection'
                  : gridExporting
                    ? 'Earning bill credit'
                    : gridImporting
                      ? 'Buying from utility'
                      : '100% self-powered'}
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGridOutage
                    ? 'bg-rose-500'
                    : gridExporting
                      ? 'bg-emerald-500'
                      : 'bg-sky-500'
                }`}
                style={{
                  width: `${
                    isGridOutage
                      ? 100
                      : Math.min(100, ((step.gridExportKw + step.gridImportKw) / 6) * 100)
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
