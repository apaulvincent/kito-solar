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
  simulateAllScenarios,
} from '../utils/financialEngine';
import { STORAGE_KEYS, safeStorage } from '@/lib/storage';
import {
  readCrossStoreFinancialSizingInput,
  useCrossFeatureFinancialSizingInput,
} from '@/store/systemSizingSelector';

export interface FinancialRoiState {
  config: FinancialConfig;
  standaloneMonthlyBillPhp: number;
  useStandaloneBillOverride: boolean;
  activeScenarioComparison: ExportStrategy;
  showAllCurvesOnTimeline: boolean;
  highlightedTimelineYear: number | null;

  setUtilityPreset: (presetId: string) => void;
  updateConfig: (updates: Partial<FinancialConfig>) => void;
  setStandaloneMonthlyBill: (billPhp: number) => void;
  setUseStandaloneBillOverride: (useOverride: boolean) => void;
  setActiveScenarioComparison: (strategy: ExportStrategy) => void;
  setShowAllCurvesOnTimeline: (showAll: boolean) => void;
  setHighlightedTimelineYear: (year: number | null) => void;
  resetToDefaults: () => void;

  getSystemSizingInput: () => SystemSizingInput;
  getActiveSimulation: () => ScenarioSimulationResult;
  getAllScenarioSimulations: () => Record<ExportStrategy, ScenarioSimulationResult>;
}

export const useFinancialRoiStore = create<FinancialRoiState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_FINANCIAL_CONFIG,
      standaloneMonthlyBillPhp: 7000,
      useStandaloneBillOverride: true,
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
        set({
          standaloneMonthlyBillPhp: Math.max(1000, Math.min(200000, billPhp)),
          useStandaloneBillOverride: true,
        });
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
          standaloneMonthlyBillPhp: 7000,
          useStandaloneBillOverride: true,
          activeScenarioComparison: 'net_metering',
          showAllCurvesOnTimeline: true,
          highlightedTimelineYear: null,
        });
      },

      getSystemSizingInput: (): SystemSizingInput => {
        const state = get();
        return readCrossStoreFinancialSizingInput({
          retailRatePhp: state.config.retailRatePhp,
          standaloneMonthlyBillPhp: state.standaloneMonthlyBillPhp,
          useStandaloneBillOverride: state.useStandaloneBillOverride,
        });
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
      name: STORAGE_KEYS.financialRoi,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        config: state.config,
        standaloneMonthlyBillPhp: state.standaloneMonthlyBillPhp,
        useStandaloneBillOverride: state.useStandaloneBillOverride,
        activeScenarioComparison: state.activeScenarioComparison,
        showAllCurvesOnTimeline: state.showAllCurvesOnTimeline,
      }),
    }
  )
);

export function useFinancialRoiSimulation() {
  const config = useFinancialRoiStore((s) => s.config);
  const standaloneMonthlyBillPhp = useFinancialRoiStore((s) => s.standaloneMonthlyBillPhp);
  const useStandaloneBillOverride = useFinancialRoiStore((s) => s.useStandaloneBillOverride);

  const sizingInput = useCrossFeatureFinancialSizingInput({
    retailRatePhp: config.retailRatePhp,
    standaloneMonthlyBillPhp,
    useStandaloneBillOverride,
  });

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
