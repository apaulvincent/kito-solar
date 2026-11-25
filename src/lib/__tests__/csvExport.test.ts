import { describe, it, expect, vi, beforeEach } from 'vitest';
import { escapeCsvField, generateBomCsv, downloadBomCsv } from '../csvExport';
import { useCalculatorStore } from '@/store/useCalculatorStore';

describe('BOM CSV Export Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('escapeCsvField', () => {
    it('returns empty string for null or undefined', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('returns raw string when no special characters present', () => {
      expect(escapeCsvField('Standard Inverter')).toBe('Standard Inverter');
      expect(escapeCsvField(42)).toBe('42');
    });

    it('wraps fields with commas, double quotes, or newlines in quotes and escapes inner quotes', () => {
      expect(escapeCsvField('Panels, 545W')).toBe('"Panels, 545W"');
      expect(escapeCsvField('Solis "S5" Inverter')).toBe('"Solis ""S5"" Inverter"');
      expect(escapeCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    });
  });

  describe('generateBomCsv', () => {
    it('generates a complete, compliant CSV schedule without em dashes', () => {
      const calculationResult = useCalculatorStore.getState().calculationResult;
      const csv = generateBomCsv(calculationResult, 'Quezon City Residence');

      expect(csv).toContain('KITO SOLAR - BILL OF MATERIALS (BOM) & FINANCIAL SCHEDULE');
      expect(csv).toContain('Quezon City Residence');
      expect(csv).toContain('Philippine Electrical Code (PEC 2017)');
      expect(csv).toContain('https://kitosolar.pvdeo.com');
      expect(csv).toContain('Category,Item Description,Quantity,Unit,Unit Price (PHP),Total Price (PHP),Status');

      // Check discipline sub-totals
      expect(csv).toContain('DISCIPLINE SUB-TOTALS & ESTIMATED TOTAL');
      expect(csv).toContain('Major Equipment (Panels, Inverter, Battery)');
      expect(csv).toContain('Roof Mounting & Structural Hardware');
      expect(csv).toContain('Switchgear, Protection & Cabling');
      expect(csv).toContain('Grand Total Investment');

      // Check environmental & carbon offset metrics
      expect(csv).toContain('ENVIRONMENTAL & CARBON OFFSET METRICS');
      expect(csv).toContain('Annual Clean Energy Yield');
      expect(csv).toContain('Annual CO2 Avoided');
      expect(csv).toContain('Lifetime (25-Yr) CO2 Avoided');

      // Rule: zero em dashes in generated technical data
      expect(csv).not.toContain('—');
    });
  });

  describe('downloadBomCsv', () => {
    it('creates a download blob and triggers programmatic click', () => {
      const calculationResult = useCalculatorStore.getState().calculationResult;

      const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const el = originalCreateElement(tagName);
        if (tagName.toLowerCase() === 'a') {
          el.click = clickMock;
        }
        return el;
      });

      downloadBomCsv(calculationResult, 'Solar Farm Project');

      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(appendChildSpy).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalledTimes(1);
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});
