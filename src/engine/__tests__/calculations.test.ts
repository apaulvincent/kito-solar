// src/engine/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest';
import { ruleService } from '@/services/ruleService';
import { calculateDc } from '../calculateDc';
import { calculateAc } from '../calculateAc';
import { calculateBattery } from '../calculateBattery';
import { calculatePvSizing } from '../calculatePvSizing';
import { calculateStringSizing } from '../calculateStringSizing';
import { calculateMounting } from '../calculateMounting';
import { calculateAts } from '../calculateAts';
import { calculateGrounding } from '../calculateGrounding';
import { calculateSystem } from '../calculateSystem';
import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';

describe('Calculator Engine Unit Test Suite', () => {
  const sampleInverter = (invertersSeed as SolarInverterRecord[])[0];
  const sampleModule = (modulesSeed as SolarModuleRecord[])[0];
  const sampleBattery = (batteriesSeed as BatteryRecord[])[0];

  describe('Rule Service Lookups', () => {
    it('selects correct DC breakers across threshold ranges', () => {
      expect(ruleService.findBreaker('dc', 10)).toBe(15);
      expect(ruleService.findBreaker('dc', 17.625)).toBe(20);
      expect(ruleService.findBreaker('dc', 24)).toBe(25);
      expect(ruleService.findBreaker('dc', 35)).toBe(40);
    });

    it('selects correct AC breakers across threshold ranges', () => {
      expect(ruleService.findBreaker('ac', 14)).toBe(15);
      expect(ruleService.findBreaker('ac', 35.75)).toBe(40);
      expect(ruleService.findBreaker('ac', 60)).toBe(63);
    });

    it('selects DC and AC isolators properly', () => {
      expect(ruleService.findIsolator('dc', 20)).toBe(25);
      expect(ruleService.findIsolator('dc', 32)).toBe(40);
      expect(ruleService.findIsolator('ac', 40)).toBe(50);
    });

    it('selects wires and conduits accurately', () => {
      const dcWire = ruleService.findWire('dc_pv', 20);
      expect(dcWire).toContain('4.0mm²');
      const conduit = ruleService.findConduit('dc_pv', dcWire);
      expect(conduit).toContain('32mm²');
    });

    it('selects grounding conductor and rod based on amperage', () => {
      const g1 = ruleService.findGrounding(20);
      expect(g1.conductor).toContain('14 AWG');
      const g2 = ruleService.findGrounding(40);
      expect(g2.conductor).toContain('8 AWG');
    });
  });

  describe('Mounting Bill of Materials', () => {
    it('calculates mounting hardware for 10 modules in 2 strings', () => {
      const bom = calculateMounting(10, 2);
      expect(bom.panelCount).toBe(10);
      expect(bom.totalEndClamps).toBe(8); // 2 rows * 4 end-clamps
      expect(bom.totalMidClamps).toBe(16); // 2 * (10 - 2) = 16 mid-clamps
      expect(bom.totalRails).toBeGreaterThanOrEqual(10);
      expect(bom.totalMc4Pairs).toBe(4);
      expect(bom.items.length).toBe(6);
    });

    it('reconciles all 6 R4 mounting hardware accessories in expected order with grounding lugs and bonding jumpers', () => {
      const bom = calculateMounting(10, 2);
      const itemKeys = bom.items.map((i) => i.key);
      expect(itemKeys).toEqual([
        'roof_rail',
        'rail_splice',
        'l_foot',
        'mid_clamp',
        'end_clamp',
        'grounding_lug',
      ]);

      const groundingLug = bom.items.find((i) => i.key === 'grounding_lug');
      expect(groundingLug).toBeDefined();
      // For 10 modules in 2 strings: rows = 2 -> 4 lugs + 7 bonding jumpers = 11 sets
      expect(groundingLug?.quantity).toBe(11);
      expect(groundingLug?.unit).toBe('sets');
      expect(groundingLug?.specification).toContain('Tin-plated');

      // Verify dimensional schemas and standards on all 6 items
      bom.items.forEach((item) => {
        expect(item.dimensions).toBeDefined();
        expect(item.dimensions?.lengthMm).toBeGreaterThan(0);
        expect(item.dimensions?.widthMm).toBeGreaterThan(0);
        expect(item.dimensions?.heightMm).toBeGreaterThan(0);
        expect(item.dimensions?.fastenerSpec).toBeDefined();
        expect(item.dimensions?.torqueNm).toBeDefined();
        expect(item.standards).toBeDefined();
        expect(item.standards?.length).toBeGreaterThan(0);
        expect(item.material).toBeDefined();
        expect(item.finish).toBeDefined();
      });
    });

    it('calculates single-row boundary conditions for grounding lugs and clamps', () => {
      const bom = calculateMounting(2, 1);
      expect(bom.panelCount).toBe(2);
      expect(bom.totalEndClamps).toBe(4); // 1 row * 4
      expect(bom.totalMidClamps).toBe(2); // 2 * (2 - 1)
      expect(bom.items.length).toBe(6);

      const groundingLug = bom.items.find((i) => i.key === 'grounding_lug');
      // Minimum 2 grounding lugs for 1 row
      expect(groundingLug?.quantity).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ATS Calculation', () => {
    it('handles ATS presence and absence cleanly', () => {
      const atsNone = calculateAts(null);
      expect(atsNone.isConfigured).toBe(false);
      expect(atsNone.note).toBe('ATS not configured');

      const ats100 = calculateAts(100);
      expect(ats100.isConfigured).toBe(true);
      expect(ats100.recommendedRatingA).toBe(100);

      const ats50 = calculateAts(50);
      expect(ats50.recommendedRatingA).toBe(63); // next standard tier
    });
  });

  describe('PV Sizing & String Topology', () => {
    it('computes min, recommended, and max panels with voltage safeguards', () => {
      const sizing = calculatePvSizing(sampleInverter, sampleModule);
      expect(sizing.minPanels).toBeGreaterThan(0);
      expect(sizing.recommendedPanels).toBeGreaterThanOrEqual(sizing.minPanels);
      expect(sizing.maxPanels).toBeGreaterThanOrEqual(sizing.recommendedPanels);
    });

    it('distributes panels across strings within MPPT voltage range', () => {
      const strings = calculateStringSizing(sampleInverter, sampleModule, 10);
      expect(strings.recommendedStrings).toBeGreaterThan(0);
      expect(strings.panelsPerString).toBeGreaterThan(0);
      expect(strings.voltagePerStringVmp).toBeGreaterThan(0);
    });
  });

  describe('Safety & System Validation Warnings', () => {
    it('generates error warning when panel count massively exceeds inverter input', () => {
      const result = calculateSystem({
        inverter: sampleInverter,
        module: sampleModule,
        battery: sampleBattery,
        batteryCount: 1,
        gridVoltageV: 230,
        mainBreakerA: 100,
        panelCountOverride: 100, // Excessive 100 panels
      });

      const powerError = result.warnings.find((w) => w.id === 'pv-power-exceeded');
      expect(powerError).toBeDefined();
      expect(powerError?.severity).toBe('error');
    });

    it('flags info notice when hybrid inverter runs without storage', () => {
      const hybridInv = (invertersSeed as SolarInverterRecord[]).find(
        (i) => i.battery_type && i.battery_type.toLowerCase() !== 'none'
      )!;

      const result = calculateSystem({
        inverter: hybridInv,
        module: sampleModule,
        battery: null,
        batteryCount: 0,
        gridVoltageV: 230,
        mainBreakerA: 100,
      });

      const noBat = result.warnings.find((w) => w.id === 'hybrid-no-battery');
      expect(noBat).toBeDefined();
      expect(noBat?.severity).toBe('info');
    });
  });
});
