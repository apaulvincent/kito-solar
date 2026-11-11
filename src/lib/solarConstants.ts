// Shared Philippine residential solar assumptions. Every engine, store and feature reads
// these instead of re-declaring them, so one edit here changes every calculation together.

export const DEFAULT_PEAK_SUN_HOURS = 4.5;
export const DEFAULT_AMBIENT_TEMP_C = 28;

// Meralco residential blended effective tariff (PHP/kWh).
export const DEFAULT_RETAIL_TARIFF_PHP_PER_KWH = 11.85;

// Baseline workbench & AI simple sizing tariff assumption (PHP/kWh).
export const WORKBENCH_DEFAULT_TARIFF_PHP_PER_KWH = 12.0;

export const DEFAULT_SYSTEM_EFFICIENCY = 0.8;
export const DEFAULT_SYSTEM_LOSSES = 1 - DEFAULT_SYSTEM_EFFICIENCY;
export const DEFAULT_INVERTER_EFFICIENCY = 0.92;

export const LIFEPO4_BATTERY_DOD = 0.8;
export const LIFEPO4_ROUND_TRIP_EFFICIENCY = 0.9;
export const LIFEPO4_MODULE_KWH = 5.12;

export const DEFAULT_PANEL_WATTAGE_W = 580;

// Each placed 3D PV array unit in the plant builder represents this many physical modules.
export const MODULES_PER_3D_PV_ARRAY = 3;

export const DAYS_PER_MONTH = 30;

export function roundUpToBatteryModules(requiredKwh: number, moduleKwh: number = LIFEPO4_MODULE_KWH): number {
  if (requiredKwh <= 0) return 0;
  return Math.ceil(requiredKwh / moduleKwh);
}
