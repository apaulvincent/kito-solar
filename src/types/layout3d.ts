import { DiagramNodeKey } from './diagram';

export type NodeType =
  | 'pv'
  | 'breaker'
  | 'isolator'
  | 'spd'
  | 'inverter'
  | 'battery'
  | 'panel'
  | 'grid'
  | 'load'
  | 'ats'
  | 'grounding';

export type WirePolarity = 'positive' | 'negative' | 'ground';
export type MountSurface = 'wall' | 'floor';
export type MountCapability = 'wall' | 'floor' | 'both';
export type CanvasInteractionTool =
  | 'select'
  | 'wire_pos'
  | 'wire_neg'
  | 'wire_pair'
  | 'wire_gnd'
  | 'wire_cut';

export type ComponentLimitGroup =
  | 'inverters'
  | 'batteries'
  | 'breakers'
  | 'switches'
  | 'spds'
  | 'panels_ground'
  | 'pv_arrays';

export type AddableComponentKey =
  | 'pv_dc_breaker'
  | 'ac_grid_breaker'
  | 'battery_breaker'
  | 'eps_breaker'
  | 'pv_dc_spd'
  | 'ac_spd'
  | 'pv_dc_isolator'
  | 'ac_isolator'
  | 'ats'
  | 'battery_unit'
  | 'inverter_unit'
  | 'sub_panel'
  | 'grounding_busbar'
  | 'pv_array_unit';

export interface AddableComponentSpec {
  key: AddableComponentKey;
  title: string;
  shortLabel: string;
  categoryLabel: 'Breakers & SPD' | 'Switches & ATS' | 'Batteries & Power' | 'Panels & Ground';
  limitGroup: ComponentLimitGroup;
  nodeType: NodeType;
  mountCapability: MountCapability;
  defaultSurface: MountSurface;
  imagePath: string;
  color: string;
  defaultRatingLabel: string;
  bomAccessoryKey?: string;
  fallbackUnitPricePhp: number;
  dimensions: [number, number, number];
  floorCenterY: number;
  preferredWallY: number;
}

/**
 * Commercial / Medium-Size Business Plant Room Limits.
 * Supports ~50-100 kWp C&I solar + ~240 kWh ESS while keeping WebGL draw calls fast.
 */
export const SCENE_LIMITS = {
  maxTotalPlacedComponents: 112,
  maxTotalWires: 200,
  byGroup: {
    inverters: 6,
    batteries: 16,
    breakers: 32,
    switches: 20,
    spds: 16,
    panels_ground: 10,
    pv_arrays: 12,
  } satisfies Record<ComponentLimitGroup, number>,
} as const;

export const PLANT_ROOM_GEOMETRY = {
  centerX: 0.7,
  wall: {
    width: 44.0,
    height: 9.6,
    thickness: 0.25,
    z: -0.28,
  },
  backboard: {
    width: 36.0,
    height: 6.6,
    centerY: 3.6,
    minX: -16.8,
    maxX: 18.2,
    minY: 0.2,
    maxY: 6.7,
    unistrutYTiers: [1.4, 2.9, 4.4, 5.6] as readonly number[],
    unistrutSnapThreshold: 0.16,
  },
  floor: {
    width: 44.0,
    depth: 20.0,
    centerZ: 9.0,
    minX: -19.5,
    maxX: 20.9,
    minZ: 0.9,
    maxZ: 18.2,
    wallTransitionZ: 0.65,
  },
  wirePricePerMeterPhp: 95,
} as const;

export interface PlacedComponent3D {
  id: string;
  catalogKey: AddableComponentKey;
  label: string;
  surface: MountSurface;
  position: [number, number, number];
}

export interface WireConnection3D {
  id: string;
  polarity: WirePolarity;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  lengthMeters: number;
  routeOffset?: [number, number];
}

export interface Layout3DState {
  version: 1;
  baseNodePositions: Partial<Record<DiagramNodeKey, [number, number, number]>>;
  removedBaseNodes?: DiagramNodeKey[];
  placedComponents: PlacedComponent3D[];
  wires: WireConnection3D[];
}

export interface TerminalPort3D {
  portId: string;
  nodeId: string;
  nodeLabel: string;
  label: string;
  polarity: WirePolarity;
  localOffset: [number, number, number];
  worldPosition: [number, number, number];
}

export interface SnapCandidateResult {
  port: TerminalPort3D;
  distance: number;
  polarityMismatch: boolean;
}
