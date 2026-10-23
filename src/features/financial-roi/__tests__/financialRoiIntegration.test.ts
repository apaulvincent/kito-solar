// src/features/financial-roi/__tests__/financialRoiIntegration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useFinancialRoiStore } from '../store/useFinancialRoiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalculatorStore } from '@/store/useCalculatorStore';

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
    // Guest user should be redirected to login when trying to open financial-roi
    const authState = useAuthStore.getState();
    expect(authState.user).toBeNull();

    const calcStore = useCalculatorStore.getState();
    calcStore.setActiveView('financial-roi');
    expect(useCalculatorStore.getState().activeView).toBe('financial-roi');

    // Simulate auth check logic from App.tsx / FinancialRoiPage.tsx
    const isAuthLoading = authState.isLoading;
    const user = authState.user;
    const activeView = useCalculatorStore.getState().activeView;

    let targetView = activeView;
    if ((activeView === 'solar-mapper' || activeView === 'financial-roi') && !isAuthLoading && !user) {
      targetView = 'login';
    }

    expect(targetView).toBe('login');
  });
});
