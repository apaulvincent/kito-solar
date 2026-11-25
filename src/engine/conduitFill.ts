/**
 * Philippine Electrical Code (PEC) 2017 & NEC Chapter 9 Tables 1, 4 & 5
 * Conduit Fill Percentage & Sizing Calculation Engine
 *
 * Implements deterministic conduit fill calculations, trade diameter internal
 * cross-sectional area lookups, and maximum allowable fill percentage rules:
 * - 1 conductor: 53.0% max fill
 * - 2 conductors: 31.0% max fill
 * - 3 or more conductors: 40.0% max fill
 */

export interface ConduitSizeRecord {
  tradeMm: number;
  tradeInches: string;
  internalDiameterMm: number;
  totalInternalAreaMm2: number;
}

/**
 * Standard Electrical Rigid PVC / Schedule 40 Conduit Dimensions
 * Conforms to PEC 2017 Chapter 9 Table 4 / NEC Chapter 9 Table 4
 */
export const CONDUIT_SIZE_TABLE: readonly ConduitSizeRecord[] = [
  { tradeMm: 20, tradeInches: '1/2"', internalDiameterMm: 15.8, totalInternalAreaMm2: 196.1 },
  { tradeMm: 25, tradeInches: '3/4"', internalDiameterMm: 20.9, totalInternalAreaMm2: 343.1 },
  { tradeMm: 32, tradeInches: '1"', internalDiameterMm: 26.6, totalInternalAreaMm2: 555.7 },
  { tradeMm: 40, tradeInches: '1-1/4"', internalDiameterMm: 35.1, totalInternalAreaMm2: 967.6 },
  { tradeMm: 50, tradeInches: '1-1/2"', internalDiameterMm: 40.9, totalInternalAreaMm2: 1313.8 },
  { tradeMm: 63, tradeInches: '2"', internalDiameterMm: 52.5, totalInternalAreaMm2: 2164.8 },
  { tradeMm: 80, tradeInches: '2-1/2"', internalDiameterMm: 62.7, totalInternalAreaMm2: 3087.9 },
  { tradeMm: 100, tradeInches: '3"', internalDiameterMm: 77.9, totalInternalAreaMm2: 4765.9 },
  { tradeMm: 125, tradeInches: '4"', internalDiameterMm: 102.3, totalInternalAreaMm2: 8219.4 },
  { tradeMm: 150, tradeInches: '5"', internalDiameterMm: 128.2, totalInternalAreaMm2: 12908.1 },
  { tradeMm: 200, tradeInches: '6"', internalDiameterMm: 154.1, totalInternalAreaMm2: 18651.1 },
];

export interface ConductorAreaRecord {
  conductorSizeMm2: number;
  awgEquivalent: string;
  thhnOuterDiameterMm: number;
  thhnTotalAreaMm2: number;
  pvWireOuterDiameterMm: number;
  pvWireTotalAreaMm2: number;
}

/**
 * Insulated Conductor Dimensions per PEC 2017 Chapter 9 Table 5 / NEC Chapter 9 Table 5
 * (Includes copper core plus insulation/outer jacket)
 */
export const CONDUCTOR_AREA_TABLE: readonly ConductorAreaRecord[] = [
  { conductorSizeMm2: 2.5, awgEquivalent: '14 AWG', thhnOuterDiameterMm: 3.3, thhnTotalAreaMm2: 8.55, pvWireOuterDiameterMm: 4.8, pvWireTotalAreaMm2: 18.10 },
  { conductorSizeMm2: 4.0, awgEquivalent: '12 AWG', thhnOuterDiameterMm: 3.8, thhnTotalAreaMm2: 11.34, pvWireOuterDiameterMm: 5.4, pvWireTotalAreaMm2: 22.90 },
  { conductorSizeMm2: 6.0, awgEquivalent: '10 AWG', thhnOuterDiameterMm: 4.4, thhnTotalAreaMm2: 15.20, pvWireOuterDiameterMm: 6.0, pvWireTotalAreaMm2: 28.27 },
  { conductorSizeMm2: 8.0, awgEquivalent: '8 AWG', thhnOuterDiameterMm: 5.9, thhnTotalAreaMm2: 27.34, pvWireOuterDiameterMm: 7.2, pvWireTotalAreaMm2: 40.72 },
  { conductorSizeMm2: 10.0, awgEquivalent: '8 AWG', thhnOuterDiameterMm: 5.9, thhnTotalAreaMm2: 27.34, pvWireOuterDiameterMm: 7.2, pvWireTotalAreaMm2: 40.72 },
  { conductorSizeMm2: 14.0, awgEquivalent: '6 AWG', thhnOuterDiameterMm: 6.9, thhnTotalAreaMm2: 37.39, pvWireOuterDiameterMm: 8.4, pvWireTotalAreaMm2: 55.42 },
  { conductorSizeMm2: 16.0, awgEquivalent: '6 AWG', thhnOuterDiameterMm: 6.9, thhnTotalAreaMm2: 37.39, pvWireOuterDiameterMm: 8.4, pvWireTotalAreaMm2: 55.42 },
  { conductorSizeMm2: 22.0, awgEquivalent: '4 AWG', thhnOuterDiameterMm: 8.4, thhnTotalAreaMm2: 55.42, pvWireOuterDiameterMm: 10.0, pvWireTotalAreaMm2: 78.54 },
  { conductorSizeMm2: 25.0, awgEquivalent: '4 AWG', thhnOuterDiameterMm: 8.4, thhnTotalAreaMm2: 55.42, pvWireOuterDiameterMm: 10.0, pvWireTotalAreaMm2: 78.54 },
  { conductorSizeMm2: 30.0, awgEquivalent: '2 AWG', thhnOuterDiameterMm: 9.8, thhnTotalAreaMm2: 75.43, pvWireOuterDiameterMm: 11.6, pvWireTotalAreaMm2: 105.68 },
  { conductorSizeMm2: 35.0, awgEquivalent: '2 AWG', thhnOuterDiameterMm: 9.8, thhnTotalAreaMm2: 75.43, pvWireOuterDiameterMm: 11.6, pvWireTotalAreaMm2: 105.68 },
  { conductorSizeMm2: 50.0, awgEquivalent: '1/0 AWG', thhnOuterDiameterMm: 11.4, thhnTotalAreaMm2: 102.07, pvWireOuterDiameterMm: 13.5, pvWireTotalAreaMm2: 143.14 },
];

export type WireType = 'thhn' | 'pv_wire';

export interface ConduitFillCalculationParams {
  conduitTradeMm: number;
  conductorSizeMm2: number;
  conductorCount: number;
  wireType?: WireType;
}

export interface ConduitFillCalculationResult {
  conduitTradeMm: number;
  conduitInternalAreaMm2: number;
  conductorSizeMm2: number;
  conductorCount: number;
  singleConductorAreaMm2: number;
  totalConductorAreaMm2: number;
  maxAllowableFillPct: number;
  fillPercent: number;
  isCompliant: boolean;
  status: 'compliant' | 'overfilled';
  advisory: string;
}

/**
 * Returns maximum allowable conduit fill percentage per PEC 2017 Chapter 9 Table 1.
 */
export function getMaxAllowableFillPct(conductorCount: number): number {
  if (conductorCount <= 1) return 53.0;
  if (conductorCount === 2) return 31.0;
  return 40.0;
}

/**
 * Resolves conduit dimension record matching trade diameter (mm).
 */
export function findConduitRecord(tradeMm: number): ConduitSizeRecord {
  const match = CONDUIT_SIZE_TABLE.find((c) => c.tradeMm >= tradeMm);
  if (match) return match;
  return CONDUIT_SIZE_TABLE[CONDUIT_SIZE_TABLE.length - 1];
}

/**
 * Resolves conductor dimension record matching conductor cross section (mm2).
 */
export function findConductorAreaRecord(sizeMm2: number): ConductorAreaRecord {
  const match = CONDUCTOR_AREA_TABLE.find((c) => c.conductorSizeMm2 >= sizeMm2);
  if (match) return match;
  return CONDUCTOR_AREA_TABLE[CONDUCTOR_AREA_TABLE.length - 1];
}

/**
 * Calculates conduit fill percentage and compliance per PEC 2017 Chapter 9 Table 1.
 */
export function calculateConduitFill(
  params: ConduitFillCalculationParams
): ConduitFillCalculationResult {
  const {
    conduitTradeMm,
    conductorSizeMm2,
    conductorCount,
    wireType = 'thhn',
  } = params;

  const validCount = Math.max(1, Math.round(conductorCount));
  const conduitRecord = findConduitRecord(conduitTradeMm);
  const conductorRecord = findConductorAreaRecord(conductorSizeMm2);

  const singleArea =
    wireType === 'pv_wire'
      ? conductorRecord.pvWireTotalAreaMm2
      : conductorRecord.thhnTotalAreaMm2;

  const totalConductorAreaMm2 = Number((validCount * singleArea).toFixed(2));
  const conduitInternalAreaMm2 = conduitRecord.totalInternalAreaMm2;

  const maxAllowableFillPct = getMaxAllowableFillPct(validCount);
  const rawFillPct = (totalConductorAreaMm2 / conduitInternalAreaMm2) * 100;
  const fillPercent = Number(rawFillPct.toFixed(1));

  const isCompliant = fillPercent <= maxAllowableFillPct;
  const status = isCompliant ? 'compliant' : 'overfilled';

  let advisory = '';
  if (isCompliant) {
    advisory = `Compliant with PEC 2017 Chapter 9 Table 1. Actual fill is ${fillPercent}% within ${maxAllowableFillPct}% allowable threshold for ${validCount} conductors.`;
  } else {
    advisory = `Exceeds PEC 2017 conduit fill limit (${fillPercent}% > ${maxAllowableFillPct}%). Upsize conduit to prevent cable binding and heat retention.`;
  }

  return {
    conduitTradeMm: conduitRecord.tradeMm,
    conduitInternalAreaMm2,
    conductorSizeMm2: conductorRecord.conductorSizeMm2,
    conductorCount: validCount,
    singleConductorAreaMm2: singleArea,
    totalConductorAreaMm2,
    maxAllowableFillPct,
    fillPercent,
    isCompliant,
    status,
    advisory,
  };
}

/**
 * Recommends the minimum standard conduit diameter satisfying PEC 2017 fill rules.
 */
export function recommendConduitSize(
  conductorSizeMm2: number,
  conductorCount: number,
  wireType: WireType = 'thhn'
): ConduitSizeRecord {
  const validCount = Math.max(1, Math.round(conductorCount));
  const conductorRecord = findConductorAreaRecord(conductorSizeMm2);
  const singleArea =
    wireType === 'pv_wire'
      ? conductorRecord.pvWireTotalAreaMm2
      : conductorRecord.thhnTotalAreaMm2;
  const totalArea = validCount * singleArea;
  const maxAllowableFillPct = getMaxAllowableFillPct(validCount);

  for (const conduit of CONDUIT_SIZE_TABLE) {
    const fill = (totalArea / conduit.totalInternalAreaMm2) * 100;
    if (fill <= maxAllowableFillPct) {
      return conduit;
    }
  }

  return CONDUIT_SIZE_TABLE[CONDUIT_SIZE_TABLE.length - 1];
}

/**
 * Parses numerical trade diameter in mm from conduit spec strings.
 * e.g. "32mm² diameter PVC pipe" -> 32, "25mm diameter conduit" -> 25
 */
export function parseConduitDiameterMm(conduitSpec: string): number | null {
  if (!conduitSpec) return null;

  const match =
    conduitSpec.match(/(\d+(?:\.\d+)?)\s*(?:mm²|mm2|mm)?\s*diameter/i) ||
    conduitSpec.match(/(\d+)\s*mm/i);

  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  return null;
}
