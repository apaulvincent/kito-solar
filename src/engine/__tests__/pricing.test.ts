// src/engine/__tests__/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { formatPeso } from '@/lib/utils';
import { calculateMounting } from '../calculateMounting';
import { calculateSystem } from '../calculateSystem';
import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';

describe('Pricing & Currency Engine Test Suite', () => {
  describe('formatPeso utility', () => {
    it('formats numbers into Philippine Peso with comma separators and 2 decimals', () => {
      expect(formatPeso(12450)).toBe('₱12,450.00');
      expect(formatPeso(95.5)).toBe('₱95.50');
      expect(formatPeso(450)).toBe('₱450.00');
      expect(formatPeso(1000000)).toBe('₱1,000,000.00');
    });

    it('returns TBD for null, undefined, 0, negative, or NaN values', () => {
      expect(formatPeso(null)).toBe('TBD');
      expect(formatPeso(undefined)).toBe('TBD');
      expect(formatPeso(0)).toBe('TBD');
      expect(formatPeso(-150)).toBe('TBD');
      expect(formatPeso(NaN)).toBe('TBD');
    });
  });

  describe('calculateMounting pricing integration', () => {
    it('populates unitPricePhp and totalPricePhp on all 6 mounting items', () => {
      const bom = calculateMounting(10, 2);
      expect(bom.items.length).toBe(6);
      expect(bom.totalMountingCostPhp).toBeGreaterThan(0);

      for (const item of bom.items) {
        expect(item.unitPricePhp).toBeDefined();
        expect(typeof item.unitPricePhp).toBe('number');
        expect(item.unitPricePhp).toBeGreaterThan(0);

        expect(item.totalPricePhp).toBeDefined();
        expect(item.totalPricePhp).toBe((item.unitPricePhp ?? 0) * item.quantity);
      }

      const expectedTotal = bom.items.reduce((s, i) => s + (i.totalPricePhp || 0), 0);
      expect(bom.totalMountingCostPhp).toBe(expectedTotal);
    });
  });

  describe('calculateSystem costSummary integration', () => {
    const inverter = (invertersSeed as SolarInverterRecord[]).find(
      (i) => i.model === 'SUN-6K-SG05LP1-EU'
    ) || (invertersSeed[0] as SolarInverterRecord);

    const moduleRecord = (modulesSeed as SolarModuleRecord[]).find(
      (m) => m.model === 'AIKO-M-500'
    ) || (modulesSeed[0] as SolarModuleRecord);

    const battery = (batteriesSeed as BatteryRecord[]).find(
      (b) => b.model === '51.2V-200 Ah'
    ) || (batteriesSeed[0] as BatteryRecord);

    it('produces complete costSummary with subtotals and grandTotal', () => {
      const result = calculateSystem({
        inverter,
        module: moduleRecord,
        battery,
        batteryCount: 1,
        gridVoltageV: 230,
        mainBreakerA: 100,
      });

      expect(result.costSummary).toBeDefined();
      expect(result.costSummary.grandTotalPhp).toBeGreaterThan(0);
      expect(result.costSummary.equipmentSubtotalPhp).toBeGreaterThan(0);
      expect(result.costSummary.mountingSubtotalPhp).toBeGreaterThan(0);
      expect(result.costSummary.switchgearSubtotalPhp).toBeGreaterThan(0);

      const sum =
        result.costSummary.equipmentSubtotalPhp +
        result.costSummary.mountingSubtotalPhp +
        result.costSummary.switchgearSubtotalPhp;
      expect(result.costSummary.grandTotalPhp).toBe(sum);
    });

    it('correctly tracks TBD items when an unpriced inverter or module is selected', () => {
      const unpricedInverter: SolarInverterRecord = {
        ...inverter,
        model: 'CUSTOM-EXPERIMENTAL-INV',
        price_php: null,
      };

      const result = calculateSystem({
        inverter: unpricedInverter,
        module: moduleRecord,
        battery: null,
        batteryCount: 0,
        gridVoltageV: 230,
        mainBreakerA: 100,
      });

      const invCostItem = result.costSummary.items.find((i) => i.key === 'inverter');
      expect(invCostItem).toBeDefined();
      expect(invCostItem?.isTbd).toBe(true);
      expect(invCostItem?.totalPricePhp).toBeNull();
      expect(result.costSummary.tbdItemCount).toBeGreaterThan(0);
      expect(result.costSummary.isFullyEstimated).toBe(false);
    });
  });
});
