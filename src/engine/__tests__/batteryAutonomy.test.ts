import { describe, it, expect } from 'vitest';
import {
  detectBatteryChemistry,
  formatRuntimeHours,
  calculateBatteryAutonomy,
  DEFAULT_LITHIUM_DOD_PCT,
  DEFAULT_LEAD_ACID_DOD_PCT,
} from '../batteryAutonomy';

describe('Battery Storage Autonomy & Backup Calculation Engine', () => {
  describe('Chemistry Detection', () => {
    it('identifies lead-acid / gel / AGM configurations', () => {
      expect(detectBatteryChemistry('12V 200Ah Deep Cycle AGM')).toBe('lead_acid');
      expect(detectBatteryChemistry('Gel Tubular Flooded 2V')).toBe('lead_acid');
    });

    it('identifies lithium-ion / NMC configurations', () => {
      expect(detectBatteryChemistry('LG Chem NMC 48V')).toBe('lithium_ion');
      expect(detectBatteryChemistry('Ternary Lithium 14S')).toBe('lithium_ion');
    });

    it('defaults to lifepo4 for modern energy storage models', () => {
      expect(detectBatteryChemistry('51.2V-200 Ah')).toBe('lifepo4');
      expect(detectBatteryChemistry('Dyness Powerbox Pro')).toBe('lifepo4');
      expect(detectBatteryChemistry(undefined)).toBe('lifepo4');
    });
  });

  describe('formatRuntimeHours', () => {
    it('formats minutes for sub-hour runtimes', () => {
      expect(formatRuntimeHours(0.5)).toBe('30 min');
      expect(formatRuntimeHours(0.75)).toBe('45 min');
    });

    it('formats exact and mixed hours', () => {
      expect(formatRuntimeHours(5.0)).toBe('5 hrs');
      expect(formatRuntimeHours(8.5)).toBe('8h 30m');
      expect(formatRuntimeHours(24.25)).toBe('24h 15m');
    });

    it('handles zero or negative hours safely', () => {
      expect(formatRuntimeHours(0)).toBe('0 min');
      expect(formatRuntimeHours(-2)).toBe('0 min');
    });
  });

  describe('calculateBatteryAutonomy', () => {
    it('computes net usable energy and runtimes for standard 51.2V 200Ah LiFePO4 bank', () => {
      // 51.2V * 200Ah = 10,240 Wh gross
      // Net usable = 10,240 * 0.90 (DoD) * 0.94 (eff) = 8,662.656 Wh = 8.66 kWh
      const result = calculateBatteryAutonomy({
        nominalEnergyWh: 10240,
        nominalVoltageV: 51.2,
        capacityAh: 200,
        dischargeCurrentA: 150,
        inverterRatedPowerW: 6000,
        batteryModelName: '51.2V-200 Ah',
      });

      expect(result.chemistry).toBe('lifepo4');
      expect(result.recommendedDodPct).toBe(DEFAULT_LITHIUM_DOD_PCT);
      expect(result.grossCapacityKwh).toBe(10.24);
      expect(result.netUsableCapacityKwh).toBeCloseTo(8.66, 1);

      // Max discharge: 51.2V * 150A = 7,680 W >= 6,000 W inverter -> not throttled
      expect(result.maxDischargePowerW).toBe(7680);
      expect(result.isDischargeThrottled).toBe(false);
      expect(result.inverterPowerCoveragePct).toBeGreaterThan(100);
      expect(result.status).toBe('optimal');

      // Light load: ~8,663 / 300 = ~28.87 hrs
      expect(result.runtimes.lightLoad.runtimeHours).toBeCloseTo(28.87, 0.5);
      expect(result.runtimes.lightLoad.formattedRuntime).toContain('h');

      // Moderate load: ~8,663 / 800 = ~10.83 hrs
      expect(result.runtimes.moderateLoad.runtimeHours).toBeCloseTo(10.83, 0.5);

      // Heavy load: ~8,663 / 2000 = ~4.33 hrs
      expect(result.runtimes.heavyLoad.runtimeHours).toBeCloseTo(4.33, 0.5);

      // Full inverter load: ~8,663 / 6000 = ~1.44 hrs
      expect(result.runtimes.fullInverterLoad).toBeDefined();
      expect(result.runtimes.fullInverterLoad?.runtimeHours).toBeCloseTo(1.44, 0.5);
    });

    it('identifies discharge throttling when battery discharge power is lower than inverter rated capacity', () => {
      // 51.2V * 50A discharge = 2,560 W discharge vs 6,000 W inverter
      const result = calculateBatteryAutonomy({
        nominalEnergyWh: 5120,
        nominalVoltageV: 51.2,
        capacityAh: 100,
        dischargeCurrentA: 50,
        inverterRatedPowerW: 6000,
        batteryModelName: '51.2V-100 Ah Rack',
      });

      expect(result.maxDischargePowerW).toBe(2560);
      expect(result.isDischargeThrottled).toBe(true);
      expect(result.inverterPowerCoveragePct).toBeCloseTo(42.7, 1);
      expect(result.status).toBe('throttled');
      expect(result.advisory).toContain('Battery discharge capacity');
      expect(result.advisory).toContain('is below inverter rated output');
    });

    it('applies 50% DoD for lead-acid battery banks', () => {
      const result = calculateBatteryAutonomy({
        nominalEnergyWh: 4800,
        nominalVoltageV: 48.0,
        capacityAh: 100,
        dischargeCurrentA: 50,
        inverterRatedPowerW: 3000,
        batteryModelName: '48V Deep Cycle Lead Acid Bank',
      });

      expect(result.chemistry).toBe('lead_acid');
      expect(result.recommendedDodPct).toBe(DEFAULT_LEAD_ACID_DOD_PCT);
      // Net usable = 4800 * 0.50 * 0.80 = 1,920 Wh = 1.92 kWh
      expect(result.netUsableCapacityKwh).toBe(1.92);
      expect(result.status).toBe('throttled'); // 2400W < 3000W
    });

    it('contains strictly zero em dashes in generated advisories', () => {
      const optimal = calculateBatteryAutonomy({
        nominalEnergyWh: 10240,
        nominalVoltageV: 51.2,
        capacityAh: 200,
        dischargeCurrentA: 150,
        inverterRatedPowerW: 6000,
      });

      const throttled = calculateBatteryAutonomy({
        nominalEnergyWh: 5120,
        nominalVoltageV: 51.2,
        capacityAh: 100,
        dischargeCurrentA: 50,
        inverterRatedPowerW: 6000,
      });

      const small = calculateBatteryAutonomy({
        nominalEnergyWh: 2400,
        nominalVoltageV: 48.0,
        capacityAh: 50,
        dischargeCurrentA: 50,
        inverterRatedPowerW: 2000,
      });

      expect(optimal.advisory).not.toContain('—');
      expect(throttled.advisory).not.toContain('—');
      expect(small.advisory).not.toContain('—');
    });
  });
});
