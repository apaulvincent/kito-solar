import { describe, it, expect } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InverterSelector } from '../InverterSelector';
import { PvModuleSelector } from '../PvModuleSelector';
import { BatterySelector } from '../BatterySelector';
import { GridConfig } from '../GridConfig';
import { mountIntoDom } from '@/test/domTestUtils';

describe('STEP 1: Technical Specifications Collapsible Accordion Suite', () => {
  it('collapses Inverter, PV Module, and Battery spec sheets by default and expands them on click', () => {
    const selectors = [
      {
        component: InverterSelector,
        defaultText: 'SUN-6K-SG05LP1-EU',
        revealedText: 'Rated AC Power',
        additionalFields: ['Startup Voltage', 'MPPT Config'],
      },
      {
        component: PvModuleSelector,
        defaultText: 'View Specs',
        revealedText: 'Wattage (Pmax)',
        additionalFields: ['Voc (Open Ckt)', 'Vmp (Max Power)'],
      },
      {
        component: BatterySelector,
        defaultText: 'View Specs',
        revealedText: 'Nominal Voltage',
        additionalFields: ['Single Capacity', 'Recommended MCCB'],
      },
    ];

    for (const spec of selectors) {
      const mounted = mountIntoDom(createElement(spec.component));
      try {
        const toggleBtn = mounted.container.querySelector<HTMLButtonElement>('button[aria-expanded]');
        expect(toggleBtn).not.toBeNull();
        expect(toggleBtn?.getAttribute('aria-expanded')).toBe('false');
        expect(mounted.container.textContent).toContain('View Specs');
        expect(mounted.container.textContent).toContain(spec.defaultText);
        expect(mounted.container.textContent).not.toContain(spec.revealedText);

        act(() => {
          toggleBtn?.click();
        });

        expect(toggleBtn?.getAttribute('aria-expanded')).toBe('true');
        expect(mounted.container.textContent).toContain('Hide Specs');
        expect(mounted.container.textContent).toContain(spec.revealedText);
        for (const field of spec.additionalFields) {
          expect(mounted.container.textContent).toContain(field);
        }
      } finally {
        mounted.unmount();
      }
    }
  });

  it('uses clean single-border accordion cards without outer double ring wrappers', () => {
    const markup = renderToStaticMarkup(createElement(InverterSelector));
    expect(markup).not.toContain('ring-1 ring-slate-900/10');
    expect(markup).not.toContain('rounded-2xl bg-slate-900/[0.03]');
    expect(markup).toContain('rounded-full bg-slate-100 dark:bg-white/10');
  });

  it('renders GridConfig with Autocomplete fields for grid voltage and service breaker with clear buttons', () => {
    const markup = renderToStaticMarkup(createElement(GridConfig));
    expect(markup).toContain('Grid Nominal Voltage (V)');
    expect(markup).toContain('Main Panel Service Breaker (A)');
    expect(markup).toContain('Search voltage');
    expect(markup).toContain('Search breaker');
    expect(markup).toContain('230 V (Single Phase - Standard)');
    expect(markup).toContain('100 A (Standard Residential)');
    expect(markup).toContain('title="Clear selection"');
    expect(markup).toContain('aria-label="Clear selection"');
    expect(markup).toContain('Configured Panel Quantity');
  });
});
