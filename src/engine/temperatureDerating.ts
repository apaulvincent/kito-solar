/**
 * Philippine Electrical Code (PEC) 2017 Section 6.90.1.7 & NEC Article 690.7
 * Photovoltaic Temperature Voltage Derating & String Safety Verification Engine
 *
 * Provides deterministic voltage adjustments across thermal extremes:
 * 1. Cold Temperature String Voc Expansion:
 *    Under cold morning temperatures (e.g. 10 deg C to 12 deg C in Philippine highlands),
 *    module Voc increases significantly based on temperature coefficient Beta (Voc).
 *    Total string Voc must not exceed the inverter maximum DC voltage ceiling (Vpv,max).
 *
 * 2. Hot Temperature Cell Vmp Contraction:
 *    Under high tropical irradiance and 35 deg C ambient, nominal module operating
 *    temperature (NOCT) elevates cell temperatures to 65 deg C+, contracting Vmp.
 *    Total string Vmp must remain comfortably above the inverter minimum MPPT
 *    tracking voltage (Vmppt,min) to prevent MPPT dropout or clipping.
 */

export const DEFAULT_MIN_DESIGN_TEMP_C = 12; // Philippine highland cold reference
export const DEFAULT_MAX_DESIGN_AMBIENT_C = 35; // Tropical peak daytime ambient
export const DEFAULT_NOCT_C = 45; // Nominal Module Operating Temperature (deg C)
export const DEFAULT_PEAK_IRRADIANCE_W_M2 = 1000; // Peak solar irradiance (W/m2)
export const DEFAULT_BETA_VOC_PCT = -0.28; // % / deg C (typical mono PERC / TOPCon)
export const DEFAULT_GAMMA_VMP_PCT = -0.35; // % / deg C (typical mono PERC / TOPCon)

export type TemperatureDeratingStatus =
  | 'compliant'
  | 'overvoltage_hazard'
  | 'mppt_dropout_hazard'
  | 'critical_non_compliant';

export interface TemperatureDeratingParams {
  moduleVoc: number;
  moduleVmp: number;
  panelsPerString: number;
  inverterMaxVoltage: number;
  inverterMinMpptVoltage: number;
  inverterMaxMpptVoltage?: number;
  minAmbientTempC?: number;
  maxAmbientTempC?: number;
  betaVocPct?: number;
  gammaVmpPct?: number;
  noctC?: number;
  irradianceWm2?: number;
}

export interface TemperatureDeratingResult {
  coldAmbientTempC: number;
  maxAmbientTempC: number;
  maxCellTempC: number;
  coldModuleVocV: number;
  hotModuleVmpV: number;
  coldStringVocV: number;
  hotStringVmpV: number;
  maxPvVoltageV: number;
  minMpptVoltageV: number;
  maxMpptVoltageV: number;
  coldVocMarginV: number;
  hotVmpMarginV: number;
  isColdCompliant: boolean;
  isHotCompliant: boolean;
  status: TemperatureDeratingStatus;
  advisory: string;
}

/**
 * Calculates estimated operating cell temperature (Tcell) using NOCT formula:
 * Tcell = Tambient + ((NOCT - 20) / 800) * G
 */
export function calculateCellTemperature(
  ambientTempC: number = DEFAULT_MAX_DESIGN_AMBIENT_C,
  noctC: number = DEFAULT_NOCT_C,
  irradianceWm2: number = DEFAULT_PEAK_IRRADIANCE_W_M2
): number {
  const safeAmbient = Math.max(-20, ambientTempC);
  const safeNoct = Math.max(25, noctC);
  const safeIrradiance = Math.max(0, irradianceWm2);
  const cellTemp = safeAmbient + ((safeNoct - 20) / 800) * safeIrradiance;
  return Number(cellTemp.toFixed(1));
}

/**
 * Calculates cold-adjusted open-circuit voltage (Voc) per module at minimum ambient temperature:
 * Voc(cold) = Voc(STC) * [1 + (Beta_Voc / 100) * (Tmin - 25)]
 */
export function calculateColdVoc(
  stcVocV: number,
  minAmbientTempC: number = DEFAULT_MIN_DESIGN_TEMP_C,
  betaVocPct: number = DEFAULT_BETA_VOC_PCT
): number {
  const safeVoc = Math.max(0, stcVocV);
  const deltaT = minAmbientTempC - 25;
  const tempCorrection = 1 + (betaVocPct / 100) * deltaT;
  return Number((safeVoc * tempCorrection).toFixed(2));
}

/**
 * Calculates hot-adjusted maximum power voltage (Vmp) per module at elevated cell operating temperature:
 * Vmp(hot) = Vmp(STC) * [1 + (Gamma_Vmp / 100) * (Tcell - 25)]
 */
export function calculateHotVmp(
  stcVmpV: number,
  maxCellTempC: number,
  gammaVmpPct: number = DEFAULT_GAMMA_VMP_PCT
): number {
  const safeVmp = Math.max(0, stcVmpV);
  const deltaT = maxCellTempC - 25;
  const tempCorrection = 1 + (gammaVmpPct / 100) * deltaT;
  return Number((safeVmp * tempCorrection).toFixed(2));
}

/**
 * Computes maximum allowable series modules per string before cold Voc breaches inverter ceiling:
 * N_max = floor(V_pv,max / Voc(cold))
 */
export function calculateMaxSeriesPanelsForVoc(
  stcVocV: number,
  maxPvVoltageV: number,
  minAmbientTempC: number = DEFAULT_MIN_DESIGN_TEMP_C,
  betaVocPct: number = DEFAULT_BETA_VOC_PCT
): number {
  const coldVoc = calculateColdVoc(stcVocV, minAmbientTempC, betaVocPct);
  if (coldVoc <= 0 || maxPvVoltageV <= 0) return 0;
  return Math.floor(maxPvVoltageV / coldVoc);
}

/**
 * Computes minimum required series modules per string to maintain MPPT tracking in hot conditions:
 * N_min = ceil(V_mppt,min / Vmp(hot))
 */
export function calculateMinSeriesPanelsForMppt(
  stcVmpV: number,
  minMpptVoltageV: number,
  maxAmbientTempC: number = DEFAULT_MAX_DESIGN_AMBIENT_C,
  noctC: number = DEFAULT_NOCT_C,
  gammaVmpPct: number = DEFAULT_GAMMA_VMP_PCT,
  irradianceWm2: number = DEFAULT_PEAK_IRRADIANCE_W_M2
): number {
  const cellTemp = calculateCellTemperature(maxAmbientTempC, noctC, irradianceWm2);
  const hotVmp = calculateHotVmp(stcVmpV, cellTemp, gammaVmpPct);
  if (hotVmp <= 0 || minMpptVoltageV <= 0) return 1;
  return Math.ceil(minMpptVoltageV / hotVmp);
}

/**
 * Executes full photovoltaic string temperature derating and safety verification.
 */
export function calculateTemperatureDerating(
  params: TemperatureDeratingParams
): TemperatureDeratingResult {
  const minAmbient = params.minAmbientTempC ?? DEFAULT_MIN_DESIGN_TEMP_C;
  const maxAmbient = params.maxAmbientTempC ?? DEFAULT_MAX_DESIGN_AMBIENT_C;
  const betaVoc = params.betaVocPct ?? DEFAULT_BETA_VOC_PCT;
  const gammaVmp = params.gammaVmpPct ?? DEFAULT_GAMMA_VMP_PCT;
  const noct = params.noctC ?? DEFAULT_NOCT_C;
  const irradiance = params.irradianceWm2 ?? DEFAULT_PEAK_IRRADIANCE_W_M2;
  const seriesCount = Math.max(1, params.panelsPerString);

  const maxCellTemp = calculateCellTemperature(maxAmbient, noct, irradiance);
  const coldModuleVoc = calculateColdVoc(params.moduleVoc, minAmbient, betaVoc);
  const hotModuleVmp = calculateHotVmp(params.moduleVmp, maxCellTemp, gammaVmp);

  const coldStringVoc = Number((coldModuleVoc * seriesCount).toFixed(1));
  const hotStringVmp = Number((hotModuleVmp * seriesCount).toFixed(1));

  const maxPvVoltage = params.inverterMaxVoltage;
  const minMpptVoltage = params.inverterMinMpptVoltage;
  const maxMpptVoltage = params.inverterMaxMpptVoltage ?? maxPvVoltage;

  const coldVocMargin = Number((maxPvVoltage - coldStringVoc).toFixed(1));
  const hotVmpMargin = Number((hotStringVmp - minMpptVoltage).toFixed(1));

  const isColdCompliant = coldStringVoc <= maxPvVoltage;
  const isHotCompliant = hotStringVmp >= minMpptVoltage;

  let status: TemperatureDeratingStatus;
  let advisory: string;

  if (isColdCompliant && isHotCompliant) {
    status = 'compliant';
    advisory = `Temperature derating verified per PEC 2017 Section 6.90.1.7. At ${minAmbient} deg C cold reference, string Voc expands to ${coldStringVoc} V (${coldVocMargin} V safety buffer below ${maxPvVoltage} V limit). At ${maxCellTemp} deg C cell temperature, string Vmp settles at ${hotStringVmp} V (${hotVmpMargin} V above inverter ${minMpptVoltage} V MPPT minimum).`;
  } else if (!isColdCompliant && !isHotCompliant) {
    status = 'critical_non_compliant';
    advisory = `Critical temperature non-compliance: String cold Voc (${coldStringVoc} V) breaches inverter maximum input (${maxPvVoltage} V) by ${Math.abs(coldVocMargin)} V, and summer hot Vmp (${hotStringVmp} V) drops below inverter MPPT minimum (${minMpptVoltage} V). Reduce module series count or redesign string array.`;
  } else if (!isColdCompliant) {
    status = 'overvoltage_hazard';
    advisory = `Overvoltage hazard: At ${minAmbient} deg C, cold string Voc expands to ${coldStringVoc} V, exceeding inverter safety ceiling of ${maxPvVoltage} V by ${Math.abs(coldVocMargin)} V. Modules must not exceed ${calculateMaxSeriesPanelsForVoc(params.moduleVoc, maxPvVoltage, minAmbient, betaVoc)} in series.`;
  } else {
    status = 'mppt_dropout_hazard';
    advisory = `MPPT dropout warning: Under tropical peak heat (${maxCellTemp} deg C cell temp), hot string Vmp contracts to ${hotStringVmp} V, falling ${Math.abs(hotVmpMargin)} V below inverter MPPT threshold of ${minMpptVoltage} V. Strings require at least ${calculateMinSeriesPanelsForMppt(params.moduleVmp, minMpptVoltage, maxAmbient, noct, gammaVmp, irradiance)} modules in series to avoid power clipping.`;
  }

  return {
    coldAmbientTempC: minAmbient,
    maxAmbientTempC: maxAmbient,
    maxCellTempC: maxCellTemp,
    coldModuleVocV: coldModuleVoc,
    hotModuleVmpV: hotModuleVmp,
    coldStringVocV: coldStringVoc,
    hotStringVmpV: hotStringVmp,
    maxPvVoltageV: maxPvVoltage,
    minMpptVoltageV: minMpptVoltage,
    maxMpptVoltageV: maxMpptVoltage,
    coldVocMarginV: coldVocMargin,
    hotVmpMarginV: hotVmpMargin,
    isColdCompliant,
    isHotCompliant,
    status,
    advisory,
  };
}
