import { StateCreator } from 'zustand';
import { calculateSystem } from '@/engine/calculateSystem';
import { ActiveView, DetailMode, SystemCalculationResult, WorkbenchTabKey } from '@/types/calculator';
import { DiagramNodeKey } from '@/types/diagram';
import {
  AddableComponentKey,
  CanvasInteractionTool,
  Layout3DState,
  MountSurface,
  PlacedComponent3D,
  WireConnection3D,
  WirePolarity,
} from '@/types/layout3d';
import { SavedProject } from '@/types/project';
import { ProjectSizingResult } from '@/types/solar-ai';
import {
  AccessoryRecord,
  BatteryRecord,
  SolarInverterRecord,
  SolarModuleRecord,
} from '@/types/supabase';
import { ThemeMode } from '@/lib/theme';

export interface CatalogSlice {
  inverters: SolarInverterRecord[];
  modules: SolarModuleRecord[];
  batteries: BatteryRecord[];
  accessories: AccessoryRecord[];
  isLoadingCatalog: boolean;
  catalogSource: 'supabase' | 'local_seed';
  initializeCatalog: () => Promise<void>;
}

export interface ProjectUiSlice {
  activeView: ActiveView;
  activeProjectId: string | null;
  activeProjectName: string | null;
  theme: ThemeMode;
  step1DetailMode: DetailMode;
  step2DetailMode: DetailMode;
  activeWorkbenchTab: WorkbenchTabKey;
  isCopilotOpen: boolean;
  atsSource: 'solar' | 'utility';
  setActiveProjectId: (id: string | null, name?: string | null) => void;
  setActiveView: (view: ActiveView, projectId?: string | null) => void;
  setIsCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  setAtsSource: (source: 'solar' | 'utility') => void;
  toggleAtsSource: () => void;
  toggleTheme: () => void;
  setActiveWorkbenchTab: (tab: WorkbenchTabKey) => void;
  setStep1DetailMode: (mode: DetailMode) => void;
  setStep2DetailMode: (mode: DetailMode) => void;
  loadProject: (project: SavedProject) => void;
  clearActiveProject: () => void;
}

export interface EquipmentSizingSlice {
  selectedInverter: SolarInverterRecord;
  selectedModule: SolarModuleRecord;
  selectedBattery: BatteryRecord | null;
  batteryCount: number;
  gridVoltageV: number;
  mainBreakerA: number | null;
  panelCountOverride: number | null;
  selectedNodeKey: DiagramNodeKey | null;
  hoveredNodeKey: DiagramNodeKey | null;
  lastAppliedProposal: ProjectSizingResult | null;
  customPrices: Record<string, number>;
  calculationResult: SystemCalculationResult;
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
  setCustomPrice: (key: string, pricePhp: number | null) => void;
  resetToDefaults: () => void;
}

export interface Layout3DSlice {
  layout3d: Layout3DState;
  layout3dUndoStack: Layout3DState[];
  layout3dRedoStack: Layout3DState[];
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
  removeBaseNode: (nodeKey: DiagramNodeKey) => void;
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
  updateWireRouteOffset: (
    wireId: string,
    routeOffset: [number, number],
    options?: { commitHistory?: boolean }
  ) => void;
  clearAllWires: () => void;
  resetLayout3D: () => void;
  pushLayout3DUndoSnapshot: (snapshot: Layout3DState) => void;
  undoLayout3D: () => void;
  redoLayout3D: () => void;
  importLayout3DJson: (rawJson: unknown) => { ok: boolean; error?: string };
}

export type CalculatorState = CatalogSlice &
  ProjectUiSlice &
  EquipmentSizingSlice &
  Layout3DSlice;

export type CalculatorSliceCreator<T> = StateCreator<CalculatorState, [], [], T>;

export type RecalculableInputs = Pick<
  CalculatorState,
  | 'selectedInverter'
  | 'selectedModule'
  | 'selectedBattery'
  | 'batteryCount'
  | 'gridVoltageV'
  | 'mainBreakerA'
  | 'panelCountOverride'
  | 'accessories'
  | 'customPrices'
  | 'layout3d'
>;

export function recalculateForState(
  state: RecalculableInputs,
  overrides?: Partial<RecalculableInputs>
): SystemCalculationResult {
  const merged = overrides ? { ...state, ...overrides } : state;
  return calculateSystem({
    inverter: merged.selectedInverter,
    module: merged.selectedModule,
    battery: merged.selectedBattery,
    batteryCount: merged.batteryCount,
    gridVoltageV: merged.gridVoltageV,
    mainBreakerA: merged.mainBreakerA,
    panelCountOverride: merged.panelCountOverride,
    accessories: merged.accessories,
    customPrices: merged.customPrices,
    layout3d: merged.layout3d,
  });
}
