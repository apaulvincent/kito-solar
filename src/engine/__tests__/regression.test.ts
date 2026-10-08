// src/engine/__tests__/regression.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSystem } from '../calculateSystem';
import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';

describe('PRD Section 21 — Hybrid & On-Grid Regression Test', () => {
  const inverter = (invertersSeed as SolarInverterRecord[]).find(
    (i) => i.model === 'HESP4860S100-H'
  );
  const module = (modulesSeed as SolarModuleRecord[]).find(
    (m) => m.model === 'CS6R-585MS'
  );
  const battery = (batteriesSeed as BatteryRecord[]).find(
    (b) => b.model === '24V-150 Ah'
  );

  if (!inverter || !module || !battery) {
    throw new Error('Required regression seed models not found in catalog');
  }

  it('matches all workbook outputs for standard reference configuration', () => {
    const result = calculateSystem({
      inverter,
      module,
      battery,
      batteryCount: 1,
      gridVoltageV: 230,
      mainBreakerA: 100,
    });

    // 1. DC outputs
    expect(result.dc.computedCurrentA).toBe(17.625);
    expect(result.dc.breakerRatingA).toBe(20);
    expect(result.dc.wireSpec).toContain('4.0mm²');
    expect(result.dc.wireSpec).toContain('12 AWG');
    expect(result.dc.spdRatingV).toBe(600);

    // 2. AC outputs
    expect(result.ac.computedCurrentA).toBe(35.75);
    expect(result.ac.breakerRatingA).toBe(40);
    expect(result.ac.wireSpec).toContain('14.0mm²');
    expect(result.ac.wireSpec).toContain('8 AWG');
    expect(result.ac.spdRatingV).toBe(440);

    // 3. PV sizing
    expect(result.pvSizing.recommendedPanels).toBe(10);
    expect(result.pvSizing.maxPanels).toBe(15);
    expect(result.stringSizing.recommendedStrings).toBe(2);

    // 4. Battery outputs
    expect(result.battery.recommendedBreakerA).toBe(188);
    expect(result.battery.wireSpec).toContain('70 mm²');
    expect(result.battery.wireSpec).toContain('2/0 AWG');

    // 5. ATS output
    expect(result.ac.atsConfigured).toBe(true);
    expect(result.ac.atsRatingA).toBe(100);
  });
});
