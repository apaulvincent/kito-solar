import { describe, it, expect } from 'vitest';
import {
  calculateConduitFill,
  recommendConduitSize,
  parseConduitDiameterMm,
  getMaxAllowableFillPct,
  CONDUIT_SIZE_TABLE,
} from '../conduitFill';

describe('PEC 2017 / NEC Conduit Fill Calculation Engine Suite', () => {
  describe('PEC 2017 Chapter 9 Table 1 Fill Limits', () => {
    it('returns 53% for 1 conductor', () => {
      expect(getMaxAllowableFillPct(1)).toBe(53.0);
    });

    it('returns 31% for 2 conductors', () => {
      expect(getMaxAllowableFillPct(2)).toBe(31.0);
    });

    it('returns 40% for 3 or more conductors', () => {
      expect(getMaxAllowableFillPct(3)).toBe(40.0);
      expect(getMaxAllowableFillPct(4)).toBe(40.0);
      expect(getMaxAllowableFillPct(6)).toBe(40.0);
    });
  });

  describe('calculateConduitFill', () => {
    it('calculates DC solar homerun fill in 32mm PVC conduit accurately', () => {
      // 2x 4.0 mm² PV cables (22.9 mm² each = 45.8 mm²) in 32mm conduit (555.7 mm² internal area)
      const result = calculateConduitFill({
        conduitTradeMm: 32,
        conductorSizeMm2: 4.0,
        conductorCount: 2,
        wireType: 'pv_wire',
      });

      expect(result.conduitTradeMm).toBe(32);
      expect(result.conductorCount).toBe(2);
      expect(result.maxAllowableFillPct).toBe(31.0);
      // Fill % = (45.8 / 555.7) * 100 = 8.2%
      expect(result.fillPercent).toBeCloseTo(8.2, 1);
      expect(result.isCompliant).toBe(true);
      expect(result.status).toBe('compliant');
      expect(result.advisory).toContain('Compliant with PEC 2017');
    });

    it('flags overfilled conduit when conductors exceed allowable percentage', () => {
      // 4x 16.0 mm² THHN cables (37.39 mm² each = 149.56 mm²) in 20mm conduit (196.1 mm² internal area)
      // Fill % = (149.56 / 196.1) * 100 = 76.3% > 40.0% limit
      const result = calculateConduitFill({
        conduitTradeMm: 20,
        conductorSizeMm2: 16.0,
        conductorCount: 4,
        wireType: 'thhn',
      });

      expect(result.maxAllowableFillPct).toBe(40.0);
      expect(result.fillPercent).toBeGreaterThan(40.0);
      expect(result.isCompliant).toBe(false);
      expect(result.status).toBe('overfilled');
      expect(result.advisory).toContain('Exceeds PEC 2017 conduit fill limit');
    });
  });

  describe('recommendConduitSize', () => {
    it('recommends the minimum compliant conduit diameter for conductors', () => {
      // 2x 6.0 mm² PV cables (28.27 mm² each = 56.54 mm²)
      // Allowable for 2 conductors is 31%
      // 20mm conduit: 31% of 196.1 mm² is 60.79 mm² -> 56.54 <= 60.79 -> 20mm is compliant!
      const rec = recommendConduitSize(6.0, 2, 'pv_wire');
      expect(rec.tradeMm).toBe(20);
    });

    it('recommends larger conduit when cables exceed smaller sizes', () => {
      // 4x 25.0 mm² THHN (55.42 mm² each = 221.68 mm²)
      // Allowable for 4 conductors is 40%
      // 25mm (343.1 mm² * 0.4 = 137.2 mm²) -> too small
      // 32mm (555.7 mm² * 0.4 = 222.28 mm²) -> 221.68 <= 222.28 -> 32mm!
      const rec = recommendConduitSize(25.0, 4, 'thhn');
      expect(rec.tradeMm).toBe(32);
    });
  });

  describe('parseConduitDiameterMm', () => {
    it('parses standard conduit specifications from rule seeds', () => {
      expect(parseConduitDiameterMm('32mm² diameter PVC pipe')).toBe(32);
      expect(parseConduitDiameterMm('40mm² diameter PVC pipe')).toBe(40);
      expect(parseConduitDiameterMm('50mm² diameter PVC pipe')).toBe(50);
      expect(parseConduitDiameterMm('25mm diameter conduit')).toBe(25);
    });

    it('returns null for empty or invalid spec strings', () => {
      expect(parseConduitDiameterMm('')).toBeNull();
      expect(parseConduitDiameterMm('Cable tray')).toBeNull();
    });
  });

  describe('Prose and Style Hygiene', () => {
    it('strictly avoids em dashes in generated advisories', () => {
      const compliant = calculateConduitFill({
        conduitTradeMm: 32,
        conductorSizeMm2: 4.0,
        conductorCount: 2,
      });
      const overfilled = calculateConduitFill({
        conduitTradeMm: 20,
        conductorSizeMm2: 16.0,
        conductorCount: 4,
      });

      expect(compliant.advisory).not.toContain('—');
      expect(overfilled.advisory).not.toContain('—');
    });
  });
});
