import { describe, it, expect } from 'vitest';
import { generateSizingPdf } from '../pdfExportService';
import { calculateSystem } from '@/engine/calculateSystem';
import { DailySimulationSummary } from '@/features/yield-simulator/types/yieldSimulator';
import invertersSeed from '@/data/seed/solar_inverters.json';
import modulesSeed from '@/data/seed/solar_modules.json';
import batteriesSeed from '@/data/seed/batteries.json';
import { SolarInverterRecord, SolarModuleRecord, BatteryRecord } from '@/types/supabase';

describe('pdfExportService', () => {
  const inverter = (invertersSeed as SolarInverterRecord[])[0];
  const module = (modulesSeed as SolarModuleRecord[])[0];
  const battery = (batteriesSeed as BatteryRecord[])[0];

  it('generates a valid jsPDF document for hybrid systems', () => {
    const calculationResult = calculateSystem({
      inverter,
      module,
      battery,
      batteryCount: 1,
      gridVoltageV: 230,
      mainBreakerA: 63,
    });

    const sampleYield: DailySimulationSummary = {
      totalPotentialPvKwh: 23.0,
      totalHarvestedPvKwh: 22.4,
      totalClippedPvKwh: 0.6,
      inverterClippedKwh: 0.4,
      zeroExportCurtailedKwh: 0.2,
      curtailmentStartTime: null,
      totalLoadConsumedKwh: 18.2,
      totalUnmetLoadKwh: 0,
      directSolarToLoadKwh: 10.5,
      batteryChargedKwh: 8.0,
      batteryDischargedKwh: 6.8,
      gridImportedKwh: 0.9,
      gridExportedKwh: 3.1,
      selfSufficiencyPercent: 95.1,
      solarSelfConsumptionPercent: 86.2,
      minBatterySocPercent: 25,
      maxBatterySocPercent: 98,
      brownoutSurvived: true,
      blackoutUnmetMinutes: 0,
      batteryDepletedTimeLabel: null,
      overloadFaultDetected: false,
      antiIslandingDetected: false,
      diagnostics: [],
      steps: [],
    };

    const doc = generateSizingPdf({
      calculationResult,
      selectedInverter: inverter,
      selectedModule: module,
      selectedBattery: battery,
      batteryCount: 1,
      gridVoltageV: 230,
      mainBreakerA: 63,
      userEmail: 'engineer@kitosolar.com',
      userName: 'Lead Solar Engineer',
      yieldSummary: sampleYield,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const pdfOutput = doc.output('arraybuffer');
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });

  it('generates a valid jsPDF document for on-grid systems without batteries', () => {
    const calculationResult = calculateSystem({
      inverter,
      module,
      battery: null,
      batteryCount: 0,
      gridVoltageV: 230,
      mainBreakerA: null,
    });

    const doc = generateSizingPdf({
      calculationResult,
      selectedInverter: inverter,
      selectedModule: module,
      selectedBattery: null,
      batteryCount: 0,
      gridVoltageV: 230,
      mainBreakerA: null,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
