// src/lib/layout3dEngine.ts
import { z } from 'zod';
import { DiagramNodeKey } from '@/types/diagram';
import { NodeType, getNodeTypeFromKey } from '@/components/diagram/NodeGeometry';
import defaultLayoutSeed from '@/data/seed/default_layout_3d.json';
import {
  AddableComponentKey,
  AddableComponentSpec,
  ComponentLimitGroup,
  Layout3DState,
  MountCapability,
  MountSurface,
  PLANT_ROOM_GEOMETRY,
  PlacedComponent3D,
  SCENE_LIMITS,
  SnapCandidateResult,
  TerminalPort3D,
  WireConnection3D,
  WirePolarity,
} from '@/types/layout3d';

export const ADDABLE_COMPONENT_CATALOG: AddableComponentSpec[] = [
  // 1. Breakers & SPD
  {
    key: 'pv_dc_breaker',
    title: 'PV DC Circuit Breaker',
    shortLabel: 'DC Breaker',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'breakers',
    nodeType: 'breaker',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/pv-dc-breaker.svg',
    color: '#DC2626',
    defaultRatingLabel: '1000V DC 2P MCB',
    bomAccessoryKey: 'pv_dc_breaker',
    fallbackUnitPricePhp: 280,
    dimensions: [0.78, 0.98, 0.44],
    floorCenterY: 0.49,
    preferredWallY: 2.9,
  },
  {
    key: 'ac_grid_breaker',
    title: 'AC Circuit Breaker',
    shortLabel: 'AC Breaker',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'breakers',
    nodeType: 'breaker',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/ac-breaker.svg',
    color: '#0284C7',
    defaultRatingLabel: '230V AC 2P MCB',
    bomAccessoryKey: 'ac_grid_breaker',
    fallbackUnitPricePhp: 220,
    dimensions: [0.78, 0.98, 0.44],
    floorCenterY: 0.49,
    preferredWallY: 2.9,
  },
  {
    key: 'battery_breaker',
    title: 'Battery DC MCCB',
    shortLabel: 'Battery MCCB',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'breakers',
    nodeType: 'breaker',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/battery-breaker.svg',
    color: '#059669',
    defaultRatingLabel: '125A-250A DC MCCB',
    bomAccessoryKey: 'battery_breaker',
    fallbackUnitPricePhp: 950,
    dimensions: [0.78, 0.98, 0.44],
    floorCenterY: 0.49,
    preferredWallY: 1.4,
  },
  {
    key: 'eps_breaker',
    title: 'EPS Backup Breaker',
    shortLabel: 'EPS Breaker',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'breakers',
    nodeType: 'breaker',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/ac-breaker.svg',
    color: '#0EA5E9',
    defaultRatingLabel: 'Critical Load MCB',
    bomAccessoryKey: 'eps_breaker',
    fallbackUnitPricePhp: 220,
    dimensions: [0.78, 0.98, 0.44],
    floorCenterY: 0.49,
    preferredWallY: 1.4,
  },
  {
    key: 'pv_dc_spd',
    title: 'DC Surge Arrester (SPD)',
    shortLabel: 'DC SPD',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'spds',
    nodeType: 'spd',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/dc-spd.svg',
    color: '#059669',
    defaultRatingLabel: 'Type 2 1000V DC',
    bomAccessoryKey: 'pv_dc_spd',
    fallbackUnitPricePhp: 420,
    dimensions: [0.78, 0.95, 0.44],
    floorCenterY: 0.48,
    preferredWallY: 1.4,
  },
  {
    key: 'ac_spd',
    title: 'AC Surge Arrester (SPD)',
    shortLabel: 'AC SPD',
    categoryLabel: 'Breakers & SPD',
    limitGroup: 'spds',
    nodeType: 'spd',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/ac-spd.svg',
    color: '#10B981',
    defaultRatingLabel: 'Type 2 275V AC',
    bomAccessoryKey: 'ac_spd',
    fallbackUnitPricePhp: 380,
    dimensions: [0.78, 0.95, 0.44],
    floorCenterY: 0.48,
    preferredWallY: 1.4,
  },

  // 2. Switches & ATS
  {
    key: 'pv_dc_isolator',
    title: 'DC Rotary Isolator Switch',
    shortLabel: 'DC Isolator',
    categoryLabel: 'Switches & ATS',
    limitGroup: 'switches',
    nodeType: 'isolator',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/dc-isolator.svg',
    color: '#D97706',
    defaultRatingLabel: '4P IP66 Load-Break',
    bomAccessoryKey: 'pv_dc_isolator',
    fallbackUnitPricePhp: 850,
    dimensions: [0.85, 1.05, 0.42],
    floorCenterY: 0.53,
    preferredWallY: 2.9,
  },
  {
    key: 'ac_isolator',
    title: 'AC Rotary Disconnect Switch',
    shortLabel: 'AC Isolator',
    categoryLabel: 'Switches & ATS',
    limitGroup: 'switches',
    nodeType: 'isolator',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/ac-isolator.svg',
    color: '#F59E0B',
    defaultRatingLabel: 'Lockable LOTO Switch',
    bomAccessoryKey: 'ac_isolator',
    fallbackUnitPricePhp: 650,
    dimensions: [0.85, 1.05, 0.42],
    floorCenterY: 0.53,
    preferredWallY: 2.9,
  },
  {
    key: 'ats',
    title: 'Automatic Transfer Switch',
    shortLabel: 'ATS Switch',
    categoryLabel: 'Switches & ATS',
    limitGroup: 'switches',
    nodeType: 'ats',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/ats.svg',
    color: '#7C3AED',
    defaultRatingLabel: 'Dual-Source Solar/Grid',
    bomAccessoryKey: 'ats',
    fallbackUnitPricePhp: 950,
    dimensions: [0.95, 1.25, 0.46],
    floorCenterY: 0.63,
    preferredWallY: 2.9,
  },

  // 3. Batteries & Power
  {
    key: 'battery_unit',
    title: 'LiFePO4 Battery Module',
    shortLabel: 'Battery Bank',
    categoryLabel: 'Batteries & Power',
    limitGroup: 'batteries',
    nodeType: 'battery',
    mountCapability: 'both',
    defaultSurface: 'floor',
    imagePath: '/assets/accessories/battery-unit.svg',
    color: '#059669',
    defaultRatingLabel: 'Wall or Floor ESS',
    fallbackUnitPricePhp: 68000,
    dimensions: [1.38, 1.56, 0.50],
    floorCenterY: 0.78,
    preferredWallY: 1.4,
  },
  {
    key: 'inverter_unit',
    title: 'Parallel Solar Inverter',
    shortLabel: 'Solar Inverter',
    categoryLabel: 'Batteries & Power',
    limitGroup: 'inverters',
    nodeType: 'inverter',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/solar-inverter.svg',
    color: '#D97706',
    defaultRatingLabel: 'Parallel MPPT Unit',
    fallbackUnitPricePhp: 58000,
    dimensions: [1.56, 1.76, 0.44],
    floorCenterY: 0.88,
    preferredWallY: 3.35,
  },
  {
    key: 'pv_array_unit',
    title: 'PV Sub-Array (3x Modules)',
    shortLabel: 'PV Sub-Array',
    categoryLabel: 'Batteries & Power',
    limitGroup: 'pv_arrays',
    nodeType: 'pv',
    mountCapability: 'floor',
    defaultSurface: 'floor',
    imagePath: '/assets/accessories/pv-array.svg',
    color: '#0284C7',
    defaultRatingLabel: '3x Ground/Roof Table',
    fallbackUnitPricePhp: 19500,
    dimensions: [3.9, 1.1, 2.0],
    floorCenterY: 0.75,
    preferredWallY: 0.75,
  },

  // 4. Panels & Ground
  {
    key: 'sub_panel',
    title: 'Distribution Subpanel',
    shortLabel: 'Subpanel',
    categoryLabel: 'Panels & Ground',
    limitGroup: 'panels_ground',
    nodeType: 'panel',
    mountCapability: 'both',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/sub-panel.svg',
    color: '#475569',
    defaultRatingLabel: 'NEMA 3R Load Center',
    fallbackUnitPricePhp: 1450,
    dimensions: [1.15, 1.65, 0.45],
    floorCenterY: 0.83,
    preferredWallY: 2.5,
  },
  {
    key: 'grounding_busbar',
    title: 'Copper Ground Busbar',
    shortLabel: 'Ground Busbar',
    categoryLabel: 'Panels & Ground',
    limitGroup: 'panels_ground',
    nodeType: 'grounding',
    mountCapability: 'wall',
    defaultSurface: 'wall',
    imagePath: '/assets/accessories/grounding-lug.svg',
    color: '#D97706',
    defaultRatingLabel: 'UL 467 Earth Bar',
    bomAccessoryKey: 'grounding',
    fallbackUnitPricePhp: 380,
    dimensions: [0.68, 0.16, 0.08],
    floorCenterY: 0.15,
    preferredWallY: 0.75,
  },
];

export const ADDABLE_CATALOG_MAP = new Map<AddableComponentKey, AddableComponentSpec>(
  ADDABLE_COMPONENT_CATALOG.map((item) => [item.key, item])
);

export const BASE_NODE_CAPABILITY: Record<DiagramNodeKey, { capability: MountCapability; height: number; floorCenterY: number }> = {
  pv_array: { capability: 'floor', height: 1.1, floorCenterY: 0.75 },
  dc_isolator: { capability: 'wall', height: 1.05, floorCenterY: 0.53 },
  dc_breaker: { capability: 'wall', height: 0.98, floorCenterY: 0.49 },
  dc_spd: { capability: 'wall', height: 0.95, floorCenterY: 0.48 },
  dc_conduit: { capability: 'wall', height: 0.5, floorCenterY: 0.3 },
  inverter: { capability: 'wall', height: 1.76, floorCenterY: 0.88 },
  battery_breaker: { capability: 'wall', height: 0.98, floorCenterY: 0.49 },
  battery: { capability: 'both', height: 1.56, floorCenterY: 0.80 },
  battery_wire: { capability: 'floor', height: 0.4, floorCenterY: 0.4 },
  ac_breaker: { capability: 'wall', height: 0.98, floorCenterY: 0.49 },
  ac_spd: { capability: 'wall', height: 0.95, floorCenterY: 0.48 },
  ac_isolator: { capability: 'wall', height: 1.05, floorCenterY: 0.53 },
  main_panel: { capability: 'both', height: 1.65, floorCenterY: 0.83 },
  ats: { capability: 'wall', height: 1.25, floorCenterY: 0.63 },
  eps_breaker: { capability: 'wall', height: 0.98, floorCenterY: 0.49 },
  grid: { capability: 'floor', height: 3.2, floorCenterY: 1.6 },
  load: { capability: 'floor', height: 1.6, floorCenterY: 0.8 },
  grounding: { capability: 'wall', height: 0.16, floorCenterY: 0.15 },
};

const FALLBACK_BASE_NODE_POSITIONS: Record<DiagramNodeKey, [number, number, number]> = {
  pv_array: [-7.8, 0.75, 2.2],
  dc_isolator: [-5.4, 2.9, 0.0],
  dc_breaker: [-3.6, 2.9, 0.0],
  dc_spd: [-3.6, 1.4, 0.0],
  dc_conduit: [-5.0, 2.9, 0.0],
  inverter: [-0.6, 3.35, 0.0],
  battery_breaker: [-2.0, 1.4, 0.0],
  battery: [-0.6, 0.80, 0.4],
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

export const DEFAULT_BASE_NODE_POSITIONS: Record<DiagramNodeKey, [number, number, number]> = {
  ...FALLBACK_BASE_NODE_POSITIONS,
  ...((defaultLayoutSeed?.baseNodePositions as unknown as Partial<Record<DiagramNodeKey, [number, number, number]>>) || {}),
};

export const DEFAULT_SYSTEM_WIRE_SPECS: ReadonlyArray<{
  id: string;
  polarity: WirePolarity;
  fromNodeId: DiagramNodeKey;
  fromPortId: string;
  toNodeId: DiagramNodeKey;
  toPortId: string;
}> = [
  // PV Array -> DC Isolator
  { id: 'base_wire_pv_iso_pos', polarity: 'positive', fromNodeId: 'pv_array', fromPortId: 'pv_pos', toNodeId: 'dc_isolator', toPortId: 'in_pos' },
  { id: 'base_wire_pv_iso_neg', polarity: 'negative', fromNodeId: 'pv_array', fromPortId: 'pv_neg', toNodeId: 'dc_isolator', toPortId: 'in_neg' },
  // DC Isolator -> DC Breaker
  { id: 'base_wire_iso_brk_pos', polarity: 'positive', fromNodeId: 'dc_isolator', fromPortId: 'out_pos', toNodeId: 'dc_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_iso_brk_neg', polarity: 'negative', fromNodeId: 'dc_isolator', fromPortId: 'out_neg', toNodeId: 'dc_breaker', toPortId: 'in_neg' },
  // DC Breaker -> Inverter PV Input
  { id: 'base_wire_dcbrk_inv_pos', polarity: 'positive', fromNodeId: 'dc_breaker', fromPortId: 'out_pos', toNodeId: 'inverter', toPortId: 'pv_pos' },
  { id: 'base_wire_dcbrk_inv_neg', polarity: 'negative', fromNodeId: 'dc_breaker', fromPortId: 'out_neg', toNodeId: 'inverter', toPortId: 'pv_neg' },
  // Inverter Battery Port -> Battery Breaker (Hybrid)
  { id: 'base_wire_inv_batbrk_pos', polarity: 'positive', fromNodeId: 'inverter', fromPortId: 'bat_pos', toNodeId: 'battery_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_inv_batbrk_neg', polarity: 'negative', fromNodeId: 'inverter', fromPortId: 'bat_neg', toNodeId: 'battery_breaker', toPortId: 'in_neg' },
  // Battery Breaker -> Battery Storage (Hybrid)
  { id: 'base_wire_batbrk_bat_pos', polarity: 'positive', fromNodeId: 'battery_breaker', fromPortId: 'out_pos', toNodeId: 'battery', toPortId: 'bat_pos' },
  { id: 'base_wire_batbrk_bat_neg', polarity: 'negative', fromNodeId: 'battery_breaker', fromPortId: 'out_neg', toNodeId: 'battery', toPortId: 'bat_neg' },
  // Inverter AC Output -> AC Breaker
  { id: 'base_wire_inv_acbrk_pos', polarity: 'positive', fromNodeId: 'inverter', fromPortId: 'ac_pos', toNodeId: 'ac_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_inv_acbrk_neg', polarity: 'negative', fromNodeId: 'inverter', fromPortId: 'ac_neg', toNodeId: 'ac_breaker', toPortId: 'in_neg' },
  // AC Breaker -> AC Isolator
  { id: 'base_wire_acbrk_iso_pos', polarity: 'positive', fromNodeId: 'ac_breaker', fromPortId: 'out_pos', toNodeId: 'ac_isolator', toPortId: 'in_pos' },
  { id: 'base_wire_acbrk_iso_neg', polarity: 'negative', fromNodeId: 'ac_breaker', fromPortId: 'out_neg', toNodeId: 'ac_isolator', toPortId: 'in_neg' },
  // AC Isolator -> Main Service Panel
  { id: 'base_wire_aciso_panel_pos', polarity: 'positive', fromNodeId: 'ac_isolator', fromPortId: 'out_pos', toNodeId: 'main_panel', toPortId: 'in_pos' },
  { id: 'base_wire_aciso_panel_neg', polarity: 'negative', fromNodeId: 'ac_isolator', fromPortId: 'out_neg', toNodeId: 'main_panel', toPortId: 'in_neg' },
  // Utility Grid -> Main Service Panel
  { id: 'base_wire_grid_panel_pos', polarity: 'positive', fromNodeId: 'grid', fromPortId: 'grid_pos', toNodeId: 'main_panel', toPortId: 'in_pos' },
  { id: 'base_wire_grid_panel_neg', polarity: 'negative', fromNodeId: 'grid', fromPortId: 'grid_neg', toNodeId: 'main_panel', toPortId: 'in_neg' },
  // Main Service Panel -> Automatic Transfer Switch (ATS)
  { id: 'base_wire_panel_ats_pos', polarity: 'positive', fromNodeId: 'main_panel', fromPortId: 'out_pos', toNodeId: 'ats', toPortId: 'in_pos' },
  { id: 'base_wire_panel_ats_neg', polarity: 'negative', fromNodeId: 'main_panel', fromPortId: 'out_neg', toNodeId: 'ats', toPortId: 'in_neg' },
  // Automatic Transfer Switch (ATS) -> Building Load
  { id: 'base_wire_ats_load_pos', polarity: 'positive', fromNodeId: 'ats', fromPortId: 'out_pos', toNodeId: 'load', toPortId: 'load_pos' },
  { id: 'base_wire_ats_load_neg', polarity: 'negative', fromNodeId: 'ats', fromPortId: 'out_neg', toNodeId: 'load', toPortId: 'load_neg' },
  // Equipment Grounding Conductors (Neon Green, No Particles) -> Copper Ground Busbar
  { id: 'base_wire_panel_gnd', polarity: 'ground', fromNodeId: 'main_panel', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_3' },
  { id: 'base_wire_acspd_gnd', polarity: 'ground', fromNodeId: 'ac_spd', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_2' },
  { id: 'base_wire_dcspd_gnd', polarity: 'ground', fromNodeId: 'dc_spd', fromPortId: 'gnd', toNodeId: 'grounding', toPortId: 'gnd_1' },
  // Parallel Surge Protection (SPD) Connections
  { id: 'base_wire_dcspd_brk_pos', polarity: 'positive', fromNodeId: 'dc_spd', fromPortId: 'in_pos', toNodeId: 'dc_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_dcspd_brk_neg', polarity: 'negative', fromNodeId: 'dc_spd', fromPortId: 'in_neg', toNodeId: 'dc_breaker', toPortId: 'in_neg' },
  { id: 'base_wire_acspd_brk_pos', polarity: 'positive', fromNodeId: 'ac_spd', fromPortId: 'in_pos', toNodeId: 'ac_breaker', toPortId: 'in_pos' },
  { id: 'base_wire_acspd_brk_neg', polarity: 'negative', fromNodeId: 'ac_spd', fromPortId: 'in_neg', toNodeId: 'ac_breaker', toPortId: 'in_neg' },
];

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

    const fromNodePos = DEFAULT_BASE_NODE_POSITIONS[spec.fromNodeId];
    const toNodePos = DEFAULT_BASE_NODE_POSITIONS[spec.toNodeId];
    const fromPortObj = getNodeTerminalPorts(
      spec.fromNodeId,
      spec.fromNodeId.toUpperCase(),
      getNodeTypeFromKey(spec.fromNodeId),
      fromNodePos
    ).find((p) => p.portId === spec.fromPortId);
    const toPortObj = getNodeTerminalPorts(
      spec.toNodeId,
      spec.toNodeId.toUpperCase(),
      getNodeTypeFromKey(spec.toNodeId),
      toNodePos
    ).find((p) => p.portId === spec.toPortId);

    const fromPort = fromPortObj?.worldPosition || fromNodePos;
    const toPort = toPortObj?.worldPosition || toNodePos;

    const waypoints = buildOrthogonalWireWaypoints(fromPort, toPort, spec.polarity, {
      fromDir: fromPortObj ? (fromPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
      toDir: toPortObj ? (toPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
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
      lengthMeters: calculateWaypointsLengthMeters(waypoints),
      ...(routeOffset && (Math.abs(routeOffset[0]) > 0.001 || Math.abs(routeOffset[1]) > 0.001)
        ? { routeOffset }
        : {}),
    };
  });
}

export function createEmptyLayout3D(): Layout3DState {
  const seedRemoved = Array.isArray(defaultLayoutSeed?.removedBaseNodes)
    ? (defaultLayoutSeed.removedBaseNodes as DiagramNodeKey[])
    : [];
  const seedPlaced = Array.isArray(defaultLayoutSeed?.placedComponents)
    ? (defaultLayoutSeed.placedComponents as unknown as PlacedComponent3D[])
    : [];
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
    placedComponents: seedPlaced.map((p) => ({ ...p, position: [...p.position] as [number, number, number] })),
    wires: [...createDefaultSystemWires(), ...extraSeedWires],
  };
}

export function serializeLayout3DPreset(layout: Layout3DState): Layout3DState {
  const mergedBase: Partial<Record<DiagramNodeKey, [number, number, number]>> = {
    ...DEFAULT_BASE_NODE_POSITIONS,
    ...layout.baseNodePositions,
  };
  return {
    version: 1,
    baseNodePositions: mergedBase,
    removedBaseNodes: layout.removedBaseNodes || [],
    placedComponents: layout.placedComponents,
    wires: layout.wires.map((w) => ({
      ...w,
      routeOffset: w.routeOffset || [0, 0],
    })),
  };
}

// Zod Validation Schema for Safe Cloud/Local Project Deserialization
const Coord3DSchema = z.tuple([
  z.number().finite().min(-50).max(50),
  z.number().finite().min(-2).max(20),
  z.number().finite().min(-5).max(40),
]);

const AddableKeyEnum = z.enum([
  'pv_dc_breaker',
  'ac_grid_breaker',
  'battery_breaker',
  'eps_breaker',
  'pv_dc_spd',
  'ac_spd',
  'pv_dc_isolator',
  'ac_isolator',
  'ats',
  'battery_unit',
  'inverter_unit',
  'sub_panel',
  'grounding_busbar',
  'pv_array_unit',
]);

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

export function sanitizeLayout3D(raw: unknown): Layout3DState {
  if (!raw || typeof raw !== 'object') return createEmptyLayout3D();
  const candidate =
    'layout_3d' in (raw as Record<string, unknown>) &&
    typeof (raw as Record<string, unknown>).layout_3d === 'object' &&
    (raw as Record<string, unknown>).layout_3d !== null
      ? (raw as Record<string, unknown>).layout_3d
      : raw;
  const parsed = Layout3DSchema.safeParse(candidate);
  if (!parsed.success) return createEmptyLayout3D();
  return parsed.data as Layout3DState;
}

/**
 * Counts placed components per limit group and checks whether another item can be added.
 */
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

export function getGroupCounts(placedComponents: PlacedComponent3D[]): Record<ComponentLimitGroup, number> {
  const counts: Record<ComponentLimitGroup, number> = {
    inverters: 0,
    batteries: 0,
    breakers: 0,
    switches: 0,
    spds: 0,
    panels_ground: 0,
    pv_arrays: 0,
  };
  for (const item of placedComponents) {
    const spec = ADDABLE_CATALOG_MAP.get(item.catalogKey);
    if (spec) counts[spec.limitGroup]++;
  }
  return counts;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Clamps and snaps a 3D drag hit point onto the commercial wall backboard or concrete floor slab.
 */
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

  // Determine target surface for dual-mount ('both') items based on cursor Z proximity to wall
  let targetSurface: MountSurface = capability === 'floor' ? 'floor' : 'wall';
  if (capability === 'both') {
    if (floorHit && floorHit[2] > floor.wallTransitionZ && (!wallHit || wallHit[1] < 1.15)) {
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

  // Floor placement
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

/**
 * Finds a clean, non-overlapping 3D spawn position on the expanded wall or floor
 * so clicking components in the right-side palette lays them out neatly.
 */
export function findFreeSpawnPosition(
  spec: AddableComponentSpec,
  occupiedPositions: [number, number, number][]
): { position: [number, number, number]; surface: MountSurface } {
  const minClearance = Math.max(1.15, spec.dimensions[0] * 0.92);

  const isFree = (candidate: [number, number, number]) => {
    for (const pos of occupiedPositions) {
      const dx = candidate[0] - pos[0];
      const dy = candidate[1] - pos[1];
      const dz = candidate[2] - pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < minClearance) return false;
    }
    return true;
  };

  if (spec.defaultSurface === 'wall') {
    // Search Unistrut tiers starting from preferredWallY, sweeping outward from accessible commercial bays
    const candidateYs = [
      spec.preferredWallY,
      ...PLANT_ROOM_GEOMETRY.backboard.unistrutYTiers.filter((y) => Math.abs(y - spec.preferredWallY) > 0.2),
    ];
    // Candidate X slots across the 36m commercial backboard (prioritize open right & left expansion wings first, plus central gaps)
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

  // Floor grid search across the 44m x 20m slab
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

/**
 * Returns local [x, y, z] terminal lug definitions for any NodeType.
 * Exposes explicit Positive (+) Red and Negative (-) Black ports.
 */
export function getLocalPortsForNodeType(
  nodeType: NodeType
): { portId: string; label: string; polarity: WirePolarity; offset: [number, number, number] }[] {
  switch (nodeType) {
    case 'breaker':
      return [
        { portId: 'in_pos', label: 'IN (+)', polarity: 'positive', offset: [-0.15, 0.52, 0.18] },
        { portId: 'in_neg', label: 'IN (-)', polarity: 'negative', offset: [0.15, 0.52, 0.18] },
        { portId: 'out_pos', label: 'OUT (+)', polarity: 'positive', offset: [-0.16, -0.52, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.52, 0.18] },
        { portId: 'out_neg', label: 'OUT (-)', polarity: 'negative', offset: [0.16, -0.52, 0.18] },
      ];
    case 'isolator':
      return [
        { portId: 'in_pos', label: 'LINE (+)', polarity: 'positive', offset: [-0.18, 0.56, 0.18] },
        { portId: 'in_neg', label: 'LINE (-)', polarity: 'negative', offset: [0.18, 0.56, 0.18] },
        { portId: 'out_pos', label: 'LOAD (+)', polarity: 'positive', offset: [-0.18, -0.56, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.56, 0.18] },
        { portId: 'out_neg', label: 'LOAD (-)', polarity: 'negative', offset: [0.18, -0.56, 0.18] },
      ];
    case 'spd':
      return [
        { portId: 'in_pos', label: 'SPD (+)', polarity: 'positive', offset: [-0.18, 0.50, 0.18] },
        { portId: 'in_neg', label: 'SPD (-)', polarity: 'negative', offset: [0.18, 0.50, 0.18] },
        { portId: 'gnd', label: 'SPD GND', polarity: 'ground', offset: [0.0, -0.50, 0.18] },
      ];
    case 'ats':
      return [
        { portId: 'in_pos', label: 'SRC (+)', polarity: 'positive', offset: [-0.22, 0.65, 0.20] },
        { portId: 'in_neg', label: 'SRC (-)', polarity: 'negative', offset: [0.22, 0.65, 0.20] },
        { portId: 'out_pos', label: 'LOAD (+)', polarity: 'positive', offset: [-0.24, -0.65, 0.20] },
        { portId: 'gnd', label: 'ATS GND', polarity: 'ground', offset: [0.0, -0.65, 0.20] },
        { portId: 'out_neg', label: 'LOAD (-)', polarity: 'negative', offset: [0.24, -0.65, 0.20] },
      ];
    case 'inverter':
      return [
        { portId: 'pv_pos', label: 'PV (+)', polarity: 'positive', offset: [-0.56, -0.91, 0.18] },
        { portId: 'pv_neg', label: 'PV (-)', polarity: 'negative', offset: [-0.38, -0.91, 0.18] },
        { portId: 'bat_pos', label: 'BAT (+)', polarity: 'positive', offset: [-0.14, -0.91, 0.18] },
        { portId: 'bat_neg', label: 'BAT (-)', polarity: 'negative', offset: [0.06, -0.91, 0.18] },
        { portId: 'ac_pos', label: 'AC L (+)', polarity: 'positive', offset: [0.30, -0.91, 0.18] },
        { portId: 'ac_neg', label: 'AC N (-)', polarity: 'negative', offset: [0.48, -0.91, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.64, -0.91, 0.18] },
      ];
    case 'battery':
      return [
        { portId: 'bat_pos', label: 'BAT (+)', polarity: 'positive', offset: [-0.28, 0.81, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.0, 0.81, 0.18] },
        { portId: 'bat_neg', label: 'BAT (-)', polarity: 'negative', offset: [0.28, 0.81, 0.18] },
      ];
    case 'panel':
      return [
        { portId: 'in_pos', label: 'BUS L (+)', polarity: 'positive', offset: [-0.24, 0.86, 0.18] },
        { portId: 'in_neg', label: 'BUS N (-)', polarity: 'negative', offset: [0.24, 0.86, 0.18] },
        { portId: 'out_pos', label: 'FEED (+)', polarity: 'positive', offset: [-0.26, -0.86, 0.18] },
        { portId: 'gnd', label: 'PE GND', polarity: 'ground', offset: [0.0, -0.86, 0.18] },
        { portId: 'out_neg', label: 'FEED (-)', polarity: 'negative', offset: [0.26, -0.86, 0.18] },
      ];
    case 'pv':
      return [
        { portId: 'pv_pos', label: 'STRING (+)', polarity: 'positive', offset: [-0.24, 0.24, -0.56] },
        { portId: 'gnd', label: 'FRAME GND', polarity: 'ground', offset: [0.0, 0.24, -0.56] },
        { portId: 'pv_neg', label: 'STRING (-)', polarity: 'negative', offset: [0.24, 0.24, -0.56] },
      ];
    case 'grounding':
      return [
        { portId: 'gnd_1', label: 'EARTH GND', polarity: 'ground', offset: [-0.26, 0.12, 0.08] },
        { portId: 'gnd_2', label: 'EQUIP GND', polarity: 'ground', offset: [0.0, 0.12, 0.08] },
        { portId: 'gnd_3', label: 'BOND GND', polarity: 'ground', offset: [0.26, 0.12, 0.08] },
      ];
    case 'grid':
      return [
        { portId: 'grid_pos', label: 'GRID L (+)', polarity: 'positive', offset: [-0.20, 0.35, 0.24] },
        { portId: 'grid_neg', label: 'GRID N (-)', polarity: 'negative', offset: [0.20, 0.35, 0.24] },
      ];
    case 'load':
      return [
        { portId: 'load_pos', label: 'LOAD L (+)', polarity: 'positive', offset: [-0.24, 0.18, -0.86] },
        { portId: 'load_neg', label: 'LOAD N (-)', polarity: 'negative', offset: [0.24, 0.18, -0.86] },
      ];
    default:
      return [
        { portId: 'pos', label: '(+)', polarity: 'positive', offset: [-0.15, -0.45, 0.18] },
        { portId: 'gnd', label: 'GND', polarity: 'ground', offset: [0.0, -0.45, 0.18] },
        { portId: 'neg', label: '(-)', polarity: 'negative', offset: [0.15, -0.45, 0.18] },
      ];
  }
}

export function getNodeTerminalPorts(
  nodeId: string,
  nodeLabel: string,
  nodeType: NodeType,
  position: [number, number, number]
): TerminalPort3D[] {
  const local = getLocalPortsForNodeType(nodeType);
  return local.map((p) => ({
    portId: p.portId,
    nodeId,
    nodeLabel,
    label: p.label,
    polarity: p.polarity,
    localOffset: p.offset,
    worldPosition: [
      Number((position[0] + p.offset[0]).toFixed(3)),
      Number((position[1] + p.offset[1]).toFixed(3)),
      Number((position[2] + p.offset[2]).toFixed(3)),
    ],
  }));
}

export function resolveNodeTypeAndLabel(
  nodeId: string,
  placedComponents: PlacedComponent3D[]
): { nodeType: NodeType; label: string } {
  const custom = placedComponents.find((c) => c.id === nodeId);
  if (custom) {
    const spec = ADDABLE_CATALOG_MAP.get(custom.catalogKey);
    return {
      nodeType: spec?.nodeType || 'breaker',
      label: custom.label,
    };
  }
  return {
    nodeType: getNodeTypeFromKey(nodeId),
    label: nodeId.toUpperCase().replace(/_/g, ' '),
  };
}

/**
 * Magnetic Terminal Snap Resolver:
 * Evaluates all ports in 3D space while dragging a wire.
 * Prefers matching polarity ports within snapRadius; if the user aims right onto
 * an opposite-polarity lug, flags polarityMismatch=true so the UI blocks short-circuits!
 */
export function findNearestSnapPort(params: {
  cursorWorld: [number, number, number];
  allPorts: TerminalPort3D[];
  sourceNodeId: string;
  wirePolarity: WirePolarity;
  snapRadius?: number;
}): SnapCandidateResult | null {
  const { cursorWorld, allPorts, sourceNodeId, wirePolarity, snapRadius = 0.85 } = params;

  let bestMatching: { port: TerminalPort3D; dist: number } | null = null;
  let bestOpposite: { port: TerminalPort3D; dist: number } | null = null;

  for (const port of allPorts) {
    if (port.nodeId === sourceNodeId) continue;

    const dx = cursorWorld[0] - port.worldPosition[0];
    const dy = cursorWorld[1] - port.worldPosition[1];
    const dz = cursorWorld[2] - port.worldPosition[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist <= snapRadius) {
      if (port.polarity === wirePolarity) {
        if (!bestMatching || dist < bestMatching.dist) {
          bestMatching = { port, dist };
        }
      } else {
        if (!bestOpposite || dist < bestOpposite.dist) {
          bestOpposite = { port, dist };
        }
      }
    }
  }

  // If user is aiming directly at an opposite-polarity lug (< 0.24m) and much closer than matching lug, flag polarity warning
  if (
    bestOpposite &&
    bestOpposite.dist < 0.24 &&
    (!bestMatching || bestOpposite.dist + 0.14 < bestMatching.dist)
  ) {
    return {
      port: bestOpposite.port,
      distance: bestOpposite.dist,
      polarityMismatch: true,
    };
  }

  if (bestMatching) {
    return {
      port: bestMatching.port,
      distance: bestMatching.dist,
      polarityMismatch: false,
    };
  }

  if (bestOpposite && bestOpposite.dist < 0.35) {
    return {
      port: bestOpposite.port,
      distance: bestOpposite.dist,
      polarityMismatch: true,
    };
  }

  return null;
}

/**
 * Screen-Ray Magnetic Terminal Snap Resolver:
 * Computes perpendicular 3D ray-to-point distance from the camera pointer ray to every
 * terminal lug in the plant room so magnetic snapping works accurately across both the
 * vertical wall backboard (Z = 0) and the 20m deep concrete floor slab.
 */
export function findNearestSnapPortByRay(params: {
  rayOrigin: [number, number, number];
  rayDirection: [number, number, number];
  allPorts: TerminalPort3D[];
  sourceNodeId: string;
  wirePolarity: WirePolarity;
  snapRadius?: number;
}): SnapCandidateResult | null {
  const { rayOrigin, rayDirection, allPorts, sourceNodeId, wirePolarity, snapRadius } = params;

  const dLen = Math.sqrt(
    rayDirection[0] * rayDirection[0] +
      rayDirection[1] * rayDirection[1] +
      rayDirection[2] * rayDirection[2]
  );
  if (dLen <= 1e-6) return null;
  const dxUnit = rayDirection[0] / dLen;
  const dyUnit = rayDirection[1] / dLen;
  const dzUnit = rayDirection[2] / dLen;

  let bestMatching: { port: TerminalPort3D; perpDist: number; score: number } | null = null;
  let bestOpposite: { port: TerminalPort3D; perpDist: number; score: number } | null = null;

  for (const port of allPorts) {
    if (port.nodeId === sourceNodeId) continue;

    const vx = port.worldPosition[0] - rayOrigin[0];
    const vy = port.worldPosition[1] - rayOrigin[1];
    const vz = port.worldPosition[2] - rayOrigin[2];

    const t = vx * dxUnit + vy * dyUnit + vz * dzUnit;
    if (t <= 0.1) continue; // Behind camera

    const cx = rayOrigin[0] + t * dxUnit;
    const cy = rayOrigin[1] + t * dyUnit;
    const cz = rayOrigin[2] + t * dzUnit;

    const px = port.worldPosition[0] - cx;
    const py = port.worldPosition[1] - cy;
    const pz = port.worldPosition[2] - cz;
    const perpDist = Math.sqrt(px * px + py * py + pz * pz);

    const effectiveRadius = snapRadius ?? Math.min(0.95, Math.max(0.42, t * 0.048));
    if (perpDist <= effectiveRadius) {
      const score = perpDist + t * 0.008;
      if (port.polarity === wirePolarity) {
        if (!bestMatching || score < bestMatching.score) {
          bestMatching = { port, perpDist, score };
        }
      } else {
        if (!bestOpposite || score < bestOpposite.score) {
          bestOpposite = { port, perpDist, score };
        }
      }
    }
  }

  // Flag reverse polarity if aiming directly onto an opposite-polarity lug
  if (
    bestOpposite &&
    bestOpposite.perpDist < 0.22 &&
    (!bestMatching || bestOpposite.perpDist + 0.12 < bestMatching.perpDist)
  ) {
    return {
      port: bestOpposite.port,
      distance: Number(bestOpposite.perpDist.toFixed(3)),
      polarityMismatch: true,
    };
  }

  if (bestMatching) {
    return {
      port: bestMatching.port,
      distance: Number(bestMatching.perpDist.toFixed(3)),
      polarityMismatch: false,
    };
  }

  if (bestOpposite && bestOpposite.perpDist < 0.34) {
    return {
      port: bestOpposite.port,
      distance: Number(bestOpposite.perpDist.toFixed(3)),
      polarityMismatch: true,
    };
  }

  return null;
}

/**
 * Rebuilds orthogonal EMT conduit waypoints when a user drags one of the baseline nodes.
 */
export function buildMovedConduitWaypoints(
  fromPos: [number, number, number],
  toPos: [number, number, number]
): [number, number, number][] {
  const [x1, y1, z1] = fromPos;
  const [x2, y2, z2] = toPos;

  if (Math.abs(z1 - z2) < 0.05) {
    const midY = Number(((y1 + y2) / 2).toFixed(3));
    if (Math.abs(x1 - x2) < 0.05 || Math.abs(y1 - y2) < 0.05) {
      return [fromPos, [x2, y1, z1], toPos];
    }
    return [fromPos, [x1, midY, z1], [x2, midY, z1], toPos];
  }

  const floorY = 0.25;
  return [
    fromPos,
    [x1, floorY, z1],
    [x1, floorY, z2],
    [x2, floorY, z2],
    toPos,
  ];
}

export interface WallObstacle2D {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function getHalfSizeForNodeType(nodeType: NodeType): [number, number] {
  switch (nodeType) {
    case 'inverter':
      return [0.76, 0.90];
    case 'panel':
      return [0.60, 0.85];
    case 'ats':
      return [0.52, 0.64];
    case 'isolator':
      return [0.44, 0.54];
    case 'breaker':
      return [0.38, 0.50];
    case 'spd':
      return [0.38, 0.48];
    case 'battery':
      return [0.62, 0.78];
    case 'grounding':
      return [0.38, 0.14];
    case 'grid':
      return [0.40, 0.85];
    default:
      return [0.40, 0.50];
  }
}

export function getWallObstacles(
  nodePositions: Record<string, [number, number, number]>,
  placedComponents: PlacedComponent3D[],
  isHybrid = true,
  removedBaseNodes: DiagramNodeKey[] = []
): WallObstacle2D[] {
  const obstacles: WallObstacle2D[] = [];
  const baseKeys = Object.keys(DEFAULT_BASE_NODE_POSITIONS) as DiagramNodeKey[];
  const removedSet = new Set(removedBaseNodes);

  for (const key of baseKeys) {
    if (removedSet.has(key)) continue;
    if (!isHybrid && (key === 'battery' || key === 'battery_breaker')) continue;
    if (key === 'eps_breaker') continue;
    const pos = nodePositions[key] || DEFAULT_BASE_NODE_POSITIONS[key];
    if (!pos || pos[2] >= 0.65) continue;
    const [hw, hh] = getHalfSizeForNodeType(getNodeTypeFromKey(key));
    obstacles.push({
      id: key,
      minX: Number((pos[0] - hw).toFixed(3)),
      maxX: Number((pos[0] + hw).toFixed(3)),
      minY: Number((pos[1] - hh).toFixed(3)),
      maxY: Number((pos[1] + hh).toFixed(3)),
    });
  }

  for (const placed of placedComponents) {
    if (placed.position[2] >= 0.65) continue;
    const spec = ADDABLE_CATALOG_MAP.get(placed.catalogKey);
    const [hw, hh] = getHalfSizeForNodeType(spec?.nodeType || 'breaker');
    obstacles.push({
      id: placed.id,
      minX: Number((placed.position[0] - hw).toFixed(3)),
      maxX: Number((placed.position[0] + hw).toFixed(3)),
      minY: Number((placed.position[1] - hh).toFixed(3)),
      maxY: Number((placed.position[1] + hh).toFixed(3)),
    });
  }

  return obstacles;
}

function segmentHitsObstacle(
  xa: number,
  ya: number,
  xb: number,
  yb: number,
  obs: WallObstacle2D
): boolean {
  const minSegX = Math.min(xa, xb);
  const maxSegX = Math.max(xa, xb);
  const minSegY = Math.min(ya, yb);
  const maxSegY = Math.max(ya, yb);
  const eps = 0.03;

  // Horizontal segment
  if (Math.abs(ya - yb) < 0.01) {
    if (ya <= obs.minY + eps || ya >= obs.maxY - eps) return false;
    return maxSegX > obs.minX + eps && minSegX < obs.maxX - eps;
  }

  // Vertical segment
  if (Math.abs(xa - xb) < 0.01) {
    if (xa <= obs.minX + eps || xa >= obs.maxX - eps) return false;
    return maxSegY > obs.minY + eps && minSegY < obs.maxY - eps;
  }

  return false;
}

function countRouteHits(pts: [number, number][], obstacles: WallObstacle2D[]): number {
  let hits = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [xa, ya] = pts[i];
    const [xb, yb] = pts[i + 1];
    if (Math.hypot(xb - xa, yb - ya) < 0.01) continue;
    for (const obs of obstacles) {
      if (segmentHitsObstacle(xa, ya, xb, yb, obs)) {
        hits++;
      }
    }
  }
  return hits;
}

function compute2DRouteLength(pts: [number, number][]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
  }
  return len;
}

export interface WireRouteOptions {
  fromDir?: 1 | -1;
  toDir?: 1 | -1;
  obstacles?: WallObstacle2D[];
  routeOffset?: [number, number];
}

/**
 * Generates clean 3D Manhattan orthogonal cable segments between two 3D terminal lugs,
 * respecting component bounding-box obstacles, terminal exit directions (top vs bottom),
 * and user-dragged route offsets ([offsetX, offsetY]) so wires never cross over components.
 */
export function buildOrthogonalWireWaypoints(
  fromPos: [number, number, number],
  toPos: [number, number, number],
  polarity: WirePolarity,
  options?: WireRouteOptions
): [number, number, number][] {
  const laneOffsetZ =
    polarity === 'positive' ? 0.048 : polarity === 'negative' ? 0.022 : 0.008;
  const laneOffsetY =
    polarity === 'positive' ? 0.035 : polarity === 'negative' ? -0.035 : -0.085;
  const laneOffsetX =
    polarity === 'positive' ? -0.048 : polarity === 'negative' ? 0.048 : 0.0;

  const [x1, y1, z1] = fromPos;
  const [x2, y2, z2] = toPos;
  const [userOffsetX, userOffsetY] = options?.routeOffset || [0, 0];

  // Both endpoints near wall plane
  const bothOnWall = z1 < 0.65 && z2 < 0.65;

  if (bothOnWall) {
    const routeZ = Number((Math.max(z1, z2) + laneOffsetZ).toFixed(3));
    const dx = Math.abs(x2 - x1);

    const stubClearance =
      polarity === 'positive' ? 0.16 : polarity === 'negative' ? 0.23 : 0.29;
    const fromDir: 1 | -1 = options?.fromDir ?? (y1 >= y2 ? -1 : 1);
    const toDir: 1 | -1 = options?.toDir ?? (y2 > y1 ? -1 : 1);

    const stubY1 = Number((y1 + fromDir * stubClearance).toFixed(3));
    const stubY2 = Number((y2 + toDir * stubClearance).toFixed(3));
    const obstacles = options?.obstacles || [];

    // Direct vertical connection when aligned in X and stubs face each other without obstacles
    if (dx < 0.04 && countRouteHits([[x1, y1], [x2, y2]], obstacles) === 0) {
      return [
        fromPos,
        [x1, y1, routeZ],
        [x2, y2, routeZ],
        toPos,
      ];
    }

    // Build candidate 2D orthogonal inner paths from (x1, stubY1) to (x2, stubY2)
    const candidates: { pts: [number, number][]; kind: 'h-channel' | 'v-riser' | 'u-loop' }[] = [];

    // 1. Horizontal channel candidates: [x1, stubY1] -> [x1, chanY] -> [x2, chanY] -> [x2, stubY2]
    const rawChanYs: number[] = [
      (stubY1 + stubY2) / 2 + laneOffsetY,
      Math.min(stubY1, stubY2) + (polarity === 'positive' ? 0.0 : polarity === 'negative' ? -0.06 : -0.12),
      Math.max(stubY1, stubY2) + (polarity === 'positive' ? 0.10 : polarity === 'negative' ? 0.04 : -0.02),
      0.36 + laneOffsetY,
    ];
    for (const obs of obstacles) {
      rawChanYs.push(obs.minY - stubClearance);
      rawChanYs.push(obs.maxY + stubClearance);
    }

    for (const rawY of rawChanYs) {
      const chanY = Number(Math.max(0.22, Math.min(6.5, rawY)).toFixed(3));
      // Ensure leaving (x1, y1) -> (x1, chanY) doesn't reverse through source or target enclosure
      const validStart = (chanY - y1) * fromDir >= 0.08;
      const validEnd = (chanY - y2) * toDir >= 0.08;
      if (validStart && validEnd) {
        candidates.push({
          kind: 'h-channel',
          pts: [
            [x1, y1],
            [x1, chanY],
            [x2, chanY],
            [x2, y2],
          ],
        });
      }
    }

    // 2. Vertical riser candidates: [x1, y1] -> [x1, stubY1] -> [midX, stubY1] -> [midX, stubY2] -> [x2, stubY2] -> [x2, y2]
    const rawMidXs: number[] = [
      (x1 + x2) / 2 + laneOffsetX,
      x1 - 0.56 + laneOffsetX,
      x1 + 0.56 + laneOffsetX,
      x2 - 0.56 + laneOffsetX,
      x2 + 0.56 + laneOffsetX,
    ];
    for (const obs of obstacles) {
      rawMidXs.push(obs.minX - 0.18 + laneOffsetX);
      rawMidXs.push(obs.maxX + 0.18 + laneOffsetX);
    }

    for (const rawX of rawMidXs) {
      const midX = Number(rawX.toFixed(3));
      candidates.push({
        kind: 'v-riser',
        pts: [
          [x1, y1],
          [x1, stubY1],
          [midX, stubY1],
          [midX, stubY2],
          [x2, stubY2],
          [x2, y2],
        ],
      });
    }

    // Pick candidate with minimum obstacle hits and minimum Manhattan length
    let best = candidates[0] || {
      kind: 'v-riser' as const,
      pts: [
        [x1, y1],
        [x1, stubY1],
        [Number((((x1 + x2) / 2) + laneOffsetX).toFixed(3)), stubY1],
        [Number((((x1 + x2) / 2) + laneOffsetX).toFixed(3)), stubY2],
        [x2, stubY2],
        [x2, y2],
      ],
    };
    let bestScore = Infinity;

    for (const cand of candidates) {
      const hits = countRouteHits(cand.pts, obstacles);
      const len = compute2DRouteLength(cand.pts);
      const bendPenalty = cand.pts.length * 0.12;
      const score = hits * 1000 + len + bendPenalty;
      if (score < bestScore) {
        bestScore = score;
        best = cand;
      }
    }

    // Apply user-dragged routeOffset ([userOffsetX, userOffsetY]) to movable middle segments
    const final2D = best.pts.map((pt) => [pt[0], pt[1]] as [number, number]);
    if (Math.abs(userOffsetX) > 0.001 || Math.abs(userOffsetY) > 0.001) {
      if (best.kind === 'h-channel' && final2D.length === 4) {
        const shiftedY = Number(Math.max(0.18, Math.min(6.5, final2D[1][1] + userOffsetY)).toFixed(3));
        final2D[1][1] = shiftedY;
        final2D[2][1] = shiftedY;
      } else if (final2D.length >= 6) {
        const shiftedX = Number((final2D[2][0] + userOffsetX).toFixed(3));
        const shiftedY1 = Number(Math.max(0.18, Math.min(6.5, final2D[1][1] + userOffsetY)).toFixed(3));
        const shiftedY2 = Number(Math.max(0.18, Math.min(6.5, final2D[4][1] + userOffsetY)).toFixed(3));
        final2D[1][1] = shiftedY1;
        final2D[2][0] = shiftedX;
        final2D[2][1] = shiftedY1;
        final2D[3][0] = shiftedX;
        final2D[3][1] = shiftedY2;
        final2D[4][1] = shiftedY2;
      }
    }

    return [
      fromPos,
      ...final2D.map(([px, py]) => [px, py, routeZ] as [number, number, number]),
      toPos,
    ];
  }

  // Wall-to-floor or floor-to-floor trench/tray routing
  const baseFloorTrayY =
    polarity === 'positive' ? 0.12 : polarity === 'negative' ? 0.08 : 0.04;
  const floorTrayY = Number(Math.max(0.04, baseFloorTrayY + userOffsetY * 0.25).toFixed(3));
  const wallDropZ = Number((0.18 + laneOffsetZ).toFixed(3));

  if (z1 < 0.65 && z2 >= 0.65) {
    const riserX = Number((x1 + userOffsetX).toFixed(3));
    return [
      fromPos,
      [x1, y1, wallDropZ],
      [riserX, y1, wallDropZ],
      [riserX, floorTrayY, wallDropZ],
      [riserX, floorTrayY, z2],
      [x2, floorTrayY, z2],
      toPos,
    ];
  }

  if (z1 >= 0.65 && z2 < 0.65) {
    if (y2 > 2.0) {
      const baseRiserX =
        x1 < x2
          ? x2 - (polarity === 'positive' ? 0.56 : polarity === 'negative' ? 0.48 : 0.64)
          : x2 + (polarity === 'positive' ? 0.48 : polarity === 'negative' ? 0.56 : 0.64);
      const riserX = Number((baseRiserX + userOffsetX).toFixed(3));
      const arriveY = Number(
        (y2 + (polarity === 'positive' ? 0.18 : polarity === 'negative' ? 0.11 : 0.25) + userOffsetY).toFixed(3)
      );
      return [
        fromPos,
        [x1, floorTrayY, z1],
        [riserX, floorTrayY, z1],
        [riserX, floorTrayY, wallDropZ],
        [riserX, arriveY, wallDropZ],
        [x2, arriveY, wallDropZ],
        [x2, y2, wallDropZ],
        toPos,
      ];
    }
    const riserX = Number((x2 + userOffsetX).toFixed(3));
    return [
      fromPos,
      [x1, floorTrayY, z1],
      [riserX, floorTrayY, z1],
      [riserX, floorTrayY, wallDropZ],
      [x2, y2, wallDropZ],
      toPos,
    ];
  }

  // Floor-to-floor routing
  return [
    fromPos,
    [x1, floorTrayY, z1],
    [x2, floorTrayY, z1],
    [x2, floorTrayY, z2],
    toPos,
  ];
}

export function calculateWaypointsLengthMeters(waypoints: [number, number, number][]): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  // Include 10% termination slack, minimum 0.5m
  return Math.max(0.5, Number((total * 1.1).toFixed(2)));
}

/**
 * Finds the complimentary (+/-) port on the same node so Twin (+/-) Pair mode
 * can wire both positive and negative terminals in one drag!
 */
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

  return layout3d.wires.map((wire) => {
    const fromNodePos = resolveNodeWorldPosition(wire.fromNodeId, layout3d);
    const toNodePos = resolveNodeWorldPosition(wire.toNodeId, layout3d);
    if (!fromNodePos || !toNodePos) return wire;

    const fromMeta = resolveNodeTypeAndLabel(wire.fromNodeId, layout3d.placedComponents);
    const toMeta = resolveNodeTypeAndLabel(wire.toNodeId, layout3d.placedComponents);
    const fromPortObj = getNodeTerminalPorts(
      wire.fromNodeId,
      fromMeta.label,
      fromMeta.nodeType,
      fromNodePos
    ).find((p) => p.portId === wire.fromPortId);
    const toPortObj = getNodeTerminalPorts(
      wire.toNodeId,
      toMeta.label,
      toMeta.nodeType,
      toNodePos
    ).find((p) => p.portId === wire.toPortId);

    const fromPort = fromPortObj?.worldPosition || fromNodePos;
    const toPort = toPortObj?.worldPosition || toNodePos;

    const waypoints = buildOrthogonalWireWaypoints(fromPort, toPort, wire.polarity, {
      fromDir: fromPortObj ? (fromPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
      toDir: toPortObj ? (toPortObj.localOffset[1] >= 0 ? 1 : -1) : undefined,
      obstacles,
      routeOffset: wire.routeOffset,
    });
    return {
      ...wire,
      lengthMeters: calculateWaypointsLengthMeters(waypoints),
    };
  });
}

export function findCompanionPairPort(
  selectedPort: TerminalPort3D,
  nodePorts: TerminalPort3D[]
): TerminalPort3D | null {
  const targetPolarity: WirePolarity = selectedPort.polarity === 'positive' ? 'negative' : 'positive';
  const prefix = selectedPort.portId.replace(/_(pos|neg)$/, '');

  return (
    nodePorts.find((p) => p.polarity === targetPolarity && p.portId.startsWith(prefix)) ||
    nodePorts.find((p) => p.polarity === targetPolarity) ||
    null
  );
}
