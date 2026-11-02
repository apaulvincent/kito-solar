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
import batteriesSeed from '@/data/seed/batteries.json';
import { BatteryRecord } from '@/types/supabase';
import { AddableComponentKey, PLANT_ROOM_GEOMETRY } from '@/types/layout3d';

export function calculateSystem(input: CalculationInput): SystemCalculationResult {
  const {
    inverter,
    module,
    battery,
    batteryCount,
    gridVoltageV = 230,
    mainBreakerA,
    panelCountOverride,
    layout3d,
  } = input;

  // Tally 3D Plant Builder custom placed components & wires
  const placedCounts: Partial<Record<AddableComponentKey, number>> = {};
  const placedList = layout3d?.placedComponents || [];
  for (const item of placedList) {
    placedCounts[item.catalogKey] = (placedCounts[item.catalogKey] || 0) + 1;
  }
  const getAddedCount = (k: AddableComponentKey) => placedCounts[k] || 0;

  const addedInverters = getAddedCount('inverter_unit');
  const addedBatteries = getAddedCount('battery_unit');
  const addedPvArrays = getAddedCount('pv_array_unit');
  const addedPanelsFrom3D = addedPvArrays * 3;

  // Determine system classification: Hybrid vs On-grid
  const isBatteryCapable = Boolean(
    inverter.battery_type &&
    inverter.battery_voltage_range &&
    inverter.battery_type.toLowerCase() !== 'none'
  );

  const systemType: SystemType = isBatteryCapable ? 'hybrid' : 'ongrid';

  // Accessory pricing map (live Supabase accessories or fallback seed)
  const customPrices = input.customPrices || {};
  const rawAccessories = input.accessories && input.accessories.length > 0 ? input.accessories : accessoriesSeed;
  const accessoryPriceMap = new Map<string, number | null>();
  for (const acc of rawAccessories) {
    const custom = customPrices[acc.accessory_key] ?? customPrices[`mounting_${acc.accessory_key}`];
    if (custom !== undefined) {
      accessoryPriceMap.set(acc.accessory_key, custom);
    } else {
      accessoryPriceMap.set(acc.accessory_key, acc.price_php ?? null);
    }
  }

  // Populate any additional custom accessory prices
  for (const [key, val] of Object.entries(customPrices)) {
    if (val !== undefined) {
      if (key.startsWith('mounting_')) {
        accessoryPriceMap.set(key.replace(/^mounting_/, ''), val);
      } else {
        accessoryPriceMap.set(key, val);
      }
    }
  }

  // Sizing calculations
  const pvSizing = calculatePvSizing(inverter, module, panelCountOverride);
  const totalEffectivePanels = pvSizing.activePanelCount + addedPanelsFrom3D;
  const stringSizing = calculateStringSizing(inverter, module, pvSizing.activePanelCount);
  const dc = calculateDc(inverter, module);
  const ac = calculateAc(inverter, gridVoltageV, mainBreakerA);
  const fallback3DBattery =
    (batteriesSeed as BatteryRecord[]).find((b) => b.model === '51.2V-200 Ah') ||
    (batteriesSeed[0] as BatteryRecord);
  const effectiveBatteryRecord = battery || (addedBatteries > 0 ? fallback3DBattery : null);
  const effectiveBatteryUnits = (battery ? batteryCount : 0) + addedBatteries;
  const batteryResult = calculateBattery(
    inverter,
    effectiveBatteryRecord,
    effectiveBatteryUnits > 0 ? effectiveBatteryUnits : batteryCount
  );
  const mounting = calculateMounting(totalEffectivePanels, stringSizing.recommendedStrings + addedPvArrays, accessoryPriceMap);
  const baseMountingCostPhp =
    addedPvArrays > 0
      ? calculateMounting(pvSizing.activePanelCount, stringSizing.recommendedStrings, accessoryPriceMap).totalMountingCostPhp || 0
      : mounting.totalMountingCostPhp || 0;
  const extraMountingFrom3DPhp = Math.max(0, (mounting.totalMountingCostPhp || 0) - baseMountingCostPhp);

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
  const singleInvKw = Number(((parseNumericValue(inverter.rated_ac_power_w) / 1000) || 0).toFixed(1));
  const totalInverterUnits = 1 + addedInverters;
  const moduleWattW = parseNumericValue(module.pv_wattage_w) || 0;
  const effectiveArrayPowerKw = Number(((totalEffectivePanels * moduleWattW) / 1000).toFixed(2));

  const summary = {
    inverterModel: addedInverters > 0 ? `${totalInverterUnits}x ${inverter.model}` : inverter.model,
    inverterPowerKw: Number((singleInvKw * totalInverterUnits).toFixed(1)),
    moduleModel: module.model,
    modulePowerW: moduleWattW,
    totalPanels: totalEffectivePanels,
    totalArrayPowerKw: effectiveArrayPowerKw,
    dcAcRatio: pvSizing.dcAcRatio,
    batteryBankSummary: batteryResult.hasBattery
      ? `${effectiveBatteryUnits}x ${effectiveBatteryRecord?.model} (${(batteryResult.totalEnergyWh / 1000).toFixed(1)} kWh @ ${batteryResult.bankVoltageV}V)`
      : addedBatteries > 0 && effectiveBatteryRecord
      ? `${addedBatteries}x ${effectiveBatteryRecord.model} (3D Layout ESS)`
      : 'No Storage (Grid-Tied)',
  };

  // Cost & Investment Calculation
  const getAccPrice = (key: string): number | null => {
    return accessoryPriceMap.get(key) ?? null;
  };

  const costItems: ProjectCostItem[] = [];
  let addedSubtotalPhp = extraMountingFrom3DPhp;

  // 1. Major Equipment
  const invCustom = customPrices['inverter'];
  const invPrice = invCustom !== undefined
    ? invCustom
    : (inverter.price_php ? Number(inverter.price_php) : null);
  const invTotal = invPrice ? invPrice * totalInverterUnits : null;
  if (invPrice && addedInverters > 0) {
    addedSubtotalPhp += invPrice * addedInverters;
  }
  costItems.push({
    key: 'inverter',
    name:
      addedInverters > 0
        ? `${inverter.brand} ${inverter.model} (1 Base + ${addedInverters} in 3D)`
        : `${inverter.brand} ${inverter.model}`,
    category: 'equipment',
    quantity: totalInverterUnits,
    unit: totalInverterUnits === 1 ? 'unit' : 'units',
    unitPricePhp: invPrice,
    totalPricePhp: invTotal,
    isTbd: !invPrice || invPrice <= 0,
    isCustomPrice: invCustom !== undefined,
  });

  const modCustom = customPrices['solar_module'];
  const modPrice = modCustom !== undefined
    ? modCustom
    : (module.price_php ? Number(module.price_php) : null);
  const modTotal = modPrice ? modPrice * totalEffectivePanels : null;
  if (modPrice && addedPanelsFrom3D > 0) {
    addedSubtotalPhp += modPrice * addedPanelsFrom3D;
  }
  costItems.push({
    key: 'solar_module',
    name:
      addedPanelsFrom3D > 0
        ? `${module.brand} ${module.model} (${module.pv_wattage_w}W) (+${addedPanelsFrom3D} in 3D)`
        : `${module.brand} ${module.model} (${module.pv_wattage_w}W)`,
    category: 'equipment',
    quantity: totalEffectivePanels,
    unit: 'panels',
    unitPricePhp: modPrice,
    totalPricePhp: modTotal,
    isTbd: !modPrice || modPrice <= 0,
    isCustomPrice: modCustom !== undefined,
  });

  if ((batteryResult.hasBattery || addedBatteries > 0) && effectiveBatteryRecord) {
    const batCustom = customPrices['battery_bank'];
    const batPrice = batCustom !== undefined
      ? batCustom
      : (effectiveBatteryRecord.price_php ? Number(effectiveBatteryRecord.price_php) : null);
    const batTotal = batPrice ? batPrice * effectiveBatteryUnits : null;
    if (batPrice && addedBatteries > 0) {
      addedSubtotalPhp += batPrice * addedBatteries;
    }
    costItems.push({
      key: 'battery_bank',
      name:
        addedBatteries > 0
          ? `${effectiveBatteryRecord.model} (${effectiveBatteryRecord.nominal_voltage_v}V ${effectiveBatteryRecord.capacity_ah}Ah) (+${addedBatteries} in 3D)`
          : `${effectiveBatteryRecord.model} (${effectiveBatteryRecord.nominal_voltage_v}V ${effectiveBatteryRecord.capacity_ah}Ah)`,
      category: 'equipment',
      quantity: effectiveBatteryUnits,
      unit: 'units',
      unitPricePhp: batPrice,
      totalPricePhp: batTotal,
      isTbd: !batPrice || batPrice <= 0,
      isCustomPrice: batCustom !== undefined,
    });
  }

  // 2. Mounting Hardware
  for (const mItem of mounting.items) {
    const mountingKey = `mounting_${mItem.key}`;
    const mCustom = customPrices[mountingKey] ?? customPrices[mItem.key];
    const unitPrice = mCustom !== undefined ? mCustom : (mItem.unitPricePhp ?? null);
    const totalPrice = unitPrice ? unitPrice * mItem.quantity : null;
    costItems.push({
      key: mountingKey,
      name: mItem.name,
      category: 'mounting',
      quantity: mItem.quantity,
      unit: mItem.unit,
      unitPricePhp: unitPrice,
      totalPricePhp: totalPrice,
      isTbd: !unitPrice || unitPrice <= 0,
      isCustomPrice: mCustom !== undefined,
    });
  }

  // 3. Balance of System Switchgear & Protection (Base + Added 3D Layout Items)
  const addSwitchgearItem = (
    key: string,
    name: string,
    category: ProjectCostItem['category'],
    baseQuantity: number = 1,
    unit: string = 'pc',
    added3dQty: number = 0,
    fallbackPrice?: number
  ) => {
    const totalQty = baseQuantity + added3dQty;
    if (totalQty <= 0) return;

    const swCustom = customPrices[key];
    const unitPrice = swCustom !== undefined ? swCustom : (getAccPrice(key) ?? fallbackPrice ?? null);
    const totalPrice = unitPrice ? unitPrice * totalQty : null;
    if (unitPrice && added3dQty > 0) {
      addedSubtotalPhp += unitPrice * added3dQty;
    }
    const displayName =
      added3dQty > 0
        ? baseQuantity > 0
          ? `${name} (${baseQuantity} Base + ${added3dQty} in 3D)`
          : `${name} (${added3dQty} Added in 3D)`
        : name;

    costItems.push({
      key,
      name: displayName,
      category,
      quantity: totalQty,
      unit,
      unitPricePhp: unitPrice,
      totalPricePhp: totalPrice,
      isTbd: !unitPrice || unitPrice <= 0,
      isCustomPrice: swCustom !== undefined,
    });
  };

  addSwitchgearItem('pv_dc_breaker', `${dc.breakerRatingA}A PV DC Circuit Breaker`, 'protection', 1, 'pc', getAddedCount('pv_dc_breaker'));
  addSwitchgearItem('pv_dc_isolator', `${dc.isolatorRatingA}A PV DC Rotary Disconnect`, 'protection', 1, 'pc', getAddedCount('pv_dc_isolator'));
  addSwitchgearItem('pv_dc_spd', `DC Surge Protective Device (${dc.spdRating})`, 'protection', 1, 'pc', getAddedCount('pv_dc_spd'));
  addSwitchgearItem('dc_conduit', `DC PVC Conduit & Fittings (${dc.conduitSpec})`, 'conduit', 1, 'lot');
  addSwitchgearItem('grounding', `Ground Cable (${dc.groundConductorSpec}) & Rod`, 'grounding', 1, 'set', getAddedCount('grounding_busbar'));
  addSwitchgearItem('ac_grid_breaker', `${ac.breakerRatingA}A Inverter AC Grid Breaker`, 'protection', 1, 'pc', getAddedCount('ac_grid_breaker'));
  addSwitchgearItem('ac_isolator', `${ac.isolatorRatingA}A AC Disconnect Isolator`, 'protection', 1, 'pc', getAddedCount('ac_isolator'));
  addSwitchgearItem('ac_spd', `AC Surge Protective Device (${ac.spdRating})`, 'protection', 1, 'pc', getAddedCount('ac_spd'));

  if (ac.atsConfigured || getAddedCount('ats') > 0) {
    addSwitchgearItem(
      'ats',
      `${ac.atsRatingA ?? 63}A Automatic Transfer Switch (ATS)`,
      'transfer',
      ac.atsConfigured ? 1 : 0,
      'pc',
      getAddedCount('ats')
    );
  }

  const hasBaseBatteryBoS = batteryResult.hasBattery && Boolean(battery);
  if (hasBaseBatteryBoS || getAddedCount('battery_breaker') > 0) {
    addSwitchgearItem(
      'battery_breaker',
      `${batteryResult.recommendedBreakerA || 125}A Battery DC MCCB`,
      'protection',
      hasBaseBatteryBoS ? 1 : 0,
      'pc',
      getAddedCount('battery_breaker')
    );
  }
  if (hasBaseBatteryBoS) {
    addSwitchgearItem('battery_wire', `Battery Conductor Pair (${batteryResult.wireSpec})`, 'wiring', 1, 'set');
  }
  if (hasBaseBatteryBoS || getAddedCount('eps_breaker') > 0) {
    addSwitchgearItem(
      'eps_breaker',
      `${ac.epsBreakerRatingA}A Inverter EPS Output Breaker`,
      'protection',
      hasBaseBatteryBoS ? 1 : 0,
      'pc',
      getAddedCount('eps_breaker')
    );
  }

  // Distribution Subpanels added in 3D space
  if (getAddedCount('sub_panel') > 0) {
    addSwitchgearItem(
      'sub_panel',
      'Distribution Subpanel (NEMA 3R Load Center)',
      'protection',
      0,
      'pc',
      getAddedCount('sub_panel'),
      3800
    );
  }

  // Custom 3D (+/-) Polarity Wire Runs
  const customWires = layout3d?.wires || [];
  let positiveWireMeters = 0;
  let negativeWireMeters = 0;
  for (const w of customWires) {
    if (w.polarity === 'positive') {
      positiveWireMeters += w.lengthMeters;
    } else {
      negativeWireMeters += w.lengthMeters;
    }
  }
  positiveWireMeters = Number(positiveWireMeters.toFixed(1));
  negativeWireMeters = Number(negativeWireMeters.toFixed(1));
  const totalCustomWireMeters = Math.ceil(positiveWireMeters + negativeWireMeters);

  if (customWires.length > 0 && totalCustomWireMeters > 0) {
    addSwitchgearItem(
      'custom_3d_wiring',
      `3D Polarity Conductor Runs (+${positiveWireMeters}m Red / -${negativeWireMeters}m Black)`,
      'wiring',
      0,
      'm',
      totalCustomWireMeters,
      PLANT_ROOM_GEOMETRY.wirePricePerMeterPhp
    );
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
    effectiveArrayPowerKw * peakSunHours * (1 - systemLosses) * 30
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
    custom3dSummary: {
      totalAddedComponents: placedList.length,
      totalWireCount: customWires.length,
      positiveWireMeters,
      negativeWireMeters,
      addedSubtotalPhp: Math.round(addedSubtotalPhp),
    },
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
