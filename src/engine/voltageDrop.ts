/**
 * Philippine Electrical Code (PEC) 2017 & NEC Article 690 / 210.19(A)
 * Conductor Voltage Drop & Maximum Run Length Engine
 *
 * Provides deterministic voltage drop calculations, resistance lookup
 * based on PEC 2017 Chapter 9 Table 8 at 75 deg C, max circuit distance thresholds,
 * and conductor cross-sectional area recommendations.
 */

export type ConductorMaterial = 'copper' | 'aluminum';
export type CircuitPhaseType = 'dc' | '1phase' | '3phase';
export type ComplianceStatus = 'compliant' | 'marginal' | 'excessive';

export interface ConductorResistanceRecord {
  sizeMm2: number;
  awgEquivalent: string;
  copperResistanceOhmPerKm: number;
  aluminumResistanceOhmPerKm: number;
}

/**
 * Conductor DC/AC resistance in Ohm/km (mOhm/m) at 75 deg C
 * Conforms to Philippine Electrical Code (PEC) 2017 Chapter 9 Table 8
 * and National Electrical Code (NEC) Chapter 9 Table 8.
 */
export const CONDUCTOR_RESISTANCE_TABLE: readonly ConductorResistanceRecord[] = [
  { sizeMm2: 2.5, awgEquivalent: '14 AWG', copperResistanceOhmPerKm: 8.21, aluminumResistanceOhmPerKm: 13.5 },
  { sizeMm2: 4.0, awgEquivalent: '12 AWG', copperResistanceOhmPerKm: 5.09, aluminumResistanceOhmPerKm: 8.37 },
  { sizeMm2: 6.0, awgEquivalent: '10 AWG', copperResistanceOhmPerKm: 3.39, aluminumResistanceOhmPerKm: 5.58 },
  { sizeMm2: 10.0, awgEquivalent: '8 AWG', copperResistanceOhmPerKm: 2.03, aluminumResistanceOhmPerKm: 3.35 },
  { sizeMm2: 16.0, awgEquivalent: '6 AWG', copperResistanceOhmPerKm: 1.28, aluminumResistanceOhmPerKm: 2.1 },
  { sizeMm2: 25.0, awgEquivalent: '4 AWG', copperResistanceOhmPerKm: 0.817, aluminumResistanceOhmPerKm: 1.34 },
  { sizeMm2: 35.0, awgEquivalent: '2 AWG', copperResistanceOhmPerKm: 0.584, aluminumResistanceOhmPerKm: 0.958 },
  { sizeMm2: 50.0, awgEquivalent: '1/0 AWG', copperResistanceOhmPerKm: 0.413, aluminumResistanceOhmPerKm: 0.679 },
  { sizeMm2: 70.0, awgEquivalent: '2/0 AWG', copperResistanceOhmPerKm: 0.292, aluminumResistanceOhmPerKm: 0.48 },
  { sizeMm2: 95.0, awgEquivalent: '3/0 AWG', copperResistanceOhmPerKm: 0.213, aluminumResistanceOhmPerKm: 0.35 },
  { sizeMm2: 120.0, awgEquivalent: '4/0 AWG', copperResistanceOhmPerKm: 0.17, aluminumResistanceOhmPerKm: 0.279 },
  { sizeMm2: 150.0, awgEquivalent: '300 kcmil', copperResistanceOhmPerKm: 0.136, aluminumResistanceOhmPerKm: 0.224 },
  { sizeMm2: 185.0, awgEquivalent: '350 kcmil', copperResistanceOhmPerKm: 0.111, aluminumResistanceOhmPerKm: 0.183 },
  { sizeMm2: 240.0, awgEquivalent: '500 kcmil', copperResistanceOhmPerKm: 0.084, aluminumResistanceOhmPerKm: 0.138 },
];

/** Standard branch circuit & PV string homerun limit per PEC / NEC (3%) */
export const PEC_MAX_BRANCH_VOLTAGE_DROP_PCT = 3.0;

/** Total allowable combined system drop per PEC / NEC (5%) */
export const PEC_MAX_TOTAL_VOLTAGE_DROP_PCT = 5.0;

/** Default reference distances for engineering inspection */
export const DEFAULT_DC_HOMERUN_DISTANCE_M = 25;
export const DEFAULT_AC_FEEDER_DISTANCE_M = 15;

export interface VoltageDropCalculationParams {
  currentA: number;
  voltageV: number;
  conductorSizeMm2: number;
  oneWayLengthMeters: number;
  material?: ConductorMaterial;
  circuitType?: CircuitPhaseType;
}

export interface VoltageDropCalculationResult {
  currentA: number;
  nominalVoltageV: number;
  conductorSizeMm2: number;
  oneWayLengthMeters: number;
  resistanceOhmPerKm: number;
  loopResistanceOhm: number;
  voltageDropV: number;
  dropPercent: number;
  endVoltageV: number;
  powerLossW: number;
  isCompliant3Pct: boolean;
  isCompliant5Pct: boolean;
  status: ComplianceStatus;
  advisory: string;
}

export interface MaxDistanceParams {
  currentA: number;
  voltageV: number;
  conductorSizeMm2: number;
  maxDropPercent?: number;
  material?: ConductorMaterial;
  circuitType?: CircuitPhaseType;
}

export interface RecommendConductorParams {
  currentA: number;
  voltageV: number;
  oneWayLengthMeters: number;
  maxDropPercent?: number;
  material?: ConductorMaterial;
  circuitType?: CircuitPhaseType;
  minSizeMm2?: number;
}

export interface ConductorRecommendationResult {
  recommendedSizeMm2: number;
  awgEquivalent: string;
  isSatisfied: boolean;
  calculation: VoltageDropCalculationResult;
}

/**
 * Resolves conductor resistance record for a given cross-sectional area (mm2).
 * Matches exact size or nearest larger standard gauge.
 */
export function findResistanceRecord(sizeMm2: number): ConductorResistanceRecord {
  const match = CONDUCTOR_RESISTANCE_TABLE.find((r) => r.sizeMm2 >= sizeMm2);
  if (match) return match;
  return CONDUCTOR_RESISTANCE_TABLE[CONDUCTOR_RESISTANCE_TABLE.length - 1];
}

/**
 * Returns conductor resistance in Ohm/km (mOhm/m) at 75 deg C.
 */
export function getConductorResistance(
  sizeMm2: number,
  material: ConductorMaterial = 'copper'
): number {
  const record = findResistanceRecord(sizeMm2);
  return material === 'aluminum'
    ? record.aluminumResistanceOhmPerKm
    : record.copperResistanceOhmPerKm;
}

/**
 * Calculates voltage drop, percentage, and thermal loss for DC and AC circuits.
 */
export function calculateVoltageDrop(
  params: VoltageDropCalculationParams
): VoltageDropCalculationResult {
  const {
    currentA,
    voltageV,
    conductorSizeMm2,
    oneWayLengthMeters,
    material = 'copper',
    circuitType = 'dc',
  } = params;

  const validCurrent = Math.max(0, currentA);
  const validVoltage = Math.max(0, voltageV);
  const validLength = Math.max(0, oneWayLengthMeters);

  const resistanceOhmPerKm = getConductorResistance(conductorSizeMm2, material);

  // Multiplier: 2 for DC & single-phase AC (loop); sqrt(3) for balanced three-phase AC
  const multiplier = circuitType === '3phase' ? Math.sqrt(3) : 2;

  const loopResistanceOhm = (multiplier * validLength * resistanceOhmPerKm) / 1000;
  const rawDropV = validCurrent * loopResistanceOhm;
  const voltageDropV = Number(Math.max(0, rawDropV).toFixed(2));

  const dropPercent =
    validVoltage > 0 ? Number(((rawDropV / validVoltage) * 100).toFixed(2)) : 0;
  const endVoltageV = Number(Math.max(0, validVoltage - rawDropV).toFixed(2));
  const powerLossW = Number((validCurrent * rawDropV).toFixed(2));

  const isCompliant3Pct = dropPercent <= PEC_MAX_BRANCH_VOLTAGE_DROP_PCT;
  const isCompliant5Pct = dropPercent <= PEC_MAX_TOTAL_VOLTAGE_DROP_PCT;

  let status: ComplianceStatus = 'compliant';
  let advisory = '';

  if (isCompliant3Pct) {
    status = 'compliant';
    advisory = `Compliant with PEC Section 6.90 / NEC 210.19(A) (3.0% threshold). Voltage drop is ${dropPercent}% (${voltageDropV} V) over ${validLength}m run.`;
  } else if (isCompliant5Pct) {
    status = 'marginal';
    advisory = `Marginal voltage drop (${dropPercent}% > 3.0%). Exceeds branch circuit recommendation though within 5.0% total system ceiling. Upsizing conductor is advised to minimize clipping loss.`;
  } else {
    status = 'excessive';
    advisory = `Excessive voltage drop (${dropPercent}% > 5.0%). Exceeds maximum electrical safety ceiling. Upsize conductor immediately to prevent inverter trips, low DC voltage faults, and excess heat.`;
  }

  return {
    currentA: validCurrent,
    nominalVoltageV: validVoltage,
    conductorSizeMm2,
    oneWayLengthMeters: validLength,
    resistanceOhmPerKm,
    loopResistanceOhm: Number(loopResistanceOhm.toFixed(4)),
    voltageDropV,
    dropPercent,
    endVoltageV,
    powerLossW,
    isCompliant3Pct,
    isCompliant5Pct,
    status,
    advisory,
  };
}

/**
 * Calculates maximum one-way conductor distance (meters) before hitting target drop percentage.
 */
export function calculateMaxRunLength(params: MaxDistanceParams): number {
  const {
    currentA,
    voltageV,
    conductorSizeMm2,
    maxDropPercent = PEC_MAX_BRANCH_VOLTAGE_DROP_PCT,
    material = 'copper',
    circuitType = 'dc',
  } = params;

  if (currentA <= 0 || voltageV <= 0 || maxDropPercent <= 0) return 0;

  const allowableDropV = (voltageV * maxDropPercent) / 100;
  const resistanceOhmPerKm = getConductorResistance(conductorSizeMm2, material);
  const multiplier = circuitType === '3phase' ? Math.sqrt(3) : 2;

  // L = (V_drop * 1000) / (multiplier * I * R_km)
  const maxMeters = (allowableDropV * 1000) / (multiplier * currentA * resistanceOhmPerKm);
  return Number(Math.max(0, maxMeters).toFixed(1));
}

/**
 * Recommends the smallest standard conductor size meeting target drop percentage over distance.
 */
export function recommendConductorSize(
  params: RecommendConductorParams
): ConductorRecommendationResult {
  const {
    currentA,
    voltageV,
    oneWayLengthMeters,
    maxDropPercent = PEC_MAX_BRANCH_VOLTAGE_DROP_PCT,
    material = 'copper',
    circuitType = 'dc',
    minSizeMm2 = 2.5,
  } = params;

  const candidateSizes = CONDUCTOR_RESISTANCE_TABLE.filter(
    (record) => record.sizeMm2 >= minSizeMm2
  );

  for (const candidate of candidateSizes) {
    const calc = calculateVoltageDrop({
      currentA,
      voltageV,
      conductorSizeMm2: candidate.sizeMm2,
      oneWayLengthMeters,
      material,
      circuitType,
    });

    if (calc.dropPercent <= maxDropPercent) {
      return {
        recommendedSizeMm2: candidate.sizeMm2,
        awgEquivalent: candidate.awgEquivalent,
        isSatisfied: true,
        calculation: calc,
      };
    }
  }

  // If no standard size satisfies, return the largest available size with isSatisfied: false
  const largest =
    candidateSizes[candidateSizes.length - 1] ||
    CONDUCTOR_RESISTANCE_TABLE[CONDUCTOR_RESISTANCE_TABLE.length - 1];
  const fallbackCalc = calculateVoltageDrop({
    currentA,
    voltageV,
    conductorSizeMm2: largest.sizeMm2,
    oneWayLengthMeters,
    material,
    circuitType,
  });

  return {
    recommendedSizeMm2: largest.sizeMm2,
    awgEquivalent: largest.awgEquivalent,
    isSatisfied: false,
    calculation: fallbackCalc,
  };
}

/**
 * Parses numeric mm2 conductor size from wire specification strings.
 * e.g. "4.0mm² THHN/THWN cable" -> 4.0, "12 AWG Copper" -> 4.0
 */
export function parseConductorSizeMm2(wireSpec: string): number | null {
  if (!wireSpec) return null;

  // Match metric mm2 (e.g. 4.0mm², 6.0 mm2, 10mm²)
  const mm2Match = wireSpec.match(/(\d+(?:\.\d+)?)\s*(?:mm²|mm2)/i);
  if (mm2Match && mm2Match[1]) {
    const parsed = parseFloat(mm2Match[1]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Match AWG notation
  const awgMatch = wireSpec.match(/(\d+(?:\/\d+)?)\s*AWG/i);
  if (awgMatch && awgMatch[1]) {
    const awgStr = awgMatch[1];
    const awgMap: Record<string, number> = {
      '14': 2.5,
      '12': 4.0,
      '10': 6.0,
      '8': 10.0,
      '6': 16.0,
      '4': 25.0,
      '2': 35.0,
      '1/0': 50.0,
      '2/0': 70.0,
      '3/0': 95.0,
      '4/0': 120.0,
    };
    if (awgMap[awgStr]) return awgMap[awgStr];
  }

  return null;
}
