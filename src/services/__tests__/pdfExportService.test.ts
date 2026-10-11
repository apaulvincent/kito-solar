import { describe, it, expect } from 'vitest';
import { generateSizingPdf } from '../pdfExportService';
import { calculateSystem } from '@/engine/calculateSystem';
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
