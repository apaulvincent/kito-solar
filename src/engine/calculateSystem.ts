// src/engine/calculateSystem.ts
import {
  CalculationInput,
  SystemCalculationResult,
  SystemWarning,
  SystemType,
} from '@/types/calculator';

import { calculateDc } from './calculateDc';
import { calculateAc } from './calculateAc';
import { calculateBattery } from './calculateBattery';
import { calculatePvSizing } from './calculatePvSizing';
import { calculateStringSizing } from './calculateStringSizing';
import { calculateMounting } from './calculateMounting';
import { parseNumericValue } from '@/lib/utils';

export function calculateSystem(input: CalculationInput): SystemCalculationResult {
  const {
    inverter,
    module,
    battery,
    batteryCount,
    gridVoltageV = 230,
    mainBreakerA,
    panelCountOverride,
  } = input;

  // Determine system classification: Hybrid vs On-grid
  const isBatteryCapable = Boolean(
    inverter.battery_type &&
    inverter.battery_voltage_range &&
    inverter.battery_type.toLowerCase() !== 'none'
  );

  const systemType: SystemType = isBatteryCapable ? 'hybrid' : 'ongrid';

  // Sizing calculations
  const pvSizing = calculatePvSizing(inverter, module, panelCountOverride);
  const stringSizing = calculateStringSizing(inverter, module, pvSizing.activePanelCount);
  const dc = calculateDc(inverter, module);
  const ac = calculateAc(inverter, gridVoltageV, mainBreakerA);
  const batteryResult = calculateBattery(inverter, battery, batteryCount);
  const mounting = calculateMounting(pvSizing.activePanelCount, stringSizing.recommendedStrings);

  // Validation & Warnings
  const warnings: SystemWarning[] = [];

  // 1. Array Power Validation
  const maxPvPowerW = Number(inverter.max_pv_input_power_w) || 0;
  if (pvSizing.totalPvPowerW > maxPvPowerW && maxPvPowerW > 0) {
    warnings.push({
      id: 'pv-power-exceeded',
      severity: 'error',
      category: 'pv',
      title: 'PV Array Power Exceeds Inverter Limit',
      message: `Calculated array power (${(pvSizing.totalPvPowerW / 1000).toFixed(2)} kW) exceeds the inverter maximum PV input ceiling of ${(maxPvPowerW / 1000).toFixed(2)} kW.`,
      recommendation: `Reduce panel count to at most ${pvSizing.maxPanels} modules to avoid inverter tripping or thermal curtailment.`,
    });
  } else if (pvSizing.totalPvPowerW >= maxPvPowerW * 0.95 && maxPvPowerW > 0) {
    warnings.push({
      id: 'pv-power-near-limit',
      severity: 'warning',
      category: 'pv',
      title: 'PV Array Approaches Inverter Maximum',
      message: `Configured array power is at ${Math.round((pvSizing.totalPvPowerW / maxPvPowerW) * 100)}% of maximum inverter input capability.`,
      recommendation: 'Verify ventilation around inverter chassis to mitigate thermal derating on high-irradiance afternoons.',
    });
  }

  // 2. Voltage / MPPT Validation
  if (!stringSizing.withinMpptRange) {
    warnings.push({
      id: 'mppt-voltage-out-of-range',
      severity: 'warning',
      category: 'pv',
      title: 'String Voltage Outside Optimum MPPT Window',
      message: `String operating voltage (${stringSizing.voltagePerStringVmp} V) falls outside the inverter rated MPPT window.`,
      recommendation: `Target string voltages between ${pvSizing.minMpptV} V and ${pvSizing.maxMpptV} V.`,
    });
  }

  if (stringSizing.voltagePerStringVoc > stringSizing.maxPvVoltageV) {
    warnings.push({
      id: 'voc-safety-exceeded',
      severity: 'error',
      category: 'safety',
      title: 'String Open-Circuit Voltage Exceeds Maximum DC Voltage',
      message: `Cold-weather open-circuit voltage (${stringSizing.voltagePerStringVoc} V) exceeds the inverter ${stringSizing.maxPvVoltageV} V safety ceiling.`,
      recommendation: 'Reduce the number of modules in series per string immediately.',
    });
  }

  // 3. Battery Compatibility & Presence
  if (isBatteryCapable) {
    if (!battery || batteryCount <= 0) {
      warnings.push({
        id: 'hybrid-no-battery',
        severity: 'info',
        category: 'battery',
        title: 'Hybrid Inverter Operating Without Battery Storage',
        message: 'A battery-capable hybrid inverter is selected, but no battery bank is configured. System will operate in grid-export mode only without EPS backup.',
        recommendation: 'Configure a compatible 24V or 48V/51.2V battery pack to unlock backup and self-consumption capabilities.',
      });
    } else {
      // Check voltage compatibility
      const batteryNominal = Number(battery.nominal_voltage_v) || 0;
      const rangeStr = inverter.battery_voltage_range || '';
      if (rangeStr.includes('-')) {
        const [minV, maxV] = rangeStr.split('-').map((v) => parseFloat(v.trim()));
        if (!isNaN(minV) && !isNaN(maxV)) {
          if (batteryNominal < minV * 0.85 || batteryNominal > maxV * 1.15) {
            warnings.push({
              id: 'battery-voltage-mismatch',
              severity: 'warning',
              category: 'battery',
              title: 'Battery Voltage Mismatch',
              message: `Selected battery nominal voltage (${batteryNominal} V) may fall outside the inverter voltage window (${rangeStr} V).`,
              recommendation: `Confirm series/parallel configuration to match the inverter battery port requirement (${rangeStr} V).`,
            });
          }
        }
      }
    }
  }

  // 4. Main Breaker / ATS advisory
  if (!mainBreakerA) {
    warnings.push({
      id: 'ats-unconfigured',
      severity: 'info',
      category: 'grid',
      title: 'Main Service Breaker Not Specified',
      message: 'Enter the residential or facility main panel breaker size to automatically configure an Automatic Transfer Switch (ATS).',
    });
  }

  // Summary Metrics
  const summary = {
    inverterModel: inverter.model,
    inverterPowerKw: Number(((parseNumericValue(inverter.rated_ac_power_w) / 1000) || 0).toFixed(1)),
    moduleModel: module.model,
    modulePowerW: parseNumericValue(module.pv_wattage_w) || 0,
    totalPanels: pvSizing.activePanelCount,
    totalArrayPowerKw: Number((pvSizing.totalPvPowerW / 1000).toFixed(2)),
    dcAcRatio: pvSizing.dcAcRatio,
    batteryBankSummary: batteryResult.hasBattery
      ? `${batteryCount}x ${battery?.model} (${(batteryResult.totalEnergyWh / 1000).toFixed(1)} kWh @ ${batteryResult.bankVoltageV}V)`
      : 'No Storage (Grid-Tied)',
  };

  return {
    systemType,
    dc,
    ac,
    battery: batteryResult,
    pvSizing,
    stringSizing,
    mounting,
    warnings,
    summary,
  };
}
