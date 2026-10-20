// src/components/load-calculator/SizingSummaryDashboard.tsx
import React, { useState } from 'react';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { InverterStressMeter } from './InverterStressMeter';
import {
  Zap,
  Sun,
  Battery,
  Box,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Layers,
} from 'lucide-react';

export const SizingSummaryDashboard: React.FC = () => {
  const getSizingResult = useApplianceLoadStore((s) => s.getSizingResult);
  const config = useApplianceLoadStore((s) => s.config);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);
  const inverters = useCalculatorStore((s) => s.inverters);
  const setInverter = useCalculatorStore((s) => s.setInverter);
  const setPanelCountOverride = useCalculatorStore((s) => s.setPanelCountOverride);
  const setBatteryCount = useCalculatorStore((s) => s.setBatteryCount);

  const [copied, setCopied] = useState(false);
  const result = getSizingResult();

  const {
    totalDailyKwh,
    daytimeKwh,
    nighttimeKwh,
    recommendedInverterKw,
    recommendedPvKwp,
    recommendedPanelCount,
    estimatedRoofAreaSqm,
    recommendedBatteryKwh,
    recommendedBatteryUnits5kWh,
    estimatedBackupHours,
    recommendedTopology,
    topologyReasoning,
    warnings,
  } = result;

  const getTopologyTitle = () => {
    switch (recommendedTopology) {
      case 'grid_tie':
        return 'Grid-Tie Solar (On-Grid)';
      case 'hybrid':
        return 'Hybrid Solar + LiFePO4 Storage';
      case 'off_grid':
        return 'Full Off-Grid Solar System';
    }
  };

  const getTopologyColor = () => {
    switch (recommendedTopology) {
      case 'grid_tie':
        return 'from-blue-500/20 to-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30';
      case 'hybrid':
        return 'from-amber-500/20 to-orange-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'off_grid':
        return 'from-emerald-500/20 to-teal-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  const handleTransferToTool = () => {
    // 1. Find matching inverter in catalog based on recommendedInverterKw and topology
    const isHybrid = recommendedTopology !== 'grid_tie';
    const targetWatts = recommendedInverterKw * 1000;

    const matchedInv = inverters.find((inv) => {
      const invWatts = typeof inv.rated_ac_power_w === 'number' ? inv.rated_ac_power_w : parseFloat(String(inv.rated_ac_power_w)) || 0;
      const matchesCapacity = Math.abs(invWatts - targetWatts) <= 1500;
      const invIsHybrid = Boolean(inv.battery_type && inv.battery_type.toLowerCase() !== 'none');
      return matchesCapacity && (isHybrid ? invIsHybrid : !invIsHybrid);
    }) || inverters.find((inv) => {
      const invWatts = typeof inv.rated_ac_power_w === 'number' ? inv.rated_ac_power_w : parseFloat(String(inv.rated_ac_power_w)) || 0;
      return Math.abs(invWatts - targetWatts) <= 2000;
    });

    if (matchedInv) {
      setInverter(matchedInv);
    }

    // 2. Set panel count override
    if (recommendedPanelCount > 0) {
      setPanelCountOverride(recommendedPanelCount);
    }

    // 3. Set battery count if hybrid or off-grid
    if (recommendedBatteryUnits5kWh > 0) {
      setBatteryCount(recommendedBatteryUnits5kWh);
    }

    // 4. Switch view to tool
    setActiveView('tool');
  };

  const handleCopySummary = () => {
    const text = `KITO SOLAR APPLIANCE SIZING SUMMARY
---------------------------------------------
Recommended Architecture: ${getTopologyTitle()}
Daily Energy Consumption: ${totalDailyKwh} kWh/day (${daytimeKwh} kWh Day / ${nighttimeKwh} kWh Night)
Recommended Inverter: ${recommendedInverterKw} kW Continuous (2.0x Surge Headroom)
Solar PV Array: ${recommendedPvKwp} kWp (${recommendedPanelCount}x ${config.panelWattage}W Panels, ~${estimatedRoofAreaSqm} m²)
Battery Storage: ${recommendedBatteryKwh} kWh (${recommendedBatteryUnits5kWh}x 51.2V 100Ah LiFePO4 Modules)
Estimated Brownout Backup Runtime: ~${estimatedBackupHours} Hours
---------------------------------------------
Generated via Kito Solar (kito-solar.vercel.app)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-[2rem] p-1.5 bg-slate-100/90 dark:bg-slate-900/80 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-xl space-y-4">
      <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-5 sm:p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] space-y-5">
        {/* Recommended System Topology Card */}
        <div
          className={`p-4 rounded-2xl border bg-gradient-to-br ${getTopologyColor()} transition-all duration-300`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
              Recommended Topology
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/60 dark:bg-black/30 backdrop-blur-xs">
              System Sizing
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getTopologyTitle()}
          </h3>

          <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {topologyReasoning.map((r, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-amber-500 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4 Core Spec Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Daily Consumption */}
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Daily Load</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {totalDailyKwh}{' '}
                <span className="text-xs font-sans font-medium text-slate-500">kWh/day</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Day: {daytimeKwh} kWh</span>
                  <span>Night: {nighttimeKwh} kWh</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${totalDailyKwh > 0 ? (daytimeKwh / totalDailyKwh) * 100 : 50}%`,
                    }}
                  />
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${totalDailyKwh > 0 ? (nighttimeKwh / totalDailyKwh) * 100 : 50}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Inverter Rating */}
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Inverter Size</span>
              <Box className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {recommendedInverterKw}{' '}
                <span className="text-xs font-sans font-medium text-slate-500">kW Rating</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                25% safety buffer; handles up to{' '}
                <strong className="font-mono text-slate-700 dark:text-slate-300">
                  {(recommendedInverterKw * 2).toFixed(1)} kW
                </strong>{' '}
                motor surge.
              </p>
            </div>
          </div>

          {/* Card 3: Solar PV Array */}
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">Solar PV Array</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                {recommendedPvKwp}{' '}
                <span className="text-xs font-sans font-medium text-slate-500">kWp</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                <strong className="text-slate-900 dark:text-slate-200">
                  {recommendedPanelCount}x {config.panelWattage}W
                </strong>{' '}
                panels (~{estimatedRoofAreaSqm} m²)
              </div>
            </div>
          </div>

          {/* Card 4: Battery Storage */}
          <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold">LiFePO4 Storage</span>
              <Battery className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              {recommendedBatteryKwh > 0 ? (
                <>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                    {recommendedBatteryKwh}{' '}
                    <span className="text-xs font-sans font-medium text-slate-500">kWh</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                    {recommendedBatteryUnits5kWh}x 5.12kWh (100Ah) (~{estimatedBackupHours}h backup)
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-1">
                    0 kWh (Grid-Tie)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Direct daytime feed; zero battery investment.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Inverter Load & Surge Stress Meter */}
        <InverterStressMeter result={result} />

        {/* Warnings & Notes */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 leading-snug"
              >
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTAs: Transfer to Solar Tool & Copy Summary */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handleTransferToTool}
            className="group flex-1 inline-flex items-center justify-between pl-5 pr-2 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-tight transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] shadow-md shadow-amber-500/25"
          >
            <span>Transfer Sizing to Solar Studio</span>
            <span className="w-7 h-7 rounded-full bg-slate-950/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            className="px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Spec'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
