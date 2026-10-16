// src/lib/solar/__tests__/sizing-engine.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeAndMatchSolarSystem,
  recalculateWithOverrides,
  calculateColdVoc,
  calculateHotVmp,
  resolveTariff,
} from '../sizing-engine';

describe('Deterministic Solar Sizing Engine', () => {
  it('correctly calculates temperature-corrected Voc and Vmp', () => {
    // Canadian Solar 550W: Voc 49.6V, gamma -0.26%/C
    // At 18°C (deltaT = -7°C): 1 + (-0.0026 * -7) = 1.0182 -> 49.6 * 1.0182 = 50.5V
    const coldVoc = calculateColdVoc(49.6, -0.26, 18.0);
    expect(coldVoc).toBeGreaterThan(49.6);
    expect(coldVoc).toBeCloseTo(50.5, 0);

    // At 65°C cell temp (deltaT = 40°C): 1 + (-0.0026 * 40) = 0.896 -> 41.7 * 0.896 = 37.36V
    const hotVmp = calculateHotVmp(41.7, -0.26, 65.0);
    expect(hotVmp).toBeLessThan(41.7);
    expect(hotVmp).toBeCloseTo(37.36, 0);
  });

  it('resolves regional Philippine tariffs properly', () => {
    const lagunaTariff = resolveTariff('San Pablo City, Laguna');
    expect(lagunaTariff.utility_provider).toBe('Meralco');
    expect(lagunaTariff.rate_php_per_kwh).toBe(11.85);

    const cebuTariff = resolveTariff('Cebu City');
    expect(cebuTariff.utility_provider).toBe('Visayan Electric (VECO)');
    expect(cebuTariff.rate_php_per_kwh).toBe(12.1);
  });

  it('correctly sizes a ₱12,000 monthly bill hybrid solar setup (PRD Flow 1)', () => {
    const result = computeAndMatchSolarSystem({
      monthlyBillPhp: 12000,
      location: 'San Pablo City, Laguna',
      systemType: 'hybrid',
      daytimeLoadRatio: 0.65,
      targetOffsetRatio: 0.85,
    });

    // 12000 / 11.85 = ~1012.66 kWh/mo (~33.76 kWh/day)
    expect(result.inputSummary.estimatedMonthlyKwh).toBeCloseTo(1012.66, 1);
    expect(result.inputSummary.estimatedDailyKwh).toBeCloseTo(33.76, 1);

    // Target array sizing: ~7.5 to 8.5 kWp
    expect(result.engineeringSpecs.targetArrayKwp).toBeGreaterThan(7.0);
    expect(result.engineeringSpecs.targetArrayKwp).toBeLessThan(9.5);

    // Panels should be matched (e.g., 580W Jinko N-Type)
    expect(result.billOfMaterials.panel.wattageWp).toBe(580);
    expect(result.billOfMaterials.panel.quantity).toBeGreaterThanOrEqual(12);

    // Hybrid inverter should be chosen (e.g. Deye 8kW hybrid)
    expect(result.billOfMaterials.inverter.systemType).toBe('hybrid');
    expect(result.billOfMaterials.inverter.ratedAcKw).toBeGreaterThanOrEqual(6.0);

    // Battery bank should be sized
    expect(result.billOfMaterials.battery).not.toBeNull();
    expect(result.billOfMaterials.battery!.totalStorageKwh).toBeGreaterThanOrEqual(10.0);

    // String configurations should be safe within MPPT parameters
    expect(result.engineeringSpecs.stringConfigurations.length).toBeGreaterThanOrEqual(1);
    for (const stringConfig of result.engineeringSpecs.stringConfigurations) {
      expect(stringConfig.isWithinSafeLimits).toBe(true);
      expect(stringConfig.stringVocColdV).toBeLessThanOrEqual(500); // Deye max DC is 500V
    }

    // Financial ROI
    expect(result.financialRoi.estimatedMonthlySavingsPhp).toBeGreaterThan(8000);
    expect(result.financialRoi.paybackPeriodYears).toBeGreaterThan(2.0);
    expect(result.financialRoi.paybackPeriodYears).toBeLessThan(7.0);
    expect(result.financialRoi.fiveYearNetSavingsPhp).toBeDefined();
  });

  it('correctly handles what-if scenario overrides (PRD Flow 2)', () => {
    const modified = recalculateWithOverrides({
      monthlyBillPhp: 12000,
      location: 'San Pablo City, Laguna',
      systemType: 'hybrid',
      overridePanelCount: 10,
      overrideInverterKw: 8,
      overrideBatteryKwh: 5.12,
    });

    expect(modified.billOfMaterials.panel.quantity).toBe(10);
    expect(modified.billOfMaterials.inverter.ratedAcKw).toBe(8);
    expect(modified.billOfMaterials.battery!.totalStorageKwh).toBe(5.12);
    expect(modified.engineeringSpecs.actualArrayKwp).toBe(5.8); // 10 * 580W = 5.8 kWp
    expect(modified.engineeringSpecs.stringConfigurations[0].isWithinSafeLimits).toBe(true);
  });

  it('supports grid-tie configuration without battery', () => {
    const gridTieResult = computeAndMatchSolarSystem({
      monthlyBillPhp: 8000,
      location: 'Metro Manila',
      systemType: 'grid-tie',
    });

    expect(gridTieResult.inputSummary.systemType).toBe('grid-tie');
    expect(gridTieResult.billOfMaterials.battery).toBeNull();
    expect(gridTieResult.financialRoi.paybackPeriodYears).toBeLessThan(5.0);
  });
});
