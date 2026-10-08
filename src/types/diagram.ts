// src/types/diagram.ts

export type DiagramNodeKey =
  | 'pv_array'
  | 'dc_breaker'
  | 'dc_isolator'
  | 'dc_spd'
  | 'dc_conduit'
  | 'inverter'
  | 'battery'
  | 'battery_breaker'
  | 'battery_wire'
  | 'ac_breaker'
  | 'ac_isolator'
  | 'ac_spd'
  | 'ats'
  | 'eps_breaker'
  | 'main_panel'
  | 'grid'
  | 'load'
  | 'grounding';

export interface DiagramNodeMeta {
  key: DiagramNodeKey;
  label: string;
  sublabel?: string;
  category: 'pv' | 'dc' | 'inverter' | 'battery' | 'ac' | 'grid' | 'ground';
  position: [number, number, number];
  specKey?: string; // Links to calculator result key
  icon?: string;
}

export interface CableConnection {
  id: string;
  from: DiagramNodeKey;
  to: DiagramNodeKey;
  type: 'dc' | 'ac' | 'battery' | 'ground';
  color: string;
  bidirectional?: boolean;
}
