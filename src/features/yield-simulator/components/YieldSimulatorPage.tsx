// src/features/yield-simulator/components/YieldSimulatorPage.tsx
import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  LogIn,
  UserPlus,
  Sun,
  ShieldAlert,
  PowerOff,
  CloudRain,
  ArrowUpRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { DownloadSizingButton } from '@/components/common/DownloadSizingButton';
import { EngineeringDisclaimer } from '@/components/common/EngineeringDisclaimer';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { useOpenMeteoSolarQuery } from '../hooks/useOpenMeteoSolarQuery';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { runYieldSimulation } from '../utils/yieldSimulationEngine';
import { distributeHouseholdLoadProfile } from '../utils/loadProfileDistributor';
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

const EASE_CURVE: [number, number, number, number] = [0.32, 0.72, 0, 1];

const YieldSimulatorWorkspace: React.FC = () => {
  usePlaybackTicker();

  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const appliances = useApplianceLoadStore((s) => s.items);
  const coordinates = useSolarMapperStore((s) => s.coordinates);
  const selectedPsh = useSolarMapperStore((s) => s.getSelectedPsh());

  const weatherScenario = useYieldSimulatorStore((s) => s.weatherScenario);
  const emsMode = useYieldSimulatorStore((s) => s.emsMode);
  const systemTopology = useYieldSimulatorStore((s) => s.systemTopology);
  const isZeroExport = useYieldSimulatorStore((s) => s.isZeroExport);
  const pvArrayKwp = useYieldSimulatorStore((s) => s.pvArrayKwp);
  const inverterKw = useYieldSimulatorStore((s) => s.inverterKw);
  const batteryCapacityKwh = useYieldSimulatorStore(
    (s) => s.batteryCapacityKwh
  );
  const initialBatterySocPercent = useYieldSimulatorStore(
    (s) => s.initialBatterySocPercent
  );
  const minReserveSocPercent = useYieldSimulatorStore(
    (s) => s.minReserveSocPercent
  );
  const tariffPhpPerKwh = useYieldSimulatorStore((s) => s.tariffPhpPerKwh);
  const brownout = useYieldSimulatorStore((s) => s.brownout);
  const instantBlackoutActive = useYieldSimulatorStore(
    (s) => s.instantBlackoutActive
  );
  const currentStepIndex = useYieldSimulatorStore((s) => s.currentStepIndex);
  const disabledApplianceIds = useYieldSimulatorStore(
    (s) => s.disabledApplianceIds
  );
  const forcedOnApplianceIds = useYieldSimulatorStore(
    (s) => s.forcedOnApplianceIds
  );
  const shiftedToMiddayIds = useYieldSimulatorStore(
    (s) => s.shiftedToMiddayIds
  );

  const setWeatherScenario = useYieldSimulatorStore((s) => s.setWeatherScenario);
  const setIsZeroExport = useYieldSimulatorStore((s) => s.setIsZeroExport);
  const setBrownout = useYieldSimulatorStore((s) => s.setBrownout);
  const setInstantBlackoutActive = useYieldSimulatorStore(
    (s) => s.setInstantBlackoutActive
  );
  const setCurrentStepIndex = useYieldSimulatorStore(
    (s) => s.setCurrentStepIndex
  );
  const setSystemSpecs = useYieldSimulatorStore((s) => s.setSystemSpecs);

  const {
    data: liveWeatherData,
    isLoading: isLiveWeatherLoading,
    error: liveWeatherErrorObj,
    refetch: refetchLiveWeather,
  } = useOpenMeteoSolarQuery(
    coordinates.lat,
    coordinates.lng,
    weatherScenario === 'live_open_meteo'
  );

  const liveWeatherError =
    liveWeatherErrorObj instanceof Error ? liveWeatherErrorObj.message : null;

  const summary = useMemo(
    () =>
      runYieldSimulation({
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
        peakSunHours: selectedPsh,
        latitude: coordinates.lat,
        tariffPhpPerKwh,
        brownout,
        instantBlackoutActive,
        currentStepIndex,
        appliances,
        disabledApplianceIds,
        forcedOnApplianceIds,
        shiftedToMiddayIds,
        liveWeatherHourly: liveWeatherData?.hourly ?? null,
      }),
    [
      pvArrayKwp,
      inverterKw,
      batteryCapacityKwh,
      initialBatterySocPercent,
      minReserveSocPercent,
      systemTopology,
      isZeroExport,
      weatherScenario,
      emsMode,
      selectedPsh,
      coordinates.lat,
      tariffPhpPerKwh,
      brownout,
      instantBlackoutActive,
      currentStepIndex,
      appliances,
      disabledApplianceIds,
      forcedOnApplianceIds,
      shiftedToMiddayIds,
      liveWeatherData,
    ]
  );

  const loadBreakdownSteps = useMemo(
    () =>
      distributeHouseholdLoadProfile({
        appliances,
        disabledApplianceIds,
        forcedOnApplianceIds,
        shiftedToMiddayIds,
      }),
    [appliances, disabledApplianceIds, forcedOnApplianceIds, shiftedToMiddayIds]
  );

  const safeStepIdx = Math.max(0, Math.min(95, currentStepIndex));
  const currentStep = summary.steps[safeStepIdx] || summary.steps[0];
  const currentLoadBreakdown =
    loadBreakdownSteps[safeStepIdx] || loadBreakdownSteps[0];

  // R-27: Explicit Loading & Unauthenticated States (Enforces logged-in users only)
  if (isAuthLoading) {
    return (
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 max-w-md w-full">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-8 text-center space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
            <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
              Verifying authenticated session...
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loading your solar hardware configuration and SCADA telemetry profile.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
        <div className="rounded-[2rem] p-1.5 bg-slate-200/65 dark:bg-slate-900/70 ring-1 ring-slate-900/5 dark:ring-white/10 max-w-md w-full">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white dark:bg-[#0c1220] p-7 sm:p-8 space-y-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/12 ring-1 ring-amber-500/30 text-amber-600 flex items-center justify-center">
              <Lock className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Account Required for Live Yield Simulator
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The 24-Hour Solar Yield Monitoring and Digital Twin SCADA Simulator is available exclusively to registered Kito Solar users. Sign in or create a free account to simulate your hardware.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setActiveView('login')}
                className="group flex-1 min-h-[44px] pl-5 pr-2 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
              >
                <span>Sign In to Continue</span>
                <span className="w-7 h-7 rounded-full bg-slate-950/10 flex items-center justify-center">
                  <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('register')}
                className="flex-1 min-h-[44px] px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
              >
                <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                <span>Create Account</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10 space-y-7">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => setActiveView('tool')}
          className="min-h-[38px] inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span>Back to Solar Engineering Studio</span>
        </button>

        <div className="flex items-center gap-3">
          <DownloadSizingButton variant="compact" />
        </div>
      </div>

      {/* Editorial Split Header + 1-Click Guided Scenario Bar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: EASE_CURVE }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end"
      >
        <div className="lg:col-span-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Real-Time Solar Yield &amp; Digital Twin Simulator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Test how your solar array, hybrid inverter, and LiFePO4 battery behave every 15 minutes across sunny peaks, passing clouds, zero-export limits, and evening brownouts.
          </p>
        </div>

        {/* 1-Click Guided Scenarios for Effortless Onboarding */}
        <div className="lg:col-span-6 space-y-2">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Try a 1-Click Real-World Scenario:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setWeatherScenario('clear_sky');
                setIsZeroExport(false);
                setInstantBlackoutActive(false);
                setBrownout({ enabled: false });
                setSystemSpecs({ initialBatterySocPercent: 35 });
                setCurrentStepIndex(48); // 12:00 PM
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/10 dark:ring-white/10 hover:ring-amber-500/50 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <Sun className="w-4 h-4" strokeWidth={1.75} />
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                Sunny Peak Noon
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                12:00 PM Harvest
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setWeatherScenario('clear_sky');
                setIsZeroExport(true);
                setInstantBlackoutActive(false);
                setBrownout({ enabled: false });
                setSystemSpecs({ initialBatterySocPercent: 75 });
                setCurrentStepIndex(54); // 13:30 PM (1:30 PM Battery Full)
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/10 dark:ring-white/10 hover:ring-amber-500/50 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" strokeWidth={1.75} />
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                1:30 PM Battery Full
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Zero-Export Clip
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setWeatherScenario('clear_sky');
                setBrownout({
                  enabled: true,
                  startHour: 18.0,
                  endHour: 23.5,
                  shedNonCriticalLoads: true,
                });
                setCurrentStepIndex(78); // 19:30 (7:30 PM)
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/10 dark:ring-white/10 hover:ring-rose-500/50 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <PowerOff className="w-4 h-4" strokeWidth={1.75} />
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                7:30 PM Brownout
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                UPS Island Backup
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setWeatherScenario('monsoon_overcast');
                setIsZeroExport(false);
                setCurrentStepIndex(48);
              }}
              className="p-2.5 rounded-2xl bg-white dark:bg-[#0c1220] ring-1 ring-slate-900/10 dark:ring-white/10 hover:ring-blue-500/50 text-left transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <CloudRain className="w-4 h-4" strokeWidth={1.75} />
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" strokeWidth={1.75} />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">
                Monsoon Overcast
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Low-Sun Stress
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Section 1: Playback, Weather & EMS Dispatch Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05, ease: EASE_CURVE }}
      >
        <SimulatorControlBar
          currentStep={currentStep}
          locationName={coordinates.locationName}
          isLiveWeatherLoading={isLiveWeatherLoading}
          liveWeatherError={liveWeatherError}
          onRetryLiveWeather={() => {
            refetchLiveWeather();
          }}
        />
      </motion.div>

      {/* Section 2: 24-Hour Energy Balance Ledger */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE_CURVE }}
      >
        <DailyEnergyKpiRibbon
          summary={summary}
          tariffPhpPerKwh={tariffPhpPerKwh}
        />
      </motion.div>

      {/* Section 3: Asymmetric Bento SCADA Workbench (4-Node Power Flow + Smart Breaker Panel) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.15, ease: EASE_CURVE }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        <div className="lg:col-span-7">
          <PowerFlowDiagram
            step={currentStep}
            pvArrayKwp={pvArrayKwp}
            inverterKw={inverterKw}
            batteryCapacityKwh={batteryCapacityKwh}
            minReserveSocPercent={minReserveSocPercent}
            systemTopology={systemTopology}
            isZeroExport={isZeroExport}
          />
        </div>
        <div className="lg:col-span-5">
          <LiveApplianceBreakerPanel
            currentLoadBreakdown={currentLoadBreakdown}
            timeLabel={currentStep.timeLabel}
          />
        </div>
      </motion.div>

      {/* Section 4: Synchronized 24-Hour Power Dispatch & Battery SoC Telemetry Charts */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.2, ease: EASE_CURVE }}
      >
        <TelemetryChartSuite
          steps={summary.steps}
          currentStepIndex={safeStepIdx}
          minReserveSocPercent={minReserveSocPercent}
          brownout={brownout}
          hasBattery={
            systemTopology !== 'grid_tie' && batteryCapacityKwh > 0.1
          }
        />
      </motion.div>

      {/* Section 5: Grid Brownout Stress Test Scheduler & Automated Diagnostic Optimizer */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.25, ease: EASE_CURVE }}
      >
        <BrownoutStressTestCard summary={summary} />
      </motion.div>

      {/* Section 6: Engineering Disclaimer */}
      <EngineeringDisclaimer />
    </main>
  );
};

export const YieldSimulatorPage: React.FC = () => {
  return (
    <QueryClientProvider client={simulatorQueryClient}>
      <YieldSimulatorWorkspace />
    </QueryClientProvider>
  );
};
