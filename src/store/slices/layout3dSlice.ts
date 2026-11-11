import { ADDABLE_CATALOG_MAP } from '@/lib/diagramNodeSpecs';
import {
  DEFAULT_BASE_NODE_POSITIONS,
  computeWireLengthForLayout,
  createEmptyLayout3D,
  findFreeSpawnPosition,
  getLimitStatus,
  parseLayout3DJson,
  recomputeAttachedWireLengths,
  sanitizeLayout3D,
} from '@/lib/layout3dEngine';
import { STORAGE_KEYS, readJson, safeStorage, writeJson } from '@/lib/storage';
import { generateShortId, projectService } from '@/services/projectService';
import { useAuthStore } from '@/store/useAuthStore';
import { SystemCalculationResult } from '@/types/calculator';
import { DiagramNodeKey } from '@/types/diagram';
import {
  Layout3DState,
  PlacedComponent3D,
  SCENE_LIMITS,
  WireConnection3D,
} from '@/types/layout3d';
import {
  CalculatorSliceCreator,
  CalculatorState,
  Layout3DSlice,
  recalculateForState,
} from './storeTypes';

export const MAX_LAYOUT3D_HISTORY = 10;

function cloneLayout3DSnapshot(layout: Layout3DState): Layout3DState {
  if (typeof structuredClone === 'function') {
    return structuredClone(layout);
  }
  return JSON.parse(JSON.stringify(layout)) as Layout3DState;
}

function pushHistorySnapshot(
  stack: Layout3DState[],
  snapshot: Layout3DState,
  limit: number = MAX_LAYOUT3D_HISTORY
): Layout3DState[] {
  const next = [...stack, cloneLayout3DSnapshot(snapshot)];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

export function getInitialLayout3D(): Layout3DState {
  const parsed = readJson<unknown>(STORAGE_KEYS.workingLayout3d);
  return parsed ? sanitizeLayout3D(parsed) : createEmptyLayout3D();
}

function syncLayoutToActiveProject(
  activeProjectId: string | null,
  layout: Layout3DState,
  calc: SystemCalculationResult
): void {
  writeJson(STORAGE_KEYS.workingLayout3d, layout);
  if (!activeProjectId) return;
  const authUser = useAuthStore.getState().user;
  if (!authUser) return;
  projectService
    .updateProject(authUser.id, activeProjectId, {
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
}

export function createLayout3DSliceWithInitial(
  initialLayout3D: Layout3DState
): CalculatorSliceCreator<Layout3DSlice> {
  return (set, get) => {
    const commitLayoutChange = (
      nextLayout: Layout3DState,
      extraPatch: Partial<CalculatorState> = {},
      commitHistory = true
    ) => {
      const state = get();
      const calculationResult = recalculateForState(state, { layout3d: nextLayout });
      const layout3dUndoStack = commitHistory
        ? pushHistorySnapshot(state.layout3dUndoStack, state.layout3d)
        : state.layout3dUndoStack;
      const layout3dRedoStack = commitHistory ? [] : state.layout3dRedoStack;

      set({
        ...extraPatch,
        layout3d: nextLayout,
        layout3dUndoStack,
        layout3dRedoStack,
        calculationResult,
      });

      syncLayoutToActiveProject(state.activeProjectId, nextLayout, calculationResult);
    };

    return {
      layout3d: initialLayout3D,
      layout3dUndoStack: [],
      layout3dRedoStack: [],
      canvasTool: 'select',
      isPaletteOpen: true,
      selectedCustomNodeId: null,
      selectedWireId: null,
      polarityAlertMessage: null,

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
        });
      },

      setSelectedWireId: (id) => {
        set({
          selectedWireId: id,
          selectedCustomNodeId: null,
          selectedNodeKey: null,
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
        const removedSet = new Set(state.layout3d.removedBaseNodes || []);
        for (const [k, defPos] of Object.entries(DEFAULT_BASE_NODE_POSITIONS)) {
          if (removedSet.has(k as DiagramNodeKey)) continue;
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

        commitLayoutChange(nextLayout, {
          selectedCustomNodeId: newItem.id,
          selectedNodeKey: null,
          selectedWireId: null,
        });

        return { ok: true, item: newItem };
      },

      movePlacedComponent: (id, position, surface) => {
        const state = get();
        const currentItem = state.layout3d.placedComponents.find((item) => item.id === id);
        if (
          currentItem &&
          currentItem.position[0] === position[0] &&
          currentItem.position[1] === position[1] &&
          currentItem.position[2] === position[2] &&
          currentItem.surface === surface
        ) {
          return;
        }

        const draftLayout: Layout3DState = {
          ...state.layout3d,
          placedComponents: state.layout3d.placedComponents.map((item) =>
            item.id === id ? { ...item, position, surface } : item
          ),
        };
        const nextLayout: Layout3DState = {
          ...draftLayout,
          wires: recomputeAttachedWireLengths(draftLayout),
        };

        commitLayoutChange(nextLayout);
      },

      moveBaseNode: (nodeKey, position) => {
        const state = get();
        const currentExplicitPos = state.layout3d.baseNodePositions[nodeKey];
        if (
          currentExplicitPos &&
          currentExplicitPos[0] === position[0] &&
          currentExplicitPos[1] === position[1] &&
          currentExplicitPos[2] === position[2]
        ) {
          return;
        }

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

        commitLayoutChange(nextLayout);
      },

      removeBaseNode: (nodeKey) => {
        const state = get();
        const currentRemoved = state.layout3d.removedBaseNodes || [];
        const nextRemoved = currentRemoved.includes(nodeKey)
          ? currentRemoved
          : [...currentRemoved, nodeKey];

        const nextLayout: Layout3DState = {
          ...state.layout3d,
          removedBaseNodes: nextRemoved,
          wires: state.layout3d.wires.filter(
            (w) => w.fromNodeId !== nodeKey && w.toNodeId !== nodeKey
          ),
        };

        commitLayoutChange(nextLayout, {
          selectedNodeKey: state.selectedNodeKey === nodeKey ? null : state.selectedNodeKey,
        });
      },

      removePlacedComponent: (id) => {
        const state = get();
        const nextLayout: Layout3DState = {
          ...state.layout3d,
          placedComponents: state.layout3d.placedComponents.filter((c) => c.id !== id),
          wires: state.layout3d.wires.filter((w) => w.fromNodeId !== id && w.toNodeId !== id),
        };

        commitLayoutChange(nextLayout, {
          selectedCustomNodeId:
            state.selectedCustomNodeId === id ? null : state.selectedCustomNodeId,
        });
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

        const lengthMeters = computeWireLengthForLayout(state.layout3d, {
          polarity,
          fromNodeId,
          fromPortId,
          toNodeId,
          toPortId,
          fromWorldPos,
          toWorldPos,
        });

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

        commitLayoutChange(nextLayout, { polarityAlertMessage: null });
        return { ok: true, wire: newWire };
      },

      removeWireConnection: (wireId) => {
        const state = get();
        const nextLayout: Layout3DState = {
          ...state.layout3d,
          wires: state.layout3d.wires.filter((w) => w.id !== wireId),
        };

        commitLayoutChange(nextLayout, {
          selectedWireId: state.selectedWireId === wireId ? null : state.selectedWireId,
        });
      },

      updateWireRouteOffset: (wireId, routeOffset, options) => {
        const state = get();
        const draftLayout: Layout3DState = {
          ...state.layout3d,
          wires: state.layout3d.wires.map((w) =>
            w.id === wireId
              ? {
                  ...w,
                  routeOffset: [
                    Number(routeOffset[0].toFixed(2)),
                    Number(routeOffset[1].toFixed(2)),
                  ],
                }
              : w
          ),
        };
        const nextLayout: Layout3DState = {
          ...draftLayout,
          wires: recomputeAttachedWireLengths(draftLayout),
        };

        commitLayoutChange(nextLayout, {}, options?.commitHistory !== false);
      },

      clearAllWires: () => {
        const state = get();
        const nextLayout: Layout3DState = {
          ...state.layout3d,
          wires: [],
        };
        commitLayoutChange(nextLayout, { selectedWireId: null });
      },

      resetLayout3D: () => {
        const emptyLayout = createEmptyLayout3D();
        safeStorage.removeItem(STORAGE_KEYS.workingLayout3d);
        commitLayoutChange(emptyLayout, {
          selectedCustomNodeId: null,
          selectedWireId: null,
          polarityAlertMessage: null,
        });
      },

      pushLayout3DUndoSnapshot: (snapshot) => {
        const state = get();
        set({
          layout3dUndoStack: pushHistorySnapshot(
            state.layout3dUndoStack,
            snapshot,
            MAX_LAYOUT3D_HISTORY
          ),
          layout3dRedoStack: [],
        });
      },

      undoLayout3D: () => {
        const state = get();
        if (state.layout3dUndoStack.length === 0) return;

        const previousLayout = state.layout3dUndoStack[state.layout3dUndoStack.length - 1];
        const layout3dUndoStack = state.layout3dUndoStack.slice(0, -1);
        const layout3dRedoStack = pushHistorySnapshot(
          state.layout3dRedoStack,
          state.layout3d,
          MAX_LAYOUT3D_HISTORY
        );
        const calculationResult = recalculateForState(state, { layout3d: previousLayout });

        set({
          layout3d: previousLayout,
          layout3dUndoStack,
          layout3dRedoStack,
          selectedCustomNodeId: null,
          selectedWireId: null,
          calculationResult,
        });
        syncLayoutToActiveProject(state.activeProjectId, previousLayout, calculationResult);
      },

      redoLayout3D: () => {
        const state = get();
        if (state.layout3dRedoStack.length === 0) return;

        const targetLayout = state.layout3dRedoStack[state.layout3dRedoStack.length - 1];
        const layout3dRedoStack = state.layout3dRedoStack.slice(0, -1);
        const layout3dUndoStack = pushHistorySnapshot(
          state.layout3dUndoStack,
          state.layout3d,
          MAX_LAYOUT3D_HISTORY
        );
        const calculationResult = recalculateForState(state, { layout3d: targetLayout });

        set({
          layout3d: targetLayout,
          layout3dUndoStack,
          layout3dRedoStack,
          selectedCustomNodeId: null,
          selectedWireId: null,
          calculationResult,
        });
        syncLayoutToActiveProject(state.activeProjectId, targetLayout, calculationResult);
      },

      importLayout3DJson: (rawJson) => {
        const parsed = parseLayout3DJson(rawJson);
        if (!parsed.ok) {
          return parsed;
        }
        const nextLayout: Layout3DState = {
          ...parsed.data,
          wires: recomputeAttachedWireLengths(parsed.data),
        };
        commitLayoutChange(nextLayout, {
          selectedCustomNodeId: null,
          selectedWireId: null,
          polarityAlertMessage: null,
        });
        return { ok: true };
      },
    };
  };
}
