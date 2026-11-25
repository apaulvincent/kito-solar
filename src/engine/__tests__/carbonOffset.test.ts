import { describe, it, expect } from 'vitest';
import {
  calculateCarbonOffset,
  DOE_PH_GRID_EMISSION_FACTOR_KG_PER_KWH,
  KG_CO2_PER_TREE_SEEDLING_10YR,
} from '../carbonOffset';

describe('Solar Environmental & Carbon Offset Engine Suite', () => {
  it('calculates annual and lifetime carbon offset accurately for a residential 5 kWp array', () => {
    // 5.0 kWp * 4.5 PSH * 365 days * 0.80 PR = 6,570 kWh/year
    const result = calculateCarbonOffset({
      totalArrayPowerKw: 5.0,
      peakSunHours: 4.5,
      performanceRatio: 0.8,
    });

    expect(result.annualGenerationKwh).toBe(6570);

    // Annual CO2 avoided: 6570 kWh * 0.7122 kg/kWh = 4679.154 kg = ~4.68 MT
    expect(result.annualCo2AvoidedKg).toBeCloseTo(4679.2, 1);
    expect(result.annualCo2AvoidedTons).toBeCloseTo(4.68, 2);

    // Lifetime 25-year generation with 0.5% annual degradation
    expect(result.lifetimeGenerationKwh).toBeGreaterThan(6570 * 20);
    expect(result.lifetimeCo2AvoidedTons).toBeGreaterThan(100);

    // Equivalencies
    // Trees: 4679.2 / 21.77 = ~215 trees
    expect(result.treesSeedlingsGrown10Yr).toBe(Math.round(4679.154 / KG_CO2_PER_TREE_SEEDLING_10YR));
    expect(result.barrelsOilAvoided).toBeGreaterThan(10);
    expect(result.coalAvoidedMetricTons).toBeGreaterThan(1.8);
    expect(result.vehicleKmTraveledAvoided).toBeGreaterThan(25000);
  });

  it('supports custom grid emission factor and system parameters', () => {
    const customResult = calculateCarbonOffset({
      totalArrayPowerKw: 10.0,
      gridEmissionFactorKgPerKwh: 0.5,
      lifespanYears: 30,
      annualDegradationRate: 0.004,
    });

    expect(customResult.gridEmissionFactor).toBe(0.5);
    // 10 kWp * 4.5 * 365 * 0.8 = 13,140 kWh/yr
    // 13,140 * 0.5 = 6,570 kg = 6.57 MT
    expect(customResult.annualCo2AvoidedTons).toBeCloseTo(6.57, 1);
  });

  it('handles zero or negative array power gracefully', () => {
    const zeroResult = calculateCarbonOffset({ totalArrayPowerKw: 0 });
    expect(zeroResult.annualGenerationKwh).toBe(0);
    expect(zeroResult.annualCo2AvoidedKg).toBe(0);
    expect(zeroResult.annualCo2AvoidedTons).toBe(0);
    expect(zeroResult.lifetimeCo2AvoidedTons).toBe(0);
    expect(zeroResult.treesSeedlingsGrown10Yr).toBe(0);
    expect(zeroResult.summaryText).toContain('No active PV array capacity specified');
  });

  it('strictly avoids em dashes in summary text', () => {
    const result = calculateCarbonOffset({ totalArrayPowerKw: 7.5 });
    expect(result.summaryText).not.toContain('—');
  });

  it('uses Philippine DOE grid emission factor default', () => {
    expect(DOE_PH_GRID_EMISSION_FACTOR_KG_PER_KWH).toBe(0.7122);
  });
});
