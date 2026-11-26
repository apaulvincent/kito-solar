import { describe, it, expect } from 'vitest';
import {
  calculateCellTemperature,
  calculateColdVoc,
  calculateHotVmp,
  calculateMaxSeriesPanelsForVoc,
  calculateMinSeriesPanelsForMppt,
  calculateTemperatureDerating,
  DEFAULT_MIN_DESIGN_TEMP_C,
  DEFAULT_MAX_DESIGN_AMBIENT_C,
  DEFAULT_NOCT_C,
  DEFAULT_BETA_VOC_PCT,
  DEFAULT_GAMMA_VMP_PCT,
} from '../temperatureDerating';

describe('Photovoltaic Temperature Voltage Derating Engine (PEC 2017 / NEC 690.7)', () => {
  describe('Cell Operating Temperature (NOCT)', () => {
    it('calculates cell temperature under standard peak tropical conditions', () => {
      // 35 C ambient + ((45 - 20) / 800) * 1000 = 35 + 31.25 = 66.25 -> 66.3 C
      const cellTemp = calculateCellTemperature(35, 45, 1000);
      expect(cellTemp).toBeCloseTo(66.3, 1);
    });

    it('handles default arguments gracefully', () => {
      const cellTemp = calculateCellTemperature();
      expect(cellTemp).toBeGreaterThan(DEFAULT_MAX_DESIGN_AMBIENT_C);
      expect(cellTemp).toBeCloseTo(66.3, 1);
    });

    it('scales proportionally with solar irradiance', () => {
      const halfSun = calculateCellTemperature(35, 45, 500);
      const fullSun = calculateCellTemperature(35, 45, 1000);
      expect(halfSun).toBeLessThan(fullSun);
      expect(halfSun).toBeCloseTo(50.6, 1);
    });
  });

  describe('Cold-Adjusted Voc Scaling', () => {
    it('increases module Voc at 12 deg C cold reference with negative beta coefficient', () => {
      // Delta T = 12 - 25 = -13 C
      // Temp correction = 1 + (-0.28 / 100) * (-13) = 1 + 0.0364 = 1.0364
      // Voc = 50.0 V * 1.0364 = 51.82 V
      const coldVoc = calculateColdVoc(50.0, 12, -0.28);
      expect(coldVoc).toBe(51.82);
    });

    it('returns exact STC Voc at 25 deg C', () => {
      const voc = calculateColdVoc(48.5, 25, -0.28);
      expect(voc).toBe(48.5);
    });
  });

  describe('Hot-Adjusted Vmp Scaling', () => {
    it('decreases module Vmp at elevated operating cell temperatures', () => {
      // 66.3 C cell temp, Delta T = 66.3 - 25 = 41.3 C
      // Temp correction = 1 + (-0.35 / 100) * 41.3 = 1 - 0.14455 = 0.85545
      // Vmp = 41.5 V * 0.85545 = 35.50 V
      const hotVmp = calculateHotVmp(41.5, 66.3, -0.35);
      expect(hotVmp).toBeLessThan(41.5);
      expect(hotVmp).toBeCloseTo(35.5, 1);
    });

    it('returns exact STC Vmp at 25 deg C', () => {
      const vmp = calculateHotVmp(40.0, 25, -0.35);
      expect(vmp).toBe(40.0);
    });
  });

  describe('Series Module Sizing Limits', () => {
    it('determines maximum series panels based on inverter Voc safety ceiling', () => {
      // Voc(STC) = 50.0 V, cold Voc = 51.82 V. Inverter max = 500 V.
      // 500 / 51.82 = 9.64 -> Max 9 panels
      const maxPanels = calculateMaxSeriesPanelsForVoc(50.0, 500, 12, -0.28);
      expect(maxPanels).toBe(9);
    });

    it('determines minimum series panels to stay inside MPPT tracking window', () => {
      // Vmp(STC) = 41.5 V, hot Vmp = 35.50 V. Inverter min MPPT = 150 V.
      // 150 / 35.50 = 4.22 -> Min 5 panels
      const minPanels = calculateMinSeriesPanelsForMppt(41.5, 150, 35, 45, -0.35, 1000);
      expect(minPanels).toBe(5);
    });
  });

  describe('calculateTemperatureDerating', () => {
    it('confirms compliance when string parameters stay safely inside thermal boundaries', () => {
      // 8 panels in series:
      // Cold Voc: 8 * 51.82 = 414.6 V <= 500 V (compliant)
      // Hot Vmp: 8 * 35.50 = 284.0 V >= 150 V (compliant)
      const result = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 8,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });

      expect(result.isColdCompliant).toBe(true);
      expect(result.isHotCompliant).toBe(true);
      expect(result.status).toBe('compliant');
      expect(result.coldVocMarginV).toBeGreaterThan(0);
      expect(result.hotVmpMarginV).toBeGreaterThan(0);
      expect(result.advisory).toContain('Temperature derating verified per PEC 2017');
    });

    it('flags overvoltage hazard when string series count exceeds cold Voc limit', () => {
      // 11 panels in series:
      // Cold Voc: 11 * 51.82 = 570.0 V > 500 V limit
      const result = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 11,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });

      expect(result.isColdCompliant).toBe(false);
      expect(result.isHotCompliant).toBe(true);
      expect(result.status).toBe('overvoltage_hazard');
      expect(result.coldVocMarginV).toBeLessThan(0);
      expect(result.advisory).toContain('Overvoltage hazard');
      expect(result.advisory).toContain('exceeding inverter safety ceiling');
    });

    it('flags MPPT dropout warning when string series count is too short for hot operating conditions', () => {
      // 3 panels in series:
      // Hot Vmp: 3 * 35.50 = 106.5 V < 150 V min MPPT
      const result = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 3,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });

      expect(result.isColdCompliant).toBe(true);
      expect(result.isHotCompliant).toBe(false);
      expect(result.status).toBe('mppt_dropout_hazard');
      expect(result.hotVmpMarginV).toBeLessThan(0);
      expect(result.advisory).toContain('MPPT dropout warning');
      expect(result.advisory).toContain('falling');
    });

    it('flags critical non-compliance if string violates both boundaries', () => {
      // Inverter with high min MPPT (400V) and low max voltage (450V) with 10 panels
      const result = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 10,
        inverterMaxVoltage: 450,
        inverterMinMpptVoltage: 400,
      });

      expect(result.isColdCompliant).toBe(false);
      expect(result.isHotCompliant).toBe(false);
      expect(result.status).toBe('critical_non_compliant');
      expect(result.advisory).toContain('Critical temperature non-compliance');
    });

    it('contains strictly zero em dashes in generated advisories', () => {
      const compliant = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 8,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });
      const overvoltage = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 12,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });
      const dropout = calculateTemperatureDerating({
        moduleVoc: 50.0,
        moduleVmp: 41.5,
        panelsPerString: 3,
        inverterMaxVoltage: 500,
        inverterMinMpptVoltage: 150,
      });

      expect(compliant.advisory).not.toContain('—');
      expect(overvoltage.advisory).not.toContain('—');
      expect(dropout.advisory).not.toContain('—');
    });
  });
});
