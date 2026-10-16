// src/lib/solar/sizing-engine.ts
import {
  GenerateSolarSetupParams,
  ModifySolarSetupParams,
  ProjectSizingResult,
  StringConfiguration,
  CatalogPanelRecord,
  CatalogInverterRecord,
  CatalogBatteryRecord,
  UtilityTariffRecord,
} from '@/types/solar-ai';
import {
  SEED_UTILITY_TARIFFS,
  DEFAULT_TARIFF,
  SEED_CATALOG_PANELS,
  SEED_CATALOG_INVERTERS,
  SEED_CATALOG_BATTERIES,
} from './seed-catalog';

export const BOS_INSTALLATION_RATE_PER_KWP = 12500;
export const SYSTEM_PERFORMANCE_RATIO = 0.8;
export const TARGET_DC_AC_RATIO = 1.2;
export const ROOF_CLEARANCE_FACTOR = 1.15;
export const BATTERY_MAX_DOD = 0.9;
export const INVERTER_BATTERY_EFFICIENCY = 0.94;
export const HOT_CELL_TEMPERATURE_C = 65.0;

export function resolveTariff(location?: string): UtilityTariffRecord {
  if (!location) return DEFAULT_TARIFF;
  const locLower = location.toLowerCase().trim();

  // Try exact substring match on city or region or provider first
  const exactMatch = SEED_UTILITY_TARIFFS.find((t) => {
    const city = t.city_or_municipality.toLowerCase();
    const region = t.region_name.toLowerCase();
    const provider = t.utility_provider.toLowerCase();
    return city.includes(locLower) || region.includes(locLower) || provider.includes(locLower);
  });
  if (exactMatch) return exactMatch;

  // Filter out stop words
  const stopWords = new Set(['city', 'municipality', 'province', 'and', 'the', 'metro', 'region']);
  const tokens = locLower
    .split(/[\s,/-]+/)
    .filter((token) => token.length >= 3 && !stopWords.has(token));

  if (tokens.length > 0) {
    const tokenMatch = SEED_UTILITY_TARIFFS.find((t) => {
      const city = t.city_or_municipality.toLowerCase();
      const region = t.region_name.toLowerCase();
      const provider = t.utility_provider.toLowerCase();
      return tokens.some((token) => city.includes(token) || region.includes(token) || provider.includes(token));
    });
    if (tokenMatch) return tokenMatch;
  }

  return DEFAULT_TARIFF;
}

export function calculateColdVoc(
  nominalVoc: number,
  tempCoeffPct: number,
  recordLowTempC: number
): number {
  const deltaT = recordLowTempC - 25.0;
  const factor = 1 + (tempCoeffPct / 100.0) * deltaT;
  return Number((nominalVoc * factor).toFixed(2));
}

export function calculateHotVmp(
  nominalVmp: number,
  tempCoeffPct: number,
  hotCellTempC = HOT_CELL_TEMPERATURE_C
): number {
  const deltaT = hotCellTempC - 25.0;
  const factor = 1 + (tempCoeffPct / 100.0) * deltaT;
  return Number((nominalVmp * factor).toFixed(2));
}

export function verifyStringConfigurations(
  panelCount: number,
  panel: CatalogPanelRecord,
  inverter: CatalogInverterRecord,
  recordLowTempC: number
): StringConfiguration[] {
  const mpptCount = Math.max(1, inverter.mppt_count || 1);
  const coldVocPerPanel = calculateColdVoc(panel.voc_v, panel.temp_coeff_voc_pct, recordLowTempC);
  const hotVmpPerPanel = calculateHotVmp(panel.vmp_v, panel.temp_coeff_voc_pct);

  const configs: StringConfiguration[] = [];

  // Determine strings across MPPTs
  if (mpptCount >= 2 && panelCount >= 4) {
    const panelsMppt1 = Math.ceil(panelCount / 2);
    const panelsMppt2 = panelCount - panelsMppt1;

    const pairs = [
      { mppt: 1, count: panelsMppt1 },
      { mppt: 2, count: panelsMppt2 },
    ];

    for (const { mppt, count } of pairs) {
      if (count <= 0) continue;
      const stringVocCold = Number((count * coldVocPerPanel).toFixed(1));
      const stringVmpHot = Number((count * hotVmpPerPanel).toFixed(1));

      const isUnderMaxVoc = stringVocCold <= inverter.max_dc_voltage_v;
      const isAboveMinMppt = stringVmpHot >= inverter.mppt_min_v;
      const isBelowMaxMppt = stringVmpHot <= inverter.mppt_max_v;
      const isSafe = isUnderMaxVoc && isAboveMinMppt && isBelowMaxMppt;

      let msg = 'PASSED: String voltage is safely within MPPT parameters.';
      if (!isUnderMaxVoc) {
        msg = `WARNING: Cold Voc (${stringVocCold}V) exceeds maximum DC limit (${inverter.max_dc_voltage_v}V).`;
      } else if (!isAboveMinMppt) {
        msg = `WARNING: Hot Vmp (${stringVmpHot}V) falls below minimum MPPT threshold (${inverter.mppt_min_v}V).`;
      } else if (!isBelowMaxMppt) {
        msg = `WARNING: Hot Vmp (${stringVmpHot}V) exceeds maximum MPPT range (${inverter.mppt_max_v}V).`;
      }

      configs.push({
        mpptIndex: mppt,
        panelsInSeries: count,
        parallelStrings: 1,
        stringVocColdV: stringVocCold,
        stringVmpHotV: stringVmpHot,
        isWithinSafeLimits: isSafe,
        validationMessage: msg,
      });
    }
  } else {
    // Single string on MPPT 1
    const stringVocCold = Number((panelCount * coldVocPerPanel).toFixed(1));
    const stringVmpHot = Number((panelCount * hotVmpPerPanel).toFixed(1));

    const isUnderMaxVoc = stringVocCold <= inverter.max_dc_voltage_v;
    const isAboveMinMppt = stringVmpHot >= inverter.mppt_min_v;
    const isBelowMaxMppt = stringVmpHot <= inverter.mppt_max_v;
    const isSafe = isUnderMaxVoc && isAboveMinMppt && isBelowMaxMppt;

    let msg = 'PASSED: Single string voltage safely within MPPT parameters.';
    if (!isUnderMaxVoc) {
      msg = `WARNING: Cold Voc (${stringVocCold}V) exceeds inverter maximum DC limit (${inverter.max_dc_voltage_v}V). Split into multiple strings.`;
    } else if (!isAboveMinMppt) {
      msg = `WARNING: Hot Vmp (${stringVmpHot}V) below minimum MPPT voltage (${inverter.mppt_min_v}V).`;
    }

    configs.push({
      mpptIndex: 1,
      panelsInSeries: panelCount,
      parallelStrings: 1,
      stringVocColdV: stringVocCold,
      stringVmpHotV: stringVmpHot,
      isWithinSafeLimits: isSafe,
      validationMessage: msg,
    });
  }

  return configs;
}

export function selectPanel(
  tier = 'standard',
  panels: CatalogPanelRecord[] = SEED_CATALOG_PANELS
): CatalogPanelRecord {
  const matched = panels.find((p) => p.tier === tier && p.in_stock);
  return matched || panels[0];
}

export function selectInverter(
  targetAcKw: number,
  systemType: 'grid-tie' | 'hybrid' | 'off-grid',
  tier = 'standard',
  inverters: CatalogInverterRecord[] = SEED_CATALOG_INVERTERS,
  preferredBrand?: string
): CatalogInverterRecord {
  // Filter by system type (or allow hybrid for off-grid if specified)
  const typeFilter =
    systemType === 'off-grid' ? (i: CatalogInverterRecord) => i.system_type === 'hybrid' : (i: CatalogInverterRecord) => i.system_type === systemType;

  let compatible = inverters.filter(typeFilter).filter((i) => i.in_stock);

  if (preferredBrand) {
    const brandLower = preferredBrand.toLowerCase();
    const brandMatches = compatible.filter((i) => i.brand.toLowerCase().includes(brandLower));
    if (brandMatches.length > 0) {
      compatible = brandMatches;
    }
  }

  if (compatible.length === 0) {
    return inverters[0];
  }

  // Find the closest inverter where rated_ac_kw is at least targetAcKw * 0.85
  const suitable = compatible
    .filter((i) => i.rated_ac_kw >= targetAcKw * 0.85)
    .sort((a, b) => a.rated_ac_kw - b.rated_ac_kw);

  if (suitable.length > 0) {
    // If multiple suitable, prefer tier if matches
    const tierMatch = suitable.find((i) => i.tier === tier);
    return tierMatch || suitable[0];
  }

  // Return the largest available
  return compatible.sort((a, b) => b.rated_ac_kw - a.rated_ac_kw)[0];
}

export function selectBattery(
  targetCapacityKwh: number,
  batteries: CatalogBatteryRecord[] = SEED_CATALOG_BATTERIES
): { battery: CatalogBatteryRecord; quantity: number } {
  const single = batteries.find((b) => b.in_stock) || batteries[0];
  const count = Math.max(1, Math.ceil(targetCapacityKwh / single.capacity_kwh));
  return { battery: single, quantity: count };
}

export function computeAndMatchSolarSystem(
  params: GenerateSolarSetupParams,
  options?: {
    customTariff?: UtilityTariffRecord;
    panelsCatalog?: CatalogPanelRecord[];
    invertersCatalog?: CatalogInverterRecord[];
    batteriesCatalog?: CatalogBatteryRecord[];
  }
): ProjectSizingResult {
  const monthlyBill = Math.max(100, params.monthlyBillPhp);
  const tariff = options?.customTariff || resolveTariff(params.location);
  const systemType = params.systemType || 'hybrid';
  const daytimeLoadRatio = params.daytimeLoadRatio ?? (systemType === 'grid-tie' ? 0.7 : 0.6);
  const targetOffsetRatio = params.targetOffsetRatio ?? (systemType === 'grid-tie' ? 0.75 : 0.85);
  const budgetTier = params.budgetTier || 'standard';

  // 1. Consumption
  const estimatedMonthlyKwh = Number((monthlyBill / tariff.rate_php_per_kwh).toFixed(2));
  const estimatedDailyKwh = Number((estimatedMonthlyKwh / 30.0).toFixed(2));

  // 2. Target Daily Solar
  const targetDailySolarKwh =
    systemType === 'grid-tie'
      ? estimatedDailyKwh * daytimeLoadRatio
      : estimatedDailyKwh * targetOffsetRatio;

  // 3. Target Array kWp
  const targetArrayKwp = Number(
    (targetDailySolarKwh / (tariff.peak_sun_hours * SYSTEM_PERFORMANCE_RATIO)).toFixed(2)
  );

  // 4. Panel selection & Count
  const panel = selectPanel(budgetTier, options?.panelsCatalog || SEED_CATALOG_PANELS);
  let panelCount = Math.ceil((targetArrayKwp * 1000) / panel.wattage_wp);
  if (panelCount < 4) panelCount = 4;
  // If > 8 panels, round to even number to divide cleanly across 2 MPPT strings
  if (panelCount > 8 && panelCount % 2 !== 0) {
    panelCount += 1;
  }
  const actualArrayKwp = Number(((panelCount * panel.wattage_wp) / 1000).toFixed(2));

  // 5. Inverter selection
  const targetInverterKw = actualArrayKwp / TARGET_DC_AC_RATIO;
  const inverter = selectInverter(
    targetInverterKw,
    systemType,
    budgetTier,
    options?.invertersCatalog || SEED_CATALOG_INVERTERS,
    params.preferredInverterBrand
  );
  const dcAcRatio = Number((actualArrayKwp / inverter.rated_ac_kw).toFixed(2));

  // 6. Battery selection (Hybrid / Off-Grid)
  let batterySpec: {
    id: string;
    brand: string;
    model: string;
    moduleCapacityKwh: number;
    quantity: number;
    totalStorageKwh: number;
    usableStorageKwh: number;
    unitPricePhp: number;
    subtotalPhp: number;
  } | null = null;

  if (systemType !== 'grid-tie') {
    const nightLoadKwh = estimatedDailyKwh * (1.0 - daytimeLoadRatio);
    const targetNominalBatteryKwh =
      nightLoadKwh / (BATTERY_MAX_DOD * INVERTER_BATTERY_EFFICIENCY);
    const { battery, quantity } = selectBattery(
      targetNominalBatteryKwh,
      options?.batteriesCatalog || SEED_CATALOG_BATTERIES
    );
    const totalStorageKwh = Number((battery.capacity_kwh * quantity).toFixed(2));
    const usableStorageKwh = Number((totalStorageKwh * battery.max_dod_pct).toFixed(2));
    const subtotalPhp = battery.price_php * quantity;

    batterySpec = {
      id: battery.id,
      brand: battery.brand,
      model: battery.model,
      moduleCapacityKwh: battery.capacity_kwh,
      quantity,
      totalStorageKwh,
      usableStorageKwh,
      unitPricePhp: battery.price_php,
      subtotalPhp,
    };
  }

  // 7. String Configuration & Safety Checks
  const stringConfigurations = verifyStringConfigurations(
    panelCount,
    panel,
    inverter,
    tariff.record_low_temp_c
  );

  // 8. Balance of System & Cost Calculation
  const panelSubtotal = panel.price_php * panelCount;
  const inverterSubtotal = inverter.price_php;
  const batterySubtotal = batterySpec ? batterySpec.subtotalPhp : 0;
  const bosAndInstallationPhp = Math.round(actualArrayKwp * BOS_INSTALLATION_RATE_PER_KWP);
  const totalSystemCostPhp =
    panelSubtotal + inverterSubtotal + batterySubtotal + bosAndInstallationPhp;

  // 9. Roof Footprint
  const panelAreaSqm = panel.length_m * panel.width_m;
  const requiredRoofAreaSqm = Number((panelCount * panelAreaSqm * ROOF_CLEARANCE_FACTOR).toFixed(1));

  // 10. Generation & Financial ROI
  const estimatedDailyHarvestKwh = Number(
    (actualArrayKwp * tariff.peak_sun_hours * SYSTEM_PERFORMANCE_RATIO).toFixed(2)
  );
  const estimatedMonthlyHarvestKwh = Number((estimatedDailyHarvestKwh * 30.0).toFixed(2));
  const billOffsetPercentage = Math.min(
    100,
    Math.round((estimatedMonthlyHarvestKwh / estimatedMonthlyKwh) * 100)
  );
  const estimatedMonthlySavingsPhp = Math.round(
    Math.min(estimatedMonthlyKwh, estimatedMonthlyHarvestKwh) * tariff.rate_php_per_kwh
  );
  const estimatedNewMonthlyBillPhp = Math.max(0, monthlyBill - estimatedMonthlySavingsPhp);
  const annualSavingsPhp = estimatedMonthlySavingsPhp * 12;
  const paybackPeriodYears =
    annualSavingsPhp > 0 ? Number((totalSystemCostPhp / annualSavingsPhp).toFixed(1)) : 99.9;
  const fiveYearNetSavingsPhp = annualSavingsPhp * 5 - totalSystemCostPhp;
  const twentyFiveYearNetSavingsPhp = annualSavingsPhp * 25 - totalSystemCostPhp;

  return {
    projectId: params.projectId || 'proj-ai-' + Math.random().toString(36).substring(2, 9),
    inputSummary: {
      monthlyBillPhp: monthlyBill,
      location: tariff.city_or_municipality,
      utilityProvider: tariff.utility_provider,
      tariffRatePhpPerKwh: tariff.rate_php_per_kwh,
      peakSunHours: tariff.peak_sun_hours,
      estimatedMonthlyKwh,
      estimatedDailyKwh,
      systemType,
      daytimeLoadRatio,
    },
    engineeringSpecs: {
      targetArrayKwp,
      actualArrayKwp,
      dcAcRatio,
      estimatedDailyHarvestKwh,
      estimatedMonthlyHarvestKwh,
      billOffsetPercentage,
      requiredRoofAreaSqm,
      stringConfigurations,
    },
    billOfMaterials: {
      panel: {
        id: panel.id,
        brand: panel.brand,
        model: panel.model,
        wattageWp: panel.wattage_wp,
        quantity: panelCount,
        unitPricePhp: panel.price_php,
        subtotalPhp: panelSubtotal,
      },
      inverter: {
        id: inverter.id,
        brand: inverter.brand,
        model: inverter.model,
        ratedAcKw: inverter.rated_ac_kw,
        systemType: inverter.system_type,
        quantity: 1,
        unitPricePhp: inverter.price_php,
        subtotalPhp: inverterSubtotal,
      },
      battery: batterySpec,
      bosAndInstallationPhp,
      totalSystemCostPhp,
    },
    financialRoi: {
      estimatedMonthlySavingsPhp,
      estimatedNewMonthlyBillPhp,
      annualSavingsPhp,
      paybackPeriodYears,
      fiveYearNetSavingsPhp,
      twentyFiveYearNetSavingsPhp,
    },
  };
}

export function recalculateWithOverrides(
  params: ModifySolarSetupParams,
  options?: {
    customTariff?: UtilityTariffRecord;
    panelsCatalog?: CatalogPanelRecord[];
    invertersCatalog?: CatalogInverterRecord[];
    batteriesCatalog?: CatalogBatteryRecord[];
  }
): ProjectSizingResult {
  const tariff = options?.customTariff || resolveTariff(params.location);
  const panels = options?.panelsCatalog || SEED_CATALOG_PANELS;
  const inverters = options?.invertersCatalog || SEED_CATALOG_INVERTERS;
  const batteries = options?.batteriesCatalog || SEED_CATALOG_BATTERIES;

  const panel = selectPanel(params.budgetTier || 'standard', panels);
  let panelCount = params.overridePanelCount || 10;
  if (panelCount < 2) panelCount = 2;
  const actualArrayKwp = Number(((panelCount * panel.wattage_wp) / 1000).toFixed(2));

  // Inverter selection
  let inverter: CatalogInverterRecord;
  if (params.overrideInverterKw) {
    const matched = inverters
      .filter((i) => (params.systemType === 'off-grid' ? i.system_type === 'hybrid' : i.system_type === params.systemType))
      .filter((i) => !params.preferredInverterBrand || i.brand.toLowerCase().includes(params.preferredInverterBrand.toLowerCase()))
      .find((i) => Math.abs(i.rated_ac_kw - (params.overrideInverterKw || 0)) <= 1.0);
    inverter = matched || selectInverter(params.overrideInverterKw, params.systemType, params.budgetTier, inverters, params.preferredInverterBrand);
  } else {
    inverter = selectInverter(actualArrayKwp / TARGET_DC_AC_RATIO, params.systemType, params.budgetTier, inverters, params.preferredInverterBrand);
  }

  // Battery
  let batterySpec: ProjectSizingResult['billOfMaterials']['battery'] = null;
  if (params.systemType !== 'grid-tie' && (params.overrideBatteryKwh === undefined || params.overrideBatteryKwh > 0)) {
    const requestedKwh = params.overrideBatteryKwh ?? 5.12;
    const { battery, quantity } = selectBattery(requestedKwh, batteries);
    const totalStorageKwh = Number((battery.capacity_kwh * quantity).toFixed(2));
    const usableStorageKwh = Number((totalStorageKwh * battery.max_dod_pct).toFixed(2));
    const subtotalPhp = battery.price_php * quantity;

    batterySpec = {
      id: battery.id,
      brand: battery.brand,
      model: battery.model,
      moduleCapacityKwh: battery.capacity_kwh,
      quantity,
      totalStorageKwh,
      usableStorageKwh,
      unitPricePhp: battery.price_php,
      subtotalPhp,
    };
  }

  const stringConfigurations = verifyStringConfigurations(
    panelCount,
    panel,
    inverter,
    tariff.record_low_temp_c
  );

  const panelSubtotal = panel.price_php * panelCount;
  const inverterSubtotal = inverter.price_php;
  const batterySubtotal = batterySpec ? batterySpec.subtotalPhp : 0;
  const bosAndInstallationPhp = Math.round(actualArrayKwp * BOS_INSTALLATION_RATE_PER_KWP);
  const totalSystemCostPhp =
    panelSubtotal + inverterSubtotal + batterySubtotal + bosAndInstallationPhp;

  const panelAreaSqm = panel.length_m * panel.width_m;
  const requiredRoofAreaSqm = Number((panelCount * panelAreaSqm * ROOF_CLEARANCE_FACTOR).toFixed(1));

  const estimatedMonthlyKwh = Number((params.monthlyBillPhp / tariff.rate_php_per_kwh).toFixed(2));
  const estimatedDailyKwh = Number((estimatedMonthlyKwh / 30.0).toFixed(2));

  const estimatedDailyHarvestKwh = Number(
    (actualArrayKwp * tariff.peak_sun_hours * SYSTEM_PERFORMANCE_RATIO).toFixed(2)
  );
  const estimatedMonthlyHarvestKwh = Number((estimatedDailyHarvestKwh * 30.0).toFixed(2));
  const billOffsetPercentage = Math.min(
    100,
    Math.round((estimatedMonthlyHarvestKwh / estimatedMonthlyKwh) * 100)
  );
  const estimatedMonthlySavingsPhp = Math.round(
    Math.min(estimatedMonthlyKwh, estimatedMonthlyHarvestKwh) * tariff.rate_php_per_kwh
  );
  const estimatedNewMonthlyBillPhp = Math.max(0, params.monthlyBillPhp - estimatedMonthlySavingsPhp);
  const annualSavingsPhp = estimatedMonthlySavingsPhp * 12;
  const paybackPeriodYears =
    annualSavingsPhp > 0 ? Number((totalSystemCostPhp / annualSavingsPhp).toFixed(1)) : 99.9;
  const fiveYearNetSavingsPhp = annualSavingsPhp * 5 - totalSystemCostPhp;
  const twentyFiveYearNetSavingsPhp = annualSavingsPhp * 25 - totalSystemCostPhp;

  return {
    projectId: params.projectId || 'proj-ai-' + Math.random().toString(36).substring(2, 9),
    inputSummary: {
      monthlyBillPhp: params.monthlyBillPhp,
      location: tariff.city_or_municipality,
      utilityProvider: tariff.utility_provider,
      tariffRatePhpPerKwh: tariff.rate_php_per_kwh,
      peakSunHours: tariff.peak_sun_hours,
      estimatedMonthlyKwh,
      estimatedDailyKwh,
      systemType: params.systemType,
      daytimeLoadRatio: 0.6,
    },
    engineeringSpecs: {
      targetArrayKwp: actualArrayKwp,
      actualArrayKwp,
      dcAcRatio: Number((actualArrayKwp / inverter.rated_ac_kw).toFixed(2)),
      estimatedDailyHarvestKwh,
      estimatedMonthlyHarvestKwh,
      billOffsetPercentage,
      requiredRoofAreaSqm,
      stringConfigurations,
    },
    billOfMaterials: {
      panel: {
        id: panel.id,
        brand: panel.brand,
        model: panel.model,
        wattageWp: panel.wattage_wp,
        quantity: panelCount,
        unitPricePhp: panel.price_php,
        subtotalPhp: panelSubtotal,
      },
      inverter: {
        id: inverter.id,
        brand: inverter.brand,
        model: inverter.model,
        ratedAcKw: inverter.rated_ac_kw,
        systemType: inverter.system_type,
        quantity: 1,
        unitPricePhp: inverter.price_php,
        subtotalPhp: inverterSubtotal,
      },
      battery: batterySpec,
      bosAndInstallationPhp,
      totalSystemCostPhp,
    },
    financialRoi: {
      estimatedMonthlySavingsPhp,
      estimatedNewMonthlyBillPhp,
      annualSavingsPhp,
      paybackPeriodYears,
      fiveYearNetSavingsPhp,
      twentyFiveYearNetSavingsPhp,
    },
  };
}
