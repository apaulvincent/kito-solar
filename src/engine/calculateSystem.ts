import {
  CalculationInput,
  SystemCalculationResult,
  SystemWarning,
  SystemType,
  ProjectCostItem,
  ProjectCostSummary,
} from '@/types/calculator';

import { calculateDc } from './calculateDc';
import { calculateAc } from './calculateAc';
import { calculateBattery } from './calculateBattery';
import { calculatePvSizing } from './calculatePvSizing';
import { calculateStringSizing } from './calculateStringSizing';
import { calculateMounting } from './calculateMounting';
import { parseNumericValue } from '@/lib/utils';
import accessoriesSeed from '@/data/seed/calculator_accessories.json';

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

  // Accessory pricing map (live Supabase accessories or fallback seed)
  const rawAccessories = input.accessories && input.accessories.length > 0 ? input.accessories : accessoriesSeed;
  const accessoryPriceMap = new Map<string, number | null>();
  for (const acc of rawAccessories) {
    accessoryPriceMap.set(acc.accessory_key, acc.price_php ?? null);
  }

  // Sizing calculations
  const pvSizing = calculatePvSizing(inverter, module, panelCountOverride);
  const stringSizing = calculateStringSizing(inverter, module, pvSizing.activePanelCount);
  const dc = calculateDc(inverter, module);
  const ac = calculateAc(inverter, gridVoltageV, mainBreakerA);
  const batteryResult = calculateBattery(inverter, battery, batteryCount);
  const mounting = calculateMounting(pvSizing.activePanelCount, stringSizing.recommendedStrings, accessoryPriceMap);

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

  // Cost & Investment Calculation
  const getAccPrice = (key: string): number | null => {
    return accessoryPriceMap.get(key) ?? null;
  };

  const costItems: ProjectCostItem[] = [];

  // 1. Major Equipment
  const invPrice = inverter.price_php ? Number(inverter.price_php) : null;
  costItems.push({
    key: 'inverter',
    name: `${inverter.brand} ${inverter.model}`,
    category: 'equipment',
    quantity: 1,
    unit: 'unit',
    unitPricePhp: invPrice,
    totalPricePhp: invPrice,
    isTbd: !invPrice || invPrice <= 0,
  });

  const modPrice = module.price_php ? Number(module.price_php) : null;
  const modTotal = modPrice ? modPrice * pvSizing.activePanelCount : null;
  costItems.push({
    key: 'solar_module',
    name: `${module.brand} ${module.model} (${module.pv_wattage_w}W)`,
    category: 'equipment',
    quantity: pvSizing.activePanelCount,
    unit: 'panels',
    unitPricePhp: modPrice,
    totalPricePhp: modTotal,
    isTbd: !modPrice || modPrice <= 0,
  });

  if (batteryResult.hasBattery && battery) {
    const batPrice = battery.price_php ? Number(battery.price_php) : null;
    const batTotal = batPrice ? batPrice * batteryCount : null;
    costItems.push({
      key: 'battery_bank',
      name: `${battery.model} (${battery.nominal_voltage_v}V ${battery.capacity_ah}Ah)`,
      category: 'equipment',
      quantity: batteryCount,
      unit: 'units',
      unitPricePhp: batPrice,
      totalPricePhp: batTotal,
      isTbd: !batPrice || batPrice <= 0,
    });
  }

  // 2. Mounting Hardware
  for (const mItem of mounting.items) {
    costItems.push({
      key: `mounting_${mItem.key}`,
      name: mItem.name,
      category: 'mounting',
      quantity: mItem.quantity,
      unit: mItem.unit,
      unitPricePhp: mItem.unitPricePhp ?? null,
      totalPricePhp: mItem.totalPricePhp ?? null,
      isTbd: !mItem.unitPricePhp || mItem.unitPricePhp <= 0,
    });
  }

  // 3. Balance of System Switchgear & Protection
  const addSwitchgearItem = (
    key: string,
    name: string,
    category: ProjectCostItem['category'],
    quantity: number = 1,
    unit: string = 'pc'
  ) => {
    const unitPrice = getAccPrice(key);
    const totalPrice = unitPrice ? unitPrice * quantity : null;
    costItems.push({
      key,
      name,
      category,
      quantity,
      unit,
      unitPricePhp: unitPrice,
      totalPricePhp: totalPrice,
      isTbd: !unitPrice || unitPrice <= 0,
    });
  };

  addSwitchgearItem('pv_dc_breaker', `${dc.breakerRatingA}A PV DC Circuit Breaker`, 'protection');
  addSwitchgearItem('pv_dc_isolator', `${dc.isolatorRatingA}A PV DC Rotary Disconnect`, 'protection');
  addSwitchgearItem('pv_dc_spd', `DC Surge Protective Device (${dc.spdRating})`, 'protection');
  addSwitchgearItem('dc_conduit', `DC PVC Conduit & Fittings (${dc.conduitSpec})`, 'conduit', 1, 'lot');
  addSwitchgearItem('grounding', `Ground Cable (${dc.groundConductorSpec}) & Rod`, 'grounding', 1, 'set');
  addSwitchgearItem('ac_grid_breaker', `${ac.breakerRatingA}A Inverter AC Grid Breaker`, 'protection');
  addSwitchgearItem('ac_isolator', `${ac.isolatorRatingA}A AC Disconnect Isolator`, 'protection');
  addSwitchgearItem('ac_spd', `AC Surge Protective Device (${ac.spdRating})`, 'protection');

  if (ac.atsConfigured) {
    addSwitchgearItem('ats', `${ac.atsRatingA ?? 63}A Automatic Transfer Switch (ATS)`, 'transfer');
  }

  if (batteryResult.hasBattery) {
    addSwitchgearItem('battery_breaker', `${batteryResult.recommendedBreakerA}A Battery DC MCCB`, 'protection');
    addSwitchgearItem('battery_wire', `Battery Conductor Pair (${batteryResult.wireSpec})`, 'wiring', 1, 'set');
    addSwitchgearItem('eps_breaker', `${ac.epsBreakerRatingA}A Inverter EPS Output Breaker`, 'protection');
  }

  let equipmentSubtotalPhp = 0;
  let mountingSubtotalPhp = 0;
  let switchgearSubtotalPhp = 0;
  let tbdItemCount = 0;

  for (const item of costItems) {
    if (item.isTbd || item.totalPricePhp == null) {
      tbdItemCount++;
    } else {
      if (item.category === 'equipment') {
        equipmentSubtotalPhp += item.totalPricePhp;
      } else if (item.category === 'mounting') {
        mountingSubtotalPhp += item.totalPricePhp;
      } else {
        switchgearSubtotalPhp += item.totalPricePhp;
      }
    }
  }

  const grandTotalPhp = equipmentSubtotalPhp + mountingSubtotalPhp + switchgearSubtotalPhp;

  // 4. Financial ROI & Payback Computation
  // Default tariff: ₱12.00/kWh (Meralco / Philippine DU national average)
  const tariffRatePhp = 12.0;
  const peakSunHours = 4.5;
  const systemLosses = 0.20;
  const monthlySolarGenKwh = Math.round(
    (pvSizing.totalPvPowerW / 1000) * peakSunHours * (1 - systemLosses) * 30
  );
  const estimatedMonthlySavingsPhp = Math.round(monthlySolarGenKwh * tariffRatePhp);
  const annualSavingsPhp = estimatedMonthlySavingsPhp * 12;

  const hasAnyTbdItems = tbdItemCount > 0;
  const canComputeRoi = !hasAnyTbdItems && grandTotalPhp > 0 && annualSavingsPhp > 0;
  const paybackPeriodYears = canComputeRoi
    ? Number((grandTotalPhp / annualSavingsPhp).toFixed(1))
    : null;

  const hasBenchmarkEstimates = costItems.some((ci) => ci.isEstimated);

  const costSummary: ProjectCostSummary = {
    items: costItems,
    equipmentSubtotalPhp,
    mountingSubtotalPhp,
    switchgearSubtotalPhp,
    grandTotalPhp,
    tbdItemCount,
    isFullyEstimated: tbdItemCount === 0,
    financialRoi: {
      estimatedMonthlySavingsPhp,
      annualSavingsPhp,
      paybackPeriodYears,
      canComputeRoi,
      roiUnavailableReason: hasAnyTbdItems
        ? `ROI and simple payback period cannot be determined while ${tbdItemCount} component(s) are marked TBD. Complete pricing is required.`
        : undefined,
      isBenchmarkEstimate: hasBenchmarkEstimates,
    },
  };

  return {
    systemType,
    dc,
    ac,
    battery: batteryResult,
    pvSizing,
    stringSizing,
    mounting,
    costSummary,
    warnings,
    summary,
  };
}
