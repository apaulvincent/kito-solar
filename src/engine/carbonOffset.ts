/**
 * Philippine Department of Energy (DOE) & US EPA Greenhouse Gas Equivalencies
 * Solar Environmental & Carbon Offset Calculation Engine
 *
 * Implements deterministic environmental metrics based on the Philippine DOE
 * National Grid Emission Factor (0.7122 kg CO2e / kWh) and standard solar
 * degradation models over 25-year system lifespans.
 */

import {
  DEFAULT_PEAK_SUN_HOURS,
  DEFAULT_SYSTEM_EFFICIENCY,
} from '@/lib/solarConstants';

/**
 * Philippine Department of Energy (DOE) National Grid Emission Factor (GEF)
 * in kg CO2e per kWh generated/avoided.
 */
export const DOE_PH_GRID_EMISSION_FACTOR_KG_PER_KWH = 0.7122;

/**
 * US EPA Greenhouse Gas Equivalencies:
 * - 1 urban tree seedling grown for 10 years sequestering ~21.77 kg CO2
 * - 1 barrel of crude oil consumed produces ~433.0 kg CO2
 * - 1 metric ton of coal burned produces ~2,410.0 kg CO2
 * - 1 km driven by an average passenger vehicle produces ~0.170 kg CO2
 */
export const KG_CO2_PER_TREE_SEEDLING_10YR = 21.77;
export const KG_CO2_PER_BARREL_OF_OIL = 433.0;
export const KG_CO2_PER_METRIC_TON_COAL = 2410.0;
export const KG_CO2_PER_VEHICLE_KM = 0.170;

export interface CarbonOffsetInput {
  totalArrayPowerKw: number;
  peakSunHours?: number;
  performanceRatio?: number;
  annualDegradationRate?: number; // default 0.5% (0.005)
  lifespanYears?: number; // default 25
  gridEmissionFactorKgPerKwh?: number;
}

export interface CarbonOffsetResult {
  annualGenerationKwh: number;
  lifetimeGenerationKwh: number;
  annualCo2AvoidedKg: number;
  annualCo2AvoidedTons: number;
  lifetimeCo2AvoidedTons: number;
  treesSeedlingsGrown10Yr: number;
  barrelsOilAvoided: number;
  coalAvoidedMetricTons: number;
  vehicleKmTraveledAvoided: number;
  gridEmissionFactor: number;
  summaryText: string;
}

/**
 * Computes annual and lifetime carbon avoidance and environmental equivalencies.
 */
export function calculateCarbonOffset(input: CarbonOffsetInput): CarbonOffsetResult {
  const {
    totalArrayPowerKw,
    peakSunHours = DEFAULT_PEAK_SUN_HOURS,
    performanceRatio = DEFAULT_SYSTEM_EFFICIENCY,
    annualDegradationRate = 0.005,
    lifespanYears = 25,
    gridEmissionFactorKgPerKwh = DOE_PH_GRID_EMISSION_FACTOR_KG_PER_KWH,
  } = input;

  const validPowerKw = Math.max(0, totalArrayPowerKw);
  const validPsh = Math.max(0, peakSunHours);
  const validPr = Math.max(0, performanceRatio);
  const validLifespan = Math.max(1, Math.round(lifespanYears));
  const validDegradation = Math.max(0, Math.min(0.05, annualDegradationRate));
  const validEmissionFactor = Math.max(0, gridEmissionFactorKgPerKwh);

  // Year 1 annual energy yield: kWp * PSH * 365 * PR
  const rawAnnualKwh = validPowerKw * validPsh * 365 * validPr;
  const annualGenerationKwh = Math.round(rawAnnualKwh);

  // Cumulative lifetime generation factoring annual panel degradation
  let lifetimeRawKwh = 0;
  for (let year = 0; year < validLifespan; year++) {
    lifetimeRawKwh += rawAnnualKwh * Math.pow(1 - validDegradation, year);
  }
  const lifetimeGenerationKwh = Math.round(lifetimeRawKwh);

  // Carbon metrics
  const rawAnnualCo2Kg = rawAnnualKwh * validEmissionFactor;
  const annualCo2AvoidedKg = Number(rawAnnualCo2Kg.toFixed(1));
  const annualCo2AvoidedTons = Number((rawAnnualCo2Kg / 1000).toFixed(2));

  const rawLifetimeCo2Tons = (lifetimeRawKwh * validEmissionFactor) / 1000;
  const lifetimeCo2AvoidedTons = Number(rawLifetimeCo2Tons.toFixed(2));

  // Equivalencies (EPA GHG formulas)
  const treesSeedlingsGrown10Yr = Math.round(rawAnnualCo2Kg / KG_CO2_PER_TREE_SEEDLING_10YR);
  const barrelsOilAvoided = Number((rawAnnualCo2Kg / KG_CO2_PER_BARREL_OF_OIL).toFixed(1));
  const coalAvoidedMetricTons = Number((rawAnnualCo2Kg / KG_CO2_PER_METRIC_TON_COAL).toFixed(2));
  const vehicleKmTraveledAvoided = Math.round(rawAnnualCo2Kg / KG_CO2_PER_VEHICLE_KM);

  const summaryText =
    validPowerKw > 0
      ? `Avoids ${annualCo2AvoidedTons} MT CO2e annually (${lifetimeCo2AvoidedTons} MT over ${validLifespan} years), equivalent to planting ${treesSeedlingsGrown10Yr.toLocaleString()} tree seedlings grown for 10 years.`
      : 'No active PV array capacity specified.';

  return {
    annualGenerationKwh,
    lifetimeGenerationKwh,
    annualCo2AvoidedKg,
    annualCo2AvoidedTons,
    lifetimeCo2AvoidedTons,
    treesSeedlingsGrown10Yr,
    barrelsOilAvoided,
    coalAvoidedMetricTons,
    vehicleKmTraveledAvoided,
    gridEmissionFactor: validEmissionFactor,
    summaryText,
  };
}
