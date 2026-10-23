// src/features/financial-roi/__tests__/financialEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateTurnkeyCapex,
  computeScenarioSimulation,
  estimateSizingFromMonthlyBill,
  formatPaybackPeriod,
  simulateAllScenarios,
} from '../utils/financialEngine';
import { DEFAULT_FINANCIAL_CONFIG } from '../utils/utilityTariffPresets';
import { SystemSizingInput } from '../types/financialRoi';

describe('Financial ROI Calculation Engine', () => {
  const sampleInput: SystemSizingInput = {
    pvKwp: 5.8,
    inverterKw: 5.0,
    batteryKwh: 5.12,
    dailyTotalKwh: 20.0,
    dailyDaytimeKwh: 8.0,
    dailyNighttimeKwh: 12.0,
    effectivePsh: 4.5,
    systemEfficiency: 0.80,
    batteryDod: 0.80,
    batteryRoundTripEfficiency: 0.90,
  };

  it('calculates turnkey CAPEX benchmark accurately across topologies', () => {
    // Zero-export (Grid-tie, no battery, no net metering)
    const capexZero = calculateTurnkeyCapex(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'zero_export');
    expect(capexZero.batteryPhp).toBe(0);
    expect(capexZero.netMeteringSetupPhp).toBe(0);
    expect(capexZero.totalCapexPhp).toBeGreaterThan(150000);

    // Net Metering (includes setup cost ₱35,000)
    const capexNet = calculateTurnkeyCapex(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'net_metering');
    expect(capexNet.netMeteringSetupPhp).toBe(35000);
    expect(capexNet.totalCapexPhp).toBe(capexZero.totalCapexPhp + 35000);

    // Hybrid (includes hybrid inverter premium and battery)
    const capexHybrid = calculateTurnkeyCapex(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'hybrid_battery');
    expect(capexHybrid.batteryPhp).toBe(Math.round(5.12 * 13500));
    expect(capexHybrid.netMeteringSetupPhp).toBe(0);
    expect(capexHybrid.totalCapexPhp).toBeGreaterThan(capexZero.totalCapexPhp);
  });

  it('compounds utility tariff inflation accurately over 25 years', () => {
    const config = {
      ...DEFAULT_FINANCIAL_CONFIG,
      retailRatePhp: 10.0,
      annualTariffInflationPercent: 5.0,
    };
    const result = computeScenarioSimulation(sampleInput, config, 'zero_export');

    // Year 1 (index 1): rate = 10.0 * (1 + 0.05)^0 = 10.0
    expect(result.cashflowSeries[1].inflatedRetailRatePhp).toBe(10.0);

    // Year 2 (index 2): rate = 10.0 * 1.05 = 10.5
    expect(result.cashflowSeries[2].inflatedRetailRatePhp).toBe(10.5);

    // Year 25 (index 25): rate = 10.0 * (1.05)^24 ≈ 32.25
    const expectedYear25Rate = Math.round(10.0 * Math.pow(1.05, 24) * 100) / 100;
    expect(result.cashflowSeries[25].inflatedRetailRatePhp).toBe(expectedYear25Rate);
  });

  it('compounds solar panel degradation accurately over 25 years', () => {
    const config = {
      ...DEFAULT_FINANCIAL_CONFIG,
      annualPanelDegradationPercent: 0.5, // 0.5% per year
    };
    const result = computeScenarioSimulation(sampleInput, config, 'zero_export');

    // Year 1: health factor = 1.0
    expect(result.cashflowSeries[1].panelHealthFactor).toBe(1.0);

    // Year 25: health factor = (1 - 0.005)^24 ≈ 0.886
    const expectedYear25Health = Math.round(Math.pow(1 - 0.005, 24) * 1000) / 1000;
    expect(result.cashflowSeries[25].panelHealthFactor).toBe(expectedYear25Health);
    expect(result.cashflowSeries[25].annualGenerationKwh).toBeLessThan(
      result.cashflowSeries[1].annualGenerationKwh
    );
  });

  it('correctly throttles/clips surplus solar under Zero-Export vs exporting under Net Metering', () => {
    // 5.8 kWp * 4.5 PSH * 0.80 = 20.88 kWh/day generated
    // Daytime load = 8.0 kWh/day
    // Surplus = 20.88 - 8.0 = 12.88 kWh/day
    const zeroResult = computeScenarioSimulation(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'zero_export');
    expect(zeroResult.dailyKwhBreakdown.clippedWastedKwh).toBeCloseTo(12.9, 0.5);
    expect(zeroResult.dailyKwhBreakdown.gridExportedKwh).toBe(0);
    expect(zeroResult.energySplitPercent.clippedWasted).toBeGreaterThan(50);

    // Under Net Metering, surplus is exported and converted to savings
    const netResult = computeScenarioSimulation(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'net_metering');
    expect(netResult.dailyKwhBreakdown.clippedWastedKwh).toBe(0);
    expect(netResult.dailyKwhBreakdown.gridExportedKwh).toBeCloseTo(12.9, 0.5);
    expect(netResult.year1AnnualSavingsPhp).toBeGreaterThan(zeroResult.year1AnnualSavingsPhp);
  });

  it('stores surplus solar into LiFePO4 battery under Hybrid mode to offset night load', () => {
    const hybridResult = computeScenarioSimulation(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'hybrid_battery');
    // Usable battery = 5.12 * 0.80 = 4.096 kWh
    // Night load = 12.0 kWh
    // Battery stores up to usable capacity (~4.1 kWh)
    expect(hybridResult.dailyKwhBreakdown.batteryStoredKwh).toBeGreaterThan(3.5);
    expect(hybridResult.dailyKwhBreakdown.directSelfUseKwh).toBe(8.0);
    expect(hybridResult.year1AnnualSavingsPhp).toBeGreaterThan(
      computeScenarioSimulation(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'zero_export').year1AnnualSavingsPhp
    );
  });

  it('interpolates the exact breakeven month when cumulative cashflow crosses zero', () => {
    const result = computeScenarioSimulation(sampleInput, DEFAULT_FINANCIAL_CONFIG, 'net_metering');
    expect(result.paybackYears).not.toBeNull();
    expect(result.paybackYears).toBeGreaterThan(1);
    expect(result.paybackYears).toBeLessThan(12);
    expect(result.paybackMonthsTotal).toBe(Math.round(result.paybackYears! * 12));
    expect(result.paybackFormatted).toMatch(/\d+\s*(yr|mo)/);
  });

  it('handles edge case when payback exceeds 25 years without breaking', () => {
    const highCapexConfig = {
      ...DEFAULT_FINANCIAL_CONFIG,
      useCustomCapex: true,
      customCapexPhp: 10000000, // ₱10M on a 5.8 kWp system
    };
    const result = computeScenarioSimulation(sampleInput, highCapexConfig, 'zero_export');
    expect(result.paybackYears).toBeNull();
    expect(result.paybackMonthsTotal).toBeNull();
    expect(result.paybackFormatted).toBe('> 25 yrs');
  });

  it('formats payback durations cleanly and concisely', () => {
    expect(formatPaybackPeriod(null)).toBe('> 25 yrs');
    expect(formatPaybackPeriod(4.25)).toBe('4 yrs 3 mos');
    expect(formatPaybackPeriod(5.0)).toBe('5 yrs');
    expect(formatPaybackPeriod(0.5)).toBe('6 mos');
  });

  it('simulates all 4 scenarios simultaneously with comparative metrics', () => {
    const scenarios = simulateAllScenarios(sampleInput, DEFAULT_FINANCIAL_CONFIG);
    expect(scenarios.zero_export).toBeDefined();
    expect(scenarios.net_metering).toBeDefined();
    expect(scenarios.hybrid_battery).toBeDefined();
    expect(scenarios.hybrid_plus_net_metering).toBeDefined();

    expect(scenarios.net_metering.initialCapexPhp).toBeGreaterThan(scenarios.zero_export.initialCapexPhp);
    expect(scenarios.net_metering.netProfit25YearsPhp).toBeGreaterThan(scenarios.zero_export.netProfit25YearsPhp);
  });

  it('derives realistic system sizing inputs from standalone monthly electric bill slider', () => {
    const inputFromBill = estimateSizingFromMonthlyBill(8500, 11.85, 4.5);
    expect(inputFromBill.dailyTotalKwh).toBeGreaterThan(15);
    expect(inputFromBill.dailyDaytimeKwh).toBeLessThan(inputFromBill.dailyTotalKwh);
    expect(inputFromBill.pvKwp).toBeGreaterThan(3);
    expect(inputFromBill.inverterKw).toBeGreaterThan(2);
    expect(inputFromBill.batteryKwh).toBeGreaterThanOrEqual(5.12);
    expect(inputFromBill.sourceLabel).toContain('₱8,500/mo');
  });
});
