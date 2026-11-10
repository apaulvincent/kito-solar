// src/features/combiner-builder/types.ts

export type CurrentDomain = 'AC' | 'DC' | 'PE_GND' | 'CONTROL_SENSE';
export type PolarityRole = 'L' | 'N' | 'DC_POS' | 'DC_NEG' | 'PE' | 'SENSE_L' | 'SENSE_N';
export type FerruleColor = 'red' | 'blue' | 'black' | 'white' | 'yellow' | 'green_yellow';
export type WireGaugeMm2 = 1.5 | 2.5 | 4 | 6 | 10 | 16 | 25 | 35 | 50;

export type ComponentCategory =
  | 'dc_mcb'
  | 'dc_spd'
  | 'dc_isolator'
  | 'ac_mcb'
  | 'ac_rcbo'
  | 'ac_spd'
  | 'ac_isolator'
  | 'ats_cb'
  | 'ats_solenoid'
  | 'battery_mccb'
  | 'din_meter'
  | 'digital_protector'
  | 'terminal_block'
  | 'pe_busbar';

export type MountZone = 'rail_top' | 'rail_middle' | 'bottom_plate' | 'side_busbar';

export interface TerminalPort {
  id: string; // e.g., "comp_1:L_IN"
  componentId: string;
  label: string; // e.g., "1/L (Top)", "DC+", "PE", "A_SENSE_L"
  positionOffset: [number, number, number]; // Local 3D offset on component mesh
  entryDirection: 'top' | 'bottom' | 'front';
  domain: CurrentDomain;
  polarity: PolarityRole;
}

export interface CombinerComponentInstance {
  id: string;
  catalogId: string;
  name: string; // e.g., "TAXNELE TXBD1-63 2P C32 DC MCB"
  brand: string; // e.g., "TAXNELE", "GCDQCN", "MTC", "ABB", "MATSIC"
  category: ComponentCategory;
  mountZone: MountZone;
  railSlotIndex: number; // 18mm modular slot position (0 to 30)
  position3D: [number, number, number];
  widthMm: number; // e.g., 36mm (2P), 72mm, 108mm (ATS)
  ratedAmps: number; // e.g., 32, 50, 63, 160
  ratedVoltage: string; // e.g., "1000V DC", "230V AC", "500V DC"
  isSwitchOn: boolean; // Live interactive breaker state
  atsMode?: 'auto' | 'manual';
  atsActiveSource?: 'source_a' | 'off' | 'source_b';
  pricePhp: number;
  ports: TerminalPort[];
}

export interface CombinerWireConnection {
  id: string;
  fromPortId: string;
  toPortId: string;
  wireColor: string; // e.g., '#ef4444', '#3b82f6', '#1e293b', '#f8fafc', '#eab308', '#22c55e'
  ferruleColor: FerruleColor;
  gaugeMm2: WireGaugeMm2;
  isJumperLoop: boolean; // True for short MCB-to-SPD parallel loops
  waypoints3D?: [number, number, number][];
}

export type DrcCode =
  | 'SHORT_CIRCUIT_LN'
  | 'CROSS_DOMAIN_AC_DC'
  | 'REVERSED_DC_POLARITY'
  | 'UNBONDED_SPD_PE'
  | 'MISSING_ATS_SENSE'
  | 'UNDERSIZED_WIRE_GAUGE';

export interface DrcDiagnostic {
  id: string;
  severity: 'error' | 'warning' | 'pass';
  code: DrcCode;
  title: string;
  description: string;
  affectedIds: string[]; // Highlights offending wires/components in 3D
}

export type ActiveCanvasTool =
  | 'move'
  | 'wire_pos'
  | 'wire_neg'
  | 'wire_sense'
  | 'wire_pe'
  | 'jumper'
  | 'cut';

export interface CatalogHardwareItem {
  id: string;
  name: string;
  brand: string;
  category: ComponentCategory;
  defaultMountZone: MountZone;
  widthMm: number;
  modules1P: number;
  ratedAmps: number;
  ratedVoltage: string;
  pricePhp: number;
  description: string;
  ports: Array<Omit<TerminalPort, 'id' | 'componentId'>>;
}
