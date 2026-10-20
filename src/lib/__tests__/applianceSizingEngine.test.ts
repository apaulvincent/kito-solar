// src/lib/__tests__/applianceSizingEngine.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateApplianceSizing,
  PRESET_APPLIANCES,
  STARTER_PROFILES,
  DEFAULT_SIZING_CONFIG,
  ApplianceItem,
} from '../applianceSizingEngine';

describe('Appliance Sizing Engine', () => {
  it('handles empty appliance list gracefully without NaN or negative values', () => {
    const result = calculateApplianceSizing([]);
    expect(result.totalDailyKwh).toBe(0);
    expect(result.continuousRunningWatts).toBe(0);
    expect(result.peakSystemSurgeWatts).toBe(0);
    expect(result.recommendedInverterKw).toBe(0);
    expect(result.recommendedPvKwp).toBe(0);
    expect(result.recommendedPanelCount).toBe(0);
    expect(result.recommendedBatteryKwh).toBe(0);
    expect(result.warnings).toEqual([]);
  });

  it('correctly calculates continuous running watts and surge for simple loads', () => {
    const items: ApplianceItem[] = [
      {
        id: '1',
        name: 'LED Bulb',
        category: 'lighting_utility',
        loadType: 'electronic',
        quantity: 5,
        runningWatts: 10,
        surgeMultiplier: 1.0,
        dutyCycle: 1.0,
        hoursPerDay: 5,
        daytimeRatio: 0.2,
        isCriticalBackup: true,
      },
      {
        id: '2',
        name: 'Desk Fan',
        category: 'cooling',
        loadType: 'inductive_motor',
        quantity: 1,
        runningWatts: 50,
        surgeMultiplier: 2.0, // Spike = 100 - 50 = 50W
        dutyCycle: 1.0,
        hoursPerDay: 8,
        daytimeRatio: 0.5,
        isCriticalBackup: false,
      },
    ];

    const result = calculateApplianceSizing(items, {
      ...DEFAULT_SIZING_CONFIG,
      primaryGoal: 'bill_savings',
      gridReliability: 'stable',
    });

    // Continuous: (5 * 10) + (1 * 50) = 100W
    expect(result.continuousRunningWatts).toBe(100);

    // Peak Surge: Continuous (100) + max spike (50W from fan) = 150W
    expect(result.largestSurgeSpikeWatts).toBe(50);
    expect(result.largestSurgeApplianceName).toBe('Desk Fan');
    expect(result.peakSystemSurgeWatts).toBe(150);

    // Inverter min required = max(100 * 1.25, 150 / 2) = 125W -> rounds up to 1.0 kW tier
    expect(result.recommendedInverterKw).toBe(1.0);
  });

  it('correctly handles motor surge spike driving inverter sizing (Edge Case from PRD)', () => {
    // PRD: 2 LED bulbs (20W) + 1 Submersible 1HP Water Pump (750W run / 3,000W surge; 4.0x multiplier)
    // Continuous run = 770W.
    // Surge spike = 750 * 4.0 - 750 = 2,250W.
    // Total system surge = 770 + 2,250 = 3,020W.
    // Inverter continuous needed: 770 * 1.25 = 962.5W.
    // Inverter needed for surge: 3,020 / 2.0 = 1,510W.
    // Recommended inverter must round up to at least 2.0 kW (not 1.0 kW)!
    const items: ApplianceItem[] = [
      {
        id: '1',
        name: 'LED Bulbs',
        category: 'lighting_utility',
        loadType: 'electronic',
        quantity: 2,
        runningWatts: 10,
        surgeMultiplier: 1.0,
        dutyCycle: 1.0,
        hoursPerDay: 5,
        daytimeRatio: 0.1,
        isCriticalBackup: true,
      },
      {
        id: '2',
        name: '1.0 HP Submersible Pump',
        category: 'lighting_utility',
        loadType: 'inductive_motor',
        quantity: 1,
        runningWatts: 750,
        surgeMultiplier: 4.0,
        dutyCycle: 1.0,
        hoursPerDay: 1,
        daytimeRatio: 0.8,
        isCriticalBackup: false,
      },
    ];

    const result = calculateApplianceSizing(items, DEFAULT_SIZING_CONFIG);

    expect(result.continuousRunningWatts).toBe(770);
    expect(result.largestSurgeSpikeWatts).toBe(2250);
    expect(result.largestSurgeApplianceName).toBe('1.0 HP Submersible Pump');
    expect(result.peakSystemSurgeWatts).toBe(3020);
    expect(result.recommendedInverterKw).toBe(2.0); // 2.0 kW handles up to 4,000W surge
    expect(result.warnings.some((w) => w.includes('Inverter sized up to 2 kW'))).toBe(true);
  });

  it('correctly applies duty cycle factor to energy calculations (fridge & inverter AC)', () => {
    const items: ApplianceItem[] = [
      {
        id: 'fridge',
        name: 'Inverter Refrigerator',
        category: 'kitchen',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 120,
        surgeMultiplier: 1.5,
        dutyCycle: 0.45, // Only runs 45% of 24h
        hoursPerDay: 24,
        daytimeRatio: 0.5,
        isCriticalBackup: true,
      },
    ];

    const result = calculateApplianceSizing(items, DEFAULT_SIZING_CONFIG);
    // Daily energy = 1 * 120W * 24h * 0.45 = 1,296 Wh = 1.30 kWh
    expect(result.totalDailyWh).toBe(1296);
    expect(result.totalDailyKwh).toBe(1.3);
  });

  it('selects Grid-Tie topology when user wants bill savings on stable grid with high daytime use', () => {
    const items: ApplianceItem[] = [
      {
        id: 'ac',
        name: '1.0 HP Inverter AC',
        category: 'cooling',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 750,
        surgeMultiplier: 1.2,
        dutyCycle: 0.7,
        hoursPerDay: 8,
        daytimeRatio: 0.8, // 80% daytime
        isCriticalBackup: false,
      },
    ];

    const result = calculateApplianceSizing(items, {
      ...DEFAULT_SIZING_CONFIG,
      primaryGoal: 'bill_savings',
      gridReliability: 'stable',
    });

    expect(result.recommendedTopology).toBe('grid_tie');
    expect(result.recommendedBatteryKwh).toBe(0);
    expect(result.recommendedBatteryUnits5kWh).toBe(0);
  });

  it('warns when user selects critical backup appliances in a Grid-Tie scenario', () => {
    const items: ApplianceItem[] = [
      {
        id: 'ac',
        name: '1.0 HP Inverter AC',
        category: 'cooling',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 750,
        surgeMultiplier: 1.2,
        dutyCycle: 0.7,
        hoursPerDay: 8,
        daytimeRatio: 0.8,
        isCriticalBackup: true, // Marked critical
      },
    ];

    const result = calculateApplianceSizing(items, {
      ...DEFAULT_SIZING_CONFIG,
      primaryGoal: 'bill_savings',
      gridReliability: 'stable',
    });

    expect(result.recommendedTopology).toBe('grid_tie');
    expect(result.warnings.some((w) => w.includes('Anti-Islanding') || w.includes('shut down during brownouts'))).toBe(true);
  });

  it('selects Hybrid with LiFePO4 battery when bill + backup or brownouts are specified', () => {
    const items: ApplianceItem[] = [
      {
        id: 'fan',
        name: 'DC Fan',
        category: 'cooling',
        loadType: 'electronic',
        quantity: 2,
        runningWatts: 25,
        surgeMultiplier: 1.1,
        dutyCycle: 1.0,
        hoursPerDay: 12,
        daytimeRatio: 0.5,
        isCriticalBackup: true,
      },
      {
        id: 'fridge',
        name: 'Fridge',
        category: 'kitchen',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 120,
        surgeMultiplier: 1.5,
        dutyCycle: 0.45,
        hoursPerDay: 24,
        daytimeRatio: 0.5,
        isCriticalBackup: true,
      },
    ];

    const result = calculateApplianceSizing(items, {
      ...DEFAULT_SIZING_CONFIG,
      primaryGoal: 'bill_and_backup',
      gridReliability: 'occasional_outages',
    });

    expect(result.recommendedTopology).toBe('hybrid');
    expect(result.recommendedBatteryKwh).toBeGreaterThanOrEqual(5.12);
    expect(result.recommendedBatteryUnits5kWh).toBeGreaterThanOrEqual(1);
    expect(result.estimatedBackupHours).toBeGreaterThan(0);
  });

  it('selects Off-Grid with days of autonomy buffer when 100% independence or no grid is set', () => {
    const items: ApplianceItem[] = [
      {
        id: 'pump',
        name: 'Submersible Pump',
        category: 'lighting_utility',
        loadType: 'inductive_motor',
        quantity: 1,
        runningWatts: 750,
        surgeMultiplier: 4.0,
        dutyCycle: 1.0,
        hoursPerDay: 2,
        daytimeRatio: 0.8,
        isCriticalBackup: true,
      },
    ];

    const result = calculateApplianceSizing(items, {
      ...DEFAULT_SIZING_CONFIG,
      primaryGoal: 'off_grid',
      gridReliability: 'no_grid',
      autonomyDays: 1.5,
    });

    expect(result.recommendedTopology).toBe('off_grid');
    expect(result.recommendedBatteryUnits5kWh).toBeGreaterThanOrEqual(1);
    expect(result.recommendedPvKwp).toBeGreaterThan(0);
  });

  it('starter profiles load valid preset appliances', () => {
    expect(STARTER_PROFILES.small_home_wfh.items.length).toBeGreaterThan(0);
    expect(STARTER_PROFILES.standard_family_home.items.length).toBeGreaterThan(0);
    expect(STARTER_PROFILES.offgrid_cabin_farm.items.length).toBeGreaterThan(0);

    const wfhResult = calculateApplianceSizing(
      STARTER_PROFILES.small_home_wfh.items.map((i, idx) => ({ ...i, id: `test_${idx}` })),
      DEFAULT_SIZING_CONFIG
    );
    expect(wfhResult.totalDailyKwh).toBeGreaterThan(1);
    expect(wfhResult.recommendedInverterKw).toBeGreaterThanOrEqual(1.0);
  });

  it('all 19 preset appliances have positive numbers and sensible values', () => {
    expect(PRESET_APPLIANCES.length).toBeGreaterThanOrEqual(18);
    PRESET_APPLIANCES.forEach((preset) => {
      expect(preset.defaultRunningWatts).toBeGreaterThan(0);
      expect(preset.surgeMultiplier).toBeGreaterThanOrEqual(1.0);
      expect(preset.dutyCycle).toBeGreaterThan(0);
      expect(preset.dutyCycle).toBeLessThanOrEqual(1.0);
      expect(preset.defaultHoursPerDay).toBeGreaterThan(0);
      expect(preset.defaultHoursPerDay).toBeLessThanOrEqual(24);
    });
  });
});
