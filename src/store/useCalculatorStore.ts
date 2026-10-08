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

  // Derived Calculation
  calculationResult: SystemCalculationResult;

  // Actions
  initializeCatalog: () => Promise<void>;
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
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  resetToDefaults: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('kito_solar_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

const initialTheme = getInitialTheme();
if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initial regression default selection
const defaultInverter =
  (invertersSeed as SolarInverterRecord[]).find((i) => i.model === 'HESP4860S100-H') ||
  (invertersSeed[0] as SolarInverterRecord);

const defaultModule =
  (modulesSeed as SolarModuleRecord[]).find((m) => m.model === 'CS6R-585MS') ||
  (modulesSeed[0] as SolarModuleRecord);

const defaultBattery =
  (batteriesSeed as BatteryRecord[]).find((b) => b.model === '24V-150 Ah') ||
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

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
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
  },

  setHoveredNodeKey: (key) => {
    set({ hoveredNodeKey: key });
  },

  setIsInspectorOpen: (open) => {
    set({ isInspectorOpen: open });
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

  resetToDefaults: () => {
    set({
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
  },
}));
