// src/features/yield-simulator/components/YieldSimulatorPage.tsx
import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, Lock, LogIn, UserPlus } from 'lucide-react';
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

  // Live Open-Meteo Solar Radiation Query (active only when weatherScenario === 'live_open_meteo')
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

  // Run 96-step physics & EMS simulation
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
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-8 text-center max-w-md space-y-2">
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
            Verifying authenticated session...
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loading your solar hardware configuration and SCADA telemetry profile.
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1220] p-6 sm:p-8 max-w-md w-full space-y-5 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
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
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Continue</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('register')}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveView('tool')}
          className="min-h-[38px] inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Solar Engineering Studio</span>
        </button>

        <div className="flex items-center gap-3">
          <DownloadSizingButton variant="compact" />
        </div>
      </div>

      {/* Page Title (R-09: Clean H1 without redundant eyebrow pill above it) */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Real-Time Solar Yield Monitoring & Digital Twin Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Inspect 15-minute MPPT solar harvest, DC-to-AC inverter clipping, afternoon zero-export battery curtailment, and overnight brownout survival across 96 daily time steps.
        </p>
      </div>

      {/* Section 1: Playback, Weather & EMS Dispatch Control Bar */}
      <SimulatorControlBar
        currentStep={currentStep}
        locationName={coordinates.locationName}
        isLiveWeatherLoading={isLiveWeatherLoading}
        liveWeatherError={liveWeatherError}
        onRetryLiveWeather={() => {
          refetchLiveWeather();
        }}
      />

      {/* Section 2: 24-Hour Energy Balance Ledger */}
      <DailyEnergyKpiRibbon
        summary={summary}
        tariffPhpPerKwh={tariffPhpPerKwh}
      />

      {/* Section 3: 2-Column Asymmetric SCADA Workbench (4-Node Power Flow + Smart Breaker Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
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
      </div>

      {/* Section 4: Synchronized 24-Hour Power Dispatch & Battery SoC Telemetry Charts */}
      <TelemetryChartSuite
        steps={summary.steps}
        currentStepIndex={safeStepIdx}
        minReserveSocPercent={minReserveSocPercent}
        brownout={brownout}
        hasBattery={systemTopology !== 'grid_tie' && batteryCapacityKwh > 0.1}
      />

      {/* Section 5: Grid Brownout Stress Test Scheduler & Automated Diagnostic Optimizer */}
      <BrownoutStressTestCard summary={summary} />

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
