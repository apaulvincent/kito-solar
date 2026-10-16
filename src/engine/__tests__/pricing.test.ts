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
      expect(result.costSummary.financialRoi?.canComputeRoi).toBe(true);
      expect(result.costSummary.financialRoi?.paybackPeriodYears).toBeGreaterThan(0);
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

      // ROI and Payback MUST be null/unavailable when components are TBD
      expect(result.costSummary.financialRoi?.canComputeRoi).toBe(false);
      expect(result.costSummary.financialRoi?.paybackPeriodYears).toBeNull();
      expect(result.costSummary.financialRoi?.roiUnavailableReason).toContain('marked TBD');
    });

    it('allows customPrices to override unit prices and resolves TBD items to enable full ROI computation', () => {
      const unpricedInverter: SolarInverterRecord = {
        ...inverter,
        model: 'CUSTOM-EXPERIMENTAL-INV',
        price_php: null,
      };

      // When custom price is provided for the unpriced inverter
      const resultWithCustom = calculateSystem({
        inverter: unpricedInverter,
        module: moduleRecord,
        battery: null,
        batteryCount: 0,
        gridVoltageV: 230,
        mainBreakerA: 100,
        customPrices: {
          inverter: 95000,
          mounting_roof_rail: 500,
        },
      });

      const invItem = resultWithCustom.costSummary.items.find((i) => i.key === 'inverter');
      expect(invItem).toBeDefined();
      expect(invItem?.unitPricePhp).toBe(95000);
      expect(invItem?.totalPricePhp).toBe(95000);
      expect(invItem?.isTbd).toBe(false);
      expect(invItem?.isCustomPrice).toBe(true);

      const railItem = resultWithCustom.costSummary.items.find((i) => i.key === 'mounting_roof_rail');
      expect(railItem).toBeDefined();
      expect(railItem?.unitPricePhp).toBe(500);
      expect(railItem?.isCustomPrice).toBe(true);

      // Verify that resolving the unpriced component eliminates TBD and enables ROI
      expect(resultWithCustom.costSummary.tbdItemCount).toBe(0);
      expect(resultWithCustom.costSummary.isFullyEstimated).toBe(true);
      expect(resultWithCustom.costSummary.financialRoi?.canComputeRoi).toBe(true);
      expect(resultWithCustom.costSummary.financialRoi?.paybackPeriodYears).toBeGreaterThan(0);
    });
  });
});
