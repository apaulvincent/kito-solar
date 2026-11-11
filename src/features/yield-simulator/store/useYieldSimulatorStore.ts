import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  BrownoutSchedule,
  EmsDispatchMode,
  SimulationSpeed,
  SystemTopologyMode,
  WeatherScenario,
} from '../types/yieldSimulator';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { readLoadSizingSnapshot, readStudioHardwareSnapshot } from '@/store/systemSizingSelector';
import { DEFAULT_RETAIL_TARIFF_PHP_PER_KWH } from '@/lib/solarConstants';
import { STORAGE_KEYS, safeStorage } from '@/lib/storage';

export interface YieldSimulatorStoreState {
  weatherScenario: WeatherScenario;
  emsMode: EmsDispatchMode;
  systemTopology: SystemTopologyMode;
  isZeroExport: boolean;
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  initialBatterySocPercent: number;
  minReserveSocPercent: number;
  tariffPhpPerKwh: number;
  brownout: BrownoutSchedule;
  instantBlackoutActive: boolean;
  isPlaying: boolean;
  playbackSpeed: SimulationSpeed;
  currentStepIndex: number; // 0..95 (default 48 = 12:00 PM)
  disabledApplianceIds: string[];
  forcedOnApplianceIds: string[];
  shiftedToMiddayIds: string[];
  syncSunHourWith3D: boolean;
  hasSyncedInitialHardware: boolean;

  // Actions
  setWeatherScenario: (scenario: WeatherScenario) => void;
  setEmsMode: (mode: EmsDispatchMode) => void;
  setSystemTopology: (topology: SystemTopologyMode) => void;
  setIsZeroExport: (zeroExport: boolean) => void;
  setSystemSpecs: (specs: {
    pvArrayKwp?: number;
    inverterKw?: number;
    batteryCapacityKwh?: number;
    initialBatterySocPercent?: number;
    minReserveSocPercent?: number;
    tariffPhpPerKwh?: number;
  }) => void;
  syncFromSolarStudio: () => void;
  syncFromLoadCalculator: () => void;
  setBrownout: (updates: Partial<BrownoutSchedule>) => void;
  toggleInstantBlackout: () => void;
  setInstantBlackoutActive: (active: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: SimulationSpeed) => void;
  setCurrentStepIndex: (stepIndex: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  toggleApplianceBreaker: (applianceId: string) => void;
  toggleApplianceForceOn: (applianceId: string) => void;
  shiftFlexibleLoadsToMidday: (applianceIds: string[]) => void;
  resetBreakerOverrides: () => void;
  setSyncSunHourWith3D: (sync: boolean) => void;
}

const initialSpecs = readStudioHardwareSnapshot(10.24);

export const useYieldSimulatorStore = create<YieldSimulatorStoreState>()(
  persist(
    (set, get) => ({
      weatherScenario: 'clear_sky',
      emsMode: 'self_consumption',
      systemTopology: initialSpecs.topology,
      isZeroExport: false,
      pvArrayKwp: initialSpecs.pvArrayKwp,
      inverterKw: initialSpecs.inverterKw,
      batteryCapacityKwh: initialSpecs.batteryCapacityKwh,
      initialBatterySocPercent: 35,
      minReserveSocPercent: 20,
      tariffPhpPerKwh: DEFAULT_RETAIL_TARIFF_PHP_PER_KWH,
      brownout: {
        enabled: false,
        startHour: 18.0,
        endHour: 23.5,
        shedNonCriticalLoads: true,
      },
      instantBlackoutActive: false,
      isPlaying: false,
      playbackSpeed: 1,
      currentStepIndex: 48, // 12:00 PM noon
      disabledApplianceIds: [],
      forcedOnApplianceIds: [],
      shiftedToMiddayIds: [],
      syncSunHourWith3D: true,
      hasSyncedInitialHardware: false,

      setWeatherScenario: (weatherScenario) => set({ weatherScenario }),
      setEmsMode: (emsMode) => set({ emsMode }),
      setSystemTopology: (systemTopology) =>
        set((state) => ({
          systemTopology,
          batteryCapacityKwh:
            systemTopology === 'grid_tie'
              ? 0
              : state.batteryCapacityKwh > 0
              ? state.batteryCapacityKwh
              : 10.24,
        })),
      setIsZeroExport: (isZeroExport) => set({ isZeroExport }),

      setSystemSpecs: (specs) =>
        set((state) => ({
          pvArrayKwp:
            specs.pvArrayKwp !== undefined
              ? Math.max(0.5, Math.min(100, Number(specs.pvArrayKwp.toFixed(2))))
              : state.pvArrayKwp,
          inverterKw:
            specs.inverterKw !== undefined
              ? Math.max(0.5, Math.min(100, Number(specs.inverterKw.toFixed(2))))
              : state.inverterKw,
          batteryCapacityKwh:
            specs.batteryCapacityKwh !== undefined
              ? Math.max(
                  0,
                  Math.min(200, Number(specs.batteryCapacityKwh.toFixed(2)))
                )
              : state.batteryCapacityKwh,
          initialBatterySocPercent:
            specs.initialBatterySocPercent !== undefined
              ? Math.max(5, Math.min(100, specs.initialBatterySocPercent))
              : state.initialBatterySocPercent,
          minReserveSocPercent:
            specs.minReserveSocPercent !== undefined
              ? Math.max(5, Math.min(80, specs.minReserveSocPercent))
              : state.minReserveSocPercent,
          tariffPhpPerKwh:
            specs.tariffPhpPerKwh !== undefined
              ? Math.max(1, Math.min(50, specs.tariffPhpPerKwh))
              : state.tariffPhpPerKwh,
        })),

      syncFromSolarStudio: () => {
        const snap = readStudioHardwareSnapshot(0);
        set({
          pvArrayKwp: snap.pvArrayKwp,
          inverterKw: snap.inverterKw,
          batteryCapacityKwh: snap.batteryCapacityKwh,
          systemTopology: snap.topology,
          hasSyncedInitialHardware: true,
        });
      },

      syncFromLoadCalculator: () => {
        const sizing = readLoadSizingSnapshot();
        set({
          pvArrayKwp: Number((sizing.recommendedPvKwp || 6.0).toFixed(2)),
          inverterKw: Number((sizing.recommendedInverterKw || 5.0).toFixed(2)),
          batteryCapacityKwh: Number((sizing.recommendedBatteryKwh || 0).toFixed(2)),
          systemTopology: sizing.recommendedTopology,
          hasSyncedInitialHardware: true,
        });
      },

      setBrownout: (updates) =>
        set((state) => ({
          brownout: { ...state.brownout, ...updates },
        })),

      toggleInstantBlackout: () =>
        set((state) => ({
          instantBlackoutActive: !state.instantBlackoutActive,
        })),

      setInstantBlackoutActive: (instantBlackoutActive) =>
        set({ instantBlackoutActive }),

      setIsPlaying: (isPlaying) => set({ isPlaying }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      setCurrentStepIndex: (stepIndex) => {
        const clamped = ((Math.round(stepIndex) % 96) + 96) % 96;
        set({ currentStepIndex: clamped });

        if (get().syncSunHourWith3D) {
          const hourDec = clamped * 0.25;
          if (hourDec >= 6 && hourDec <= 18) {
            try {
              useSolarMapperStore.getState().setSunHour(hourDec);
            } catch {
              // Ignore if mapper store is not initialized
            }
          }
        }
      },

      stepForward: () => {
        const next = (get().currentStepIndex + 1) % 96;
        get().setCurrentStepIndex(next);
      },

      stepBackward: () => {
        const prev = (get().currentStepIndex - 1 + 96) % 96;
        get().setCurrentStepIndex(prev);
      },

      toggleApplianceBreaker: (applianceId) =>
        set((state) => {
          const isCurrentlyDisabled =
            state.disabledApplianceIds.includes(applianceId);
          if (isCurrentlyDisabled) {
            return {
              disabledApplianceIds: state.disabledApplianceIds.filter(
                (id) => id !== applianceId
              ),
            };
          }
          return {
            disabledApplianceIds: [...state.disabledApplianceIds, applianceId],
            forcedOnApplianceIds: state.forcedOnApplianceIds.filter(
              (id) => id !== applianceId
            ),
          };
        }),

      toggleApplianceForceOn: (applianceId) =>
        set((state) => {
          const isForced = state.forcedOnApplianceIds.includes(applianceId);
          if (isForced) {
            return {
              forcedOnApplianceIds: state.forcedOnApplianceIds.filter(
                (id) => id !== applianceId
              ),
            };
          }
          return {
            forcedOnApplianceIds: [...state.forcedOnApplianceIds, applianceId],
            disabledApplianceIds: state.disabledApplianceIds.filter(
              (id) => id !== applianceId
            ),
          };
        }),

      shiftFlexibleLoadsToMidday: (applianceIds) =>
        set((state) => ({
          shiftedToMiddayIds: Array.from(
            new Set([...state.shiftedToMiddayIds, ...applianceIds])
          ),
        })),

      resetBreakerOverrides: () =>
        set({
          disabledApplianceIds: [],
          forcedOnApplianceIds: [],
          shiftedToMiddayIds: [],
        }),

      setSyncSunHourWith3D: (syncSunHourWith3D) => set({ syncSunHourWith3D }),
    }),
    {
      name: STORAGE_KEYS.yieldSimulator,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        weatherScenario: state.weatherScenario,
        emsMode: state.emsMode,
        systemTopology: state.systemTopology,
        isZeroExport: state.isZeroExport,
        pvArrayKwp: state.pvArrayKwp,
        inverterKw: state.inverterKw,
        batteryCapacityKwh: state.batteryCapacityKwh,
        initialBatterySocPercent: state.initialBatterySocPercent,
        minReserveSocPercent: state.minReserveSocPercent,
        tariffPhpPerKwh: state.tariffPhpPerKwh,
        brownout: state.brownout,
        currentStepIndex: state.currentStepIndex,
        disabledApplianceIds: state.disabledApplianceIds,
        forcedOnApplianceIds: state.forcedOnApplianceIds,
        shiftedToMiddayIds: state.shiftedToMiddayIds,
        syncSunHourWith3D: state.syncSunHourWith3D,
      }),
    }
  )
);
