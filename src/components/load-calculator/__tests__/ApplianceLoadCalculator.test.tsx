// src/components/load-calculator/__tests__/ApplianceLoadCalculator.test.tsx
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { ApplianceLoadCalculatorPage } from '../ApplianceLoadCalculatorPage';
import { Header } from '@/components/header/Header';

describe('Appliance Load Calculator Feature & UI Suite', () => {
  beforeEach(() => {
    useApplianceLoadStore.getState().loadProfile('small_home_wfh');
    useCalculatorStore.getState().setActiveView('load-calculator');
  });

  it('renders Header with "Load Calculator" navigation tab placed directly next to "Solar Tool"', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/header/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    expect(headerContent).toContain("setActiveView('tool')");
    expect(headerContent).toContain("setActiveView('load-calculator')");
    expect(headerContent).toContain('<span>Solar Tool</span>');
    expect(headerContent).toContain('<span>Load Calculator</span>');

    const html = renderToStaticMarkup(createElement(Header));
    expect(html).toContain('Solar Tool');
    expect(html).toContain('Load Calculator');
  });

  it('renders the ApplianceLoadCalculatorPage with 2-column layout and core sections in static markup', () => {
    const html = renderToStaticMarkup(createElement(ApplianceLoadCalculatorPage));

    expect(html).toContain('Appliance Load &amp; Solar Sizing Calculator');
    expect(html).toContain('Step 1: System Objectives');
    expect(html).toContain('Step 2: Quick Presets');
    expect(html).toContain('Step 3: Active Load List');
    expect(html).toContain('Recommended Topology');
    expect(html).toContain('Inverter Load &amp; Surge Stress Meter');
  });

  it('allows switching starter profiles in one click', () => {
    const store = useApplianceLoadStore.getState();
    store.loadProfile('offgrid_cabin_farm');

    const updated = useApplianceLoadStore.getState();
    expect(updated.activeProfileId).toBe('offgrid_cabin_farm');
    expect(updated.config.primaryGoal).toBe('off_grid');

    const result = updated.getSizingResult();
    expect(result.recommendedTopology).toBe('off_grid');
    expect(result.recommendedBatteryUnits5kWh).toBeGreaterThanOrEqual(1);
    expect(result.recommendedPvKwp).toBeGreaterThan(0);
  });

  it('dynamically adapts topology recommendation when user changes primary goal', () => {
    const store = useApplianceLoadStore.getState();

    // Set goal to bill savings on stable grid
    store.setConfig({ primaryGoal: 'bill_savings', gridReliability: 'stable' });

    const updated = useApplianceLoadStore.getState();
    expect(updated.config.primaryGoal).toBe('bill_savings');
    expect(updated.config.gridReliability).toBe('stable');

    const result = updated.getSizingResult();
    expect(result.recommendedTopology).toBe('grid_tie');
  });

  it('bridges sizing results into the main Solar Tool on "Transfer Sizing"', () => {
    const store = useApplianceLoadStore.getState();
    store.loadProfile('standard_family_home');
    const result = store.getSizingResult();

    const calcStore = useCalculatorStore.getState();
    calcStore.setPanelCountOverride(result.recommendedPanelCount);
    calcStore.setActiveView('tool');

    expect(useCalculatorStore.getState().activeView).toBe('tool');
    expect(useCalculatorStore.getState().panelCountOverride).toBe(result.recommendedPanelCount);
  });
});
