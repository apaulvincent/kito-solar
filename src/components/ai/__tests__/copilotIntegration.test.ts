import { ALL_QUICK_SIZING_PROMPTS, getRandomPrompts } from '../SolarCopilotDrawer';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { buildSolarSetupProposal, calculatePvSystem } from '@/lib/solarSizingEngine';
import { matchHardwareCatalog, searchHardwareCatalog } from '@/lib/hardwareCatalog';
import { aiCopilotService } from '@/services/aiCopilotService';

describe('AI Copilot Tool-Calling & Deterministic PV Sizing Engine', () => {
  beforeEach(() => {
    useCalculatorStore.getState().resetToDefaults();
  });

  describe('Deterministic Engine: calculatePvSystem', () => {
    it('accurately sizes PV system from monthly peso bill', () => {
      const output = calculatePvSystem({
        monthlyBillPhp: 7000,
        systemType: 'hybrid',
      });

      expect(output.estimatedMonthlyKwh).toBeCloseTo(7000 / 12.0, 0);
      expect(output.recommendedArrayKwp).toBeGreaterThan(4.0);
      expect(output.recommendedInverterKw).toBeGreaterThanOrEqual(3);
      expect(output.recommendedBatteryKwh).toBeGreaterThanOrEqual(5.12);
      expect(output.estimatedMonthlySavingsPhp).toBeGreaterThan(4000);
    });

    it('sets recommendedBatteryKwh to 0 for pure grid-tie systems', () => {
      const output = calculatePvSystem({
        monthlyBillPhp: 10000,
        systemType: 'grid-tie',
      });

      expect(output.recommendedBatteryKwh).toBe(0);
      expect(output.recommendedArrayKwp).toBeGreaterThan(4.0);
    });

    it('handles direct monthlyKwh consumption inputs without needing bill', () => {
      const output = calculatePvSystem({
        monthlyKwh: 600,
        systemType: 'hybrid',
      });

      expect(output.estimatedMonthlyKwh).toBe(600);
      expect(output.recommendedArrayKwp).toBeGreaterThan(4.0);
    });
  });

  describe('Deterministic Hardware Catalog: matchHardwareCatalog', () => {
    it('filters inverter catalog by preferred brand "Deye" and selects matching capacity', async () => {
      const match = await matchHardwareCatalog({
        targetKwp: 4.8,
        targetInverterKw: 5,
        targetBatteryKwh: 5.12,
        systemType: 'hybrid',
        preferredInverterBrand: 'Deye',
      });

      expect(match.inverter.brand).toBe('Deye');
      expect(match.inverter.model).toBe('SUN-5K-SG05LP1-EU');
      expect(match.inverter.kw).toBe(5);
      expect(match.panelCount).toBeGreaterThanOrEqual(8);
      expect(match.battery).not.toBeNull();
      expect(match.battery?.brand).toBe('Deye');
      expect(match.totalBatteryKwh).toBe(5.12);
    });

    it('supports preferred panel brand selection (e.g. Canadian Solar)', async () => {
      const match = await matchHardwareCatalog({
        targetKwp: 5.5,
        targetInverterKw: 5,
        preferredPanelBrand: 'Canadian Solar',
      });

      expect(match.panel.brand).toBe('Canadian Solar');
      expect(match.panel.watts).toBe(580);
      expect(match.actualArrayKwp).toBeGreaterThanOrEqual(5.0);
    });
  });

  describe('Workbench State Synchronization', () => {
    it('synchronizes tool-call sizing payload directly into 3D CAD & electrical workbench', async () => {
      const sizing = calculatePvSystem({
        monthlyBillPhp: 7000,
        systemType: 'hybrid',
      });

      const hardware = await matchHardwareCatalog({
        targetKwp: sizing.recommendedArrayKwp,
        targetInverterKw: sizing.recommendedInverterKw,
        targetBatteryKwh: sizing.recommendedBatteryKwh,
        systemType: 'hybrid',
        preferredInverterBrand: 'Deye',
      });

      const toolPayload = {
        action: 'APPLY_SOLAR_SETUP' as const,
        projectId: 'test-proj-deye-7k',
        inputSummary: {
          monthlyBillPhp: 7000,
          location: 'Metro Manila',
          systemType: 'hybrid' as const,
          daytimeLoadRatio: 0.6,
          utilityProvider: 'Meralco',
          tariffRatePhpPerKwh: 12.0,
          peakSunHours: 4.5,
          estimatedMonthlyKwh: sizing.estimatedMonthlyKwh,
          estimatedDailyKwh: sizing.dailyKwh,
        },
        engineeringSpecs: {
          targetArrayKwp: sizing.recommendedArrayKwp,
          actualArrayKwp: hardware.actualArrayKwp,
          dcAcRatio: 1.15,
          estimatedDailyHarvestKwh: 18.0,
          estimatedMonthlyHarvestKwh: 540,
          billOffsetPercentage: 88,
          requiredRoofAreaSqm: 25,
          stringConfigurations: [],
        },
        billOfMaterials: {
          panel: {
            id: hardware.panel.id,
            brand: hardware.panel.brand,
            model: hardware.panel.model,
            wattageWp: hardware.panel.watts,
            quantity: hardware.panelCount,
            unitPricePhp: hardware.panel.pricePhp,
            subtotalPhp: hardware.panelCount * hardware.panel.pricePhp,
          },
          inverter: {
            id: hardware.inverter.id,
            brand: hardware.inverter.brand,
            model: hardware.inverter.model,
            ratedAcKw: hardware.inverter.kw,
            systemType: 'hybrid' as const,
            quantity: 1,
            unitPricePhp: hardware.inverter.pricePhp,
            subtotalPhp: hardware.inverter.pricePhp,
          },
          battery: hardware.battery
            ? {
                id: hardware.battery.id,
                brand: hardware.battery.brand,
                model: hardware.battery.model,
                moduleCapacityKwh: hardware.battery.kwh,
                quantity: hardware.batteryCount,
                totalStorageKwh: hardware.totalBatteryKwh,
                usableStorageKwh: hardware.totalBatteryKwh * 0.9,
                unitPricePhp: hardware.battery.pricePhp,
                subtotalPhp: hardware.batteryCount * hardware.battery.pricePhp,
              }
            : null,
          bosAndInstallationPhp: 25000,
          totalSystemCostPhp: hardware.estimatedTotalSystemCostPhp,
        },
        financialRoi: {
          estimatedMonthlySavingsPhp: sizing.estimatedMonthlySavingsPhp,
          estimatedNewMonthlyBillPhp: 1500,
          annualSavingsPhp: sizing.estimatedMonthlySavingsPhp * 12,
          paybackPeriodYears: 4.5,
          fiveYearNetSavingsPhp: 120000,
          twentyFiveYearNetSavingsPhp: 1200000,
        },
      };

      // Apply tool payload to Zustand store
      useCalculatorStore.getState().applySizingProposal(toolPayload);

      const state = useCalculatorStore.getState();
      expect(state.selectedInverter.brand.toUpperCase()).toBe('DEYE');
      expect(state.selectedInverter.model).toBe('SUN-5K-SG05LP1-EU');
      expect(state.panelCountOverride).toBe(hardware.panelCount);
      expect(state.calculationResult).toBeDefined();
      expect(state.lastAppliedProposal?.projectId).toBe('test-proj-deye-7k');
    });
  });

  describe('Plain-Language Communication & Fallback', () => {
    it('answers single-string panel limits in plain language without technical jargon', async () => {
      const response = await aiCopilotService.getFriendlyFallbackResponse(
        "Why can't I put all 16 of these 580W panels into a single string?"
      );

      expect(response.content).not.toContain('VITE_GOOGLE_GENERATIVE_AI_API_KEY');
      expect(response.content).not.toContain('.env.local');
      expect(response.content).not.toContain('API key');
      expect(response.content.toLowerCase()).toContain('inverter');
      expect(response.content.toLowerCase()).toContain('string');
      expect(response.content.toLowerCase()).toContain('voltage');
    });

    it('returns a polite non-technical message for general queries when offline', async () => {
      const response = await aiCopilotService.getFriendlyFallbackResponse('random question here');
      expect(response.content).not.toContain('API key');
      expect(response.content).not.toContain('VITE_');
      expect(response.content).not.toContain('error');
    });
  });

  describe('Hardware Search & Unified Proposal Builder', () => {
    it('filters catalog entries accurately by searchQuery and category', () => {
      const inverterHits = searchHardwareCatalog({ searchQuery: 'Deye', category: 'inverter' });
      expect(inverterHits.inverters.length).toBeGreaterThan(0);
      expect(inverterHits.inverters.every((i) => i.brand === 'Deye')).toBe(true);
      expect(inverterHits.panels).toHaveLength(0);
      expect(inverterHits.batteries).toHaveLength(0);

      const panelHits = searchHardwareCatalog({ searchQuery: '580w', category: 'panel' });
      expect(panelHits.panels.some((p) => p.model === 'CS6R-580MS')).toBe(true);
    });

    it('builds consistent ProjectSizingResult BOM totals where line items sum to totalSystemCostPhp', async () => {
      const { proposal } = await buildSolarSetupProposal({
        monthlyBillPhp: 7000,
        location: 'Metro Manila',
        systemType: 'hybrid',
        preferredInverterBrand: 'Deye',
      });
      const bom = proposal.billOfMaterials;
      const lineSum =
        bom.panel.subtotalPhp +
        bom.inverter.subtotalPhp +
        (bom.battery?.subtotalPhp || 0) +
        bom.bosAndInstallationPhp;
      expect(lineSum).toBe(bom.totalSystemCostPhp);
      expect(proposal.engineeringSpecs.requiredRoofAreaSqm).toBeGreaterThan(0);
    });
  });

  describe('Quick Sizing Prompts Pool & Random Selection', () => {
    it('has at least 24 rich, diverse quick sizing prompts in the pool', () => {
      expect(ALL_QUICK_SIZING_PROMPTS.length).toBeGreaterThanOrEqual(24);
      ALL_QUICK_SIZING_PROMPTS.forEach((prompt) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.trim().length).toBeGreaterThan(15);
      });
    });

    it('returns exactly 4 unique random prompts on request', () => {
      const selected = getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 4);
      expect(selected).toHaveLength(4);

      // Verify all 4 prompts are unique
      const uniqueSet = new Set(selected);
      expect(uniqueSet.size).toBe(4);

      // Verify all 4 prompts belong to the pool
      selected.forEach((p) => {
        expect(ALL_QUICK_SIZING_PROMPTS).toContain(p);
      });
    });

    it('handles custom counts cleanly', () => {
      const two = getRandomPrompts(ALL_QUICK_SIZING_PROMPTS, 2);
      expect(two).toHaveLength(2);
      expect(new Set(two).size).toBe(2);
    });
  });
});
