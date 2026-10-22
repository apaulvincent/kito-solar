// src/features/solar-mapper/__tests__/solarPhysics.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateOptimalTilt,
  calculateOrientationYieldFactor,
  calculateThermalDerating,
  buildMonthlyClimateSeries,
  getDefaultSunHour,
} from '../utils/solarPhysics';

describe('Solar Physics & Tropical Climatology Calculations', () => {
  it('calculates optimal tilt with tropical rainfall self-cleaning constraints', () => {
    // Equator / Davao: 7.2°N -> minimum 10°
    expect(calculateOptimalTilt(7.19)).toBe(10);

    // Manila / Batangas: 14.0°N -> 14 * 0.85 = 11.9 ≈ 12°
    expect(calculateOptimalTilt(14.044)).toBe(12);

    // Ilocos Norte: 18.2°N -> 18.2 * 0.85 = 15.47 ≈ 15°
    expect(calculateOptimalTilt(18.2)).toBe(15);
  });

  it('calculates orientation yield factors across cardinal azimuths', () => {
    // Flat roof (tilt = 0) has 100% yield regardless of azimuth
    expect(calculateOrientationYieldFactor(0, 0)).toBe(1.0);
    expect(calculateOrientationYieldFactor(0, 90)).toBe(1.0);
    expect(calculateOrientationYieldFactor(0, 180)).toBe(1.0);

    // South facing (180°) at 15° pitch is optimum (1.0)
    const southFactor = calculateOrientationYieldFactor(15, 180);
    expect(southFactor).toBe(1.0);

    // East (90°) / West (270°) at 15° pitch should be > 0.90
    const eastFactor = calculateOrientationYieldFactor(15, 90);
    expect(eastFactor).toBeGreaterThan(0.9);
    expect(eastFactor).toBeLessThan(1.0);

    // North (0°) at steep 30° pitch has significant penalty
    const northSteepFactor = calculateOrientationYieldFactor(30, 0);
    expect(northSteepFactor).toBeLessThan(0.85);
  });

  it('calculates operating cell temperature and thermal derating', () => {
    // At 25°C ambient, cell temp = 50°C, loss = -0.35% * 25°C = -8.75% -> factor ≈ 0.9125
    const derating25 = calculateThermalDerating(25, -0.35);
    expect(derating25.estimatedCellTempC).toBe(50);
    expect(derating25.tempDeratingFactor).toBeCloseTo(0.913, 2);

    // At 32°C hot tropical afternoon ambient, cell temp = 57°C, loss = -0.35% * 32°C = -11.2% -> factor ≈ 0.888
    const derating32 = calculateThermalDerating(32, -0.35);
    expect(derating32.estimatedCellTempC).toBe(57);
    expect(derating32.tempDeratingFactor).toBeCloseTo(0.888, 2);
  });

  it('builds a complete 12-month climate series and identifies extremes', () => {
    const monthlyGhi = [4.6, 5.1, 5.8, 5.9, 5.2, 4.6, 4.1, 3.7, 4.2, 4.6, 4.7, 4.4];
    const monthlyT2m = [26, 27, 28, 30, 31, 29, 28, 28, 28, 28, 27, 26];

    const profile = buildMonthlyClimateSeries(
      monthlyGhi,
      monthlyT2m,
      14.044,
      15,
      180,
      'Test Region'
    );

    expect(profile.monthlySeries.length).toBe(12);
    expect(profile.annualAvgRawPsh).toBeGreaterThan(4.5);
    expect(profile.annualAvgEffectivePsh).toBeLessThan(profile.annualAvgRawPsh); // Derated

    // Best month should be April (index 3)
    expect(profile.bestMonth.monthLabel).toBe('Apr');

    // Worst month should be August (index 7)
    expect(profile.worstMonth.monthLabel).toBe('Aug');

    // P25 should be <= annual average
    expect(profile.p25EffectivePsh).toBeLessThanOrEqual(profile.annualAvgEffectivePsh);
  });

  it('determines default sun hour from daytime local time or falls back to solar noon at night', () => {
    // 9:30 AM -> 9.5
    const morning = new Date(2026, 9, 22, 9, 30);
    expect(getDefaultSunHour(morning)).toBe(9.5);

    // 1:45 PM -> 13.75
    const afternoon = new Date(2026, 9, 22, 13, 45);
    expect(getDefaultSunHour(afternoon)).toBe(13.75);

    // 6:00 AM sunrise boundary -> 6.0
    const sunrise = new Date(2026, 9, 22, 6, 0);
    expect(getDefaultSunHour(sunrise)).toBe(6.0);

    // 6:00 PM sunset boundary -> 18.0
    const sunset = new Date(2026, 9, 22, 18, 0);
    expect(getDefaultSunHour(sunset)).toBe(18.0);

    // 10:30 PM nighttime -> defaults to 12.0 (solar noon) for clear 3D roof lighting
    const night = new Date(2026, 9, 22, 22, 30);
    expect(getDefaultSunHour(night)).toBe(12.0);

    // 3:00 AM pre-dawn -> defaults to 12.0
    const preDawn = new Date(2026, 9, 22, 3, 0);
    expect(getDefaultSunHour(preDawn)).toBe(12.0);
  });
});
