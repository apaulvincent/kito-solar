import { isBatteryCapableInverter, matchProposalHardware } from '@/engine/inverterHelpers';
import { BASE_NODE_SPECS } from '@/lib/diagramNodeSpecs';
import { createEmptyLayout3D } from '@/lib/layout3dEngine';
import { STORAGE_KEYS, safeStorage } from '@/lib/storage';
import { syncUrlForView } from '@/lib/urlSync';
import { projectService } from '@/services/projectService';
import { useAuthStore } from '@/store/useAuthStore';
import { defaultBattery, defaultInverter, defaultModule } from './catalogSlice';
import {
  CalculatorSliceCreator,
  CalculatorState,
  EquipmentSizingSlice,
  recalculateForState,
} from './storeTypes';

function syncCustomPricesToProject(
  projectId: string | null,
  customPrices: Record<string, number>
): void {
  if (!projectId) return;
  const authUser = useAuthStore.getState().user;
  if (!authUser) return;
  projectService
    .updateProject(authUser.id, projectId, { custom_prices: customPrices })
    .catch((err) => {
      console.warn('Auto-save custom prices to active project failed:', err);
    });
}

export const createEquipmentSizingSlice: CalculatorSliceCreator<
  Omit<EquipmentSizingSlice, 'calculationResult'>
> = (set, get) => {
  const applySizingUpdate = (
    buildPatch: (state: CalculatorState) => Partial<CalculatorState>
  ) => {
    set((state) => {
      const patch = buildPatch(state);
      return {
        ...patch,
        calculationResult: recalculateForState(state, patch),
      };
    });
  };

  return {
    selectedInverter: defaultInverter,
    selectedModule: defaultModule,
    selectedBattery: defaultBattery,
    batteryCount: 1,
    gridVoltageV: 230,
    mainBreakerA: 100,
    panelCountOverride: null,
    selectedNodeKey: null,
    hoveredNodeKey: null,
    lastAppliedProposal: null,
    customPrices: {},

    applySizingProposal: (proposal) => {
      const state = get();
      const {
        selectedInverter: pricedInverter,
        selectedModule: pricedModule,
        selectedBattery: pricedBattery,
        batteryCount,
      } = matchProposalHardware(proposal, {
        inverters: state.inverters,
        modules: state.modules,
        batteries: state.batteries,
        currentInverter: state.selectedInverter,
        currentModule: state.selectedModule,
      });
      const panelCountOverride = proposal.billOfMaterials.panel.quantity;

      set({
        selectedInverter: pricedInverter,
        selectedModule: pricedModule,
        selectedBattery: pricedBattery,
        batteryCount,
        panelCountOverride,
        lastAppliedProposal: proposal,
        activeWorkbenchTab: 'pv_sizing',
        calculationResult: recalculateForState(state, {
          selectedInverter: pricedInverter,
          selectedModule: pricedModule,
          selectedBattery: pricedBattery,
          batteryCount,
          panelCountOverride,
        }),
      });
    },

    setInverter: (inverter) => {
      const isBatteryCapable = isBatteryCapableInverter(inverter);
      applySizingUpdate((state) => {
        const nextBattery = isBatteryCapable
          ? state.selectedBattery || state.batteries[0] || null
          : null;
        return {
          selectedInverter: inverter,
          selectedBattery: nextBattery,
          panelCountOverride: null,
        };
      });
    },

    setModule: (module) => {
      applySizingUpdate(() => ({
        selectedModule: module,
        panelCountOverride: null,
      }));
    },

    setBattery: (battery) => {
      applySizingUpdate(() => ({ selectedBattery: battery }));
    },

    setBatteryCount: (count) => {
      const safeCount = Math.max(1, count);
      applySizingUpdate(() => ({ batteryCount: safeCount }));
    },

    setGridVoltage: (voltage) => {
      applySizingUpdate(() => ({ gridVoltageV: voltage }));
    },

    setMainBreaker: (breakerA) => {
      applySizingUpdate(() => ({ mainBreakerA: breakerA }));
    },

    setPanelCountOverride: (override) => {
      applySizingUpdate(() => ({ panelCountOverride: override }));
    },

    setSelectedNodeKey: (key) => {
      const targetTab = key ? BASE_NODE_SPECS[key]?.workbenchTab : undefined;
      set((state) => ({
        selectedNodeKey: key,
        selectedCustomNodeId: null,
        selectedWireId: null,
        activeWorkbenchTab: targetTab || state.activeWorkbenchTab,
      }));
    },

    setHoveredNodeKey: (key) => {
      set({ hoveredNodeKey: key });
    },

    setCustomPrice: (key, pricePhp) => {
      const state = get();
      const nextCustomPrices = { ...state.customPrices };
      if (pricePhp === null || Number.isNaN(pricePhp) || pricePhp < 0) {
        delete nextCustomPrices[key];
      } else {
        nextCustomPrices[key] = pricePhp;
      }

      const calculationResult = recalculateForState(state, {
        customPrices: nextCustomPrices,
      });

      set({ customPrices: nextCustomPrices, calculationResult });
      syncCustomPricesToProject(state.activeProjectId, nextCustomPrices);
    },

    resetToDefaults: () => {
      const state = get();
      const emptyLayout = createEmptyLayout3D();
      safeStorage.removeItem(STORAGE_KEYS.workingLayout3d);

      const calculationResult = recalculateForState(state, {
        selectedInverter: defaultInverter,
        selectedModule: defaultModule,
        selectedBattery: defaultBattery,
        batteryCount: 1,
        gridVoltageV: 230,
        mainBreakerA: 100,
        panelCountOverride: null,
        customPrices: {},
        layout3d: emptyLayout,
      });

      set({
        activeProjectId: null,
        activeProjectName: null,
        customPrices: {},
        layout3d: emptyLayout,
        layout3dUndoStack: [],
        layout3dRedoStack: [],
        canvasTool: 'select',
        selectedCustomNodeId: null,
        selectedWireId: null,
        polarityAlertMessage: null,
        selectedInverter: defaultInverter,
        selectedModule: defaultModule,
        selectedBattery: defaultBattery,
        batteryCount: 1,
        gridVoltageV: 230,
        mainBreakerA: 100,
        panelCountOverride: null,
        selectedNodeKey: null,
        hoveredNodeKey: null,
        atsSource: 'solar',
        activeWorkbenchTab: 'electrical',
        calculationResult,
      });

      if (get().activeView === 'tool') {
        syncUrlForView('tool', null);
      }
    },
  };
};
