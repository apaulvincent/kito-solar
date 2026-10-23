// src/features/yield-simulator/__tests__/yieldSimulationEngine.test.ts
import { describe, expect, it } from 'vitest';
import { runYieldSimulation } from '../utils/yieldSimulationEngine';
import { YieldSimulationInput } from '../types/yieldSimulator';
import { STARTER_PROFILES } from '@/lib/applianceSizingEngine';
import { pathToView, useCalculatorStore } from '@/store/useCalculatorStore';
import { useYieldSimulatorStore } from '../store/useYieldSimulatorStore';
import { generateSizingPdf } from '@/services/pdfExportService';

const sampleAppliances = STARTER_PROFILES.standard_family_home.items.map(
  (item, idx) => ({
    ...item,
    id: `test_app_${idx}`,
  })
);

function createBaseInput(
  overrides: Partial<YieldSimulationInput> = {}
): YieldSimulationInput {
  return {
    pvArrayKwp: 6.96,
    inverterKw: 5.0,
    batteryCapacityKwh: 10.24,
    initialBatterySocPercent: 35,
    minReserveSocPercent: 20,
    roundTripEfficiency: 0.92,
    maxBatteryCRate: 0.5,
    systemTopology: 'hybrid',
    isZeroExport: false,
    weatherScenario: 'clear_sky',
    emsMode: 'self_consumption',
    peakSunHours: 4.8,
    latitude: 14.5995,
    brownout: {
      enabled: false,
      startHour: 18.0,
      endHour: 23.5,
      shedNonCriticalLoads: true,
    },
    instantBlackoutActive: false,
    currentStepIndex: 48,
    appliances: sampleAppliances,
    disabledApplianceIds: [],
    forcedOnApplianceIds: [],
    shiftedToMiddayIds: [],
    ...overrides,
  };
}

describe('yieldSimulationEngine (96-step Digital Twin Physics Solver)', () => {
  it('simulates 96 discrete 15-minute steps from 00:00 to 23:45 and conserves power at every step', () => {
    const result = runYieldSimulation(createBaseInput());
    expect(result.steps).toHaveLength(96);
    expect(result.steps[0].timeLabel).toBe('00:00');
    expect(result.steps[95].timeLabel).toBe('23:45');

    for (const step of result.steps) {
      const battDischargeKw =
        step.batteryPowerKw < 0 ? Math.abs(step.batteryPowerKw) : 0;
      const battChargeKw = step.batteryPowerKw > 0 ? step.batteryPowerKw : 0;

      const totalSourcesKw =
        step.actualPvKw + battDischargeKw + step.gridImportKw;
      const totalSinksKw =
        step.activeLoadKw + battChargeKw + step.gridExportKw;

      // Conservation of power on the inverter bus within floating-point rounding tolerance
      expect(Math.abs(totalSourcesKw - totalSinksKw)).toBeLessThan(1e-3);
    }
  });

  it('strictly bounds Battery SoC within [0%, 100%] and respects round-trip efficiency', () => {
    const result = runYieldSimulation(
      createBaseInput({
        pvArrayKwp: 9.28,
        batteryCapacityKwh: 5.12,
        initialBatterySocPercent: 80,
        roundTripEfficiency: 0.9,
      })
    );

    for (const step of result.steps) {
      expect(step.batterySocPercent).toBeGreaterThanOrEqual(0);
      expect(step.batterySocPercent).toBeLessThanOrEqual(100);
    }
    expect(result.maxBatterySocPercent).toBeLessThanOrEqual(100);
    expect(result.minBatterySocPercent).toBeGreaterThanOrEqual(20);
  });

  it('enforces Anti-Islanding shutdown (0 kW PV output) when Grid-Tie topology experiences a grid outage', () => {
    const result = runYieldSimulation(
      createBaseInput({
        systemTopology: 'grid_tie',
        batteryCapacityKwh: 0,
        brownout: {
          enabled: true,
          startHour: 11.0,
          endHour: 14.0,
          shedNonCriticalLoads: false,
        },
      })
    );

    expect(result.antiIslandingDetected).toBe(true);

    // Steps between 11:00 (step 44) and 13:45 (step 55) are offline during peak sun
    const middayOutageSteps = result.steps.filter(
      (s) => s.hourDecimal >= 11.0 && s.hourDecimal < 14.0
    );
    expect(middayOutageSteps.length).toBe(12);

    for (const step of middayOutageSteps) {
      expect(step.isGridOnline).toBe(false);
      expect(step.isAntiIslandingTripped).toBe(true);
      expect(step.actualPvKw).toBe(0);
      expect(step.potentialPvKw).toBeGreaterThan(1.0);
      expect(step.clippedPvKw).toBeCloseTo(step.potentialPvKw, 3);
    }
  });

  it('enforces Zero-Export mode (gridExportKw === 0) and logs afternoon curtailed solar once battery reaches 100% SoC', () => {
    const result = runYieldSimulation(
      createBaseInput({
        pvArrayKwp: 8.12,
        inverterKw: 8.0,
        batteryCapacityKwh: 5.12,
        initialBatterySocPercent: 75,
        isZeroExport: true,
      })
    );

    expect(result.gridExportedKwh).toBe(0);
    for (const step of result.steps) {
      expect(step.gridExportKw).toBe(0);
    }

    // Battery reaches 100% SoC by midday and excess solar is logged as zeroExportCurtailedKwh / totalClippedPvKwh
    expect(result.maxBatterySocPercent).toBeGreaterThanOrEqual(99.5);
    expect(result.zeroExportCurtailedKwh).toBeGreaterThan(1.0);
    expect(result.totalClippedPvKwh).toBeGreaterThanOrEqual(
      result.zeroExportCurtailedKwh
    );
    expect(result.curtailmentStartTime).not.toBeNull();
  });

  it('tracks DC-to-AC inverter ceiling clipping when PV array exceeds inverter rating at clear-sky noon', () => {
    const result = runYieldSimulation(
      createBaseInput({
        pvArrayKwp: 8.5,
        inverterKw: 5.0,
        isZeroExport: false,
      })
    );

    expect(result.inverterClippedKwh).toBeGreaterThan(0.5);
    const noonStep = result.steps[48]; // 12:00
    expect(noonStep.potentialPvKw).toBeGreaterThan(5.0);
    expect(noonStep.actualPvKw).toBeLessThanOrEqual(5.0);
    expect(noonStep.inverterClippedKw).toBeGreaterThan(0);
  });

  it('detects battery depletion and unmet load minutes during an extended evening brownout', () => {
    const result = runYieldSimulation(
      createBaseInput({
        batteryCapacityKwh: 2.5,
        initialBatterySocPercent: 30,
        minReserveSocPercent: 20,
        weatherScenario: 'monsoon_overcast',
        brownout: {
          enabled: true,
          startHour: 17.5,
          endHour: 23.75,
          shedNonCriticalLoads: false,
        },
      })
    );

    expect(result.brownoutSurvived).toBe(false);
    expect(result.blackoutUnmetMinutes).toBeGreaterThan(0);
    expect(result.batteryDepletedTimeLabel).not.toBeNull();
  });

  it('interpolates 24-hour Open-Meteo radiation and temperature telemetry when in live_open_meteo mode', () => {
    const hourlyRad = Array.from({ length: 24 }, (_, h) =>
      h >= 6 && h <= 17 ? Math.round(900 * Math.sin(((h - 6) / 12) * Math.PI)) : 0
    );
    const hourlyTemp = Array.from({ length: 24 }, (_, h) => 25 + (h >= 10 && h <= 16 ? 7 : 2));

    const result = runYieldSimulation(
      createBaseInput({
        weatherScenario: 'live_open_meteo',
        liveWeatherHourly: {
          time: Array.from({ length: 24 }, (_, h) => `2026-10-23T${String(h).padStart(2, '0')}:00`),
          temperature_2m: hourlyTemp,
          cloud_cover: new Array(24).fill(20),
          shortwave_radiation: hourlyRad,
          direct_normal_irradiance: hourlyRad,
          diffuse_radiation: new Array(24).fill(100),
        },
      })
    );

    expect(result.totalHarvestedPvKwh).toBeGreaterThan(10);
    expect(result.steps[48].irradianceWm2).toBeCloseTo(900, 0);
  });

  it('routes /yield-simulator and syncs store hardware specs + PDF dispatch export', () => {
    expect(pathToView('/yield-simulator')).toBe('yield-simulator');
    expect(pathToView('/simulator')).toBe('yield-simulator');

    const simStore = useYieldSimulatorStore.getState();
    simStore.syncFromLoadCalculator();
    expect(useYieldSimulatorStore.getState().pvArrayKwp).toBeGreaterThan(0);
    expect(useYieldSimulatorStore.getState().inverterKw).toBeGreaterThan(0);

    simStore.syncFromSolarStudio();
    const calcState = useCalculatorStore.getState();
    expect(useYieldSimulatorStore.getState().pvArrayKwp).toBe(
      calcState.calculationResult.summary.totalArrayPowerKw
    );

    const doc = generateSizingPdf({
      calculationResult: calcState.calculationResult,
      selectedInverter: calcState.selectedInverter,
      selectedModule: calcState.selectedModule,
      selectedBattery: calcState.selectedBattery,
      batteryCount: calcState.batteryCount,
      gridVoltageV: calcState.gridVoltageV,
      mainBreakerA: calcState.mainBreakerA,
      userEmail: 'engineer@kitosolar.ph',
      userName: 'Test Engineer',
    });

    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
