// src/types/project.ts

export interface SavedProject {
  id: string;
  user_id: string;
  name: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Sizing Configuration
  inverter_model: string;
  module_model: string;
  battery_model: string | null;
  battery_count: number;
  grid_voltage_v: number;
  main_breaker_a: number | null;
  panel_count_override: number | null;

  // Snapshot telemetry for high-performance listing
  total_kwp: number;
  inverter_kw: number;
  panel_count: number;
  battery_kwh: number | null;
  dc_breaker_a: number;
  ac_breaker_a: number;
  system_type: 'HYBRID' | 'ON-GRID';
}

export interface CreateProjectInput {
  name: string;
  notes?: string;
  inverter_model: string;
  module_model: string;
  battery_model: string | null;
  battery_count: number;
  grid_voltage_v: number;
  main_breaker_a: number | null;
  panel_count_override: number | null;

  total_kwp: number;
  inverter_kw: number;
  panel_count: number;
  battery_kwh: number | null;
  dc_breaker_a: number;
  ac_breaker_a: number;
  system_type: 'HYBRID' | 'ON-GRID';
}

export const MAX_PROJECTS_PER_USER = 20;
