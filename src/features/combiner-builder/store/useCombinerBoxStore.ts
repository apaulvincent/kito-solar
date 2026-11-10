// src/features/combiner-builder/store/useCombinerBoxStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ActiveCanvasTool,
  CombinerComponentInstance,
  CombinerWireConnection,
  FerruleColor,
  MountZone,
  WireGaugeMm2,
} from '../types';
import { CATALOG_MAP } from '../data/combinerHardwareCatalog';
import {
  buildTemplate1JEsolar,
  buildTemplate2MTC,
  buildTemplate3ReferenceSLD,
} from '../data/prebuiltBoxTemplates';
import {
  computeWireWaypoints,
  getRecommendedWireSpec,
} from '../utils/wireRouting3D';

interface HistorySnapshot {
  components: CombinerComponentInstance[];
  wires: CombinerWireConnection[];
}

interface CombinerBoxState {
  components: CombinerComponentInstance[];
  wires: CombinerWireConnection[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  selectedPortId: string | null;
  canvasTool: ActiveCanvasTool;
  selectedGaugeMm2: WireGaugeMm2;
  selectedFerruleColor: FerruleColor;
  isEnergized: boolean;
  atsSourceState: 'source_a' | 'off' | 'source_b';
  isPaletteOpen: boolean;
  isDrcModalOpen: boolean;
  isExportModalOpen: boolean;
  activeTemplateId: string | null;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  setCanvasTool: (tool: ActiveCanvasTool) => void;
  setSelectedGauge: (gauge: WireGaugeMm2) => void;
  setSelectedFerrule: (color: FerruleColor) => void;
  setSelectedComponent: (id: string | null) => void;
  setSelectedWire: (id: string | null) => void;
  setSelectedPort: (portId: string | null) => void;
  setIsPaletteOpen: (open: boolean) => void;
  setIsDrcModalOpen: (open: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  toggleEnergized: () => void;
  setAtsSourceState: (source: 'source_a' | 'off' | 'source_b') => void;

  addComponent: (catalogId: string, preferredZone?: MountZone) => void;
  removeComponent: (id: string) => void;
  moveComponentSlot: (id: string, newSlot: number) => void;
  toggleBreakerSwitch: (id: string) => void;
  setAtsMode: (id: string, mode: 'auto' | 'manual') => void;

  connectPorts: (fromPortId: string, toPortId: string, forceJumper?: boolean) => boolean;
  removeWire: (id: string) => void;
  clearWires: () => void;
  clearBox: () => void;
  loadTemplate: (templateId: string | { id: string }) => void;

  undo: () => void;
  redo: () => void;
}

const defaultTemplate = buildTemplate3ReferenceSLD();

export const useCombinerBoxStore = create<CombinerBoxState>()(
  persist(
    (set, get) => ({
      components: defaultTemplate.components,
      wires: defaultTemplate.wires,
      selectedComponentId: null,
      selectedWireId: null,
      selectedPortId: null,
      canvasTool: 'move',
      selectedGaugeMm2: 6,
      selectedFerruleColor: 'red',
      isEnergized: true,
      atsSourceState: 'source_a',
      isPaletteOpen: true,
      isDrcModalOpen: false,
      isExportModalOpen: false,
      activeTemplateId: 'template_reference_diagram',
      undoStack: [],
      redoStack: [],

      setCanvasTool: (tool) => {
        set({ canvasTool: tool, selectedPortId: null });
      },

      setSelectedGauge: (gauge) => set({ selectedGaugeMm2: gauge }),
      setSelectedFerrule: (color) => set({ selectedFerruleColor: color }),
      setSelectedComponent: (id) => set({ selectedComponentId: id }),
      setSelectedWire: (id) => set({ selectedWireId: id }),
      setSelectedPort: (portId) => set({ selectedPortId: portId }),
      setIsPaletteOpen: (open) => set({ isPaletteOpen: open }),
      setIsDrcModalOpen: (open) => set({ isDrcModalOpen: open }),
      setIsExportModalOpen: (open) => set({ isExportModalOpen: open }),

      toggleEnergized: () => set((state) => ({ isEnergized: !state.isEnergized })),

      setAtsSourceState: (source) => {
        set({ atsSourceState: source });
      },

      addComponent: (catalogId, preferredZone) => {
        const item = CATALOG_MAP.get(catalogId);
        if (!item) return;

        const current = get();
        // Push snapshot
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        const zone = preferredZone || item.defaultMountZone;
        const sameZoneComps = current.components.filter((c) => c.mountZone === zone);
        const maxSlot = sameZoneComps.reduce(
          (max, c) => Math.max(max, c.railSlotIndex + (c.widthMm > 70 ? 6 : 2)),
          0,
        );
        const nextSlot = maxSlot + 1;

        const instanceId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const slotPitch = 0.082;
        const posX = -1.06 + nextSlot * slotPitch;
        const posY =
          zone === 'rail_top'
            ? 0.70
            : zone === 'rail_middle'
            ? -0.05
            : zone === 'bottom_plate'
            ? -0.78
            : 0.0;
        const posZ = zone === 'bottom_plate' ? 0.08 : 0.05;

        const ports = item.ports.map((p, idx) => ({
          ...p,
          id: `${instanceId}:p_${idx}_${p.polarity}`,
          componentId: instanceId,
        }));

        const newComp: CombinerComponentInstance = {
          id: instanceId,
          catalogId,
          name: item.name,
          brand: item.brand,
          category: item.category,
          mountZone: zone,
          railSlotIndex: nextSlot,
          position3D: [posX, posY, posZ],
          widthMm: item.widthMm,
          ratedAmps: item.ratedAmps,
          ratedVoltage: item.ratedVoltage,
          isSwitchOn: true,
          atsMode: 'auto',
          atsActiveSource: 'source_a',
          pricePhp: item.pricePhp,
          ports,
        };

        set({
          components: [...current.components, newComp],
          selectedComponentId: instanceId,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      removeComponent: (id) => {
        const current = get();
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        const compToRemove = current.components.find((c) => c.id === id);
        if (!compToRemove) return;

        const portIds = new Set(compToRemove.ports.map((p) => p.id));
        const filteredWires = current.wires.filter(
          (w) => !portIds.has(w.fromPortId) && !portIds.has(w.toPortId),
        );

        set({
          components: current.components.filter((c) => c.id !== id),
          wires: filteredWires,
          selectedComponentId: null,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      moveComponentSlot: (id, newSlot) => {
        const current = get();
        const comp = current.components.find((c) => c.id === id);
        if (!comp || comp.mountZone === 'bottom_plate' || comp.mountZone === 'side_busbar') return;

        const clampedSlot = Math.max(0, Math.min(22, newSlot));
        const slotPitch = 0.082;
        const newX = -1.06 + clampedSlot * slotPitch;

        const updatedComponents = current.components.map((c) =>
          c.id === id
            ? {
                ...c,
                railSlotIndex: clampedSlot,
                position3D: [newX, c.position3D[1], c.position3D[2]] as [number, number, number],
              }
            : c,
        );

        // Recalculate connected wire waypoints
        const portMap = new Map(
          updatedComponents.flatMap((c) =>
            c.ports.map((p) => [
              p.id,
              {
                port: p,
                worldPos: [
                  c.position3D[0] + p.positionOffset[0],
                  c.position3D[1] + p.positionOffset[1],
                  c.position3D[2] + p.positionOffset[2],
                ] as [number, number, number],
                direction: p.entryDirection,
              },
            ]),
          ),
        );

        const updatedWires = current.wires.map((w) => {
          const from = portMap.get(w.fromPortId);
          const to = portMap.get(w.toPortId);
          if (!from || !to) return w;

          const waypoints = computeWireWaypoints({
            startPos: from.worldPos,
            startDirection: from.direction,
            endPos: to.worldPos,
            endDirection: to.direction,
            isJumperLoop: w.isJumperLoop,
          });

          return { ...w, waypoints3D: waypoints };
        });

        set({
          components: updatedComponents,
          wires: updatedWires,
        });
      },

      toggleBreakerSwitch: (id) => {
        set((state) => {
          const comp = state.components.find((c) => c.id === id);
          if (!comp) return state;

          const newSwitchState = !comp.isSwitchOn;
          let newAtsSource = state.atsSourceState;

          // ATS simulation reaction:
          // If the flipped component is an AC MCB and turns OFF, transfer ATS to Grid (Source B)
          if (comp.name.includes('AC MCB') || comp.category === 'ac_mcb') {
            if (!newSwitchState && state.atsSourceState === 'source_a') {
              newAtsSource = 'source_b'; // Auto transfer to grid!
            } else if (newSwitchState && state.atsSourceState === 'source_b') {
              newAtsSource = 'source_a'; // Solar restored
            }
          }

          return {
            components: state.components.map((c) =>
              c.id === id ? { ...c, isSwitchOn: newSwitchState } : c,
            ),
            atsSourceState: newAtsSource,
          };
        });
      },

      setAtsMode: (id, mode) => {
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, atsMode: mode } : c,
          ),
        }));
      },

      connectPorts: (fromPortId, toPortId, forceJumper = false) => {
        if (fromPortId === toPortId) return false;
        const current = get();

        // Check if wire already exists
        const exists = current.wires.some(
          (w) =>
            (w.fromPortId === fromPortId && w.toPortId === toPortId) ||
            (w.fromPortId === toPortId && w.toPortId === fromPortId),
        );
        if (exists) return false;

        // Find ports
        let p1: (typeof current.components)[0]['ports'][0] | null = null;
        let c1: (typeof current.components)[0] | null = null;
        let p2: (typeof current.components)[0]['ports'][0] | null = null;
        let c2: (typeof current.components)[0] | null = null;

        for (const c of current.components) {
          for (const p of c.ports) {
            if (p.id === fromPortId) {
              p1 = p;
              c1 = c;
            }
            if (p.id === toPortId) {
              p2 = p;
              c2 = c;
            }
          }
        }

        if (!p1 || !c1 || !p2 || !c2) return false;

        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        const startPos: [number, number, number] = [
          c1.position3D[0] + p1.positionOffset[0],
          c1.position3D[1] + p1.positionOffset[1],
          c1.position3D[2] + p1.positionOffset[2],
        ];

        const endPos: [number, number, number] = [
          c2.position3D[0] + p2.positionOffset[0],
          c2.position3D[1] + p2.positionOffset[1],
          c2.position3D[2] + p2.positionOffset[2],
        ];

        const isJumper =
          forceJumper ||
          current.canvasTool === 'jumper' ||
          (p1.entryDirection === p2.entryDirection &&
            Math.abs(startPos[1] - endPos[1]) < 0.25 &&
            Math.abs(startPos[0] - endPos[0]) < 0.45);

        const recSpec = getRecommendedWireSpec(p1.polarity, Math.max(c1.ratedAmps, c2.ratedAmps));

        const waypoints = computeWireWaypoints({
          startPos,
          startDirection: p1.entryDirection,
          endPos,
          endDirection: p2.entryDirection,
          isJumperLoop: isJumper,
        });

        const newWire: CombinerWireConnection = {
          id: `wire_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fromPortId,
          toPortId,
          wireColor: recSpec.wireColor,
          ferruleColor: recSpec.ferruleColor,
          gaugeMm2: recSpec.gaugeMm2,
          isJumperLoop: isJumper,
          waypoints3D: waypoints,
        };

        set({
          wires: [...current.wires, newWire],
          selectedPortId: null,
          selectedWireId: newWire.id,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });

        return true;
      },

      removeWire: (id) => {
        const current = get();
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        set({
          wires: current.wires.filter((w) => w.id !== id),
          selectedWireId: null,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      clearWires: () => {
        const current = get();
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        set({
          wires: [],
          selectedWireId: null,
          selectedPortId: null,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      clearBox: () => {
        const current = get();
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        set({
          components: [],
          wires: [],
          selectedComponentId: null,
          selectedWireId: null,
          selectedPortId: null,
          activeTemplateId: null,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      loadTemplate: (templateId) => {
        const id = typeof templateId === 'string' ? templateId : templateId?.id;
        const template =
          id === 'template_reference_diagram'
            ? buildTemplate3ReferenceSLD()
            : id === 'template_mt_solarcell'
            ? buildTemplate2MTC()
            : buildTemplate1JEsolar();

        const current = get();
        const snapshot: HistorySnapshot = {
          components: current.components,
          wires: current.wires,
        };

        set({
          components: template.components,
          wires: template.wires,
          activeTemplateId: template.id,
          selectedComponentId: null,
          selectedWireId: null,
          selectedPortId: null,
          atsSourceState: 'source_a',
          isEnergized: true,
          undoStack: [...current.undoStack, snapshot],
          redoStack: [],
        });
      },

      undo: () => {
        const { undoStack, components, wires, redoStack } = get();
        if (undoStack.length === 0) return;

        const previous = undoStack[undoStack.length - 1];
        const newUndoStack = undoStack.slice(0, -1);
        const newRedoStack = [{ components, wires }, ...redoStack];

        set({
          components: previous.components,
          wires: previous.wires,
          selectedComponentId: null,
          selectedWireId: null,
          selectedPortId: null,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        });
      },

      redo: () => {
        const { redoStack, components, wires, undoStack } = get();
        if (redoStack.length === 0) return;

        const next = redoStack[0];
        const newRedoStack = redoStack.slice(1);
        const newUndoStack = [...undoStack, { components, wires }];

        set({
          components: next.components,
          wires: next.wires,
          selectedComponentId: null,
          selectedWireId: null,
          selectedPortId: null,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        });
      },
    }),
    {
      name: 'kito_combiner_builder_store_v2',
      partialize: (state) => ({
        components: state.components,
        wires: state.wires,
        canvasTool: state.canvasTool,
        selectedGaugeMm2: state.selectedGaugeMm2,
        selectedFerruleColor: state.selectedFerruleColor,
        activeTemplateId: state.activeTemplateId,
      }),
    },
  ),
);
