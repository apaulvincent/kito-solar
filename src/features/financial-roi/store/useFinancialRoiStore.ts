// src/features/financial-roi/store/useFinancialRoiStore.ts
// Zustand store managing user financial parameters, utility tariffs, CAPEX overrides, and simulation results.

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ExportStrategy,
  FinancialConfig,
  ScenarioSimulationResult,
  SystemSizingInput,
} from '../types/financialRoi';
import {
  DEFAULT_FINANCIAL_CONFIG,
  UTILITY_PRESETS,
} from '../utils/utilityTariffPresets';
import {
  computeScenarioSimulation,
  estimateSizingFromMonthlyBill,
  simulateAllScenarios,
} from '../utils/financialEngine';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';

export interface FinancialRoiState {
  config: FinancialConfig;
  standaloneMonthlyBillPhp: number;
  useStandaloneBillOverride: boolean;
  activeScenarioComparison: ExportStrategy;
  showAllCurvesOnTimeline: boolean;
  highlightedTimelineYear: number | null;

  // Actions
  setUtilityPreset: (presetId: string) => void;
  updateConfig: (updates: Partial<FinancialConfig>) => void;
  setStandaloneMonthlyBill: (billPhp: number) => void;
  setUseStandaloneBillOverride: (useOverride: boolean) => void;
  setActiveScenarioComparison: (strategy: ExportStrategy) => void;
  setShowAllCurvesOnTimeline: (showAll: boolean) => void;
  setHighlightedTimelineYear: (year: number | null) => void;
  resetToDefaults: () => void;

  // Imperative helpers (for store.getState() calls & tests)
  getSystemSizingInput: () => SystemSizingInput;
  getActiveSimulation: () => ScenarioSimulationResult;
  getAllScenarioSimulations: () => Record<ExportStrategy, ScenarioSimulationResult>;
}

const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
};

export const useFinancialRoiStore = create<FinancialRoiState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_FINANCIAL_CONFIG,
      standaloneMonthlyBillPhp: 8500,
      useStandaloneBillOverride: false,
      activeScenarioComparison: 'net_metering',
      showAllCurvesOnTimeline: true,
      highlightedTimelineYear: null,

      setUtilityPreset: (presetId: string) => {
        const preset = UTILITY_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;

        set((state) => ({
          config: {
            ...state.config,
            selectedUtilityId: preset.id,
            retailRatePhp: preset.retailRatePhp,
            exportCreditRatePhp: preset.exportCreditRatePhp,
            netMeteringSetupCostPhp: preset.netMeteringSetupCostPhp,
          },
        }));
      },

      updateConfig: (updates: Partial<FinancialConfig>) => {
        set((state) => ({
          config: {
            ...state.config,
            ...updates,
          },
        }));
      },

      setStandaloneMonthlyBill: (billPhp: number) => {
        set({ standaloneMonthlyBillPhp: Math.max(1000, Math.min(200000, billPhp)) });
      },

      setUseStandaloneBillOverride: (useOverride: boolean) => {
        set({ useStandaloneBillOverride: useOverride });
      },

      setActiveScenarioComparison: (strategy: ExportStrategy) => {
        set((state) => ({
          activeScenarioComparison: strategy,
          config: {
            ...state.config,
            exportStrategy: strategy,
          },
        }));
      },

      setShowAllCurvesOnTimeline: (showAll: boolean) => {
        set({ showAllCurvesOnTimeline: showAll });
      },

      setHighlightedTimelineYear: (year: number | null) => {
        set({ highlightedTimelineYear: year });
      },

      resetToDefaults: () => {
        set({
          config: DEFAULT_FINANCIAL_CONFIG,
          standaloneMonthlyBillPhp: 8500,
          useStandaloneBillOverride: false,
          activeScenarioComparison: 'net_metering',
          showAllCurvesOnTimeline: true,
          highlightedTimelineYear: null,
        });
      },

      getSystemSizingInput: (): SystemSizingInput => {
        const state = get();
        const retailRate = state.config.retailRatePhp;

        // 1. Get PSH from Solar Mapper if available
        let effectivePsh = 4.5;
        try {
          const mapperProfile = useSolarMapperStore.getState().irradianceProfile;
          if (mapperProfile?.annualAvgEffectivePsh && mapperProfile.annualAvgEffectivePsh > 0) {
            effectivePsh = mapperProfile.annualAvgEffectivePsh;
          }
        } catch {}

        // 2. Check if user explicitly wants the quick standalone slider
        if (state.useStandaloneBillOverride) {
          return estimateSizingFromMonthlyBill(state.standaloneMonthlyBillPhp, retailRate, effectivePsh);
        }

        // 3. Try pulling from Appliance Load Calculator
        try {
          const loadState = useApplianceLoadStore.getState();
          if (loadState.items && loadState.items.length > 0) {
            const sizing = loadState.getSizingResult();
            if (sizing.totalDailyKwh > 0) {
              return {
                pvKwp: Math.max(1.0, sizing.recommendedPvKwp),
                inverterKw: Math.max(1.0, sizing.recommendedInverterKw),
                batteryKwh: sizing.recommendedBatteryKwh || 5.12,
                dailyTotalKwh: sizing.totalDailyKwh,
                dailyDaytimeKwh: sizing.daytimeKwh,
                dailyNighttimeKwh: sizing.nighttimeKwh,
                effectivePsh,
                systemEfficiency: 0.80,
                batteryDod: 0.80,
                batteryRoundTripEfficiency: 0.90,
                sourceLabel: `Synced from Appliance Load (${loadState.items.length} appliances, ${sizing.totalDailyKwh.toFixed(1)} kWh/day)`,
              };
            }
          }
        } catch {}

        // 4. Try pulling from Solar Engineering Tool calculation result
        try {
          const calcState = useCalculatorStore.getState();
          const calcResult = calcState.calculationResult;
          if (calcResult && calcResult.summary.totalArrayPowerKw > 0) {
            const pvKwp = calcResult.summary.totalArrayPowerKw;
            const inverterKw = calcResult.summary.inverterPowerKw;
            const batteryKwh = calcResult.battery?.hasBattery
              ? calcResult.battery.totalEnergyWh / 1000
              : 5.12;
            const dailyGen = pvKwp * effectivePsh * 0.80;

            return {
              pvKwp,
              inverterKw,
              batteryKwh,
              dailyTotalKwh: dailyGen,
              dailyDaytimeKwh: Math.round(dailyGen * 0.45 * 10) / 10,
              dailyNighttimeKwh: Math.round(dailyGen * 0.55 * 10) / 10,
              effectivePsh,
              systemEfficiency: 0.80,
              batteryDod: 0.80,
              batteryRoundTripEfficiency: 0.90,
              sourceLabel: `Synced from Solar Engineering Workbench (${pvKwp.toFixed(2)} kWp Array)`,
            };
          }
        } catch {}

        // 5. Fallback to Standalone Monthly Bill estimation
        return estimateSizingFromMonthlyBill(state.standaloneMonthlyBillPhp, retailRate, effectivePsh);
      },

      getActiveSimulation: (): ScenarioSimulationResult => {
        const state = get();
        const input = state.getSystemSizingInput();
        return computeScenarioSimulation(input, state.config, state.config.exportStrategy);
      },

      getAllScenarioSimulations: (): Record<ExportStrategy, ScenarioSimulationResult> => {
        const state = get();
        const input = state.getSystemSizingInput();
        return simulateAllScenarios(input, state.config);
      },
    }),
    {
      name: 'kito_financial_roi_v1',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state): any => ({
        config: state.config,
        standaloneMonthlyBillPhp: state.standaloneMonthlyBillPhp,
        useStandaloneBillOverride: state.useStandaloneBillOverride,
        activeScenarioComparison: state.activeScenarioComparison,
        showAllCurvesOnTimeline: state.showAllCurvesOnTimeline,
      }),
    }
  )
);

/**
 * React 19 safe memoized hook that subscribes to stable state primitives/references
 * and computes `sizingInput`, `activeSim`, and `allScenarios` without triggering
 * `useSyncExternalStore` infinite snapshot loops.
 */
export function useFinancialRoiSimulation() {
  const config = useFinancialRoiStore((s) => s.config);
  const standaloneMonthlyBillPhp = useFinancialRoiStore((s) => s.standaloneMonthlyBillPhp);
  const useStandaloneBillOverride = useFinancialRoiStore((s) => s.useStandaloneBillOverride);
  const getSystemSizingInput = useFinancialRoiStore((s) => s.getSystemSizingInput);

  // Subscribe to relevant external store state so changes re-compute memoized simulation
  const loadItems = useApplianceLoadStore((s) => s.items);
  const loadConfig = useApplianceLoadStore((s) => s.config);
  const effectivePsh = useSolarMapperStore((s) => s.irradianceProfile?.annualAvgEffectivePsh);

  const sizingInput = useMemo(
    () => getSystemSizingInput(),
    [
      getSystemSizingInput,
      config.retailRatePhp,
      standaloneMonthlyBillPhp,
      useStandaloneBillOverride,
      loadItems,
      loadConfig,
      effectivePsh,
    ]
  );

  const activeSim = useMemo(
    () => computeScenarioSimulation(sizingInput, config, config.exportStrategy),
    [sizingInput, config]
  );

  const allScenarios = useMemo(
    () => simulateAllScenarios(sizingInput, config),
    [sizingInput, config]
  );

  return {
    config,
    sizingInput,
    activeSim,
    allScenarios,
  };
}
