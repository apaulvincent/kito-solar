import { DetailMode } from '@/types/calculator';
import { sanitizeLayout3D } from '@/lib/layout3dEngine';
import { STORAGE_KEYS, safeStorage, writeJson } from '@/lib/storage';
import {
  applyThemeToDocument,
  getInitialTheme,
  persistAndApplyTheme,
} from '@/lib/theme';
import { getInitialViewFromLocation, syncUrlForView } from '@/lib/urlSync';
import {
  CalculatorSliceCreator,
  ProjectUiSlice,
  recalculateForState,
} from './storeTypes';

const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

function readDetailMode(key: string): DetailMode {
  return safeStorage.getItem(key) === 'detailed' ? 'detailed' : 'min';
}

export const createProjectUiSlice: CalculatorSliceCreator<ProjectUiSlice> = (set, get) => ({
  activeView: getInitialViewFromLocation(),
  activeProjectId: null,
  activeProjectName: null,
  theme: initialTheme,
  step1DetailMode: readDetailMode(STORAGE_KEYS.step1DetailMode),
  step2DetailMode: readDetailMode(STORAGE_KEYS.step2DetailMode),
  activeWorkbenchTab: 'electrical',
  isCopilotOpen: false,
  atsSource: 'solar',

  setActiveProjectId: (id, name) => {
    set((state) => ({
      activeProjectId: id,
      activeProjectName: name !== undefined ? name : state.activeProjectName,
    }));
    if (get().activeView === 'tool') {
      syncUrlForView('tool', id);
    }
  },

  setActiveView: (view, projectId) => {
    const targetProjectId =
      projectId !== undefined ? projectId : view === 'tool' ? get().activeProjectId : null;
    syncUrlForView(view, targetProjectId);
    set({ activeView: view });
  },

  setIsCopilotOpen: (open) => {
    set({ isCopilotOpen: open });
  },

  toggleCopilot: () => {
    set((state) => ({ isCopilotOpen: !state.isCopilotOpen }));
  },

  setAtsSource: (source) => {
    set({ atsSource: source });
  },

  toggleAtsSource: () => {
    set((state) => ({ atsSource: state.atsSource === 'solar' ? 'utility' : 'solar' }));
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      persistAndApplyTheme(next);
      return { theme: next };
    });
  },

  setActiveWorkbenchTab: (tab) => {
    set({ activeWorkbenchTab: tab });
  },

  setStep1DetailMode: (mode) => {
    safeStorage.setItem(STORAGE_KEYS.step1DetailMode, mode);
    set({ step1DetailMode: mode });
  },

  setStep2DetailMode: (mode) => {
    safeStorage.setItem(STORAGE_KEYS.step2DetailMode, mode);
    set({ step2DetailMode: mode });
  },

  loadProject: (project) => {
    const state = get();
    const selectedInverter =
      state.inverters.find((i) => i.model === project.inverter_model) ||
      state.selectedInverter;
    const selectedModule =
      state.modules.find((m) => m.model === project.module_model) ||
      state.selectedModule;
    const selectedBattery = project.battery_model
      ? state.batteries.find((b) => b.model === project.battery_model) || null
      : null;

    const batteryCount = Math.max(1, project.battery_count || 1);
    const gridVoltageV = project.grid_voltage_v || 230;
    const mainBreakerA = project.main_breaker_a;
    const panelCountOverride = project.panel_count_override;
    const customPrices = (project.custom_prices as Record<string, number>) || {};
    const layout3d = sanitizeLayout3D(project.layout_3d);

    writeJson(STORAGE_KEYS.workingLayout3d, layout3d);

    set({
      selectedInverter,
      selectedModule,
      selectedBattery,
      batteryCount,
      gridVoltageV,
      mainBreakerA,
      panelCountOverride,
      activeProjectId: project.id,
      activeProjectName: project.name,
      activeView: 'tool',
      selectedNodeKey: null,
      selectedCustomNodeId: null,
      selectedWireId: null,
      hoveredNodeKey: null,
      activeWorkbenchTab: 'electrical',
      customPrices,
      layout3d,
      layout3dUndoStack: [],
      layout3dRedoStack: [],
      calculationResult: recalculateForState(state, {
        selectedInverter,
        selectedModule,
        selectedBattery,
        batteryCount,
        gridVoltageV,
        mainBreakerA,
        panelCountOverride,
        customPrices,
        layout3d,
      }),
    });

    syncUrlForView('tool', project.id);
  },

  clearActiveProject: () => {
    set({ activeProjectId: null, activeProjectName: null, customPrices: {} });
    if (get().activeView === 'tool') {
      syncUrlForView('tool', null);
    }
  },
});
