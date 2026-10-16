// src/types/supabase.ts

export interface SolarInverterRecord {
  id?: string;
  brand: string;
  model: string;
  battery_type: string | null;
  battery_voltage_range: string | null;
  max_charging_current_a: number | null;
  max_discharging_current_a: number | null;
  battery_input_count: number | null;
  max_pv_input_power_w: number;
  max_pv_input_voltage_v: number;
  startup_voltage_v: number;
  mppt_voltage_range: string;
  rated_pv_input_voltage_v: number;
  max_operating_pv_input_current: string | null;
  max_input_short_circuit_current: string | null;
  mppt_tracker_string_config: string | null;
  rated_ac_power_w: number | string;
  rated_ac_current_a: number | string | null;
  max_ac_current_a: number | string;
  rated_voltage_range: string | null;
  grid_connection_form: string | null;
  price_php?: number | null;
  is_active?: boolean;
}

export interface SolarModuleRecord {
  id?: string;
  brand: string;
  model: string;
  pv_wattage_w: number | string;
  voc_v: number;
  vmp_v: number;
  isc_a: number;
  imp_a: number;
  efficiency_pct: number;
  price_php?: number | null;
  is_active?: boolean;
}

export interface BatteryRecord {
  id?: string;
  nominal_voltage_v: number;
  model: string;
  capacity_ah: number;
  energy_wh: number | null;
  discharge_current_a: number | null;
  recommended_breaker_a: number;
  notes: string | null;
  price_php?: number | null;
  is_active?: boolean;
}

export interface RuleBreakerRecord {
  id?: number;
  system_side: 'dc' | 'ac';
  min_current_a: number;
  max_current_a: number;
  breaker_rating_a: number;
}

export interface RuleWireRecord {
  id?: number;
  wire_group: 'dc_pv' | 'ac' | 'battery';
  max_current_a: number;
  wire_spec: string;
}

export interface RuleConduitRecord {
  id?: number;
  wire_group: 'dc_pv' | 'ac' | 'battery';
  wire_spec: string;
  conduit_spec: string;
}

export interface RuleIsolatorRecord {
  id?: number;
  system_side: 'dc' | 'ac';
  breaker_rating_a: number;
  isolator_rating_a: number;
}

export interface RuleGroundingRecord {
  id?: number;
  min_current_a: number;
  max_current_a: number;
  conductor_spec: string;
  rod_spec: string;
}

export interface AccessoryRecord {
  id?: string;
  accessory_key: string;
  name: string;
  category: 'protection' | 'wiring' | 'isolation' | 'conduit' | 'grounding' | 'transfer' | 'mounting' | 'connector';
  side: 'dc' | 'ac' | 'both';
  description: string;
  image_path: string;
  diagram_node_key: string;
  price_php?: number | null;
  is_active?: boolean;
}
