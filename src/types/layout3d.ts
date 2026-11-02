// src/types/layout3d.ts
import { DiagramNodeKey } from './diagram';
import { NodeType } from '@/components/diagram/NodeGeometry';

export type WirePolarity = 'positive' | 'negative';
export type MountSurface = 'wall' | 'floor';
export type MountCapability = 'wall' | 'floor' | 'both';
export type CanvasInteractionTool = 'select' | 'wire_pos' | 'wire_neg' | 'wire_pair';

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
  /** Accessory key or equipment marker used by calculateSystem BOM */
  bomAccessoryKey?: string;
  fallbackUnitPricePhp: number;
  /** Width, height, depth in meters for spacing & floor clearance */
  dimensions: [number, number, number];
  /** Vertical center Y when resting on concrete floor slab (Y = 0) */
  floorCenterY: number;
  /** Preferred Unistrut Y tier when spawning on wall */
  preferredWallY: number;
}

/**
 * Commercial / Medium-Size Business Plant Room Limits.
 * Supports ~50-100 kWp C&I solar + ~240 kWh ESS while keeping WebGL draw calls fast.
 * Increase constants here to expand capacity in future enterprise tiers.
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

/**
 * Expanded Commercial Plant Room Geometry Constants (Meters)
 */
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
  fromNodeId: string; // DiagramNodeKey or PlacedComponent3D.id
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
  lengthMeters: number;
}

export interface Layout3DState {
  version: 1;
  baseNodePositions: Partial<Record<DiagramNodeKey, [number, number, number]>>;
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
