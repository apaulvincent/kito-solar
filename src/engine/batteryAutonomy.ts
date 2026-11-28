/**
 * Battery Storage Autonomy, Depth of Discharge (DoD) & Backup Runtime Calculation Engine
 *
 * Implements deterministic energy storage metrics:
 * 1. Chemistry-specific recommended Depth of Discharge (DoD) & inverter roundtrip efficiency:
 *    - LiFePO4 / Lithium-ion: 90% recommended DoD, 94% discharge efficiency
 *    - Lead-acid / AGM / Gel: 50% recommended DoD, 80% discharge efficiency
 * 2. Net usable energy calculation (kWh) accounting for DoD and inverter conversion losses.
 * 3. Continuous discharge power (kW) and C-rate evaluation relative to inverter rated power.
 * 4. Multi-tier emergency backup runtime projections (Light 300W, Moderate 800W, Heavy 2,000W,
 *    and Full Inverter EPS capacity).
 */

export const DEFAULT_LITHIUM_DOD_PCT = 90.0;
export const DEFAULT_LEAD_ACID_DOD_PCT = 50.0;
export const DEFAULT_INVERTER_DISCHARGE_EFFICIENCY_PCT = 94.0;
export const DEFAULT_LEAD_ACID_EFFICIENCY_PCT = 80.0;

export const ESSENTIAL_LIGHT_LOAD_W = 300; // Wi-Fi, LED illumination, routers, security cameras
export const ESSENTIAL_MODERATE_LOAD_W = 800; // Inverter refrigerator, fans, TV, workstations
export const ESSENTIAL_HEAVY_LOAD_W = 2000; // Water pump, freezer, induction, continuous EPS

export type BatteryChemistry = 'lifepo4' | 'lithium_ion' | 'lead_acid';

export interface BatteryAutonomyParams {
  nominalEnergyWh: number;
  nominalVoltageV: number;
  capacityAh: number;
  dischargeCurrentA: number;
  inverterRatedPowerW?: number;
  dodPct?: number;
  inverterEfficiencyPct?: number;
  batteryModelName?: string;
}

export interface LoadRuntimeScenario {
  label: string;
  loadWatts: number;
  runtimeHours: number;
  formattedRuntime: string;
}

export interface BatteryAutonomyResult {
  chemistry: BatteryChemistry;
  recommendedDodPct: number;
  dischargeEfficiencyPct: number;
  grossCapacityKwh: number;
  netUsableCapacityKwh: number;
  maxDischargePowerW: number;
  cRate: number;
  isDischargeThrottled: boolean;
  inverterPowerCoveragePct: number;
  runtimes: {
    lightLoad: LoadRuntimeScenario;
    moderateLoad: LoadRuntimeScenario;
    heavyLoad: LoadRuntimeScenario;
    fullInverterLoad?: LoadRuntimeScenario;
  };
  status: 'optimal' | 'adequate' | 'throttled';
  advisory: string;
}

/**
 * Detects probable battery chemistry based on model nomenclature and characteristics.
 */
export function detectBatteryChemistry(modelName?: string): BatteryChemistry {
  if (!modelName) return 'lifepo4';
  const lower = modelName.toLowerCase();
  if (lower.includes('lead') || lower.includes('agm') || lower.includes('gel') || lower.includes('flooded')) {
    return 'lead_acid';
  }
  if (lower.includes('nmc') || lower.includes('ion') || lower.includes('ternary')) {
    return 'lithium_ion';
  }
  return 'lifepo4';
}

/**
 * Formats fractional hours into human-readable duration strings (e.g. "18.5 h (18h 30m)").
 */
export function formatRuntimeHours(hours: number): string {
  if (hours <= 0 || !Number.isFinite(hours)) return '0 min';
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} min`;
  }
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (m === 0) return `${h} hrs`;
  return `${h}h ${m}m`;
}

/**
 * Calculates battery storage autonomy, usable energy, and multi-scenario backup runtimes.
 */
export function calculateBatteryAutonomy(
  params: BatteryAutonomyParams
): BatteryAutonomyResult {
  const chemistry = detectBatteryChemistry(params.batteryModelName);
  const isLithium = chemistry === 'lifepo4' || chemistry === 'lithium_ion';

  const recommendedDod = params.dodPct ?? (isLithium ? DEFAULT_LITHIUM_DOD_PCT : DEFAULT_LEAD_ACID_DOD_PCT);
  const efficiency =
    params.inverterEfficiencyPct ??
    (isLithium ? DEFAULT_INVERTER_DISCHARGE_EFFICIENCY_PCT : DEFAULT_LEAD_ACID_EFFICIENCY_PCT);

  const safeNominalEnergyWh = Math.max(0, params.nominalEnergyWh);
  const grossCapacityKwh = Number((safeNominalEnergyWh / 1000).toFixed(2));

  // Net usable Wh = Gross Wh * (DoD / 100) * (Efficiency / 100)
  const netUsableWh = safeNominalEnergyWh * (recommendedDod / 100) * (efficiency / 100);
  const netUsableCapacityKwh = Number((netUsableWh / 1000).toFixed(2));

  const safeVoltage = Math.max(1, params.nominalVoltageV);
  const safeDischargeCurrent = Math.max(0, params.dischargeCurrentA);
  const safeCapacityAh = Math.max(1, params.capacityAh);

  const maxDischargePowerW = Number((safeVoltage * safeDischargeCurrent).toFixed(0));
  const cRate = Number((safeDischargeCurrent / safeCapacityAh).toFixed(2));

  const inverterPowerW = params.inverterRatedPowerW ? Math.max(0, params.inverterRatedPowerW) : 0;
  const inverterPowerCoveragePct =
    inverterPowerW > 0 ? Number(((maxDischargePowerW / inverterPowerW) * 100).toFixed(1)) : 100;

  const isDischargeThrottled = inverterPowerW > 0 && maxDischargePowerW < inverterPowerW;

  const buildScenario = (label: string, watts: number): LoadRuntimeScenario => {
    const hours = watts > 0 && netUsableWh > 0 ? Number((netUsableWh / watts).toFixed(2)) : 0;
    return {
      label,
      loadWatts: watts,
      runtimeHours: hours,
      formattedRuntime: formatRuntimeHours(hours),
    };
  };

  const lightScenario = buildScenario('Essential Light (300 W)', ESSENTIAL_LIGHT_LOAD_W);
  const moderateScenario = buildScenario('Residential Core (800 W)', ESSENTIAL_MODERATE_LOAD_W);
  const heavyScenario = buildScenario('Heavy EPS (2,000 W)', ESSENTIAL_HEAVY_LOAD_W);

  const runtimes: BatteryAutonomyResult['runtimes'] = {
    lightLoad: lightScenario,
    moderateLoad: moderateScenario,
    heavyLoad: heavyScenario,
  };

  if (inverterPowerW > 0) {
    runtimes.fullInverterLoad = buildScenario(`Full Inverter (${inverterPowerW} W)`, inverterPowerW);
  }

  let status: BatteryAutonomyResult['status'];
  let advisory: string;

  if (isDischargeThrottled) {
    status = 'throttled';
    advisory = `Battery discharge capacity (${(maxDischargePowerW / 1000).toFixed(1)} kW at ${cRate}C) is below inverter rated output (${(inverterPowerW / 1000).toFixed(1)} kW). During grid outages, emergency EPS loads will be capped at ${(maxDischargePowerW / 1000).toFixed(1)} kW to protect battery cells. Usable capacity is ${netUsableCapacityKwh} kWh at ${recommendedDod}% DoD.`;
  } else if (netUsableCapacityKwh < 3.0) {
    status = 'adequate';
    advisory = `Bank yields ${netUsableCapacityKwh} kWh net usable reserve (${recommendedDod}% DoD). Suitable for short outages (${lightScenario.formattedRuntime} on light essentials), but additional storage modules are recommended for prolonged daytime or overnight autonomy.`;
  } else {
    status = 'optimal';
    advisory = `High-capacity energy reserve delivering ${netUsableCapacityKwh} kWh net usable power (${recommendedDod}% DoD, ${efficiency}% conversion efficiency). Sustains essential loads for ${lightScenario.formattedRuntime} or typical residential appliances for ${moderateScenario.formattedRuntime}. Max continuous discharge of ${(maxDischargePowerW / 1000).toFixed(1)} kW fully covers rated inverter demands.`;
  }

  return {
    chemistry,
    recommendedDodPct: recommendedDod,
    dischargeEfficiencyPct: efficiency,
    grossCapacityKwh,
    netUsableCapacityKwh,
    maxDischargePowerW,
    cRate,
    isDischargeThrottled,
    inverterPowerCoveragePct,
    runtimes,
    status,
    advisory,
  };
}
