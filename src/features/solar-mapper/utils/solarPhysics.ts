// src/features/solar-mapper/utils/solarPhysics.ts
import { degToRad } from './geodesicMath';
import { MonthlyClimatePoint, LocationIrradianceProfile, IrradianceSource } from '../types/solarMapper';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Calculates optimal tilt angle for year-round solar harvest.
 * In tropical latitudes (e.g. Philippines 5°N - 20°N), optimal tilt is latitude * 0.85,
 * with a practical minimum of 10° for self-cleaning via rainfall.
 */
export function calculateOptimalTilt(latitude: number): number {
  const absLat = Math.abs(latitude);
  const calculated = Math.round(absLat * 0.85);
  return Math.max(10, Math.min(45, calculated));
}

/**
 * Calculates orientation yield factor relative to optimal South-facing azimuth.
 * Northern Hemisphere: 180° is South.
 * On flat roofs (tilt ≈ 0°), azimuth has zero penalty.
 * On pitched roofs, East/West gives ≈ 92-95%, North gives 78-85% depending on pitch.
 */
export function calculateOrientationYieldFactor(
  tiltDeg: number,
  azimuthDeg: number,
  _latitude: number = 14
): number {
  const clampedTilt = Math.min(60, Math.max(0, tiltDeg));
  if (clampedTilt < 3) return 1.0; // Flat roofs harvest omni-directionally

  // Angular distance from optimum South (180°)
  const normalizedAzimuth = ((azimuthDeg % 360) + 360) % 360;
  const devFromSouthDeg = Math.min(
    Math.abs(normalizedAzimuth - 180),
    360 - Math.abs(normalizedAzimuth - 180)
  );

  // Normalized deviation: 0 (South) to 1 (North)
  const normDev = devFromSouthDeg / 180;
  const sinTilt = Math.sin(degToRad(clampedTilt));

  // Tilt penalty increases with deviation from South
  const penalty = Math.pow(normDev, 1.6) * 0.38 * sinTilt;
  const factor = 1.0 - penalty;

  // Clamp within reasonable physical bounds (0.70 to 1.04)
  return Math.round(Math.max(0.7, Math.min(1.04, factor)) * 1000) / 1000;
}

/**
 * Calculates temperature derating for solar modules.
 * Standard NOCT (Nominal Operating Cell Temperature) is 45°C at 800 W/m² irradiance.
 * Under tropical daylight, operating cell temperature exceeds ambient by ~25°C.
 */
export function calculateThermalDerating(
  ambientTempC: number,
  tempCoeffPercentPerC: number = -0.35, // -0.35%/°C for modern N-Type TOPCon
  _noct: number = 45
): {
  estimatedCellTempC: number;
  tempDeratingFactor: number;
  thermalLossPercent: number;
} {
  // Operating cell temperature under daytime solar load
  const estimatedCellTempC = Math.round((ambientTempC + 25) * 10) / 10;
  const deltaT = Math.max(0, estimatedCellTempC - 25);
  const lossFraction = (Math.abs(tempCoeffPercentPerC) / 100) * deltaT;
  const tempDeratingFactor = Math.max(0.7, Math.min(1.0, 1.0 - lossFraction));

  return {
    estimatedCellTempC,
    tempDeratingFactor: Math.round(tempDeratingFactor * 1000) / 1000,
    thermalLossPercent: Math.round(lossFraction * 1000) / 10,
  };
}

/**
 * Builds 12-month climate series combining GHI, ambient temperature,
 * pitch tilt transposition, and thermal derating into effective PSH.
 */
export function buildMonthlyClimateSeries(
  monthlyGhiKwhM2: number[], // 12 monthly horizontal PSH values
  monthlyT2mC: number[], // 12 monthly ambient temperatures (°C)
  latitude: number,
  pitchDeg: number,
  azimuthDeg: number,
  locationName: string,
  source: IrradianceSource = 'nasa_power',
  longitude: number = 121.158
): LocationIrradianceProfile {
  const optimalTilt = calculateOptimalTilt(latitude);
  const orientationFactor = calculateOrientationYieldFactor(pitchDeg, azimuthDeg, latitude);

  const series: MonthlyClimatePoint[] = [];

  for (let i = 0; i < 12; i++) {
    const rawGhi = monthlyGhiKwhM2[i] ?? 4.5;
    const ambientTemp = monthlyT2mC[i] ?? 28;

    // Tilted Plane of Array (POA) irradiance estimate
    // In tropics, a modest South tilt (10-15°) boosts dry season harvest by 2-5%
    const tiltBoostFactor =
      1.0 + 0.05 * Math.sin(degToRad(pitchDeg)) * (i < 4 || i > 9 ? 1.0 : -0.3);
    const tiltedPoa = Math.round(rawGhi * tiltBoostFactor * 100) / 100;

    const { estimatedCellTempC, tempDeratingFactor } = calculateThermalDerating(ambientTemp);

    // Effective PSH accounts for POA, temperature losses, and roof azimuth orientation
    const effectivePsh =
      Math.round(tiltedPoa * tempDeratingFactor * orientationFactor * 100) / 100;

    series.push({
      monthIndex: i,
      monthLabel: MONTH_LABELS[i],
      rawGhiKwhM2: rawGhi,
      tiltedPoaKwhM2: tiltedPoa,
      ambientTempC: ambientTemp,
      estimatedCellTempC,
      tempDeratingFactor,
      effectivePsh,
    });
  }

  // Summary statistics
  const rawSum = series.reduce((acc, m) => acc + m.rawGhiKwhM2, 0);
  const effectiveSum = series.reduce((acc, m) => acc + m.effectivePsh, 0);

  const annualAvgRawPsh = Math.round((rawSum / 12) * 100) / 100;
  const annualAvgEffectivePsh = Math.round((effectiveSum / 12) * 100) / 100;

  // Identify Worst & Best Month
  let worstMonth = {
    monthLabel: series[0].monthLabel,
    rawPsh: series[0].rawGhiKwhM2,
    effectivePsh: series[0].effectivePsh,
  };
  let bestMonth = {
    monthLabel: series[0].monthLabel,
    rawPsh: series[0].rawGhiKwhM2,
    effectivePsh: series[0].effectivePsh,
  };

  for (const m of series) {
    if (m.effectivePsh < worstMonth.effectivePsh) {
      worstMonth = {
        monthLabel: m.monthLabel,
        rawPsh: m.rawGhiKwhM2,
        effectivePsh: m.effectivePsh,
      };
    }
    if (m.effectivePsh > bestMonth.effectivePsh) {
      bestMonth = {
        monthLabel: m.monthLabel,
        rawPsh: m.rawGhiKwhM2,
        effectivePsh: m.effectivePsh,
      };
    }
  }

  // 25th Percentile calculation (P25 conservative)
  const sortedEffective = [...series.map((m) => m.effectivePsh)].sort((a, b) => a - b);
  // P25 index in 12 items: 12 * 0.25 = 3
  const p25EffectivePsh = sortedEffective[2] ?? annualAvgEffectivePsh;

  return {
    latitude,
    longitude,
    locationName,
    source,
    fetchedAtIso: new Date().toISOString(),
    optimalTiltDeg: optimalTilt,
    optimalAzimuthDeg: 180,
    annualAvgRawPsh,
    annualAvgEffectivePsh,
    worstMonth,
    bestMonth,
    p25EffectivePsh,
    monthlySeries: series,
  };
}

/**
 * Calculates default sun hour matching the user's current local time during daylight hours (6 AM to 6 PM).
 * Defaults to 12 PM solar noon if outside daylight hours to ensure the 3D roof is clearly illuminated.
 */
export function getDefaultSunHour(date: Date = new Date()): number {
  const decimal = date.getHours() + date.getMinutes() / 60;
  if (decimal >= 6.0 && decimal <= 18.0) {
    return Math.round(decimal * 100) / 100;
  }
  return 12.0;
}
