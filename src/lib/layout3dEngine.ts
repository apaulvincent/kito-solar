import { z } from 'zod';
import { DiagramNodeKey } from '@/types/diagram';
import defaultLayoutSeedRaw from '@/data/seed/default_layout_3d.json';
import {
  AddableComponentKey,
  AddableComponentSpec,
  Layout3DState,
  MountCapability,
  MountSurface,
  PLANT_ROOM_GEOMETRY,
  PlacedComponent3D,
  SCENE_LIMITS,
  WireConnection3D,
  WirePolarity,
} from '@/types/layout3d';
import {
  ADDABLE_CATALOG_MAP,
  ADDABLE_COMPONENT_CATALOG,
  BASE_NODE_SPECS,
  isBaselineSystemWire,
  isFloorMountedZ,
} from './diagramNodeSpecs';
import {
  getWallObstacles as computeWallObstacles,
  measureLayoutWires,
  resolveNodeTypeAndLabel,
  routeAndMeasureWire,
  WallObstacle2D,
} from './wireRouting3d';

interface RawLayoutSeed {
  baseNodePositions?: Record<string, unknown>;
  removedBaseNodes?: unknown[];
  placedComponents?: unknown[];
  wires?: Array<{
    id: string;
    polarity: string;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
    lengthMeters?: unknown;
    routeOffset?: unknown[];
  }>;
}

const defaultLayoutSeed = defaultLayoutSeedRaw as RawLayoutSeed | null | undefined;

const FALLBACK_BASE_NODE_POSITIONS: Record<DiagramNodeKey, [number, number, number]> = {
  pv_array: [-7.8, 0.75, 2.2],
  dc_isolator: [-5.4, 2.9, 0.0],
  dc_breaker: [-3.6, 2.9, 0.0],
  dc_spd: [-3.6, 1.4, 0.0],
  dc_conduit: [-5.0, 2.9, 0.0],
  inverter: [-0.6, 3.35, 0.0],
  battery_breaker: [-2.0, 1.4, 0.0],
  battery: [-0.6, 0.8, 0.4],
  battery_wire: [-1.4, 0.4, 0.4],
  ac_breaker: [1.4, 2.9, 0.0],
  ac_spd: [1.4, 1.4, 0.0],
  ac_isolator: [2.9, 2.9, 0.0],
  main_panel: [4.6, 2.5, 0.0],
  ats: [5.95, 2.5, 0.0],
  eps_breaker: [5.95, 1.4, 0.0],
  grid: [10.2, 1.6, 0.0],
  load: [10.2, 0.8, 2.2],
  grounding: [4.6, 0.75, 0.0],
};

function isValidSeedPosition(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

export const DEFAULT_BASE_NODE_POSITIONS: Record<DiagramNodeKey, [number, number, number]> = (() => {
  const result: Record<DiagramNodeKey, [number, number, number]> = {
    ...FALLBACK_BASE_NODE_POSITIONS,
  };
  const seedPositions = defaultLayoutSeed?.baseNodePositions as Record<string, unknown> | undefined;
  if (seedPositions) {
    for (const key of Object.keys(BASE_NODE_SPECS) as DiagramNodeKey[]) {
      if (isValidSeedPosition(seedPositions[key])) {
        result[key] = [...seedPositions[key]];
      }
    }
  }
  return result;
})();

export const DEFAULT_SYSTEM_WIRE_SPECS: ReadonlyArray<{
  id: string;
  polarity: WirePolarity;
  fromNodeId: DiagramNodeKey;
  fromPortId: string;
  toNodeId: DiagramNodeKey;
  toPortId: string;
}> = [
  { id: 'base_wire_pv_iso_pos', polarity: 'positive', fromNodeId: 'pv_array', fromPortId: 'pv_pos', toNodeId: 'dc_isolator', toPortId: 'in_pos' },
  { id: 'base_wire_pv_iso_neg', polarity: 'negative', fromNodeId: 'pv_array', fromPortId: 'pv_neg', toNodeId: 'dc_isolator', toPortId: 'in_neg' },
  { id: 'base_wire_iso_brk_pos', polarity: 'positive', fromNodeId: 'dc_isolator', fromPortId: 'out_pos', toNodeId: 'dc_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_iso_brk_neg', polarity: 'negative', fromNodeId: 'dc_isolator', fromPortId: 'out_neg', toNodeId: 'dc_breaker', toPortId: 'in_neg' },
  { id: 'base_wire_dcbrk_inv_pos', polarity: 'positive', fromNodeId: 'dc_breaker', fromPortId: 'out_pos', toNodeId: 'inverter', toPortId: 'pv_pos' },
  { id: 'base_wire_dcbrk_inv_neg', polarity: 'negative', fromNodeId: 'dc_breaker', fromPortId: 'out_neg', toNodeId: 'inverter', toPortId: 'pv_neg' },
  { id: 'base_wire_inv_batbrk_pos', polarity: 'positive', fromNodeId: 'inverter', fromPortId: 'bat_pos', toNodeId: 'battery_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_inv_batbrk_neg', polarity: 'negative', fromNodeId: 'inverter', fromPortId: 'bat_neg', toNodeId: 'battery_breaker', toPortId: 'in_neg' },
  { id: 'base_wire_batbrk_bat_pos', polarity: 'positive', fromNodeId: 'battery_breaker', fromPortId: 'out_pos', toNodeId: 'battery', toPortId: 'bat_pos' },
  { id: 'base_wire_batbrk_bat_neg', polarity: 'negative', fromNodeId: 'battery_breaker', fromPortId: 'out_neg', toNodeId: 'battery', toPortId: 'bat_neg' },
  { id: 'base_wire_inv_acbrk_pos', polarity: 'positive', fromNodeId: 'inverter', fromPortId: 'ac_pos', toNodeId: 'ac_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_inv_acbrk_neg', polarity: 'negative', fromNodeId: 'inverter', fromPortId: 'ac_neg', toNodeId: 'ac_breaker', toPortId: 'in_neg' },
  { id: 'base_wire_acbrk_iso_pos', polarity: 'positive', fromNodeId: 'ac_breaker', fromPortId: 'out_pos', toNodeId: 'ac_isolator', toPortId: 'in_pos' },
  { id: 'base_wire_acbrk_iso_neg', polarity: 'negative', fromNodeId: 'ac_breaker', fromPortId: 'out_neg', toNodeId: 'ac_isolator', toPortId: 'in_neg' },
  { id: 'base_wire_aciso_panel_pos', polarity: 'positive', fromNodeId: 'ac_isolator', fromPortId: 'out_pos', toNodeId: 'main_panel', toPortId: 'in_pos' },
  { id: 'base_wire_aciso_panel_neg', polarity: 'negative', fromNodeId: 'ac_isolator', fromPortId: 'out_neg', toNodeId: 'main_panel', toPortId: 'in_neg' },
  { id: 'base_wire_grid_panel_pos', polarity: 'positive', fromNodeId: 'grid', fromPortId: 'grid_pos', toNodeId: 'main_panel', toPortId: 'in_pos' },
  { id: 'base_wire_grid_panel_neg', polarity: 'negative', fromNodeId: 'grid', fromPortId: 'grid_neg', toNodeId: 'main_panel', toPortId: 'in_neg' },
  { id: 'base_wire_panel_ats_pos', polarity: 'positive', fromNodeId: 'main_panel', fromPortId: 'out_pos', toNodeId: 'ats', toPortId: 'in_pos' },
  { id: 'base_wire_panel_ats_neg', polarity: 'negative', fromNodeId: 'main_panel', fromPortId: 'out_neg', toNodeId: 'ats', toPortId: 'in_neg' },
  { id: 'base_wire_ats_load_pos', polarity: 'positive', fromNodeId: 'ats', fromPortId: 'out_pos', toNodeId: 'load', toPortId: 'load_pos' },
  { id: 'base_wire_ats_load_neg', polarity: 'negative', fromNodeId: 'ats', fromPortId: 'out_neg', toNodeId: 'load', toPortId: 'load_neg' },
  { id: 'base_wire_panel_gnd', polarity: 'ground', fromNodeId: 'main_panel', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_3' },
  { id: 'base_wire_acspd_gnd', polarity: 'ground', fromNodeId: 'ac_spd', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_2' },
  { id: 'base_wire_dcspd_gnd', polarity: 'ground', fromNodeId: 'dc_spd', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_1' },
  { id: 'base_wire_dcspd_brk_pos', polarity: 'positive', fromNodeId: 'dc_spd', fromPortId: 'in_pos', toNodeId: 'dc_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_dcspd_brk_neg', polarity: 'negative', fromNodeId: 'dc_spd', fromPortId: 'in_neg', toNodeId: 'dc_breaker', toPortId: 'in_neg' },
  { id: 'base_wire_acspd_brk_pos', polarity: 'positive', fromNodeId: 'ac_spd', fromPortId: 'in_pos', toNodeId: 'ac_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_acspd_brk_neg', polarity: 'negative', fromNodeId: 'ac_spd', fromPortId: 'in_neg', toNodeId: 'ac_breaker', toPortId: 'in_neg' },
];

export function getWallObstacles(
  nodePositions: Record<string, [number, number, number]>,
  placedComponents: PlacedComponent3D[],
  isHybrid = true,
  removedBaseNodes: DiagramNodeKey[] = []
): WallObstacle2D[] {
  return computeWallObstacles(
    nodePositions,
    DEFAULT_BASE_NODE_POSITIONS,
    placedComponents,
    isHybrid,
    removedBaseNodes
  );
}

export function createDefaultSystemWires(): WireConnection3D[] {
  const seedWires = Array.isArray(defaultLayoutSeed?.wires) ? defaultLayoutSeed.wires : [];
  const seedWireMap = new Map(seedWires.map((w) => [w.id, w]));
  const obstacles = getWallObstacles(DEFAULT_BASE_NODE_POSITIONS, [], true);

  return DEFAULT_SYSTEM_WIRE_SPECS.map((spec) => {
    const seedWire = seedWireMap.get(spec.id);
    const routeOffset: [number, number] | undefined =
      seedWire && Array.isArray(seedWire.routeOffset) && seedWire.routeOffset.length === 2
        ? [Number(seedWire.routeOffset[0]) || 0, Number(seedWire.routeOffset[1]) || 0]
        : undefined;

    const { lengthMeters } = routeAndMeasureWire({
      fromNodeId: spec.fromNodeId,
      fromPortId: spec.fromPortId,
      toNodeId: spec.toNodeId,
      toPortId: spec.toPortId,
      polarity: spec.polarity,
      fromNodePos: DEFAULT_BASE_NODE_POSITIONS[spec.fromNodeId],
      toNodePos: DEFAULT_BASE_NODE_POSITIONS[spec.toNodeId],
      placedComponents: [],
      obstacles,
      routeOffset,
    });

    return {
      id: spec.id,
      polarity: spec.polarity,
      fromNodeId: spec.fromNodeId,
      fromPortId: spec.fromPortId,
      toNodeId: spec.toNodeId,
      toPortId: spec.toPortId,
      lengthMeters,
      ...(routeOffset && (Math.abs(routeOffset[0]) > 0.001 || Math.abs(routeOffset[1]) > 0.001)
        ? { routeOffset }
        : {}),
    };
  });
}

function isPlacedComponentSeed(value: unknown): value is PlacedComponent3D {
  return PlacedComponentSchema.safeParse(value).success;
}

export function createEmptyLayout3D(): Layout3DState {
  const seedRemoved: DiagramNodeKey[] = Array.isArray(defaultLayoutSeed?.removedBaseNodes)
    ? defaultLayoutSeed.removedBaseNodes.filter((k): k is DiagramNodeKey => typeof k === 'string' && k in BASE_NODE_SPECS)
    : [];
  const rawPlaced = Array.isArray(defaultLayoutSeed?.placedComponents)
    ? defaultLayoutSeed.placedComponents
    : [];
  const seedPlaced: PlacedComponent3D[] = rawPlaced.filter(isPlacedComponentSeed);

  const extraSeedWires = (Array.isArray(defaultLayoutSeed?.wires) ? defaultLayoutSeed.wires : [])
    .filter((w) => !DEFAULT_SYSTEM_WIRE_SPECS.some((s) => s.id === w.id))
    .map((w) => ({
      id: w.id,
      polarity: w.polarity as WirePolarity,
      fromNodeId: w.fromNodeId,
      fromPortId: w.fromPortId,
      toNodeId: w.toNodeId,
      toPortId: w.toPortId,
      lengthMeters: Number(w.lengthMeters) || 1.0,
      ...(Array.isArray(w.routeOffset) && w.routeOffset.length === 2
        ? { routeOffset: [Number(w.routeOffset[0]) || 0, Number(w.routeOffset[1]) || 0] as [number, number] }
        : {}),
    }));

  return {
    version: 1,
    baseNodePositions: {},
    removedBaseNodes: [...seedRemoved],
    placedComponents: seedPlaced.map((p) => ({
      ...p,
      position: [...p.position] as [number, number, number],
    })),
    wires: [...createDefaultSystemWires(), ...extraSeedWires],
  };
}

const Coord3DSchema = z.tuple([
  z.number().finite().min(-50).max(50),
  z.number().finite().min(-2).max(20),
  z.number().finite().min(-5).max(40),
]);

const addableKeys = ADDABLE_COMPONENT_CATALOG.map((c) => c.key) as [
  AddableComponentKey,
  ...AddableComponentKey[],
];
const AddableKeyEnum = z.enum(addableKeys);

const PlacedComponentSchema = z.object({
  id: z.string().min(1).max(64),
  catalogKey: AddableKeyEnum,
  label: z.string().min(1).max(80),
  surface: z.enum(['wall', 'floor']),
  position: Coord3DSchema,
});

const WireConnectionSchema = z.object({
  id: z.string().min(1).max(64),
  polarity: z.enum(['positive', 'negative', 'ground']),
  fromNodeId: z.string().min(1).max(64),
  fromPortId: z.string().min(1).max(40),
  toNodeId: z.string().min(1).max(64),
  toPortId: z.string().min(1).max(40),
  lengthMeters: z.number().finite().min(0.1).max(500),
  routeOffset: z
    .tuple([z.number().finite().min(-35).max(35), z.number().finite().min(-15).max(15)])
    .optional(),
});

export const Layout3DSchema = z.object({
  version: z.literal(1).default(1),
  baseNodePositions: z.record(z.string(), Coord3DSchema).default({}),
  removedBaseNodes: z.array(z.string().min(1).max(40)).optional().default([]),
  placedComponents: z.array(PlacedComponentSchema).max(SCENE_LIMITS.maxTotalPlacedComponents).default([]),
  wires: z.array(WireConnectionSchema).max(SCENE_LIMITS.maxTotalWires).default([]),
});

export function parseLayout3DJson(
  raw: unknown
): { ok: true; data: Layout3DState } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Invalid JSON file format.' };
  }
  const obj = raw as Record<string, unknown>;
  const candidate =
    'layout_3d' in obj && typeof obj.layout_3d === 'object' && obj.layout_3d !== null
      ? obj.layout_3d
      : obj;
  const parsed = Layout3DSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'JSON does not match the Kito Solar 3D layout & wiring schema.',
    };
  }
  return { ok: true, data: parsed.data as Layout3DState };
}

export function sanitizeLayout3D(raw: unknown): Layout3DState {
  const parsed = parseLayout3DJson(raw);
  return parsed.ok ? parsed.data : createEmptyLayout3D();
}

export function getLimitStatus(
  placedComponents: PlacedComponent3D[],
  catalogKey: AddableComponentKey
): { currentGroupCount: number; maxGroupCount: number; totalCount: number; canAdd: boolean; reason?: string } {
  const spec = ADDABLE_CATALOG_MAP.get(catalogKey);
  if (!spec) {
    return { currentGroupCount: 0, maxGroupCount: 0, totalCount: placedComponents.length, canAdd: false, reason: 'Unknown component' };
  }

  const totalCount = placedComponents.length;
  const maxGroupCount = SCENE_LIMITS.byGroup[spec.limitGroup];
  const currentGroupCount = placedComponents.filter((p) => {
    const s = ADDABLE_CATALOG_MAP.get(p.catalogKey);
    return s?.limitGroup === spec.limitGroup;
  }).length;

  if (totalCount >= SCENE_LIMITS.maxTotalPlacedComponents) {
    return {
      currentGroupCount,
      maxGroupCount,
      totalCount,
      canAdd: false,
      reason: `Plant room maximum of ${SCENE_LIMITS.maxTotalPlacedComponents} custom components reached.`,
    };
  }

  if (currentGroupCount >= maxGroupCount) {
    return {
      currentGroupCount,
      maxGroupCount,
      totalCount,
      canAdd: false,
      reason: `Maximum of ${maxGroupCount} ${spec.categoryLabel.toLowerCase()} units reached.`,
    };
  }

  return { currentGroupCount, maxGroupCount, totalCount, canAdd: true };
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function clampAndSnapPosition(params: {
  wallHit: [number, number, number] | null;
  floorHit: [number, number, number] | null;
  capability: MountCapability;
  componentHeight: number;
  floorCenterY: number;
  snapToGrid?: boolean;
}): { position: [number, number, number]; surface: MountSurface } {
  const { wallHit, floorHit, capability, componentHeight, floorCenterY, snapToGrid = true } = params;
  const { backboard, floor } = PLANT_ROOM_GEOMETRY;

  let targetSurface: MountSurface = capability === 'floor' ? 'floor' : 'wall';
  if (capability === 'both') {
    if (floorHit && isFloorMountedZ(floorHit[2]) && (!wallHit || wallHit[1] < 1.15)) {
      targetSurface = 'floor';
    } else if (wallHit && wallHit[1] >= 0.65 && (!floorHit || floorHit[2] <= floor.wallTransitionZ + 0.35)) {
      targetSurface = 'wall';
    } else if (floorHit) {
      targetSurface = 'floor';
    }
  }

  if (targetSurface === 'wall') {
    const rawX = wallHit ? wallHit[0] : floorHit ? floorHit[0] : 0;
    const rawY = wallHit ? wallHit[1] : 2.9;

    const snappedX = snapToGrid ? roundToStep(rawX, 0.1) : rawX;
    const clampedX = Math.max(backboard.minX, Math.min(backboard.maxX, Number(snappedX.toFixed(2))));

    let resolvedY = snapToGrid ? roundToStep(rawY, 0.1) : rawY;
    if (snapToGrid) {
      for (const railY of backboard.unistrutYTiers) {
        if (Math.abs(rawY - railY) <= backboard.unistrutSnapThreshold) {
          resolvedY = railY;
          break;
        }
      }
    }

    const minSafeY = Math.max(backboard.minY, Number((componentHeight / 2 + 0.04).toFixed(2)));
    const maxSafeY = Math.min(backboard.maxY, Number((6.9 - componentHeight / 2).toFixed(2)));
    const clampedY = Math.max(minSafeY, Math.min(maxSafeY, Number(resolvedY.toFixed(2))));

    return {
      position: [clampedX, clampedY, 0.0],
      surface: 'wall',
    };
  }

  const rawX = floorHit ? floorHit[0] : wallHit ? wallHit[0] : 0;
  const rawZ = floorHit ? floorHit[2] : 3.2;

  const snappedX = snapToGrid ? roundToStep(rawX, 0.2) : rawX;
  const snappedZ = snapToGrid ? roundToStep(rawZ, 0.2) : rawZ;

  const clampedX = Math.max(floor.minX, Math.min(floor.maxX, Number(snappedX.toFixed(2))));
  const clampedZ = Math.max(floor.minZ, Math.min(floor.maxZ, Number(snappedZ.toFixed(2))));

  return {
    position: [clampedX, Number(floorCenterY.toFixed(2)), clampedZ],
    surface: 'floor',
  };
}

export function findFreeSpawnPosition(
  spec: AddableComponentSpec,
  occupiedPositions: [number, number, number][]
): { position: [number, number, number]; surface: MountSurface } {
  const minClearance = Math.max(1.15, spec.dimensions[0] * 0.92);

  const isFree = (candidate: [number, number, number]) => {
    for (const pos of occupiedPositions) {
      const dist = Math.hypot(
        candidate[0] - pos[0],
        candidate[1] - pos[1],
        candidate[2] - pos[2]
      );
      if (dist < minClearance) return false;
    }
    return true;
  };

  if (spec.defaultSurface === 'wall') {
    const candidateYs = [
      spec.preferredWallY,
      ...PLANT_ROOM_GEOMETRY.backboard.unistrutYTiers.filter((y) => Math.abs(y - spec.preferredWallY) > 0.2),
    ];
    const candidateXs: number[] = [];
    for (let offset = 0; offset <= 16; offset += 1.4) {
      const rightX = Number((7.4 + offset).toFixed(2));
      const leftX = Number((-7.0 - offset).toFixed(2));
      if (rightX <= PLANT_ROOM_GEOMETRY.backboard.maxX) candidateXs.push(rightX);
      if (leftX >= PLANT_ROOM_GEOMETRY.backboard.minX) candidateXs.push(leftX);
    }
    for (let cx = -6.0; cx <= 7.0; cx += 1.4) {
      candidateXs.push(Number(cx.toFixed(2)));
    }

    for (const cy of candidateYs) {
      const safeY = Math.max(spec.dimensions[1] / 2 + 0.05, cy);
      for (const cx of candidateXs) {
        const candidate: [number, number, number] = [cx, Number(safeY.toFixed(2)), 0.0];
        if (isFree(candidate)) {
          return { position: candidate, surface: 'wall' };
        }
      }
    }
  }

  const zRows = spec.nodeType === 'pv' ? [5.2, 8.2, 11.2, 14.2, 17.0] : [1.8, 3.6, 5.6, 7.8, 10.2, 12.8];
  const xStep = Math.max(1.8, Number((spec.dimensions[0] + 0.5).toFixed(1)));
  for (const cz of zRows) {
    for (let step = 0; step <= 18; step += xStep) {
      const candidatesX = step === 0 ? [0.8] : [Number((0.8 + step).toFixed(2)), Number((0.8 - step).toFixed(2))];
      for (const cx of candidatesX) {
        if (cx < PLANT_ROOM_GEOMETRY.floor.minX || cx > PLANT_ROOM_GEOMETRY.floor.maxX) continue;
        const candidate: [number, number, number] = [cx, spec.floorCenterY, cz];
        if (isFree(candidate)) {
          return { position: candidate, surface: 'floor' };
        }
      }
    }
  }

  return {
    position: [8.4, spec.defaultSurface === 'wall' ? spec.preferredWallY : spec.floorCenterY, spec.defaultSurface === 'wall' ? 0.0 : 3.2],
    surface: spec.defaultSurface,
  };
}

export function resolveNodeWorldPosition(
  nodeId: string,
  layout3d: Layout3DState
): [number, number, number] | null {
  const custom = layout3d.placedComponents.find((c) => c.id === nodeId);
  if (custom) return custom.position;
  const key = nodeId as DiagramNodeKey;
  if (layout3d.baseNodePositions[key]) return layout3d.baseNodePositions[key]!;
  if (DEFAULT_BASE_NODE_POSITIONS[key]) return DEFAULT_BASE_NODE_POSITIONS[key];
  return null;
}

export function recomputeAttachedWireLengths(layout3d: Layout3DState): WireConnection3D[] {
  return measureLayoutWires(layout3d, DEFAULT_BASE_NODE_POSITIONS);
}

export function computeWireLengthForLayout(
  layout3d: Layout3DState,
  params: {
    polarity: WirePolarity;
    fromNodeId: string;
    fromPortId: string;
    toNodeId: string;
    toPortId: string;
    fromWorldPos: [number, number, number];
    toWorldPos: [number, number, number];
  }
): number {
  const mergedBasePositions: Record<string, [number, number, number]> = {
    ...DEFAULT_BASE_NODE_POSITIONS,
    ...(layout3d.baseNodePositions as Record<string, [number, number, number]>),
  };
  const obstacles = getWallObstacles(
    mergedBasePositions,
    layout3d.placedComponents,
    true,
    layout3d.removedBaseNodes || []
  );
  const fromNodePos = resolveNodeWorldPosition(params.fromNodeId, layout3d) || params.fromWorldPos;
  const toNodePos = resolveNodeWorldPosition(params.toNodeId, layout3d) || params.toWorldPos;

  return routeAndMeasureWire({
    fromNodeId: params.fromNodeId,
    fromPortId: params.fromPortId,
    toNodeId: params.toNodeId,
    toPortId: params.toPortId,
    polarity: params.polarity,
    fromNodePos,
    toNodePos,
    placedComponents: layout3d.placedComponents,
    obstacles,
  }).lengthMeters;
}

export { isBaselineSystemWire, resolveNodeTypeAndLabel };
