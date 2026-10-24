// src/components/config/__tests__/specAccordion.test.tsx
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InverterSelector } from '../InverterSelector';
import { PvModuleSelector } from '../PvModuleSelector';
import { BatterySelector } from '../BatterySelector';
import { GridConfig } from '../GridConfig';

describe('STEP 1: Technical Specifications Collapsible Accordion Suite', () => {
  it('hides Inverter technical spec sheet (SUN-6K-SG05LP1-EU) by default', () => {
    const markup = renderToStaticMarkup(createElement(InverterSelector));
    // Header toggle should be visible
    expect(markup).toContain('View Specs');
    expect(markup).toContain('aria-expanded="false"');
    // Inside the toggle button, the model name is displayed
    expect(markup).toContain('SUN-6K-SG05LP1-EU');
    // Detailed spec tiles should be collapsed/hidden by default
    expect(markup).not.toContain('Rated AC Power');
    expect(markup).not.toContain('Startup Voltage');
    expect(markup).not.toContain('MPPT Config');
  });

  it('hides PV Module technical spec sheet by default', () => {
    const markup = renderToStaticMarkup(createElement(PvModuleSelector));
    expect(markup).toContain('View Specs');
    expect(markup).toContain('aria-expanded="false"');
    // Detailed spec tiles should be collapsed/hidden by default
    expect(markup).not.toContain('Wattage (Pmax)');
    expect(markup).not.toContain('Voc (Open Ckt)');
    expect(markup).not.toContain('Vmp (Max Power)');
  });

  it('hides Battery technical spec sheet by default', () => {
    const markup = renderToStaticMarkup(createElement(BatterySelector));
    expect(markup).toContain('View Specs');
    expect(markup).toContain('aria-expanded="false"');
    // Detailed spec tiles should be collapsed/hidden by default
    expect(markup).not.toContain('Nominal Voltage');
    expect(markup).not.toContain('Single Capacity');
    expect(markup).not.toContain('Recommended MCCB');
  });

  it('includes both ChevronDown and ChevronUp toggle states with accessible Button-in-Button architecture', () => {
    const invCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/config/InverterSelector.tsx'), 'utf-8');
    const pvCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/config/PvModuleSelector.tsx'), 'utf-8');
    const batCode = fs.readFileSync(path.resolve(process.cwd(), 'src/components/config/BatterySelector.tsx'), 'utf-8');

    for (const code of [invCode, pvCode, batCode]) {
      expect(code).toContain('ChevronDown');
      expect(code).toContain('ChevronUp');
      expect(code).toContain('aria-expanded={isOpen}');
      expect(code).toContain('setIsOpen((prev) => !prev)');
      // Button-in-Button architecture (nested circular pill container)
      expect(code).toContain('rounded-full bg-slate-100 dark:bg-white/10');
    }
  });

  it('renders GridConfig with Autocomplete fields for grid voltage and service breaker with clear buttons', () => {
    const markup = renderToStaticMarkup(createElement(GridConfig));
    // Labels
    expect(markup).toContain('Grid Nominal Voltage (V)');
    expect(markup).toContain('Main Panel Service Breaker (A)');
    // Input placeholders
    expect(markup).toContain('Search voltage');
    expect(markup).toContain('Search breaker');
    // Default values in Autocomplete inputs
    expect(markup).toContain('230 V (Single Phase - Standard)');
    expect(markup).toContain('100 A (Standard Residential)');
    // Clear selection X buttons
    expect(markup).toContain('title="Clear selection"');
    expect(markup).toContain('aria-label="Clear selection"');
    // Sliders
    expect(markup).toContain('Configured Panel Quantity');
  });
});
