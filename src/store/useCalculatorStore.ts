// src/store/useCalculatorStore.ts
import { create } from 'zustand';
import {
  SolarInverterRecord,
  SolarModuleRecord,
  BatteryRecord,
} from '@/types/supabase';
import { SystemCalculationResult } from '@/types/calculator';
import { DiagramNodeKey } from '@/types/diagram';
import { calculateSystem } from '@/engine/calculateSystem';

import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import { catalogService } from '@/services/catalogService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SavedProject } from '@/types/project';

export type WorkbenchTabKey = 'electrical' | 'pv_sizing' | 'mounting_bom' | 'warnings';
export type ActiveView = 'home' | 'tool' | 'projects' | 'login' | 'register' | 'account';
export type DetailMode = 'min' | 'detailed';

interface CalculatorState {
  // Catalogs
  inverters: SolarInverterRecord[];
  modules: SolarModuleRecord[];
  batteries: BatteryRecord[];
  isLoadingCatalog: boolean;
  catalogSource: 'supabase' | 'local_seed';

  // User Selections
  selectedInverter: SolarInverterRecord;
  selectedModule: SolarModuleRecord;
  selectedBattery: BatteryRecord | null;
  batteryCount: number;
  gridVoltageV: number;
  mainBreakerA: number | null;
  panelCountOverride: number | null;

  // Active UI / Diagram State
  selectedNodeKey: DiagramNodeKey | null;
  hoveredNodeKey: DiagramNodeKey | null;
  isInspectorOpen: boolean;
  theme: 'dark' | 'light';
  activeWorkbenchTab: WorkbenchTabKey;
  activeView: ActiveView;
  step1DetailMode: DetailMode;
  step2DetailMode: DetailMode;
  atsSource: 'solar' | 'utility';
  activeProjectId: string | null;
  activeProjectName: string | null;

  // Derived Calculation
  calculationResult: SystemCalculationResult;

  initializeCatalog: () => Promise<void>;
  setActiveProjectId: (id: string | null, name?: string | null) => void;
  setActiveView: (view: ActiveView, projectId?: string | null) => void;
  setInverter: (inverter: SolarInverterRecord) => void;
  setModule: (module: SolarModuleRecord) => void;
  setBattery: (battery: BatteryRecord | null) => void;
  setBatteryCount: (count: number) => void;
  setGridVoltage: (voltage: number) => void;
  setMainBreaker: (breakerA: number | null) => void;
  setPanelCountOverride: (override: number | null) => void;
  setSelectedNodeKey: (key: DiagramNodeKey | null) => void;
  setHoveredNodeKey: (key: DiagramNodeKey | null) => void;
  setIsInspectorOpen: (open: boolean) => void;
  setAtsSource: (source: 'solar' | 'utility') => void;
  toggleAtsSource: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActiveWorkbenchTab: (tab: WorkbenchTabKey) => void;
  setStep1DetailMode: (mode: DetailMode) => void;
  setStep2DetailMode: (mode: DetailMode) => void;
  loadProject: (project: SavedProject) => void;
  clearActiveProject: () => void;
  resetToDefaults: () => void;
}

const getInitialStep1DetailMode = (): DetailMode => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('kito_step1_detail_mode');
      if (saved === 'detailed') return 'detailed';
    } catch (e) {}
  }
  return 'min';
};

const getInitialStep2DetailMode = (): DetailMode => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('kito_step2_detail_mode');
      if (saved === 'detailed') return 'detailed';
    } catch (e) {}
  }
  return 'min';
};

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kito_solar_theme');
    if (saved === 'dark') return 'dark';
  }
  return 'light';
};

export const extractProjectIdFromUrl = (pathname: string, search?: string): string | null => {
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const parts = cleanPath.split('/');
  if (parts.length >= 2) {
    const prefix = parts[0].toLowerCase();
    if (prefix === 'projects' || prefix === 'project' || prefix === 'tool') {
      const candidate = parts[1];
      if (candidate && candidate.toLowerCase() !== 'new') {
        return candidate;
      }
    }
  }
  if (search) {
    try {
      const params = new URLSearchParams(search);
      const p = params.get('project') || params.get('id');
      if (p) return p;
    } catch (e) {}
  }
  return null;
};

export const pathToView = (pathname: string, hash?: string): ActiveView => {
  const cleanPath = pathname.toLowerCase().replace(/^\/+|\/+$/g, '');
  const parts = cleanPath.split('/');

  // If path is /projects/<id> or /project/<id>, it's a project link -> open tool!
  if ((parts[0] === 'projects' || parts[0] === 'project') && parts.length >= 2 && parts[1]) {
    return 'tool';
  }
  if (cleanPath === 'tool' || cleanPath === 'studio') return 'tool';
  if (cleanPath === 'projects') return 'projects';
  if (cleanPath === 'login') return 'login';
  if (cleanPath === 'register') return 'register';
  if (cleanPath === 'account') return 'account';

  // If at root or /home, check if a legacy hash was passed
  if (cleanPath === 'home' || cleanPath === '') {
    if (hash) {
      const cleanHash = hash.replace(/^#+/, '').toLowerCase();
      if (cleanHash === 'tool' || cleanHash === 'studio') return 'tool';
      if (cleanHash === 'projects') return 'projects';
      if (cleanHash === 'login') return 'login';
      if (cleanHash === 'register') return 'register';
      if (cleanHash === 'account') return 'account';
    }
    return 'home';
  }
  return 'home';
};

export const isOAuthHash = (hash: string): boolean => {
  return hash.includes('access_token') || hash.includes('refresh_token') || hash.includes('error=');
};

const getInitialView = (): ActiveView => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    const view = pathToView(window.location.pathname, hash);
    const projectId = extractProjectIdFromUrl(window.location.pathname, window.location.search);
    // Don't strip OAuth tokens so Supabase client can authenticate the user
    if (hash && !isOAuthHash(hash) && window.history?.replaceState) {
      const targetPath = projectId ? `/projects/${projectId}` : view === 'home' ? '/' : `/${view}`;
      window.history.replaceState({ view, projectId }, '', targetPath);
    }
    return view;
  }
  return 'home';
};

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initial default equipment selection (Deye Inverter, Aiko Solar Module, 51.2V Battery)
const defaultInverter =
  (invertersSeed as SolarInverterRecord[]).find(
    (i) => i.brand.toUpperCase() === 'DEYE' && i.model === 'SUN-6K-SG05LP1-EU'
  ) ||
  (invertersSeed as SolarInverterRecord[]).find(
    (i) => i.brand.toUpperCase() === 'DEYE'
  ) ||
  (invertersSeed[0] as SolarInverterRecord);

const defaultModule =
  (modulesSeed as SolarModuleRecord[]).find(
    (m) => m.brand.toUpperCase() === 'AIKO' && m.model === 'AIKO-M-500'
  ) ||
  (modulesSeed as SolarModuleRecord[]).find(
    (m) => m.brand.toUpperCase() === 'AIKO'
  ) ||
  (modulesSeed[0] as SolarModuleRecord);

const defaultBattery =
  (batteriesSeed as BatteryRecord[]).find((b) => b.model === '51.2V-200 Ah') ||
  (batteriesSeed[0] as BatteryRecord);

function compute(
  inv: SolarInverterRecord,
  mod: SolarModuleRecord,
  bat: BatteryRecord | null,
  batCount: number,
  gridV: number,
  mainA: number | null,
  panelOverride: number | null
): SystemCalculationResult {
  return calculateSystem({
    inverter: inv,
    module: mod,
    battery: bat,
    batteryCount: batCount,
    gridVoltageV: gridV,
    mainBreakerA: mainA,
    panelCountOverride: panelOverride,
  });
}

export const useCalculatorStore = create<CalculatorState>((set, get, api) => {
  api.getInitialState = () => get();
  return {
  inverters: invertersSeed as SolarInverterRecord[],
  modules: modulesSeed as SolarModuleRecord[],
  batteries: batteriesSeed as BatteryRecord[],
  isLoadingCatalog: false,
  catalogSource: 'local_seed',

  selectedInverter: defaultInverter,
  selectedModule: defaultModule,
  selectedBattery: defaultBattery,
  batteryCount: 1,
  gridVoltageV: 230,
  mainBreakerA: 100,
  panelCountOverride: null,

  selectedNodeKey: null,
  hoveredNodeKey: null,
  isInspectorOpen: false,
  theme: initialTheme,
  activeWorkbenchTab: 'electrical',
  activeView: getInitialView(),
  step1DetailMode: getInitialStep1DetailMode(),
  step2DetailMode: getInitialStep2DetailMode(),
  atsSource: 'solar',
  activeProjectId: null,
  activeProjectName: null,

  calculationResult: compute(
    defaultInverter,
    defaultModule,
    defaultBattery,
    1,
    230,
    100,
    null
  ),

  initializeCatalog: async () => {
    if (!isSupabaseConfigured) return;
    set({ isLoadingCatalog: true });
    try {
      const [invs, mods, bats] = await Promise.all([
        catalogService.getInverters(),
        catalogService.getModules(),
        catalogService.getBatteries(),
      ]);

      const isLive = catalogService.isLive;

      set((state) => {
        const selectedInverter =
          invs.find((i) => i.model === state.selectedInverter.model) || invs[0] || state.selectedInverter;
        const selectedModule =
          mods.find((m) => m.model === state.selectedModule.model) || mods[0] || state.selectedModule;
        const selectedBattery = state.selectedBattery
          ? bats.find((b) => b.model === state.selectedBattery?.model) || bats[0] || null
          : null;

        return {
          inverters: invs,
          modules: mods,
          batteries: bats,
          selectedInverter,
          selectedModule,
          selectedBattery,
          isLoadingCatalog: false,
          catalogSource: isLive ? 'supabase' : 'local_seed',
          calculationResult: compute(
            selectedInverter,
            selectedModule,
            selectedBattery,
            state.batteryCount,
            state.gridVoltageV,
            state.mainBreakerA,
            state.panelCountOverride
          ),
        };
      });
    } catch (err) {
      console.warn('Catalog initialization fallback:', err);
      set({ isLoadingCatalog: false, catalogSource: 'local_seed' });
    }
  },

  setInverter: (inverter) => {
    const isBatteryCapable = Boolean(
      inverter.battery_type &&
      inverter.battery_voltage_range &&
      inverter.battery_type.toLowerCase() !== 'none'
    );
    // If inverter cannot take battery, clear selected battery
    const currentBattery = isBatteryCapable ? get().selectedBattery : null;

    set((state) => ({
      selectedInverter: inverter,
      selectedBattery: currentBattery,
      panelCountOverride: null, // Reset panel override to track new inverter sizing
      calculationResult: compute(
        inverter,
        state.selectedModule,
        currentBattery,
        state.batteryCount,
        state.gridVoltageV,
        state.mainBreakerA,
        null
      ),
    }));
  },

  setModule: (module) => {
    set((state) => ({
      selectedModule: module,
      panelCountOverride: null,
      calculationResult: compute(
        state.selectedInverter,
        module,
        state.selectedBattery,
        state.batteryCount,
        state.gridVoltageV,
        state.mainBreakerA,
        null
      ),
    }));
  },

  setBattery: (battery) => {
    set((state) => ({
      selectedBattery: battery,
      calculationResult: compute(
        state.selectedInverter,
        state.selectedModule,
        battery,
        state.batteryCount,
        state.gridVoltageV,
        state.mainBreakerA,
        state.panelCountOverride
      ),
    }));
  },

  setBatteryCount: (count) => {
    const safeCount = Math.max(1, count);
    set((state) => ({
      batteryCount: safeCount,
      calculationResult: compute(
        state.selectedInverter,
        state.selectedModule,
        state.selectedBattery,
        safeCount,
        state.gridVoltageV,
        state.mainBreakerA,
        state.panelCountOverride
      ),
    }));
  },

  setGridVoltage: (voltage) => {
    set((state) => ({
      gridVoltageV: voltage,
      calculationResult: compute(
        state.selectedInverter,
        state.selectedModule,
        state.selectedBattery,
        state.batteryCount,
        voltage,
        state.mainBreakerA,
        state.panelCountOverride
      ),
    }));
  },

  setMainBreaker: (breakerA) => {
    set((state) => ({
      mainBreakerA: breakerA,
      calculationResult: compute(
        state.selectedInverter,
        state.selectedModule,
        state.selectedBattery,
        state.batteryCount,
        state.gridVoltageV,
        breakerA,
        state.panelCountOverride
      ),
    }));
  },

  setPanelCountOverride: (override) => {
    set((state) => ({
      panelCountOverride: override,
      calculationResult: compute(
        state.selectedInverter,
        state.selectedModule,
        state.selectedBattery,
        state.batteryCount,
        state.gridVoltageV,
        state.mainBreakerA,
        override
      ),
    }));
  },

  setSelectedNodeKey: (key) => {
    set({
      selectedNodeKey: key,
      isInspectorOpen: Boolean(key),
    });
    if (key) {
      if (key === 'pv_array') {
        set({ activeWorkbenchTab: 'pv_sizing' });
      } else if (
        key === 'battery' ||
        key === 'battery_breaker' ||
        key === 'battery_wire' ||
        key === 'dc_breaker' ||
        key === 'dc_isolator' ||
        key === 'dc_spd' ||
        key === 'dc_conduit' ||
        key === 'inverter' ||
        key === 'ac_breaker' ||
        key === 'ac_isolator' ||
        key === 'ac_spd' ||
        key === 'ats' ||
        key === 'eps_breaker' ||
        key === 'main_panel' ||
        key === 'grid' ||
        key === 'load' ||
        key === 'grounding'
      ) {
        set({ activeWorkbenchTab: 'electrical' });
      }
    }
  },

  setHoveredNodeKey: (key) => {
    set({ hoveredNodeKey: key });
  },

  setIsInspectorOpen: (open) => {
    set({ isInspectorOpen: open });
  },

  setAtsSource: (source) => {
    set({ atsSource: source });
  },

  toggleAtsSource: () => {
    set((state) => ({ atsSource: state.atsSource === 'solar' ? 'utility' : 'solar' }));
  },

  setActiveWorkbenchTab: (tab) => {
    set({ activeWorkbenchTab: tab });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kito_solar_theme', theme);
      } catch (e) {}
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('kito_solar_theme', next);
        } catch (e) {}
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: next };
    });
  },

  setActiveProjectId: (id, name) => {
    set((state) => ({
      activeProjectId: id,
      activeProjectName: name !== undefined ? name : state.activeProjectName,
    }));
    if (typeof window !== 'undefined' && get().activeView === 'tool') {
      try {
        const targetPath = id ? `/projects/${id}` : '/tool';
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ view: 'tool', projectId: id }, '', targetPath);
        }
      } catch (e) {}
    }
  },

  setActiveView: (view, projectId) => {
    const targetProjectId =
      projectId !== undefined ? projectId : (view === 'tool' ? get().activeProjectId : null);

    if (typeof window !== 'undefined') {
      try {
        let targetPath: string;
        if (view === 'home') {
          targetPath = '/';
        } else if (view === 'tool') {
          targetPath = targetProjectId ? `/projects/${targetProjectId}` : '/tool';
        } else {
          targetPath = `/${view}`;
        }
        const currentPath = window.location.pathname;
        if (currentPath !== targetPath || window.location.hash) {
          window.history.pushState({ view, projectId: targetProjectId }, '', targetPath);
        }
      } catch (e) {}
    }
    set({ activeView: view });
  },

  setStep1DetailMode: (mode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kito_step1_detail_mode', mode);
      } catch (e) {}
    }
    set({ step1DetailMode: mode });
  },

  setStep2DetailMode: (mode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kito_step2_detail_mode', mode);
      } catch (e) {}
    }
    set({ step2DetailMode: mode });
  },

  loadProject: (project) => {
    const state = get();
    const inverter =
      state.inverters.find((i) => i.model === project.inverter_model) ||
      state.selectedInverter;
    const module =
      state.modules.find((m) => m.model === project.module_model) ||
      state.selectedModule;
    const battery = project.battery_model
      ? state.batteries.find((b) => b.model === project.battery_model) || null
      : null;

    set({
      selectedInverter: inverter,
      selectedModule: module,
      selectedBattery: battery,
      batteryCount: Math.max(1, project.battery_count || 1),
      gridVoltageV: project.grid_voltage_v || 230,
      mainBreakerA: project.main_breaker_a,
      panelCountOverride: project.panel_count_override,
      activeProjectId: project.id,
      activeProjectName: project.name,
      activeView: 'tool',
      selectedNodeKey: null,
      hoveredNodeKey: null,
      isInspectorOpen: false,
      activeWorkbenchTab: 'electrical',
      calculationResult: compute(
        inverter,
        module,
        battery,
        Math.max(1, project.battery_count || 1),
        project.grid_voltage_v || 230,
        project.main_breaker_a,
        project.panel_count_override
      ),
    });

    // Update browser URL to /projects/:id
    if (typeof window !== 'undefined') {
      try {
        const targetPath = `/projects/${project.id}`;
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ view: 'tool', projectId: project.id }, '', targetPath);
        }
      } catch (e) {}
    }
  },

  clearActiveProject: () => {
    set({ activeProjectId: null, activeProjectName: null });
    if (typeof window !== 'undefined' && get().activeView === 'tool') {
      try {
        if (window.location.pathname !== '/tool') {
          window.history.pushState({ view: 'tool', projectId: null }, '', '/tool');
        }
      } catch (e) {}
    }
  },

  resetToDefaults: () => {
    set({
      activeProjectId: null,
      activeProjectName: null,
      selectedInverter: defaultInverter,
      selectedModule: defaultModule,
      selectedBattery: defaultBattery,
      batteryCount: 1,
      gridVoltageV: 230,
      mainBreakerA: 100,
      panelCountOverride: null,
      selectedNodeKey: null,
      hoveredNodeKey: null,
      isInspectorOpen: false,
      atsSource: 'solar',
      activeWorkbenchTab: 'electrical',
      calculationResult: compute(
        defaultInverter,
        defaultModule,
        defaultBattery,
        1,
        230,
        100,
        null
      ),
    });
    if (typeof window !== 'undefined' && get().activeView === 'tool') {
      try {
        if (window.location.pathname !== '/tool') {
          window.history.pushState({ view: 'tool', projectId: null }, '', '/tool');
        }
      } catch (e) {}
    }
  },
};
});
