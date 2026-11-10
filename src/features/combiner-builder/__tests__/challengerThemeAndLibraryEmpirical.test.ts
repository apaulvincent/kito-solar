// src/features/combiner-builder/__tests__/challengerThemeAndLibraryEmpirical.test.ts
import { describe, it, expect } from 'vitest';
import { COMBINER_HARDWARE_CATALOG } from '../data/combinerHardwareCatalog';

// Standard WCAG 2.1 Relative Luminance & Contrast Formula
function sRGBtoLin(c: number): number {
  const norm = c / 255;
  return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Replicate exact category filtering from CombinerHardwareLibrary.tsx
function filterLibraryItems(
  activeCategory: 'ALL' | 'DC' | 'AC' | 'ATS_METER' | 'MCCB_BUSBAR',
  searchQuery = ''
) {
  return COMBINER_HARDWARE_CATALOG.filter((item) => {
    if (activeCategory === 'DC') {
      if (item.category !== 'dc_mcb' && item.category !== 'dc_spd' && item.category !== 'dc_isolator') return false;
    } else if (activeCategory === 'AC') {
      if (
        item.category !== 'ac_mcb' &&
        item.category !== 'ac_rcbo' &&
        item.category !== 'ac_spd' &&
        item.category !== 'ac_isolator' &&
        item.category !== 'digital_protector'
      ) {
        return false;
      }
    } else if (activeCategory === 'ATS_METER') {
      if (
        item.category !== 'ats_cb' &&
        item.category !== 'ats_solenoid' &&
        item.category !== 'din_meter' &&
        item.category !== 'digital_protector'
      ) {
        return false;
      }
    } else if (activeCategory === 'MCCB_BUSBAR') {
      if (item.category !== 'battery_mccb' && item.category !== 'terminal_block' && item.category !== 'pe_busbar') {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    return true;
  });
}

describe('Challenger 2.2: Theme Contrast & Visual Boundaries Empirical Suite', () => {
  describe('1. Relative Luminance Contrast Ratios', () => {
    it('confirms bottomPlateText (#fca5a5) against bottomPlateColor (#2d3748) in dark mode >= 4.5:1 (WCAG AA)', () => {
      const textColor = '#fca5a5';
      const bgColor = '#2d3748';
      const lumText = getRelativeLuminance(textColor);
      const lumBg = getRelativeLuminance(bgColor);
      const ratio = getContrastRatio(textColor, bgColor);

      expect(lumText).toBeCloseTo(0.5032, 2);
      expect(lumBg).toBeCloseTo(0.0376, 2);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeCloseTo(6.32, 2);
    });

    it('confirms middle rail header (#b45309) against light backplate (#e2e8f0) in light mode >= 3.0:1', () => {
      const headerColor = '#b45309';
      const backplateColor = '#e2e8f0';
      const lumHeader = getRelativeLuminance(headerColor);
      const lumBackplate = getRelativeLuminance(backplateColor);
      const ratio = getContrastRatio(headerColor, backplateColor);

      expect(lumHeader).toBeCloseTo(0.1591, 2);
      expect(lumBackplate).toBeCloseTo(0.8017, 2);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(ratio).toBeCloseTo(4.07, 2);
    });

    it('confirms middle rail header (#f59e0b) against dark backplate (#374151) in dark mode >= 3.0:1 and >= 4.5:1', () => {
      const ratio = getContrastRatio('#f59e0b', '#374151');
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(ratio).toBeCloseTo(4.80, 2);
    });

    it('confirms top rail header contrast in both light and dark modes', () => {
      const lightRatio = getContrastRatio('#0284c7', '#e2e8f0');
      expect(lightRatio).toBeGreaterThanOrEqual(3.0);
      expect(lightRatio).toBeCloseTo(3.32, 2);

      const darkRatio = getContrastRatio('#38bdf8', '#374151');
      expect(darkRatio).toBeGreaterThanOrEqual(4.5);
      expect(darkRatio).toBeCloseTo(4.81, 2);
    });

    it('evaluates enclosure outer flange lip visual boundary in dark and light modes', () => {
      // Dark mode: flange #64748b against canvas background #0b0f19
      const darkFlangeToBg = getContrastRatio('#64748b', '#0b0f19');
      expect(darkFlangeToBg).toBeGreaterThanOrEqual(3.0); // 4.02:1 meets WCAG 2.1 SC 1.4.11 (>= 3.0:1)

      // Light mode: flange #475569 against wall #cbd5e1 and canvas background #f8fafc
      const lightFlangeToWall = getContrastRatio('#475569', '#cbd5e1');
      expect(lightFlangeToWall).toBeGreaterThanOrEqual(3.0); // 5.10:1 meets UI component boundary
      const lightFlangeToBg = getContrastRatio('#475569', '#f8fafc');
      expect(lightFlangeToBg).toBeGreaterThanOrEqual(3.0); // 7.24:1
    });

    it('confirms all knockout badge text elements satisfy WCAG AA (>= 4.5:1) against backing plate (#090d16)', () => {
      const backingPlate = '#090d16';

      // Primary white label
      const whiteRatio = getContrastRatio('#ffffff', backingPlate);
      expect(whiteRatio).toBeGreaterThanOrEqual(4.5);
      expect(whiteRatio).toBeCloseTo(19.43, 1);

      // Sub-label circuit indicators
      const subLabels = [
        { id: 'pv1_pv2', color: '#ea580c', name: 'PV String Infeed (Orange)' },
        { id: 'grid', color: '#0284c7', name: 'Utility Mains In (Sky Blue)' },
        { id: 'inv', color: '#f59e0b', name: 'Solar AC Output (Amber)' },
        { id: 'load', color: '#8b5cf6', name: 'Critical Sub-Panel (Purple)' },
        { id: 'bat', color: '#10b981', name: 'Battery Storage (Emerald)' },
        { id: 'earth', color: '#22c55e', name: 'Ground Electrode (Green)' },
      ];

      for (const badge of subLabels) {
        const ratio = getContrastRatio(badge.color, backingPlate);
        expect(ratio, `Badge ${badge.name} (${badge.color}) must satisfy WCAG AA >= 4.5:1`).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('2. CombinerHardwareLibrary Device Tab Filtering', () => {
    it('exposes Santon 32A DC Rotary Isolator under the DC tab', () => {
      const dcItems = filterLibraryItems('DC');
      const isolator = dcItems.find((i) => i.id === 'dc-rotary-isolator-32a');
      expect(isolator).toBeDefined();
      expect(isolator?.name).toBe('Santon 32A 1000V DC Rotary Isolator');
      expect(isolator?.category).toBe('dc_isolator');
    });

    it('exposes GRL 63A AC Isolator and TAXNELE Digital Protector under the AC tab', () => {
      const acItems = filterLibraryItems('AC');
      const acIsolator = acItems.find((i) => i.id === 'ac-isolator-63a');
      expect(acIsolator).toBeDefined();
      expect(acIsolator?.name).toBe('GRL 63A 2P AC Isolator Switch');
      expect(acIsolator?.category).toBe('ac_isolator');

      const digiProt = acItems.find((i) => i.id === 'digital-protector-63a');
      expect(digiProt).toBeDefined();
      expect(digiProt?.name).toBe('TAXNELE 63A Digital Voltage & Current Protector');
      expect(digiProt?.category).toBe('digital_protector');
    });

    it('exposes TAXNELE Digital Protector under the ATS_METER tab', () => {
      const atsMeterItems = filterLibraryItems('ATS_METER');
      const digiProt = atsMeterItems.find((i) => i.id === 'digital-protector-63a');
      expect(digiProt).toBeDefined();
      expect(digiProt?.category).toBe('digital_protector');

      // Also ensure meters and ATS are present
      expect(atsMeterItems.some((i) => i.id === 'digital-watt-meter-100a')).toBe(true);
      expect(atsMeterItems.some((i) => i.id === 'ats-100a-2p')).toBe(true);
    });

    it('verifies search query filtering functions accurately across library categories', () => {
      const searchResult = filterLibraryItems('ALL', 'rotary');
      expect(searchResult.length).toBeGreaterThanOrEqual(1);
      expect(searchResult.some((i) => i.id === 'dc-rotary-isolator-32a')).toBe(true);

      const dcSearch = filterLibraryItems('DC', 'rotary');
      expect(dcSearch.length).toBe(1);
      expect(dcSearch[0].id).toBe('dc-rotary-isolator-32a');
    });
  });
});
