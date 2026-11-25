import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { SystemSummary } from '../SystemSummary';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { mountIntoDom } from '@/test/domTestUtils';

describe('SystemSummary Telemetry HUD Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders live engineering summary KPIs with high-contrast electrical data', () => {
    const mounted = mountIntoDom(createElement(SystemSummary));
    try {
      const text = mounted.container.textContent || '';
      expect(text).toContain('TELEMETRY HUD');
      expect(text).toContain('Live Engineering Summary');
      expect(text).toContain('Array Peak');
      expect(text).toContain('Inverter AC');
      expect(text).toContain('DC/AC Ratio');
      expect(text).toContain('Battery Bank');
      expect(text).toContain('DC Breaker');
      expect(text).toContain('AC Breaker');
    } finally {
      mounted.unmount();
    }
  });

  it('renders environmental and carbon offset metrics based on DOE grid factor', () => {
    const mounted = mountIntoDom(createElement(SystemSummary));
    try {
      const text = mounted.container.textContent || '';
      expect(text).toContain('Environmental Offset (DOE GEF: 0.7122 kg CO2/kWh)');
      expect(text).toContain('Annual CO2 Avoided');
      expect(text).toContain('25-Yr Lifetime CO2');
      expect(text).toContain('Trees Seedling Eq.');
      expect(text).toContain('Fossil Fuel Avoided');
      expect(text).toContain('Clean Generation');
    } finally {
      mounted.unmount();
    }
  });

  it('strictly avoids em dashes in all rendered summary text', () => {
    const mounted = mountIntoDom(createElement(SystemSummary));
    try {
      const text = mounted.container.textContent || '';
      expect(text).not.toContain('—');
    } finally {
      mounted.unmount();
    }
  });
});
