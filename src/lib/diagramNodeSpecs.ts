import { DiagramNodeKey } from '@/types/diagram';
import {
  AddableComponentKey,
  AddableComponentSpec,
  MountCapability,
  NodeType,
  PLANT_ROOM_GEOMETRY,
  WireConnection3D,
} from '@/types/layout3d';
import { SystemCalculationResult } from '@/types/calculator';
import { MODULES_PER_3D_PV_ARRAY } from './solarConstants';

export interface NodeTypeDimensionSpec {
  width: number;
  height: number;
  depth: number;
  isWall: boolean;
  badgeYOffset: number;
  floorCenterY: number;
  floorRingYOffset: number;
  previewCameraDistance: number;
}

// Dimensions match the rendered Three.js meshes in NodeGeometry.tsx so selection halos,
// obstacle bounds, floor placement, and preview framing stay aligned.
export const NODE_TYPE_SPECS: Record<NodeType, NodeTypeDimensionSpec> = {
  inverter: {
    width: 1.56,
    height: 1.76,
    depth: 0.44,
    isWall: true,
    badgeYOffset: 1.15,
    floorCenterY: 0.88,
    floorRingYOffset: -0.75,
    previewCameraDistance: 2.8,
  },
  battery: {
    width: 1.38,
    height: 1.56,
    depth: 0.52,
    isWall: true,
    badgeYOffset: 1.05,
    floorCenterY: 0.78,
    floorRingYOffset: -0.75,
    previewCameraDistance: 2.6,
  },
  isolator: {
    width: 0.85,
    height: 1.05,
    depth: 0.42,
    isWall: true,
    badgeYOffset: 1.0,
    floorCenterY: 0.53,
    floorRingYOffset: -0.75,
    previewCameraDistance: 1.9,
  },
  spd: {
    width: 0.78,
    height: 0.95,
    depth: 0.44,
    isWall: true,
    badgeYOffset: 1.0,
    floorCenterY: 0.48,
    floorRingYOffset: -0.75,
    previewCameraDistance: 1.9,
  },
  breaker: {
    width: 0.78,
    height: 0.98,
    depth: 0.44,
    isWall: true,
    badgeYOffset: 1.0,
    floorCenterY: 0.49,
    floorRingYOffset: -0.75,
    previewCameraDistance: 1.9,
  },
  ats: {
    width: 0.95,
    height: 1.22,
    depth: 0.46,
    isWall: true,
    badgeYOffset: 1.15,
    floorCenterY: 0.61,
    floorRingYOffset: -0.75,
    previewCameraDistance: 2.3,
  },
  panel: {
    width: 1.15,
    height: 1.65,
    depth: 0.44,
    isWall: true,
    badgeYOffset: 1.35,
    floorCenterY: 0.83,
    floorRingYOffset: -0.75,
    previewCameraDistance: 2.8,
  },
  pv: {
    width: 3.9,
    height: 1.1,
    depth: 2.0,
    isWall: false,
    badgeYOffset: 1.0,
    floorCenterY: 0.75,
    floorRingYOffset: -1.05,
    previewCameraDistance: 4.4,
  },
  grid: {
    width: 1.4,
    height: 3.2,
    depth: 0.6,
    isWall: false,
    badgeYOffset: 1.7,
    floorCenterY: 1.6,
    floorRingYOffset: -1.55,
    previewCameraDistance: 4.6,
  },
  load: {
    width: 1.8,
    height: 1.6,
    depth: 1.8,
    isWall: false,
    badgeYOffset: 1.1,
    floorCenterY: 0.8,
    floorRingYOffset: -0.75,
    previewCameraDistance: 3.2,
  },
  grounding: {
    width: 0.68,
    height: 0.16,
    depth: 0.08,
    isWall: true,
    badgeYOffset: 0.28,
    floorCenterY: 0.15,
    floorRingYOffset: -0.75,
    previewCameraDistance: 2.2,
  },
};

export function getNodeDimensions(nodeType: NodeType): NodeTypeDimensionSpec {
  return NODE_TYPE_SPECS[nodeType] || NODE_TYPE_SPECS.breaker;
}

export function getHalfSizeForNodeType(nodeType: NodeType): [number, number] {
  const spec = getNodeDimensions(nodeType);
  return [Number((spec.width / 2).toFixed(2)), Number((spec.height / 2).toFixed(2))];
}

export function getOptimalCameraDistance(nodeType: NodeType): number {
  return getNodeDimensions(nodeType).previewCameraDistance;
}

export function isFloorMountedZ(z: number): boolean {
  return z >= PLANT_ROOM_GEOMETRY.floor.wallTransitionZ;
}

export function isBaselineSystemWire(wire: Pick<WireConnection3D, 'id'>): boolean {
  return wire.id.startsWith('base_wire_');
}

export interface BreakerAppearance {
  toggleColor: string;
  hasTieBar: boolean;
}

const BREAKER_APPEARANCE_BY_KEY: Record<string, BreakerAppearance> = {
  dc_breaker: { toggleColor: '#DC2626', hasTieBar: false },
  pv_dc_breaker: { toggleColor: '#DC2626', hasTieBar: false },
  battery_breaker: { toggleColor: '#059669', hasTieBar: true },
};

const DEFAULT_BREAKER_APPEARANCE: BreakerAppearance = {
  toggleColor: '#0284C7',
  hasTieBar: false,
};

export function getBreakerAppearance(nodeKey?: string): BreakerAppearance {
  return (nodeKey && BREAKER_APPEARANCE_BY_KEY[nodeKey]) || DEFAULT_BREAKER_APPEARANCE;
}

function dimsTuple(nodeType: NodeType): [number, number, number] {
  const s = NODE_TYPE_SPECS[nodeType];
  return [s.width, s.height, s.depth];
}

export const ADDABLE_COMPONENT_CATALOG: AddableComponentSpec[] = [
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
    dimensions: dimsTuple('breaker'),
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
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
    dimensions: dimsTuple('breaker'),
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
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
    dimensions: dimsTuple('breaker'),
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
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
    dimensions: dimsTuple('breaker'),
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
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
    dimensions: dimsTuple('spd'),
    floorCenterY: NODE_TYPE_SPECS.spd.floorCenterY,
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
    dimensions: dimsTuple('spd'),
    floorCenterY: NODE_TYPE_SPECS.spd.floorCenterY,
    preferredWallY: 1.4,
  },
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
    dimensions: dimsTuple('isolator'),
    floorCenterY: NODE_TYPE_SPECS.isolator.floorCenterY,
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
    dimensions: dimsTuple('isolator'),
    floorCenterY: NODE_TYPE_SPECS.isolator.floorCenterY,
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
    dimensions: dimsTuple('ats'),
    floorCenterY: NODE_TYPE_SPECS.ats.floorCenterY,
    preferredWallY: 2.9,
  },
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
    bomAccessoryKey: 'battery_bank',
    fallbackUnitPricePhp: 68000,
    dimensions: dimsTuple('battery'),
    floorCenterY: NODE_TYPE_SPECS.battery.floorCenterY,
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
    bomAccessoryKey: 'inverter',
    fallbackUnitPricePhp: 58000,
    dimensions: dimsTuple('inverter'),
    floorCenterY: NODE_TYPE_SPECS.inverter.floorCenterY,
    preferredWallY: 3.35,
  },
  {
    key: 'pv_array_unit',
    title: `PV Sub-Array (${MODULES_PER_3D_PV_ARRAY}x Modules)`,
    shortLabel: 'PV Sub-Array',
    categoryLabel: 'Batteries & Power',
    limitGroup: 'pv_arrays',
    nodeType: 'pv',
    mountCapability: 'floor',
    defaultSurface: 'floor',
    imagePath: '/assets/accessories/pv-array.svg',
    color: '#0284C7',
    defaultRatingLabel: `${MODULES_PER_3D_PV_ARRAY}x Ground/Roof Table`,
    bomAccessoryKey: 'solar_module',
    fallbackUnitPricePhp: 19500,
    dimensions: dimsTuple('pv'),
    floorCenterY: NODE_TYPE_SPECS.pv.floorCenterY,
    preferredWallY: 0.75,
  },
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
    bomAccessoryKey: 'sub_panel',
    fallbackUnitPricePhp: 1450,
    dimensions: dimsTuple('panel'),
    floorCenterY: NODE_TYPE_SPECS.panel.floorCenterY,
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
    dimensions: dimsTuple('grounding'),
    floorCenterY: NODE_TYPE_SPECS.grounding.floorCenterY,
    preferredWallY: 0.75,
  },
];

export const ADDABLE_CATALOG_MAP = new Map<AddableComponentKey, AddableComponentSpec>(
  ADDABLE_COMPONENT_CATALOG.map((item) => [item.key, item])
);

export interface InspectorContent {
  title: string;
  category: string;
  purpose: string;
  calculatedInput: string;
  recommendedRating: string;
  explanation: string;
  wireConduit: string;
  codeReference: string;
}

export interface BaseNodeSpec {
  key: DiagramNodeKey;
  sceneLabel: string;
  wireLabel: string;
  nodeType: NodeType;
  color: string;
  imagePath: string;
  capability: MountCapability;
  height: number;
  floorCenterY: number;
  hybridOnly?: boolean;
  includeInMainScene: boolean;
  workbenchTab: 'pv_sizing' | 'electrical';
  costItemKey?: string;
  getBadgeRating: (calc: SystemCalculationResult, gridVoltageV: number) => string;
  getInspectorContent: (
    calc: SystemCalculationResult,
    gridVoltageV: number,
    mainBreakerA: number | null
  ) => InspectorContent;
}

export const BASE_NODE_SPECS: Record<DiagramNodeKey, BaseNodeSpec> = {
  pv_array: {
    key: 'pv_array',
    sceneLabel: 'PV ARRAY',
    wireLabel: 'PV ARRAY',
    nodeType: 'pv',
    color: '#0284C7',
    imagePath: '/assets/accessories/pv-array.svg',
    capability: 'floor',
    height: NODE_TYPE_SPECS.pv.height,
    floorCenterY: NODE_TYPE_SPECS.pv.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'pv_sizing',
    costItemKey: 'solar_module',
    getBadgeRating: (calc) =>
      `${calc.summary.totalPanels} Panels • ${calc.summary.totalArrayPowerKw} kWp`,
    getInspectorContent: (calc) => ({
      title: 'Solar Photovoltaic Array',
      category: 'DC Generation',
      purpose:
        'Converts incident sunlight into direct current (DC) electrical energy through silicon photovoltaic semiconductor cells.',
      calculatedInput: `${calc.summary.totalPanels} modules @ ${calc.summary.modulePowerW} Wp each`,
      recommendedRating: `${calc.summary.totalArrayPowerKw} kW DC Array Peak`,
      explanation: calc.stringSizing.explanation,
      wireConduit: `Homerun cable: ${calc.dc.wireSpec} inside ${calc.dc.conduitSpec}`,
      codeReference:
        'NEC 690.7 & 690.8 / PEC Article 6.90 (PV source & output circuit maximum voltage and current sizing)',
    }),
  },
  dc_isolator: {
    key: 'dc_isolator',
    sceneLabel: 'DC ISOLATOR',
    wireLabel: 'DC ISOLATOR',
    nodeType: 'isolator',
    color: '#D97706',
    imagePath: '/assets/accessories/dc-isolator.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.isolator.height,
    floorCenterY: NODE_TYPE_SPECS.isolator.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'pv_dc_isolator',
    getBadgeRating: (calc) => `${calc.dc.isolatorRatingA}A • 1000V DC rated`,
    getInspectorContent: (calc) => ({
      title: 'PV Array DC Disconnect Switch',
      category: 'Manual Safety Isolation',
      purpose:
        'Provides a visible, lockable load-break disconnect switch on the DC homerun line to safely isolate high-voltage PV array power before overcurrent protection, inverter entry, and servicing.',
      calculatedInput: `Sized for continuous array current = ${calc.dc.rawCurrentA} A (Isc) × 125% = ${calc.dc.computedCurrentA} A`,
      recommendedRating: `${calc.dc.isolatorRatingA} A 4-Pole Rotary Isolator (1000V DC rated)`,
      explanation: calc.dc.explanation.isolator,
      wireConduit: `Homerun enclosure: IP66 UV-resistant exterior casing • ${calc.dc.wireSpec}`,
      codeReference:
        'NEC 690.13 & 690.15 / PEC Article 6.90 / IEC 62548 (Manual load-break disconnect installed ahead of equipment)',
    }),
  },
  dc_breaker: {
    key: 'dc_breaker',
    sceneLabel: 'DC BREAKER',
    wireLabel: 'DC BREAKER',
    nodeType: 'breaker',
    color: '#DC2626',
    imagePath: '/assets/accessories/pv-dc-breaker.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.breaker.height,
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'pv_dc_breaker',
    getBadgeRating: (calc) => `${calc.dc.breakerRatingA}A • 1.25x Continuous`,
    getInspectorContent: (calc) => ({
      title: 'PV String DC Circuit Breaker',
      category: 'DC Overcurrent Protection',
      purpose:
        'Protects DC homerun cabling and inverter MPPT inputs against short circuits, line faults, and reverse current faults.',
      calculatedInput: `Continuous current = ${calc.dc.rawCurrentA} A (Isc) × 125% = ${calc.dc.computedCurrentA} A`,
      recommendedRating: `${calc.dc.breakerRatingA} A DC MCB (1000V DC rated, 10kA Icu)`,
      explanation: calc.dc.explanation.breaker,
      wireConduit: `Connected wire: ${calc.dc.wireSpec}`,
      codeReference:
        'NEC 690.8 & 690.9 / PEC 6.90.2.1 (125% continuous duty overcurrent protection rule)',
    }),
  },
  dc_spd: {
    key: 'dc_spd',
    sceneLabel: 'DC SPD',
    wireLabel: 'DC SPD',
    nodeType: 'spd',
    color: '#059669',
    imagePath: '/assets/accessories/dc-spd.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.spd.height,
    floorCenterY: NODE_TYPE_SPECS.spd.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'pv_dc_spd',
    getBadgeRating: (calc) => calc.dc.spdRating,
    getInspectorContent: (calc) => ({
      title: 'DC Surge Protective Device (SPD)',
      category: 'Transient Surge Protection',
      purpose:
        'Diverts indirect lightning-induced transients and atmospheric high-voltage surges on the DC string bus safely to earth ground.',
      calculatedInput: `Inverter Max Open-Circuit Voltage = ${calc.stringSizing.maxPvVoltageV} V DC`,
      recommendedRating: calc.dc.spdRating,
      explanation: calc.dc.explanation.spd,
      wireConduit: `Earth grounding: ${calc.dc.groundConductorSpec} solid copper to ground busbar`,
      codeReference:
        'NEC 690.35 & 242.11 / IEC 61643-31 / UL 1449 4th Ed (Type 2 DC surge protective device)',
    }),
  },
  dc_conduit: {
    key: 'dc_conduit',
    sceneLabel: 'DC CONDUIT',
    wireLabel: 'DC CONDUIT',
    nodeType: 'isolator',
    color: '#64748B',
    imagePath: '/assets/accessories/conduit.svg',
    capability: 'wall',
    height: 0.5,
    floorCenterY: 0.3,
    includeInMainScene: false,
    workbenchTab: 'electrical',
    costItemKey: 'dc_conduit',
    getBadgeRating: (calc) => calc.dc.conduitSpec,
    getInspectorContent: (calc) => ({
      title: 'DC Homerun EMT Conduit System',
      category: 'Raceway & Conductor Protection',
      purpose:
        'Encloses DC positive and negative homerun conductors from the roof penetrations down to the indoor wall equipment.',
      calculatedInput: `${calc.dc.conduitSpec} (Continuous Trade Size)`,
      recommendedRating: `${calc.dc.conduitSpec} Electrical Metallic Tubing (EMT)`,
      explanation: calc.dc.explanation.conduit,
      wireConduit: `${calc.dc.wireSpec} inside ${calc.dc.conduitSpec}`,
      codeReference: 'NEC Chapter 9 Table 1 & Article 358 (< 40% EMT Conduit Fill Limit)',
    }),
  },
  inverter: {
    key: 'inverter',
    sceneLabel: 'SOLAR INVERTER',
    wireLabel: 'SOLAR INVERTER',
    nodeType: 'inverter',
    color: '#D97706',
    imagePath: '/assets/accessories/solar-inverter.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.inverter.height,
    floorCenterY: NODE_TYPE_SPECS.inverter.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'inverter',
    getBadgeRating: (calc) =>
      `${calc.summary.inverterPowerKw} kW ${calc.systemType.toUpperCase()}`,
    getInspectorContent: (calc, gridVoltageV) => ({
      title: 'Solar Hybrid / Grid Inverter',
      category: 'Power Conditioning Unit',
      purpose:
        'Converts DC solar and battery energy into synchronized 230V AC grid electricity with MPPT tracking and energy storage management.',
      calculatedInput: `Max PV input: ${calc.pvSizing.totalPvPowerW} W | AC capacity: ${calc.summary.inverterPowerKw} kW`,
      recommendedRating: `${calc.summary.inverterModel} (${calc.systemType.toUpperCase()})`,
      explanation: `MPPT trackers: ${calc.stringSizing.trackerCount} | Grid connection: ${gridVoltageV}V L+N+PE`,
      wireConduit: `AC Output: ${calc.ac.wireSpec} | DC Input: ${calc.dc.wireSpec}`,
      codeReference:
        'NEC 690.4 & 705.12 / UL 1741 SB / IEEE 1547 (Grid-support utility interactive equipment)',
    }),
  },
  battery_breaker: {
    key: 'battery_breaker',
    sceneLabel: 'BATTERY MCCB',
    wireLabel: 'BATTERY MCCB',
    nodeType: 'breaker',
    color: '#059669',
    imagePath: '/assets/accessories/battery-breaker.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.breaker.height,
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
    hybridOnly: true,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'battery_breaker',
    getBadgeRating: (calc) => `${calc.battery.recommendedBreakerA}A DC MCCB`,
    getInspectorContent: (calc) => ({
      title: 'Battery Bank DC MCCB',
      category: 'High-Current DC Protection',
      purpose:
        'Safeguards low-voltage high-capacity battery storage bank against dead-short faults, thermal runaway, and busbar overloads.',
      calculatedInput: `Continuous discharge current = ${calc.battery.dischargeCurrentA} A`,
      recommendedRating: `${calc.battery.recommendedBreakerA} A DC MCCB (Molded Case Circuit Breaker)`,
      explanation: calc.battery.explanation.breaker,
      wireConduit: `Battery Cable: ${calc.battery.wireSpec}`,
      codeReference:
        'NEC 706.21 & 706.30 / PEC Article 7.06 / UL 489B (DC Molded Case Circuit Breaker for ESS)',
    }),
  },
  battery: {
    key: 'battery',
    sceneLabel: 'BATTERY STORAGE',
    wireLabel: 'BATTERY STORAGE',
    nodeType: 'battery',
    color: '#059669',
    imagePath: '/assets/accessories/battery-unit.svg',
    capability: 'both',
    height: NODE_TYPE_SPECS.battery.height,
    floorCenterY: NODE_TYPE_SPECS.battery.floorCenterY,
    hybridOnly: true,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'battery_bank',
    getBadgeRating: (calc) =>
      `${(calc.battery.totalEnergyWh / 1000).toFixed(1)} kWh Storage`,
    getInspectorContent: (calc) => ({
      title: 'Battery Energy Storage System (BESS)',
      category: 'Chemical Energy Storage',
      purpose:
        'Stores excess daytime solar generation for evening self-consumption and provides instantaneous EPS backup power during utility outages.',
      calculatedInput: `${calc.battery.batteryType}`,
      recommendedRating: `${(calc.battery.totalEnergyWh / 1000).toFixed(1)} kWh Bank @ ${calc.battery.bankVoltageV} V Nominal`,
      explanation: calc.battery.explanation.sizing,
      wireConduit: `Battery Cables: ${calc.battery.wireSpec}`,
      codeReference: 'NEC Article 706 / NFPA 855 / UL 9540 (Energy storage system installation & safety)',
    }),
  },
  battery_wire: {
    key: 'battery_wire',
    sceneLabel: 'BATTERY CABLE',
    wireLabel: 'BATTERY CABLE',
    nodeType: 'battery',
    color: '#059669',
    imagePath: '/assets/accessories/battery-cable.svg',
    capability: 'floor',
    height: 0.4,
    floorCenterY: 0.4,
    hybridOnly: true,
    includeInMainScene: false,
    workbenchTab: 'electrical',
    costItemKey: 'battery_wire',
    getBadgeRating: (calc) => calc.battery.wireSpec,
    getInspectorContent: (calc) => ({
      title: 'Battery Bank High-Current Interconnect Cables',
      category: 'DC Battery Conductor',
      purpose:
        'Carries low-voltage high-current DC power between the battery storage bank terminals and the inverter battery port.',
      calculatedInput: `Continuous discharge current = ${calc.battery.dischargeCurrentA} A`,
      recommendedRating: `${calc.battery.wireSpec} Flexible Copper Welding/Battery Cable`,
      explanation: calc.battery.explanation.wire,
      wireConduit: 'High-strand class K flexible copper with heavy-duty heat-shrink sealed ring terminals',
      codeReference: 'NEC 706.31 & Table 310.16 (Ampacity of conductors in free air and raceways)',
    }),
  },
  ac_breaker: {
    key: 'ac_breaker',
    sceneLabel: 'AC BREAKER',
    wireLabel: 'AC BREAKER',
    nodeType: 'breaker',
    color: '#0284C7',
    imagePath: '/assets/accessories/ac-breaker.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.breaker.height,
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'ac_grid_breaker',
    getBadgeRating: (calc) => `${calc.ac.breakerRatingA}A AC Breaker`,
    getInspectorContent: (calc) => ({
      title: 'Inverter AC Grid Breaker',
      category: 'AC Overcurrent Protection',
      purpose:
        'Protects AC interconnect feeder cable and main distribution busbar against overcurrent and inverter fault conditions.',
      calculatedInput: `Continuous current = ${calc.ac.rawCurrentA} A (Max AC) × 125% = ${calc.ac.computedCurrentA} A`,
      recommendedRating: `${calc.ac.breakerRatingA} A 2-Pole AC MCB (10kA interrupt)`,
      explanation: calc.ac.explanation.breaker,
      wireConduit: `Feeder cable: ${calc.ac.wireSpec}`,
      codeReference: 'NEC 705.12 / PEC Article 7.05 (125% Inverter continuous output overcurrent protection)',
    }),
  },
  ac_spd: {
    key: 'ac_spd',
    sceneLabel: 'AC SPD',
    wireLabel: 'AC SPD',
    nodeType: 'spd',
    color: '#059669',
    imagePath: '/assets/accessories/ac-spd.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.spd.height,
    floorCenterY: NODE_TYPE_SPECS.spd.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'ac_spd',
    getBadgeRating: (calc) => calc.ac.spdRating,
    getInspectorContent: (calc, gridVoltageV) => ({
      title: 'AC Surge Protective Device (SPD)',
      category: 'AC Transient Protection',
      purpose:
        'Clamps utility switching surges and lightning transients on the AC distribution line before they reach inverter circuits.',
      calculatedInput: `Grid Utility Voltage = ${gridVoltageV} V AC nominal`,
      recommendedRating: calc.ac.spdRating,
      explanation: calc.ac.explanation.spd,
      wireConduit: `Earth grounding: ${calc.dc.groundConductorSpec} solid copper to ground busbar`,
      codeReference:
        'NEC 242 / UL 1449 / IEC 61643-11 (Type 2 AC surge protective device for main service entrance)',
    }),
  },
  ac_isolator: {
    key: 'ac_isolator',
    sceneLabel: 'AC ISOLATOR',
    wireLabel: 'AC ISOLATOR',
    nodeType: 'isolator',
    color: '#D97706',
    imagePath: '/assets/accessories/ac-isolator.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.isolator.height,
    floorCenterY: NODE_TYPE_SPECS.isolator.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'ac_isolator',
    getBadgeRating: (calc) => `${calc.ac.isolatorRatingA}A AC-23A rated`,
    getInspectorContent: (calc) => ({
      title: 'AC Disconnect Switch',
      category: 'Manual AC Isolation',
      purpose:
        'Allows utility technicians and electricians to mechanically isolate solar generation from the building distribution grid.',
      calculatedInput: `Sized to exceed ${calc.ac.breakerRatingA} A breaker rating`,
      recommendedRating: `${calc.ac.isolatorRatingA} A Lockable Rotary Disconnect`,
      explanation: calc.ac.explanation.isolator,
      wireConduit: `Enclosure: IP65 Rated exterior rated • ${calc.ac.wireSpec}`,
      codeReference: 'NEC 705.20 / PEC Article 7.05 (Readily accessible lockable AC disconnect)',
    }),
  },
  main_panel: {
    key: 'main_panel',
    sceneLabel: 'MAIN SERVICE PANEL',
    wireLabel: 'MAIN PANEL',
    nodeType: 'panel',
    color: '#475569',
    imagePath: '/assets/accessories/sub-panel.svg',
    capability: 'both',
    height: NODE_TYPE_SPECS.panel.height,
    floorCenterY: NODE_TYPE_SPECS.panel.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    getBadgeRating: () => '120% Busbar Interconnection Compliant',
    getInspectorContent: (calc, gridVoltageV, mainBreakerA) => ({
      title: 'Main AC Distribution Panel',
      category: 'Building Distribution',
      purpose:
        'Central AC load center housing branch circuit breakers and interconnecting solar inverter feed with building electrical loads and utility grid.',
      calculatedInput: `Busbar rating: ${mainBreakerA ? `${mainBreakerA} A Main Breaker` : '200 A Service Bus'} | System Voltage: ${gridVoltageV}V AC Single-Phase`,
      recommendedRating: mainBreakerA
        ? `${mainBreakerA} A Main Service Panel`
        : 'Standard 230V Split-Bus Distribution Panel',
      explanation:
        'Compliant with NEC 705.12 (120% Busbar Interconnection Rule) and PEC Article 7.05. Ensures solar backfed breaker plus main utility breaker does not exceed 120% of the distribution busbar ampacity rating.',
      wireConduit: `AC Feeder: ${calc.ac.wireSpec}`,
      codeReference: 'NEC 705.12(B) (120% Busbar Ampacity Interconnection Rule) / PEC Article 7.05',
    }),
  },
  ats: {
    key: 'ats',
    sceneLabel: 'AUTOMATIC TRANSFER SWITCH',
    wireLabel: 'ATS SWITCH',
    nodeType: 'ats',
    color: '#7C3AED',
    imagePath: '/assets/accessories/ats.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.ats.height,
    floorCenterY: NODE_TYPE_SPECS.ats.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'ats',
    getBadgeRating: (calc) =>
      calc.ac.atsConfigured ? `${calc.ac.atsRatingA}A Transfer Switch` : 'ATS Optional',
    getInspectorContent: (calc) => ({
      title: 'Automatic Transfer Switch (ATS)',
      category: 'Emergency Power Transfer',
      purpose:
        'Automatic transfer switch that selects between Utility Grid (Source 1) and Main Service Panel Solar Feed (Source 2) to power the building loads.',
      calculatedInput: calc.ac.atsConfigured
        ? `Main service breaker size: ${calc.ac.atsRatingA} A`
        : 'Main breaker omitted',
      recommendedRating: calc.ac.atsConfigured
        ? `${calc.ac.atsRatingA} A Dual-Power ATS`
        : 'ATS Not Configured',
      explanation: calc.ac.explanation.ats,
      wireConduit: 'Input 1 from Utility Grid • Input 2 from Main Service Panel • Output to Building Loads',
      codeReference: 'NEC Article 702 (Optional Standby Systems) & UL 1008 (Transfer Switch Equipment)',
    }),
  },
  eps_breaker: {
    key: 'eps_breaker',
    sceneLabel: 'EPS BREAKER',
    wireLabel: 'EPS BREAKER',
    nodeType: 'breaker',
    color: '#0EA5E9',
    imagePath: '/assets/accessories/ac-breaker.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.breaker.height,
    floorCenterY: NODE_TYPE_SPECS.breaker.floorCenterY,
    includeInMainScene: false,
    workbenchTab: 'electrical',
    costItemKey: 'eps_breaker',
    getBadgeRating: (calc) => `${calc.ac.epsBreakerRatingA}A EPS Breaker`,
    getInspectorContent: (calc) => ({
      title: 'EPS BACKUP BREAKER',
      category: 'System Component',
      purpose: 'System electrical node in the single line diagram.',
      calculatedInput: 'Standard electrical parameter',
      recommendedRating: `${calc.ac.epsBreakerRatingA} A EPS Breaker`,
      explanation: calc.ac.explanation.eps,
      wireConduit: calc.ac.wireSpec,
      codeReference: 'NEC / PEC / IEC Electrical Standards',
    }),
  },
  grid: {
    key: 'grid',
    sceneLabel: 'UTILITY GRID',
    wireLabel: 'UTILITY GRID',
    nodeType: 'grid',
    color: '#64748B',
    imagePath: '/assets/accessories/ats.svg',
    capability: 'floor',
    height: NODE_TYPE_SPECS.grid.height,
    floorCenterY: NODE_TYPE_SPECS.grid.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    getBadgeRating: (_, gridVoltageV) => `${gridVoltageV}V Utility Supply`,
    getInspectorContent: (_, gridVoltageV) => ({
      title: 'Utility Electric Grid Interconnection',
      category: 'Grid Interconnection',
      purpose:
        'Point of Common Coupling (PCC) with the local electric distribution utility for bi-directional net-metered power exchange or grid power import.',
      calculatedInput: `Grid Service Voltage: ${gridVoltageV} V AC nominal | Frequency: 60 Hz`,
      recommendedRating: 'Bi-directional Net Metering (Distribution Utility Interconnect)',
      explanation:
        'Interconnection governed by IEEE 1547 and distribution utility net-metering interconnection guidelines. Includes anti-islanding protection (UL 1741 SA/SB) to automatically disconnect during utility blackouts.',
      wireConduit: 'Overhead / Underground Service Entrance Conductors',
      codeReference: 'IEEE 1547 & Distribution Utility Interconnection Standards',
    }),
  },
  load: {
    key: 'load',
    sceneLabel: 'BUILDING LOAD',
    wireLabel: 'BUILDING LOAD',
    nodeType: 'load',
    color: '#0284C7',
    imagePath: '/assets/accessories/sub-panel.svg',
    capability: 'floor',
    height: NODE_TYPE_SPECS.load.height,
    floorCenterY: NODE_TYPE_SPECS.load.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    getBadgeRating: () => 'Critical & General Loads',
    getInspectorContent: (calc) => ({
      title: 'Facility & Building Electrical Loads',
      category: 'AC Consumption',
      purpose:
        'Consumes solar and stored battery electrical energy to power building lighting, HVAC, appliances, and critical equipment.',
      calculatedInput: `Inverter Continuous Supply Capacity: ${calc.summary.inverterPowerKw} kW AC`,
      recommendedRating: 'Branch Circuits: 15A / 20A / 30A 230V AC Sub-Circuits',
      explanation:
        'Load management balances daytime PV self-consumption with battery storage reserve. In hybrid systems, critical loads are sustained without interruption during grid outages via inverter EPS port.',
      wireConduit: 'THHN/THWN copper building branch wiring inside EMT conduit',
      codeReference: 'NEC Article 210 & 220 (Branch Circuits and Service Load Calculations)',
    }),
  },
  grounding: {
    key: 'grounding',
    sceneLabel: 'COPPER GROUND BUSBAR',
    wireLabel: 'GROUND BUSBAR',
    nodeType: 'grounding',
    color: '#D97706',
    imagePath: '/assets/accessories/grounding-lug.svg',
    capability: 'wall',
    height: NODE_TYPE_SPECS.grounding.height,
    floorCenterY: NODE_TYPE_SPECS.grounding.floorCenterY,
    includeInMainScene: true,
    workbenchTab: 'electrical',
    costItemKey: 'grounding',
    getBadgeRating: () => 'Solid Copper Ground Busbar • UL 467 Listed',
    getInspectorContent: (calc) => ({
      title: 'Equipment Grounding Busbar & Earth Electrode',
      category: 'System Grounding & Bonding',
      purpose:
        'Bonds all non-current-carrying metallic equipment (PV racking frames, inverter chassis, SPD ground terminals, battery enclosures) to earth potential to eliminate hazardous touch voltages and safely dissipate lightning surges.',
      calculatedInput: `Ground Conductor: ${calc.dc.groundConductorSpec} | Earth Electrode: ${calc.dc.groundRodSpec}`,
      recommendedRating: `${calc.dc.groundConductorSpec} Solid Bare Copper (< 5 Ω Earth Resistance)`,
      explanation: calc.dc.explanation.grounding,
      wireConduit:
        'Continuous solid copper conductor bonded via tin-plated copper lugs to grounding electrode system',
      codeReference:
        'NEC Article 250 & 690.43 / PEC Article 2.50 & 6.90.5 (Equipment grounding & bonding to earth electrode)',
    }),
  },
};

export const BASE_SCENE_NODES: BaseNodeSpec[] = Object.values(BASE_NODE_SPECS).filter(
  (spec) => spec.includeInMainScene
);

export const BASE_NODE_CAPABILITY: Record<
  DiagramNodeKey,
  { capability: MountCapability; height: number; floorCenterY: number }
> = Object.fromEntries(
  (Object.keys(BASE_NODE_SPECS) as DiagramNodeKey[]).map((key) => {
    const spec = BASE_NODE_SPECS[key];
    return [key, { capability: spec.capability, height: spec.height, floorCenterY: spec.floorCenterY }];
  })
) as Record<DiagramNodeKey, { capability: MountCapability; height: number; floorCenterY: number }>;

export function getNodeTypeFromKey(key: string): NodeType {
  if (key in BASE_NODE_SPECS) {
    return BASE_NODE_SPECS[key as DiagramNodeKey].nodeType;
  }
  const addable = ADDABLE_CATALOG_MAP.get(key as AddableComponentKey);
  return addable?.nodeType || 'breaker';
}

export function resolveCatalogUnitPrice(
  spec: AddableComponentSpec,
  customPrices: Record<string, number>,
  accessoryPriceLookup: Map<string, number>,
  equipment: {
    inverterPricePhp?: number | null;
    modulePricePhp?: number | null;
    batteryPricePhp?: number | null;
  }
): number {
  if (spec.key === 'inverter_unit') {
    if (typeof customPrices.inverter === 'number') return customPrices.inverter;
    return equipment.inverterPricePhp ?? spec.fallbackUnitPricePhp;
  }
  if (spec.key === 'battery_unit') {
    const custom = customPrices.battery_bank ?? customPrices.battery;
    if (typeof custom === 'number') return custom;
    return equipment.batteryPricePhp ?? spec.fallbackUnitPricePhp;
  }
  if (spec.key === 'pv_array_unit') {
    const modulePrice =
      customPrices.solar_module ?? customPrices.solar_panels ?? equipment.modulePricePhp ?? 6500;
    return modulePrice * MODULES_PER_3D_PV_ARRAY;
  }
  const bomKey = spec.bomAccessoryKey || spec.key;
  if (typeof customPrices[bomKey] === 'number') return customPrices[bomKey];
  return accessoryPriceLookup.get(bomKey) ?? spec.fallbackUnitPricePhp;
}
