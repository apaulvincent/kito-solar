import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BatteryResultsCard } from '../BatteryResultsCard';
import { useCalculatorStore } from '@/store/useCalculatorStore';

describe('BatteryResultsCard Component & Autonomy Suite', () => {
  it('renders storage calculations, backup runtimes, and discharge capacity without NaN or undefined', () => {
    const markup = renderToStaticMarkup(createElement(BatteryResultsCard));

    expect(markup).toContain('Battery Electrical Calculations');
    expect(markup).toContain('Battery DC MCCB');
    expect(markup).toContain('Battery DC Conductor');
    expect(markup).toContain('Usable Energy Capacity');
    expect(markup).toContain('Emergency Backup Runtime &amp; Discharge Autonomy');
    expect(markup).toContain('Essential Light (300 W)');
    expect(markup).toContain('Core Residential (800 W)');
    expect(markup).toContain('Heavy EPS (2,000 W)');
    expect(markup).toContain('Full Inverter');

    expect(markup).not.toContain('NaN');
    expect(markup).not.toContain('undefined');
    expect(markup).not.toContain('—'); // Zero em dashes
  });

  it('renders detailed technical advisory when step2DetailMode is detailed', () => {
    useCalculatorStore.getState().setStep2DetailMode('detailed');
    const markup = renderToStaticMarkup(createElement(BatteryResultsCard));

    expect(markup).toContain('Emergency Backup Runtime &amp; Discharge Autonomy');
    expect(markup).toContain('conversion efficiency');
    expect(markup).not.toContain('—');
  });

  it('renders not applicable notice when battery is null', () => {
    const prevBattery = useCalculatorStore.getState().selectedBattery;
    try {
      useCalculatorStore.getState().setBattery(null);
      const markup = renderToStaticMarkup(createElement(BatteryResultsCard));
      expect(markup).toContain('Energy Storage Not Applicable');
    } finally {
      useCalculatorStore.getState().setBattery(prevBattery);
    }
  });
});
