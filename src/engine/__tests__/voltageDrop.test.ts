import { describe, it, expect } from 'vitest';
import {
  CONDUCTOR_RESISTANCE_TABLE,
  PEC_MAX_BRANCH_VOLTAGE_DROP_PCT,
  PEC_MAX_TOTAL_VOLTAGE_DROP_PCT,
  findResistanceRecord,
  getConductorResistance,
  calculateVoltageDrop,
  calculateMaxRunLength,
  recommendConductorSize,
  parseConductorSizeMm2,
} from '../voltageDrop';

describe('PEC 2017 / NEC Conductor Voltage Drop Engine', () => {
  describe('Resistance lookup table and properties', () => {
    it('contains standard metric sizes from 2.5 mm² to 240 mm²', () => {
      expect(CONDUCTOR_RESISTANCE_TABLE.length).toBeGreaterThanOrEqual(14);
      expect(CONDUCTOR_RESISTANCE_TABLE[0].sizeMm2).toBe(2.5);
      expect(CONDUCTOR_RESISTANCE_TABLE[1].sizeMm2).toBe(4.0);
      expect(CONDUCTOR_RESISTANCE_TABLE[2].sizeMm2).toBe(6.0);
    });

    it('returns exact copper and aluminum resistance values', () => {
      // 4.0 mm² (12 AWG equivalent)
      const res4Cu = getConductorResistance(4.0, 'copper');
      const res4Al = getConductorResistance(4.0, 'aluminum');
      expect(res4Cu).toBe(5.09);
      expect(res4Al).toBe(8.37);

      // Aluminum has higher resistance than copper for the same cross section
      expect(res4Al).toBeGreaterThan(res4Cu);
    });

    it('snaps intermediate wire gauges to the next standard larger conductor', () => {
      // 5.0 mm² is not a standard size; it should snap to 6.0 mm²
      const record = findResistanceRecord(5.0);
      expect(record.sizeMm2).toBe(6.0);
      expect(record.copperResistanceOhmPerKm).toBe(3.39);
    });

    it('handles out-of-range conductor sizes gracefully', () => {
      const verySmall = findResistanceRecord(1.0);
      expect(verySmall.sizeMm2).toBe(2.5);

      const veryLarge = findResistanceRecord(500.0);
      expect(veryLarge.sizeMm2).toBe(240.0);
    });
  });

  describe('calculateVoltageDrop', () => {
    it('calculates DC string homerun voltage drop accurately', () => {
      // 10A at 400V DC over 25m with 4.0 mm² copper cable
      const result = calculateVoltageDrop({
        currentA: 10,
        voltageV: 400,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 25,
        material: 'copper',
        circuitType: 'dc',
      });

      // Loop R = (2 * 25m * 5.09 Ohm/km) / 1000 = 0.2545 Ohm
      // V_drop = 10A * 0.2545 Ohm = 2.55 V
      // Drop % = (2.55 V / 400 V) * 100 = 0.64%
      expect(result.voltageDropV).toBeCloseTo(2.55, 1);
      expect(result.dropPercent).toBeCloseTo(0.64, 1);
      expect(result.endVoltageV).toBeCloseTo(397.45, 1);
      expect(result.powerLossW).toBeCloseTo(25.45, 1);
      expect(result.isCompliant3Pct).toBe(true);
      expect(result.isCompliant5Pct).toBe(true);
      expect(result.status).toBe('compliant');
      expect(result.advisory).toContain('Compliant with PEC Section 6.90');
    });

    it('calculates AC single-phase inverter feeder voltage drop accurately', () => {
      // 21.7A at 230V AC over 15m with 6.0 mm² copper conductor
      const result = calculateVoltageDrop({
        currentA: 21.7,
        voltageV: 230,
        conductorSizeMm2: 6.0,
        oneWayLengthMeters: 15,
        material: 'copper',
        circuitType: '1phase',
      });

      // Loop R = (2 * 15m * 3.39 Ohm/km) / 1000 = 0.1017 Ohm
      // V_drop = 21.7A * 0.1017 Ohm = 2.21 V
      // Drop % = (2.21 / 230) * 100 = 0.96%
      expect(result.voltageDropV).toBeCloseTo(2.21, 1);
      expect(result.dropPercent).toBeCloseTo(0.96, 1);
      expect(result.status).toBe('compliant');
    });

    it('uses sqrt(3) multiplier for balanced three-phase AC circuits', () => {
      const singlePhase = calculateVoltageDrop({
        currentA: 20,
        voltageV: 400,
        conductorSizeMm2: 10.0,
        oneWayLengthMeters: 30,
        circuitType: '1phase',
      });

      const threePhase = calculateVoltageDrop({
        currentA: 20,
        voltageV: 400,
        conductorSizeMm2: 10.0,
        oneWayLengthMeters: 30,
        circuitType: '3phase',
      });

      // Three-phase voltage drop is (sqrt(3) / 2) times single-phase drop
      expect(threePhase.voltageDropV).toBeCloseTo(singlePhase.voltageDropV * (Math.sqrt(3) / 2), 1);
    });

    it('identifies marginal voltage drop between 3% and 5%', () => {
      // Sized to yield ~3.8% drop
      const result = calculateVoltageDrop({
        currentA: 15,
        voltageV: 200,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 50,
        circuitType: 'dc',
      });

      expect(result.dropPercent).toBeGreaterThan(PEC_MAX_BRANCH_VOLTAGE_DROP_PCT);
      expect(result.dropPercent).toBeLessThanOrEqual(PEC_MAX_TOTAL_VOLTAGE_DROP_PCT);
      expect(result.isCompliant3Pct).toBe(false);
      expect(result.isCompliant5Pct).toBe(true);
      expect(result.status).toBe('marginal');
      expect(result.advisory).toContain('Marginal voltage drop');
    });

    it('identifies excessive voltage drop greater than 5%', () => {
      // Long run yielding high drop (> 5%)
      const result = calculateVoltageDrop({
        currentA: 20,
        voltageV: 150,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 80,
        circuitType: 'dc',
      });

      expect(result.dropPercent).toBeGreaterThan(PEC_MAX_TOTAL_VOLTAGE_DROP_PCT);
      expect(result.isCompliant3Pct).toBe(false);
      expect(result.isCompliant5Pct).toBe(false);
      expect(result.status).toBe('excessive');
      expect(result.advisory).toContain('Excessive voltage drop');
    });

    it('handles zero current or zero length safely', () => {
      const zeroCurrent = calculateVoltageDrop({
        currentA: 0,
        voltageV: 230,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 25,
      });

      expect(zeroCurrent.voltageDropV).toBe(0);
      expect(zeroCurrent.dropPercent).toBe(0);
      expect(zeroCurrent.status).toBe('compliant');
    });
  });

  describe('calculateMaxRunLength', () => {
    it('calculates the maximum one-way distance for a 3% drop limit', () => {
      // 400V DC string, 10A, 4.0 mm² (5.09 Ohm/km)
      // Allowable drop = 400 * 0.03 = 12V
      // Loop R per meter = (2 * 5.09) / 1000 = 0.01018 Ohm/m
      // Max length = 12 / (10 * 0.01018) = 117.87m
      const maxMeters = calculateMaxRunLength({
        currentA: 10,
        voltageV: 400,
        conductorSizeMm2: 4.0,
        maxDropPercent: 3.0,
      });

      expect(maxMeters).toBeCloseTo(117.9, 1);

      // Verify that running at maxMeters yields <= 3.0% drop
      const verify = calculateVoltageDrop({
        currentA: 10,
        voltageV: 400,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: maxMeters,
      });
      expect(verify.dropPercent).toBeCloseTo(3.0, 1);
    });

    it('returns 0 if current or voltage is zero', () => {
      expect(calculateMaxRunLength({ currentA: 0, voltageV: 230, conductorSizeMm2: 4.0 })).toBe(0);
      expect(calculateMaxRunLength({ currentA: 10, voltageV: 0, conductorSizeMm2: 4.0 })).toBe(0);
    });
  });

  describe('recommendConductorSize', () => {
    it('recommends an upsized conductor when a long run exceeds 3%', () => {
      // 20A at 230V AC over 60m:
      // With 4.0 mm²: drop would be ~5.3% (excessive)
      // Needs upsizing to satisfy <= 3%
      const recommendation = recommendConductorSize({
        currentA: 20,
        voltageV: 230,
        oneWayLengthMeters: 60,
        circuitType: '1phase',
        minSizeMm2: 4.0,
      });

      expect(recommendation.isSatisfied).toBe(true);
      expect(recommendation.recommendedSizeMm2).toBeGreaterThanOrEqual(10.0);
      expect(recommendation.calculation.dropPercent).toBeLessThanOrEqual(3.0);
    });

    it('preserves the baseline size if already compliant', () => {
      const recommendation = recommendConductorSize({
        currentA: 8,
        voltageV: 450,
        oneWayLengthMeters: 15,
        circuitType: 'dc',
        minSizeMm2: 4.0,
      });

      expect(recommendation.isSatisfied).toBe(true);
      expect(recommendation.recommendedSizeMm2).toBe(4.0);
      expect(recommendation.awgEquivalent).toBe('12 AWG');
    });
  });

  describe('parseConductorSizeMm2', () => {
    it('parses standard metric mm² wire specifications', () => {
      expect(parseConductorSizeMm2('4.0mm² THHN/THWN cable')).toBe(4.0);
      expect(parseConductorSizeMm2('6.0 mm² Solar PV Cable')).toBe(6.0);
      expect(parseConductorSizeMm2('10.0mm² multi-core')).toBe(10.0);
      expect(parseConductorSizeMm2('25mm2 Cu')).toBe(25.0);
    });

    it('parses AWG equivalent notations', () => {
      expect(parseConductorSizeMm2('14 AWG Copper')).toBe(2.5);
      expect(parseConductorSizeMm2('12 AWG Solar Cable')).toBe(4.0);
      expect(parseConductorSizeMm2('10 AWG')).toBe(6.0);
      expect(parseConductorSizeMm2('8 AWG')).toBe(10.0);
      expect(parseConductorSizeMm2('6 AWG')).toBe(16.0);
      expect(parseConductorSizeMm2('4 AWG')).toBe(25.0);
      expect(parseConductorSizeMm2('1/0 AWG')).toBe(50.0);
    });

    it('returns null for unparseable or empty specs', () => {
      expect(parseConductorSizeMm2('')).toBeNull();
      expect(parseConductorSizeMm2('Unspecified conduit pipe')).toBeNull();
    });
  });

  describe('Style and prose hygiene', () => {
    it('strictly avoids em dashes in generated advisories', () => {
      const compliant = calculateVoltageDrop({
        currentA: 10,
        voltageV: 400,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 25,
      });
      const marginal = calculateVoltageDrop({
        currentA: 15,
        voltageV: 200,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 50,
      });
      const excessive = calculateVoltageDrop({
        currentA: 20,
        voltageV: 150,
        conductorSizeMm2: 4.0,
        oneWayLengthMeters: 80,
      });

      expect(compliant.advisory).not.toContain('—');
      expect(marginal.advisory).not.toContain('—');
      expect(excessive.advisory).not.toContain('—');
    });
  });
});
