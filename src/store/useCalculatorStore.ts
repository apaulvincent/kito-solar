// src/store/useCalculatorStore.ts
import { create } from 'zustand';
import {
  SolarInverterRecord,
  SolarModuleRecord,
  BatteryRecord,
  AccessoryRecord,
} from '@/types/supabase';
import { SystemCalculationResult } from '@/types/calculator';
import { DiagramNodeKey } from '@/types/diagram';
import { calculateSystem } from '@/engine/calculateSystem';
import { ProjectSizingResult } from '@/types/solar-ai';

import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import accessoriesSeed from '@/data/seed/calculator_accessories.json';
import { catalogService } from '@/services/catalogService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SavedProject } from '@/types/project';
import { projectService, generateShortId } from '@/services/projectService';
import { useAuthStore } from '@/store/useAuthStore';
import {
  AddableComponentKey,
  CanvasInteractionTool,
  Layout3DState,
  MountSurface,
  PlacedComponent3D,
  SCENE_LIMITS,
  WireConnection3D,
  WirePolarity,
} from '@/types/layout3d';
import {
  ADDABLE_CATALOG_MAP,
  DEFAULT_BASE_NODE_POSITIONS,
  buildOrthogonalWireWaypoints,
  calculateWaypointsLengthMeters,
  createEmptyLayout3D,
  findFreeSpawnPosition,
  getLimitStatus,
  recomputeAttachedWireLengths,
  sanitizeLayout3D,
} from '@/lib/layout3dEngine';

export type WorkbenchTabKey = 'electrical' | 'pv_sizing' | 'mounting_bom' | 'warnings';
export type ActiveView = 'home' | 'tool' | 'projects' | 'login' | 'register' | 'account' | 'load-calculator' | 'solar-mapper' | 'financial-roi' | 'yield-simulator' | 'contact';
export type DetailMode = 'min' | 'detailed';

interface CalculatorState {
  // Catalogs
  inverters: SolarInverterRecord[];
  modules: SolarModuleRecord[];
  batteries: BatteryRecord[];
  accessories: AccessoryRecord[];
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
  isCopilotOpen: boolean;
  lastAppliedProposal: ProjectSizingResult | null;

  // Derived Calculation
  calculationResult: SystemCalculationResult;

  initializeCatalog: () => Promise<void>;
  setActiveProjectId: (id: string | null, name?: string | null) => void;
  setActiveView: (view: ActiveView, projectId?: string | null) => void;
  setIsCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  applySizingProposal: (proposal: ProjectSizingResult) => void;
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
  customPrices: Record<string, number>;
  setCustomPrice: (key: string, pricePhp: number | null) => void;
  resetCustomPrices: () => void;

  // 3D Interactive Plant Builder State & Actions
  layout3d: Layout3DState;
  canvasTool: CanvasInteractionTool;
  isPaletteOpen: boolean;
  selectedCustomNodeId: string | null;
  selectedWireId: string | null;
  polarityAlertMessage: string | null;
  setCanvasTool: (tool: CanvasInteractionTool) => void;
  setIsPaletteOpen: (open: boolean) => void;
  setSelectedCustomNodeId: (id: string | null) => void;
  setSelectedWireId: (id: string | null) => void;
  setPolarityAlertMessage: (msg: string | null) => void;
  addPlacedComponent: (catalogKey: AddableComponentKey) => {
    ok: boolean;
    error?: string;
    item?: PlacedComponent3D;
  };
  movePlacedComponent: (
    id: string,
    position: [number, number, number],
    surface: MountSurface
  ) => void;
  moveBaseNode: (nodeKey: DiagramNodeKey, position: [number, number, number]) => void;
  removePlacedComponent: (id: string) => void;
  addWireConnection: (params: {
    polarity: WirePolarity;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
    fromWorldPos: [number, number, number];
    toWorldPos: [number, number, number];
  }) => { ok: boolean; error?: string; wire?: WireConnection3D };
  removeWireConnection: (wireId: string) => void;
  resetLayout3D: () => void;
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
  if (cleanPath === 'load-calculator' || cleanPath === 'calculator' || cleanPath === 'sizing' || cleanPath === 'appliances') return 'load-calculator';
  if (cleanPath === 'solar-mapper' || cleanPath === 'mapper' || cleanPath === 'roof-mapper' || cleanPath === 'irradiance' || cleanPath === 'roof') return 'solar-mapper';
  if (cleanPath === 'financial-roi' || cleanPath === 'roi' || cleanPath === 'roi-simulator' || cleanPath === 'tariff') return 'financial-roi';
  if (cleanPath === 'yield-simulator' || cleanPath === 'simulator' || cleanPath === 'yield' || cleanPath === 'monitoring') return 'yield-simulator';
  if (cleanPath === 'projects') return 'projects';
  if (cleanPath === 'login') return 'login';
  if (cleanPath === 'register') return 'register';
  if (cleanPath === 'account') return 'account';
  if (cleanPath === 'contact' || cleanPath === 'contact-us' || cleanPath === 'inquiry' || cleanPath === 'support') return 'contact';

  // If at root or /home, check if a legacy hash was passed
  if (cleanPath === 'home' || cleanPath === '') {
    if (hash) {
      const cleanHash = hash.replace(/^#+/, '').toLowerCase();
      if (cleanHash === 'tool' || cleanHash === 'studio') return 'tool';
      if (cleanHash === 'load-calculator' || cleanHash === 'calculator' || cleanHash === 'sizing' || cleanHash === 'appliances') return 'load-calculator';
      if (cleanHash === 'solar-mapper' || cleanHash === 'mapper' || cleanHash === 'roof-mapper' || cleanHash === 'irradiance' || cleanHash === 'roof') return 'solar-mapper';
      if (cleanHash === 'financial-roi' || cleanHash === 'roi' || cleanHash === 'roi-simulator' || cleanHash === 'tariff') return 'financial-roi';
      if (cleanHash === 'yield-simulator' || cleanHash === 'simulator' || cleanHash === 'yield' || cleanHash === 'monitoring') return 'yield-simulator';
      if (cleanHash === 'projects') return 'projects';
      if (cleanHash === 'login') return 'login';
      if (cleanHash === 'register') return 'register';
      if (cleanHash === 'account') return 'account';
      if (cleanHash === 'contact' || cleanHash === 'contact-us' || cleanHash === 'inquiry' || cleanHash === 'support') return 'contact';
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

let currentAccessories: AccessoryRecord[] = accessoriesSeed as AccessoryRecord[];

function compute(
  inv: SolarInverterRecord,
  mod: SolarModuleRecord,
  bat: BatteryRecord | null,
  batCount: number,
  gridV: number,
  mainA: number | null,
  panelOverride: number | null,
  accs?: AccessoryRecord[],
  customPrices?: Record<string, number | null>,
  layout3d?: Layout3DState | null
): SystemCalculationResult {
  let effectiveCustomPrices = customPrices;
  let effectiveLayout3d = layout3d;
  if (effectiveCustomPrices === undefined || effectiveLayout3d === undefined) {
    try {
      if (typeof useCalculatorStore !== 'undefined' && useCalculatorStore.getState) {
        const st = useCalculatorStore.getState();
        if (effectiveCustomPrices === undefined) effectiveCustomPrices = st.customPrices;
        if (effectiveLayout3d === undefined) effectiveLayout3d = st.layout3d;
      }
    } catch {
      if (effectiveCustomPrices === undefined) effectiveCustomPrices = {};
      if (effectiveLayout3d === undefined) effectiveLayout3d = createEmptyLayout3D();
    }
  }

  return calculateSystem({
    inverter: inv,
    module: mod,
    battery: bat,
    batteryCount: batCount,
    gridVoltageV: gridV,
    mainBreakerA: mainA,
    panelCountOverride: panelOverride,
    accessories: accs || currentAccessories,
    customPrices: effectiveCustomPrices || {},
    layout3d: effectiveLayout3d || createEmptyLayout3D(),
  });
}

function syncLayoutToActiveProject(layout: Layout3DState, calc: SystemCalculationResult) {
  try {
    const st = useCalculatorStore.getState();
    if (!st.activeProjectId) return;
    const authUser = useAuthStore.getState().user;
    if (!authUser) return;
    projectService
      .updateProject(authUser.id, st.activeProjectId, {
        layout_3d: layout,
        total_kwp: calc.summary.totalArrayPowerKw,
        inverter_kw: calc.summary.inverterPowerKw,
        panel_count: calc.summary.totalPanels,
        battery_kwh: calc.battery?.hasBattery
          ? Number((calc.battery.totalEnergyWh / 1000).toFixed(2))
          : null,
      })
      .catch((err) => {
        console.warn('Auto-save 3D layout to active project failed:', err);
      });
  } catch {
    // Ignore outside browser/auth context
  }
}

export const useCalculatorStore = create<CalculatorState>((set, get, api) => {
  api.getInitialState = () => get();
  return {
  inverters: invertersSeed as SolarInverterRecord[],
  modules: modulesSeed as SolarModuleRecord[],
  batteries: batteriesSeed as BatteryRecord[],
  accessories: accessoriesSeed as AccessoryRecord[],
  isLoadingCatalog: false,
  catalogSource: 'local_seed',
  customPrices: {},
  layout3d: createEmptyLayout3D(),
  canvasTool: 'select',
  isPaletteOpen: true,
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
  isInspectorOpen: false,
  theme: initialTheme,
  activeWorkbenchTab: 'electrical',
  activeView: getInitialView(),
  step1DetailMode: getInitialStep1DetailMode(),
  step2DetailMode: getInitialStep2DetailMode(),
  atsSource: 'solar',
  activeProjectId: null,
  activeProjectName: null,
  isCopilotOpen: false,
  lastAppliedProposal: null,

  calculationResult: compute(
    defaultInverter,
    defaultModule,
    defaultBattery,
    1,
    230,
    100,
    null
  ),

  setIsCopilotOpen: (open) => {
    set({ isCopilotOpen: open });
  },

  toggleCopilot: () => {
    set((state) => ({ isCopilotOpen: !state.isCopilotOpen }));
  },

  applySizingProposal: (proposal) => {
    const state = get();

    // 1. Match inverter from catalog by exact model, normalized model, brand + kW, or system type
    const propInv = proposal.billOfMaterials.inverter;
    const isHybridProp = propInv.systemType !== 'grid-tie';
    const propModelClean = propInv.model.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchedInverter =
      // Exact model match
      state.inverters.find((i) => i.model.toLowerCase() === propInv.model.toLowerCase()) ||
      // Normalized alphanumeric match
      state.inverters.find((i) => i.model.toLowerCase().replace(/[^a-z0-9]/g, '') === propModelClean) ||
      // Substring match
      state.inverters.find((i) => {
        const iModelClean = i.model.toLowerCase().replace(/[^a-z0-9]/g, '');
        return iModelClean.includes(propModelClean) || propModelClean.includes(iModelClean);
      }) ||
      // Matching brand + capacity
      state.inverters.find((i) => {
        const matchesBrand = i.brand.toLowerCase() === propInv.brand.toLowerCase();
        const acW = typeof i.rated_ac_power_w === 'number' ? i.rated_ac_power_w : parseFloat(String(i.rated_ac_power_w)) || 0;
        const matchesKw = Math.abs(acW / 1000 - propInv.ratedAcKw) <= 1.0;
        const isHybridInv = Boolean(i.battery_type && i.battery_type.toLowerCase() !== 'none');
        return matchesBrand && matchesKw && (isHybridProp ? isHybridInv : !isHybridInv);
      }) ||
      // Matching brand + system type
      state.inverters.find((i) => {
        const matchesBrand = i.brand.toLowerCase() === propInv.brand.toLowerCase();
        const isHybridInv = Boolean(i.battery_type && i.battery_type.toLowerCase() !== 'none');
        return matchesBrand && (isHybridProp ? isHybridInv : !isHybridInv);
      }) ||
      state.selectedInverter;

    // 2. Match module from catalog
    const propPanel = proposal.billOfMaterials.panel;
    const propPanelClean = propPanel.model.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchedModule =
      state.modules.find((m) => m.model.toLowerCase() === propPanel.model.toLowerCase()) ||
      state.modules.find((m) => m.model.toLowerCase().replace(/[^a-z0-9]/g, '').includes(propPanelClean)) ||
      state.modules.find((m) => {
        const mW = typeof m.pv_wattage_w === 'number' ? m.pv_wattage_w : parseFloat(String(m.pv_wattage_w)) || 0;
        return Math.abs(mW - propPanel.wattageWp) <= 30;
      }) ||
      state.selectedModule;

    // 3. Match battery
    let matchedBattery: BatteryRecord | null = null;
    let batteryCount = 1;
    if (proposal.billOfMaterials.battery && propInv.systemType !== 'grid-tie') {
      const propBat = proposal.billOfMaterials.battery;
      const targetStorage = propBat.totalStorageKwh;
      if (targetStorage >= 14) {
        matchedBattery =
          state.batteries.find((b) => b.model === '51.2V-300 Ah') ||
          state.batteries.find((b) => b.model === '51.2V-200 Ah') ||
          state.batteries[0];
        batteryCount = 1;
      } else if (targetStorage >= 9) {
        matchedBattery =
          state.batteries.find((b) => b.model === '51.2V-200 Ah') ||
          state.batteries.find((b) => b.model === '51.2V-100 Ah') ||
          state.batteries[0];
        batteryCount = 1;
      } else {
        matchedBattery =
          state.batteries.find((b) => b.model === '51.2V-100 Ah') ||
          state.batteries[0];
        batteryCount = 1;
      }
    }

    const panelCountOverride = proposal.billOfMaterials.panel.quantity;

    // Attach priced proposal units so components in the calculation workbench are not marked TBD
    const pricedInverter: SolarInverterRecord = {
      ...matchedInverter,
      price_php: propInv.unitPricePhp ?? matchedInverter.price_php ?? null,
    };

    const pricedModule: SolarModuleRecord = {
      ...matchedModule,
      price_php: propPanel.unitPricePhp ?? matchedModule.price_php ?? null,
    };

    const pricedBattery: BatteryRecord | null = matchedBattery
      ? {
          ...matchedBattery,
          price_php: proposal.billOfMaterials.battery?.unitPricePhp ?? matchedBattery.price_php ?? null,
        }
      : null;

    set({
      selectedInverter: pricedInverter,
      selectedModule: pricedModule,
      selectedBattery: pricedBattery,
      batteryCount,
      panelCountOverride,
      lastAppliedProposal: proposal,
      activeWorkbenchTab: 'pv_sizing',
      calculationResult: compute(
        pricedInverter,
        pricedModule,
        pricedBattery,
        batteryCount,
        state.gridVoltageV,
        state.mainBreakerA,
        panelCountOverride
      ),
    });
  },

  initializeCatalog: async () => {
    if (!isSupabaseConfigured) return;
    set({ isLoadingCatalog: true });
    try {
      const [invs, mods, bats, accs] = await Promise.all([
        catalogService.getInverters(),
        catalogService.getModules(),
        catalogService.getBatteries(),
        catalogService.getAccessories(),
      ]);

      const isLive = catalogService.isLive;
      currentAccessories = accs;

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
          accessories: accs,
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
            state.panelCountOverride,
            accs
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
      selectedCustomNodeId: null,
      selectedWireId: null,
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
        } else if (view === 'load-calculator') {
          targetPath = '/calculator';
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

    const customPrices = (project.custom_prices as Record<string, number>) || {};
    const restoredLayout3d = sanitizeLayout3D(project.layout_3d);

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
      selectedCustomNodeId: null,
      selectedWireId: null,
      hoveredNodeKey: null,
      isInspectorOpen: false,
      activeWorkbenchTab: 'electrical',
      customPrices,
      layout3d: restoredLayout3d,
      calculationResult: compute(
        inverter,
        module,
        battery,
        Math.max(1, project.battery_count || 1),
        project.grid_voltage_v || 230,
        project.main_breaker_a,
        project.panel_count_override,
        state.accessories,
        customPrices,
        restoredLayout3d
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
    set({ activeProjectId: null, activeProjectName: null, customPrices: {} });
    if (typeof window !== 'undefined' && get().activeView === 'tool') {
      try {
        if (window.location.pathname !== '/tool') {
          window.history.pushState({ view: 'tool', projectId: null }, '', '/tool');
        }
      } catch (e) {}
    }
  },

  resetToDefaults: () => {
    const emptyLayout = createEmptyLayout3D();
    set({
      activeProjectId: null,
      activeProjectName: null,
      customPrices: {},
      layout3d: emptyLayout,
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
        null,
        currentAccessories,
        {},
        emptyLayout
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

  setCustomPrice: (key: string, pricePhp: number | null) => {
    const state = get();
    const nextCustomPrices = { ...state.customPrices };
    if (pricePhp === null || isNaN(pricePhp) || pricePhp < 0) {
      delete nextCustomPrices[key];
    } else {
      nextCustomPrices[key] = pricePhp;
    }

    const newCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      nextCustomPrices
    );

    set({
      customPrices: nextCustomPrices,
      calculationResult: newCalc,
    });

    // Auto-sync custom prices to active saved project if one is loaded
    if (state.activeProjectId) {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        projectService
          .updateProject(authUser.id, state.activeProjectId, {
            custom_prices: nextCustomPrices,
          })
          .catch((err) => {
            console.warn('Auto-save custom prices to active project failed:', err);
          });
      }
    }
  },

  resetCustomPrices: () => {
    const state = get();
    const newCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      {}
    );

    set({
      customPrices: {},
      calculationResult: newCalc,
    });

    if (state.activeProjectId) {
      const authUser = useAuthStore.getState().user;
      if (authUser) {
        projectService
          .updateProject(authUser.id, state.activeProjectId, {
            custom_prices: {},
          })
          .catch((err) => {
            console.warn('Auto-save reset custom prices failed:', err);
          });
      }
    }
  },

  setCanvasTool: (tool) => {
    set({ canvasTool: tool, polarityAlertMessage: null });
  },

  setIsPaletteOpen: (open) => {
    set({ isPaletteOpen: open });
  },

  setSelectedCustomNodeId: (id) => {
    set({
      selectedCustomNodeId: id,
      selectedNodeKey: null,
      selectedWireId: null,
      isInspectorOpen: false,
    });
  },

  setSelectedWireId: (id) => {
    set({
      selectedWireId: id,
      selectedCustomNodeId: null,
      selectedNodeKey: null,
      isInspectorOpen: false,
    });
  },

  setPolarityAlertMessage: (msg) => {
    set({ polarityAlertMessage: msg });
  },

  addPlacedComponent: (catalogKey) => {
    const state = get();
    const spec = ADDABLE_CATALOG_MAP.get(catalogKey);
    if (!spec) {
      return { ok: false, error: 'Unknown component key.' };
    }

    const limitCheck = getLimitStatus(state.layout3d.placedComponents, catalogKey);
    if (!limitCheck.canAdd) {
      return { ok: false, error: limitCheck.reason };
    }

    const occupied: [number, number, number][] = [];
    for (const [k, defPos] of Object.entries(DEFAULT_BASE_NODE_POSITIONS)) {
      const ov = state.layout3d.baseNodePositions[k as DiagramNodeKey];
      occupied.push(ov || defPos);
    }
    for (const pc of state.layout3d.placedComponents) {
      occupied.push(pc.position);
    }

    const spawn = findFreeSpawnPosition(spec, occupied);
    const sameTypeCount =
      state.layout3d.placedComponents.filter((p) => p.catalogKey === catalogKey).length + 1;

    const newItem: PlacedComponent3D = {
      id: `node_${generateShortId(10)}`,
      catalogKey,
      label: `${spec.shortLabel} #${sameTypeCount}`,
      surface: spawn.surface,
      position: spawn.position,
    };

    const nextLayout: Layout3DState = {
      ...state.layout3d,
      placedComponents: [...state.layout3d.placedComponents, newItem],
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({
      layout3d: nextLayout,
      selectedCustomNodeId: newItem.id,
      selectedNodeKey: null,
      selectedWireId: null,
      isInspectorOpen: false,
      calculationResult: nextCalc,
    });

    syncLayoutToActiveProject(nextLayout, nextCalc);
    return { ok: true, item: newItem };
  },

  movePlacedComponent: (id, position, surface) => {
    const state = get();
    const updatedPlaced = state.layout3d.placedComponents.map((item) =>
      item.id === id ? { ...item, position, surface } : item
    );
    const draftLayout: Layout3DState = {
      ...state.layout3d,
      placedComponents: updatedPlaced,
    };
    const nextLayout: Layout3DState = {
      ...draftLayout,
      wires: recomputeAttachedWireLengths(draftLayout),
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({ layout3d: nextLayout, calculationResult: nextCalc });
    syncLayoutToActiveProject(nextLayout, nextCalc);
  },

  moveBaseNode: (nodeKey, position) => {
    const state = get();
    const draftLayout: Layout3DState = {
      ...state.layout3d,
      baseNodePositions: {
        ...state.layout3d.baseNodePositions,
        [nodeKey]: position,
      },
    };
    const nextLayout: Layout3DState = {
      ...draftLayout,
      wires: recomputeAttachedWireLengths(draftLayout),
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({ layout3d: nextLayout, calculationResult: nextCalc });
    syncLayoutToActiveProject(nextLayout, nextCalc);
  },

  removePlacedComponent: (id) => {
    const state = get();
    const nextLayout: Layout3DState = {
      ...state.layout3d,
      placedComponents: state.layout3d.placedComponents.filter((c) => c.id !== id),
      wires: state.layout3d.wires.filter((w) => w.fromNodeId !== id && w.toNodeId !== id),
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({
      layout3d: nextLayout,
      selectedCustomNodeId: state.selectedCustomNodeId === id ? null : state.selectedCustomNodeId,
      calculationResult: nextCalc,
    });
    syncLayoutToActiveProject(nextLayout, nextCalc);
  },

  addWireConnection: ({
    polarity,
    fromNodeId,
    fromPortId,
    toNodeId,
    toPortId,
    fromWorldPos,
    toWorldPos,
  }) => {
    const state = get();
    if (fromNodeId === toNodeId) {
      return { ok: false, error: 'Cannot connect a component terminal back to itself.' };
    }
    if (state.layout3d.wires.length >= SCENE_LIMITS.maxTotalWires) {
      return {
        ok: false,
        error: `Maximum of ${SCENE_LIMITS.maxTotalWires} custom wire runs reached.`,
      };
    }

    const isDuplicate = state.layout3d.wires.some(
      (w) =>
        w.polarity === polarity &&
        ((w.fromNodeId === fromNodeId &&
          w.fromPortId === fromPortId &&
          w.toNodeId === toNodeId &&
          w.toPortId === toPortId) ||
          (w.fromNodeId === toNodeId &&
            w.fromPortId === toPortId &&
            w.toNodeId === fromNodeId &&
            w.toPortId === fromPortId))
    );
    if (isDuplicate) {
      return { ok: false, error: 'These two terminals are already wired together.' };
    }

    const waypoints = buildOrthogonalWireWaypoints(fromWorldPos, toWorldPos, polarity);
    const lengthMeters = calculateWaypointsLengthMeters(waypoints);

    const newWire: WireConnection3D = {
      id: `wire_${generateShortId(10)}`,
      polarity,
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId,
      lengthMeters,
    };

    const nextLayout: Layout3DState = {
      ...state.layout3d,
      wires: [...state.layout3d.wires, newWire],
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({
      layout3d: nextLayout,
      polarityAlertMessage: null,
      calculationResult: nextCalc,
    });
    syncLayoutToActiveProject(nextLayout, nextCalc);
    return { ok: true, wire: newWire };
  },

  removeWireConnection: (wireId) => {
    const state = get();
    const nextLayout: Layout3DState = {
      ...state.layout3d,
      wires: state.layout3d.wires.filter((w) => w.id !== wireId),
    };

    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      nextLayout
    );

    set({
      layout3d: nextLayout,
      selectedWireId: state.selectedWireId === wireId ? null : state.selectedWireId,
      calculationResult: nextCalc,
    });
    syncLayoutToActiveProject(nextLayout, nextCalc);
  },

  resetLayout3D: () => {
    const state = get();
    const emptyLayout = createEmptyLayout3D();
    const nextCalc = compute(
      state.selectedInverter,
      state.selectedModule,
      state.selectedBattery,
      state.batteryCount,
      state.gridVoltageV,
      state.mainBreakerA,
      state.panelCountOverride,
      state.accessories,
      state.customPrices,
      emptyLayout
    );

    set({
      layout3d: emptyLayout,
      selectedCustomNodeId: null,
      selectedWireId: null,
      polarityAlertMessage: null,
      calculationResult: nextCalc,
    });
    syncLayoutToActiveProject(emptyLayout, nextCalc);
  },
};
});
