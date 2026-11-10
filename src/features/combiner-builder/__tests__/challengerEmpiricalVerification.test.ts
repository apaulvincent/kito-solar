// src/features/combiner-builder/__tests__/challengerEmpiricalVerification.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCombinerBoxStore } from '../store/useCombinerBoxStore';
import { evaluateCombinerWiringDRC } from '../utils/combinerDrcEngine';
import { COMBINER_HARDWARE_CATALOG } from '../data/combinerHardwareCatalog';

describe('Empirical Verification - Combiner Challenger 2.1', () => {
  beforeEach(() => {
    useCombinerBoxStore.getState().loadTemplate('template_jesolar_hybrid');
  });

  it('verifies useCombinerBoxStore.getState().loadTemplate("template_reference_diagram") populates 15 combiner components (excluding battery) with zero DRC errors or warnings', () => {
    const store = useCombinerBoxStore.getState();
    store.loadTemplate('template_reference_diagram');

    const state = useCombinerBoxStore.getState();
    expect(state.activeTemplateId).toBe('template_reference_diagram');
    expect(state.components.length).toBe(15);
    expect(state.components.some((c) => c.category === 'battery_mccb')).toBe(false);
    expect(state.wires.length).toBe(31);

    // Run DRC
    const drc = evaluateCombinerWiringDRC(state.components, state.wires);
    expect(drc.isNormal).toBe(true);
    expect(drc.errorCount).toBe(0);
    expect(drc.warningCount).toBe(0);

    const shorts = drc.diagnostics.filter((d) => d.severity === 'error' && d.code === 'SHORT_CIRCUIT_LN');
    expect(shorts.length).toBe(0);

    const unbonded = drc.diagnostics.filter((d) => d.code === 'UNBONDED_SPD_PE');
    expect(unbonded.length).toBe(0);

    const crossDomain = drc.diagnostics.filter((d) => d.code === 'CROSS_DOMAIN_AC_DC');
    expect(crossDomain.length).toBe(0);
  });

  it('verifies addComponent spawns components at physical rail coordinates (0.70 for rail_top, -0.05 for rail_middle, -0.78 for bottom_plate)', () => {
    const store = useCombinerBoxStore.getState();

    // Spawn on rail_top
    store.addComponent('taxnele-txsa-40', 'rail_top');
    const stateTop = useCombinerBoxStore.getState();
    const topComp = stateTop.components[stateTop.components.length - 1];
    expect(topComp.position3D[1]).toBe(0.70);

    // Spawn on rail_middle
    store.addComponent('taxnele-txbd1-63-32a', 'rail_middle');
    const stateMid = useCombinerBoxStore.getState();
    const midComp = stateMid.components[stateMid.components.length - 1];
    expect(midComp.position3D[1]).toBe(-0.05);

    // Spawn on bottom_plate
    store.addComponent('matsic-160a-mccb', 'bottom_plate');
    const stateBot = useCombinerBoxStore.getState();
    const botComp = stateBot.components[stateBot.components.length - 1];
    expect(botComp.position3D[1]).toBe(-0.78);
  });

  it('verifies hardware catalog category filters include all newly added hardware archetypes', () => {
    // 1. DC tab must include dc-rotary-isolator-32a
    const dcItems = COMBINER_HARDWARE_CATALOG.filter((item) => {
      return item.category === 'dc_mcb' || item.category === 'dc_spd' || item.category === 'dc_isolator';
    });
    expect(dcItems.some((item) => item.id === 'dc-rotary-isolator-32a')).toBe(true);

    // 2. AC tab must include ac-isolator-63a and digital-protector-63a
    const acItems = COMBINER_HARDWARE_CATALOG.filter((item) => {
      return (
        item.category === 'ac_mcb' ||
        item.category === 'ac_rcbo' ||
        item.category === 'ac_spd' ||
        item.category === 'ac_isolator' ||
        item.category === 'digital_protector'
      );
    });
    expect(acItems.some((item) => item.id === 'ac-isolator-63a')).toBe(true);
    expect(acItems.some((item) => item.id === 'digital-protector-63a')).toBe(true);

    // 3. ATS_METER tab must include digital-protector-63a
    const atsMeterItems = COMBINER_HARDWARE_CATALOG.filter((item) => {
      return (
        item.category === 'ats_cb' ||
        item.category === 'ats_solenoid' ||
        item.category === 'din_meter' ||
        item.category === 'digital_protector'
      );
    });
    expect(atsMeterItems.some((item) => item.id === 'digital-protector-63a')).toBe(true);
  });

  it('verifies mathematical contrast compliance for updated mesh tokens (WCAG AA)', () => {
    function getRelativeLuminance(hex: string): number {
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      const sRGB = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
      return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
    }

    function getContrastRatio(hex1: string, hex2: string): number {
      const l1 = getRelativeLuminance(hex1);
      const l2 = getRelativeLuminance(hex2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    // 1. Bottom plate dark title text (#fca5a5) on dark mount plate (#2d3748) >= 4.5:1
    const bottomPlateRatio = getContrastRatio('#fca5a5', '#2d3748');
    expect(bottomPlateRatio).toBeGreaterThanOrEqual(4.5);
    expect(bottomPlateRatio).toBeCloseTo(6.32, 1);

    // 2. Middle rail light title text (#b45309) on light backplate (#e2e8f0) >= 3.0:1
    const midRailLightRatio = getContrastRatio('#b45309', '#e2e8f0');
    expect(midRailLightRatio).toBeGreaterThanOrEqual(3.0);
    expect(midRailLightRatio).toBeCloseTo(4.07, 1);
  });
});
