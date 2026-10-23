// src/features/yield-simulator/components/YieldSimulatorPage.tsx
import React, { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Lock,
  Sparkles,
  Sun,
  ZapOff,
  CloudRain,
  ShieldAlert,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { DownloadSizingButton } from '@/components/common/DownloadSizingButton';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { useOpenMeteoSolarQuery } from '../hooks/useOpenMeteoSolarQuery';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { runYieldSimulation } from '../utils/yieldSimulationEngine';
import { DiagnosticInsight } from '../types/yieldSimulator';
import { SimulatorControlBar } from './SimulatorControlBar';
import { DailyEnergyKpiRibbon } from './DailyEnergyKpiRibbon';
import { PowerFlowDiagram } from './PowerFlowDiagram';
import { LiveApplianceBreakerPanel } from './LiveApplianceBreakerPanel';
import { TelemetryChartSuite } from './TelemetryChartSuite';
import { BrownoutStressTestCard } from './BrownoutStressTestCard';

const simulatorQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

interface GuidedScenario {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
  accentClass: string;
  apply: () => void;
}

const YieldSimulatorWorkspace: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const appliances = useApplianceLoadStore((s) => s.items);
  const addPreset = useApplianceLoadStore((s) => s.addPreset);

  const coordinates = useSolarMapperStore((s) => s.coordinates);
  const selectedPsh = useSolarMapperStore((s) => s.getSelectedPsh());

  const {
    weatherScenario,
    emsMode,
    systemTopology,
    isZeroExport,
    pvArrayKwp,
    inverterKw,
    batteryCapacityKwh,
    initialBatterySocPercent,
    minReserveSocPercent,
    tariffPhpPerKwh,
    brownout,
    instantBlackoutActive,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    disabledApplianceIds,
    forcedOnApplianceIds,
    shiftedToMiddayIds,
    setWeatherScenario,
    setEmsMode,
    setSystemTopology,
    setIsZeroExport,
    setSystemSpecs,
    syncFromSolarStudio,
    setBrownout,
    toggleInstantBlackout,
    setInstantBlackoutActive,
    setIsPlaying,
    togglePlay,
    setPlaybackSpeed,
    setCurrentStepIndex,
    toggleApplianceBreaker,
    toggleApplianceForceOn,
    shiftFlexibleLoadsToMidday,
    resetBreakerOverrides,
  } = useYieldSimulatorStore();

  const [activeScenarioId, setActiveScenarioId] = useState<string>('sunny-peak');

  usePlaybackTicker();

  const openMeteoQuery = useOpenMeteoSolarQuery(
    coordinates.lat,
    coordinates.lng,
    weatherScenario === 'live_open_meteo'
  );

  const effectivePsh = selectedPsh || 4.8;

  const simulationSummary = useMemo(() => {
    return runYieldSimulation({
      pvArrayKwp,
      inverterKw,
      batteryCapacityKwh,
      initialBatterySocPercent,
      minReserveSocPercent,
      roundTripEfficiency: 0.92,
      maxBatteryCRate: 0.5,
      systemTopology,
      isZeroExport,
      weatherScenario,
      emsMode,
      peakSunHours: effectivePsh,
      latitude: coordinates.lat,
      tariffPhpPerKwh,
      brownout,
      instantBlackoutActive,
      currentStepIndex,
      appliances,
      disabledApplianceIds,
      forcedOnApplianceIds,
      shiftedToMiddayIds,
      liveWeatherHourly: openMeteoQuery.data?.hourly ?? null,
    });
  }, [
    pvArrayKwp,
    inverterKw,
    batteryCapacityKwh,
    initialBatterySocPercent,
    minReserveSocPercent,
    systemTopology,
    isZeroExport,
    weatherScenario,
    emsMode,
    effectivePsh,
    coordinates.lat,
    tariffPhpPerKwh,
    brownout,
    instantBlackoutActive,
    currentStepIndex,
    appliances,
    disabledApplianceIds,
    forcedOnApplianceIds,
    shiftedToMiddayIds,
    openMeteoQuery.data,
  ]);

  const currentStep =
    simulationSummary.steps[currentStepIndex] ?? simulationSummary.steps[48];

  const guidedScenarios: GuidedScenario[] = [
    {
      id: 'sunny-peak',
      badge: '12:00 PM Noon',
      title: 'Sunny Peak Day',
      description: 'Watch solar run your home, charge the battery, and export surplus',
      icon: Sun,
      accentClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      apply: () => {
        setActiveScenarioId('sunny-peak');
        setIsPlaying(false);
        setWeatherScenario('clear_sky');
        setSystemTopology('hybrid');
        setEmsMode('self_consumption');
        setIsZeroExport(false);
        setInstantBlackoutActive(false);
        setBrownout({ enabled: false });
        setCurrentStepIndex(48);
      },
    },
    {
      id: 'zero-export-full',
      badge: '1:30 PM Afternoon',
      title: 'Battery Full + Zero-Export',
      description: 'See how the inverter throttles extra solar when grid export is blocked',
      icon: ShieldAlert,
      accentClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      apply: () => {
        setActiveScenarioId('zero-export-full');
        setIsPlaying(false);
        setWeatherScenario('clear_sky');
        setSystemTopology('hybrid');
        setEmsMode('backup_ups_priority');
        setIsZeroExport(true);
        setInstantBlackoutActive(false);
        setBrownout({ enabled: false });
        setCurrentStepIndex(54);
      },
    },
    {
      id: 'evening-brownout',
      badge: '7:30 PM Outage',
      title: 'Evening Grid Blackout',
      description: 'Test a 4-hour 6PM–10PM utility outage while dinner and AC are running',
      icon: ZapOff,
      accentClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      apply: () => {
        setActiveScenarioId('evening-brownout');
        setIsPlaying(false);
        setWeatherScenario('clear_sky');
        setSystemTopology('hybrid');
        setEmsMode('self_consumption');
        setIsZeroExport(false);
        setInstantBlackoutActive(false);
        setBrownout({ enabled: true, startHour: 18, endHour: 22 });
        setCurrentStepIndex(78);
      },
    },
    {
      id: 'monsoon-rain',
      badge: '2:00 PM Rainy',
      title: 'Heavy Monsoon Clouds',
      description: 'Inspect solar output and battery reserves during an overcast rainy day',
      icon: CloudRain,
      accentClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      apply: () => {
        setActiveScenarioId('monsoon-rain');
        setIsPlaying(false);
        setWeatherScenario('monsoon_overcast');
        setSystemTopology('hybrid');
        setEmsMode('self_consumption');
        setIsZeroExport(false);
        setInstantBlackoutActive(false);
        setBrownout({ enabled: false });
        setCurrentStepIndex(56);
      },
    },
  ];

  // Auth Gate
  if (!isAuthLoading && !user) {
    return (
      <main className="flex-1 w-full min-h-[100dvh] bg-[#F8FAFC] dark:bg-[#070A10] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.08] p-8 text-center space-y-5 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Sign in to open the 24-Hour Solar Simulator
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Test real-time solar generation, battery backup runtime, and appliance switching with your account.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('login')}
              className="group inline-flex items-center gap-3 rounded-full pl-5 pr-1.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <span>Log In</span>
              <span className="w-7 h-7 rounded-full bg-slate-950/10 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('register')}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handleApplyRecommendation = (insight: DiagnosticInsight) => {
    if (insight.actionType === 'add_battery_module') {
      setSystemTopology('hybrid');
      setSystemSpecs({
        batteryCapacityKwh: Number((batteryCapacityKwh + 5.12).toFixed(2)),
      });
    } else if (insight.actionType === 'switch_to_hybrid') {
      setSystemTopology('hybrid');
      setSystemSpecs({
        batteryCapacityKwh: Math.max(10.24, batteryCapacityKwh),
      });
    } else if (insight.actionType === 'shed_non_critical') {
      setBrownout({ shedNonCriticalLoads: true });
    } else if (insight.actionType === 'shift_loads_midday') {
      const flexibleIds = appliances
        .filter((a) => a.hoursPerDay < 18 && a.runningWatts * a.quantity >= 250)
        .map((a) => a.id);
      shiftFlexibleLoadsToMidday(flexibleIds);
    }
  };

  const handleShiftSingleAppliance = (id: string) => {
    if (shiftedToMiddayIds.includes(id)) {
      useYieldSimulatorStore.setState({
        shiftedToMiddayIds: shiftedToMiddayIds.filter((item) => item !== id),
      });
    } else {
      shiftFlexibleLoadsToMidday([id]);
    }
  };

  const handleResetAll = () => {
    setIsPlaying(false);
    setWeatherScenario('clear_sky');
    setSystemTopology('hybrid');
    setEmsMode('self_consumption');
    setIsZeroExport(false);
    setInstantBlackoutActive(false);
    setBrownout({ enabled: false, startHour: 18, endHour: 22 });
    resetBreakerOverrides();
    setCurrentStepIndex(48);
    setActiveScenarioId('sunny-peak');
  };

  return (
    <main className="flex-1 w-full min-h-[100dvh] bg-[#F8FAFC] dark:bg-[#070A10] text-slate-900 dark:text-slate-100 relative overflow-x-hidden transition-colors duration-300">
      {/* Subtle Fixed Ambient Glow (GPU-safe) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-1/4 w-[680px] h-[360px] rounded-full bg-amber-500/[0.06] dark:bg-amber-500/[0.05] blur-3xl -z-10"
      />

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* =====================================================================
            TOP BAR: BACK TO HOME & QUICK ACTIONS
           ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => setActiveView('home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Back to Home</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={syncFromSolarStudio}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
              <span>Sync from Solar Tool</span>
            </button>

            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Reset</span>
            </button>

            <DownloadSizingButton />
          </div>
        </div>

        {/* =====================================================================
            HERO + 4 ONE-CLICK REAL-WORLD SCENARIOS
           ===================================================================== */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
        >
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-[0.18em]">
              <Activity className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.75} />
              <span>24-Hour Solar &amp; Battery Simulator</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              See how your solar and battery power your home hour by hour.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Pick one of the real-world situations on the right, or drag the time slider below to test sunny days, rainy weather, appliance spikes, and evening brownouts.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guidedScenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = activeScenarioId === sc.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={sc.apply}
                  className={`group text-left rounded-2xl p-4 transition-all duration-300 cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-white dark:bg-[#131C2E] border-2 border-amber-500 shadow-[0_12px_30px_-10px_rgba(245,158,11,0.2)]'
                      : 'bg-white dark:bg-[#0E1420] border border-slate-200/80 dark:border-white/[0.07] hover:border-amber-500/40 shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${sc.accentClass}`}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                        {sc.badge}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sc.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {sc.description}
                    </p>
                  </div>

                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </span>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* =====================================================================
            TIME OF DAY PLAYER & WEATHER / BATTERY SETTINGS
           ===================================================================== */}
        <SimulatorControlBar
          currentStepIndex={currentStepIndex}
          currentStep={currentStep}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          weatherScenario={weatherScenario}
          emsMode={emsMode}
          systemTopology={systemTopology}
          isZeroExport={isZeroExport}
          pvArrayKwp={pvArrayKwp}
          inverterKw={inverterKw}
          batteryCapacityKwh={batteryCapacityKwh}
          isLiveWeatherLoading={openMeteoQuery.isLoading}
          isLiveWeatherError={openMeteoQuery.isError}
          liveLocationName={coordinates.locationName || `${coordinates.lat.toFixed(2)}°N`}
          onStepChange={(idx) => {
            setIsPlaying(false);
            setCurrentStepIndex(idx);
          }}
          onTogglePlay={togglePlay}
          onSpeedChange={setPlaybackSpeed}
          onWeatherChange={setWeatherScenario}
          onEmsChange={setEmsMode}
          onTopologyChange={setSystemTopology}
          onZeroExportToggle={setIsZeroExport}
          onSpecsChange={setSystemSpecs}
          onSyncFromSolarStudio={syncFromSolarStudio}
        />

        {/* =====================================================================
            DAILY SUMMARY CARDS (5 METRICS)
           ===================================================================== */}
        <DailyEnergyKpiRibbon
          summary={simulationSummary}
          systemTopology={systemTopology}
        />

        {/* =====================================================================
            LIVE POWER FLOW DIAGRAM (7 COLS) + APPLIANCE SWITCHBOARD (5 COLS)
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <PowerFlowDiagram
              step={currentStep}
              pvArrayKwp={pvArrayKwp}
              inverterKw={inverterKw}
              batteryCapacityKwh={batteryCapacityKwh}
              systemTopology={systemTopology}
              isZeroExport={isZeroExport}
              onTriggerInstantBrownout={toggleInstantBlackout}
            />
          </div>

          <div className="lg:col-span-5">
            <LiveApplianceBreakerPanel
              appliances={appliances}
              currentStep={currentStep}
              inverterKw={inverterKw}
              disabledApplianceIds={disabledApplianceIds}
              forcedOnApplianceIds={forcedOnApplianceIds}
              shiftedToMiddayIds={shiftedToMiddayIds}
              onToggleDisabled={toggleApplianceBreaker}
              onToggleForcedOn={toggleApplianceForceOn}
              onShiftToMidday={handleShiftSingleAppliance}
              onResetOverrides={resetBreakerOverrides}
              onAddQuickPreset={addPreset}
            />
          </div>
        </div>

        {/* =====================================================================
            24-HOUR CHARTS (SOLAR vs DEMAND & BATTERY %)
           ===================================================================== */}
        <TelemetryChartSuite
          steps={simulationSummary.steps}
          currentStepIndex={currentStepIndex}
          inverterKw={inverterKw}
          systemTopology={systemTopology}
          brownoutSchedule={brownout}
          onSelectStep={(idx) => {
            setIsPlaying(false);
            setCurrentStepIndex(idx);
          }}
        />

        {/* =====================================================================
            BROWNOUT SURVIVAL TESTER & SMART SYSTEM RECOMMENDATIONS
           ===================================================================== */}
        <BrownoutStressTestCard
          brownoutSchedule={brownout}
          summary={simulationSummary}
          diagnostics={simulationSummary.diagnostics}
          onBrownoutChange={setBrownout}
          onApplyRecommendation={handleApplyRecommendation}
        />
      </div>
    </main>
  );
};

export const YieldSimulatorPage: React.FC = () => (
  <QueryClientProvider client={simulatorQueryClient}>
    <YieldSimulatorWorkspace />
  </QueryClientProvider>
);
