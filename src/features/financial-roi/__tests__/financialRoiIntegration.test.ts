// src/features/financial-roi/__tests__/financialRoiIntegration.test.ts
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { QuickBillSliderBanner } from '../components/QuickBillSliderBanner';
import { ExportModeComparisonCards } from '../components/ExportModeComparisonCards';
import { CashflowTimelineChart } from '../components/CashflowTimelineChart';
import { MonthlyBillComparisonBar } from '../components/MonthlyBillComparisonBar';
import { EnergyFateBreakdownBar } from '../components/EnergyFateBreakdownBar';
import { TariffPresetSelector } from '../components/TariffPresetSelector';
import { CapexBreakdownCard } from '../components/CapexBreakdownCard';

describe('Financial ROI Store & Authentication Integration Suite', () => {
  beforeEach(() => {
    useFinancialRoiStore.getState().resetToDefaults();
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it('initializes with default Philippine Meralco tariff presets and net metering strategy', () => {
    const state = useFinancialRoiStore.getState();
    expect(state.config.selectedUtilityId).toBe('meralco');
    expect(state.config.retailRatePhp).toBe(11.85);
    expect(state.config.exportCreditRatePhp).toBe(6.40);
    expect(state.config.exportStrategy).toBe('net_metering');
    expect(state.config.annualTariffInflationPercent).toBe(4.5);
    expect(state.config.includeInverterReplacement).toBe(true);
    expect(state.config.includeBatteryReplacement).toBe(true);
  });

  it('updates parameters when selecting different utility presets', () => {
    const store = useFinancialRoiStore.getState();
    store.setUtilityPreset('batelec_2');

    const updated = useFinancialRoiStore.getState();
    expect(updated.config.selectedUtilityId).toBe('batelec_2');
    expect(updated.config.retailRatePhp).toBe(11.20);
    expect(updated.config.exportCreditRatePhp).toBe(6.10);
    expect(updated.config.netMeteringSetupCostPhp).toBe(30000);
  });

  it('allows setting custom CAPEX override and recalculates active simulation', () => {
    const store = useFinancialRoiStore.getState();
    const defaultSim = store.getActiveSimulation();

    store.updateConfig({ useCustomCapex: true, customCapexPhp: 180000 });
    const customSim = useFinancialRoiStore.getState().getActiveSimulation();

    expect(customSim.initialCapexPhp).toBe(180000);
    expect(customSim.initialCapexPhp).not.toBe(defaultSim.initialCapexPhp);
  });

  it('updates active scenario comparison and propagates to config export strategy', () => {
    const store = useFinancialRoiStore.getState();
    store.setActiveScenarioComparison('zero_export');

    const state = useFinancialRoiStore.getState();
    expect(state.activeScenarioComparison).toBe('zero_export');
    expect(state.config.exportStrategy).toBe('zero_export');

    const sim = state.getActiveSimulation();
    expect(sim.strategy).toBe('zero_export');
    expect(sim.dailyKwhBreakdown.gridExportedKwh).toBe(0);
  });

  it('provides standalone monthly bill input with live sizing fallback', () => {
    const store = useFinancialRoiStore.getState();
    store.setUseStandaloneBillOverride(true);
    store.setStandaloneMonthlyBill(12000);

    const input = useFinancialRoiStore.getState().getSystemSizingInput();
    expect(input.sourceLabel).toContain('₱12,000/mo');
    expect(input.dailyTotalKwh).toBeGreaterThan(20);
    expect(input.pvKwp).toBeGreaterThan(4);
  });

  it('verifies auth protection requirement for financial-roi view', () => {
    const authState = useAuthStore.getState();
    expect(authState.user).toBeNull();

    const calcStore = useCalculatorStore.getState();
    calcStore.setActiveView('financial-roi');
    expect(useCalculatorStore.getState().activeView).toBe('financial-roi');

    const pagePath = path.resolve(process.cwd(), 'src/features/financial-roi/components/FinancialRoiPage.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("setActiveView('login')");
    expect(content).toContain('LOGIN REQUIRED');
  });

  it('renders all Financial ROI components cleanly without uncached Zustand selector calls', () => {
    // Render each UI module and confirm zero getSnapshot loop errors
    expect(renderToStaticMarkup(createElement(QuickBillSliderBanner))).toContain('System Sizing &amp; Energy Baseline');
    expect(renderToStaticMarkup(createElement(ExportModeComparisonCards))).toContain('Architecture Financial Comparison');
    expect(renderToStaticMarkup(createElement(CashflowTimelineChart))).toContain('10-Year Cumulative Cashflow &amp; Breakeven Curve');
    expect(renderToStaticMarkup(createElement(MonthlyBillComparisonBar))).toContain('Year 1 Electric Bill Impact');
    expect(renderToStaticMarkup(createElement(EnergyFateBreakdownBar))).toContain('Daily Solar Energy Fate &amp; Utilization');
    expect(renderToStaticMarkup(createElement(TariffPresetSelector))).toContain('Electric Utility Tariff &amp; Economics');
    expect(renderToStaticMarkup(createElement(CapexBreakdownCard))).toContain('System Turnkey CAPEX &amp; Replacements');
  });

  it('recomputes ROI sizing from Studio calculationResult without stale memoization', () => {
    const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    const prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      act(() => {
        useApplianceLoadStore.getState().clearAll();
        useFinancialRoiStore.getState().setUseStandaloneBillOverride(false);
        useCalculatorStore.getState().setPanelCountOverride(6);
        root.render(createElement(QuickBillSliderBanner));
      });

      const smallInput = useFinancialRoiStore.getState().getSystemSizingInput();
      expect(container.textContent).toContain(`${smallInput.pvKwp} kWp PV`);
      expect(container.textContent).toContain('Solar Engineering Workbench');

      act(() => {
        useCalculatorStore.getState().setPanelCountOverride(16);
      });

      const largeInput = useFinancialRoiStore.getState().getSystemSizingInput();
      expect(smallInput.pvKwp).not.toBe(largeInput.pvKwp);
      expect(container.textContent).toContain(`${largeInput.pvKwp} kWp PV`);
    } finally {
      act(() => {
        root.unmount();
      });
      container.remove();
      g.IS_REACT_ACT_ENVIRONMENT = prevActEnv;
    }
  });
});
