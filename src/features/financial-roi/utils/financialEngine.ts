import {
  DEFAULT_PEAK_SUN_HOURS,
  DEFAULT_SYSTEM_EFFICIENCY,
  LIFEPO4_BATTERY_DOD,
  LIFEPO4_MODULE_KWH,
  LIFEPO4_ROUND_TRIP_EFFICIENCY,
} from '@/lib/solarConstants';
import {
  CapexBreakdown,
  ExportStrategy,
  FinancialConfig,
  ScenarioSimulationResult,
  SystemSizingInput,
  YearlyCashflowPoint,
} from '../types/financialRoi';
import { CAPEX_BENCHMARKS } from './utilityTariffPresets';

export function calculateTurnkeyCapex(
  input: SystemSizingInput,
  config: FinancialConfig,
  strategy: ExportStrategy
): CapexBreakdown {
  const isHybrid = strategy === 'hybrid_battery' || strategy === 'hybrid_plus_net_metering';
  const hasNetMetering = strategy === 'net_metering' || strategy === 'hybrid_plus_net_metering';
  const hasBattery = isHybrid && input.batteryKwh > 0;

  const pvArrayPhp = Math.round(input.pvKwp * CAPEX_BENCHMARKS.pvArrayPerKwpPhp);
  const inverterRate = isHybrid
    ? CAPEX_BENCHMARKS.hybridInverterPerKwPhp
    : CAPEX_BENCHMARKS.gridTieInverterPerKwPhp;
  const inverterPhp = Math.round(input.inverterKw * inverterRate);
  const batteryPhp = hasBattery ? Math.round(input.batteryKwh * CAPEX_BENCHMARKS.batteryPerKwhPhp) : 0;

  const hardwareSubtotal = pvArrayPhp + inverterPhp + batteryPhp;
  const bosAndMountingPhp = Math.round(
    input.pvKwp * (CAPEX_BENCHMARKS.bosAndMountingPerKwpPhp || 3500)
  );
  const laborAndPermitsPhp = Math.round(hardwareSubtotal * CAPEX_BENCHMARKS.laborAndPermitsRatio);
  const netMeteringSetupPhp = hasNetMetering ? Math.round(config.netMeteringSetupCostPhp) : 0;

  const autoTurnkeyPhp =
    hardwareSubtotal + bosAndMountingPhp + laborAndPermitsPhp + netMeteringSetupPhp;

  if (config.useCustomCapex && config.customCapexPhp && config.customCapexPhp > 0) {
    const baseOverride = config.customCapexPhp;
    const effectiveTotal =
      hasNetMetering && !config.exportStrategy.includes('net_metering')
        ? baseOverride + config.netMeteringSetupCostPhp
        : baseOverride;

    const ratio = effectiveTotal / Math.max(1, autoTurnkeyPhp);
    return {
      pvArrayPhp: Math.round(pvArrayPhp * ratio),
      inverterPhp: Math.round(inverterPhp * ratio),
      batteryPhp: Math.round(batteryPhp * ratio),
      bosAndMountingPhp: Math.round(bosAndMountingPhp * ratio),
      laborAndPermitsPhp: Math.round(laborAndPermitsPhp * ratio),
      netMeteringSetupPhp: hasNetMetering ? config.netMeteringSetupCostPhp : 0,
      totalCapexPhp: Math.round(effectiveTotal),
      inverterInitialCostPhp: Math.round(inverterPhp * ratio),
      batteryInitialCostPhp: Math.round(batteryPhp * ratio),
    };
  }

  return {
    pvArrayPhp: Math.round(pvArrayPhp),
    inverterPhp: Math.round(inverterPhp),
    batteryPhp: Math.round(batteryPhp),
    bosAndMountingPhp: Math.round(bosAndMountingPhp),
    laborAndPermitsPhp: Math.round(laborAndPermitsPhp),
    netMeteringSetupPhp: Math.round(netMeteringSetupPhp),
    totalCapexPhp: Math.round(autoTurnkeyPhp),
    inverterInitialCostPhp: Math.round(inverterPhp),
    batteryInitialCostPhp: Math.round(batteryPhp),
  };
}

export function formatPaybackPeriod(
  paybackYears: number | null,
  horizonYears = CAPEX_BENCHMARKS.simulationHorizonYears
): string {
  if (paybackYears === null || !Number.isFinite(paybackYears) || paybackYears > horizonYears) {
    return `> ${horizonYears} yrs`;
  }
  const totalMonths = Math.round(paybackYears * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} mo${months === 1 ? '' : 's'}`;
  }
  if (months === 0) {
    return `${years} yr${years === 1 ? '' : 's'}`;
  }
  return `${years} yr${years === 1 ? '' : 's'} ${months} mo${months === 1 ? '' : 's'}`;
}

export function computeScenarioSimulation(
  input: SystemSizingInput,
  config: FinancialConfig,
  strategy: ExportStrategy
): ScenarioSimulationResult {
  const horizonYears = CAPEX_BENCHMARKS.simulationHorizonYears;
  const capex = calculateTurnkeyCapex(input, config, strategy);
  const initialCapex = capex.totalCapexPhp;

  const isHybrid = strategy === 'hybrid_battery' || strategy === 'hybrid_plus_net_metering';
  const hasNetMetering = strategy === 'net_metering' || strategy === 'hybrid_plus_net_metering';
  const batteryCapacityKwh = isHybrid ? input.batteryKwh : 0;
  const batteryUsableKwh = batteryCapacityKwh * (input.batteryDod || LIFEPO4_BATTERY_DOD);
  const roundTripEff = input.batteryRoundTripEfficiency || LIFEPO4_ROUND_TRIP_EFFICIENCY;

  const psh = input.effectivePsh || DEFAULT_PEAK_SUN_HOURS;
  const sysEff = input.systemEfficiency || DEFAULT_SYSTEM_EFFICIENCY;
  const baseYear1GenKwhPerDay = input.pvKwp * psh * sysEff;

  const degradationRate = config.annualPanelDegradationPercent / 100;
  const inflationRate = config.annualTariffInflationPercent / 100;
  const discountRate = config.discountRatePercent / 100;

  const dailyDaytimeLoad = Math.max(0, input.dailyDaytimeKwh);
  const dailyNighttimeLoad = Math.max(0, input.dailyNighttimeKwh);
  const dailyTotalLoad = Math.max(
    0.1,
    input.dailyTotalKwh || dailyDaytimeLoad + dailyNighttimeLoad
  );

  const cashflowSeries: YearlyCashflowPoint[] = [];

  cashflowSeries.push({
    year: 0,
    inflatedRetailRatePhp: config.retailRatePhp,
    inflatedExportRatePhp: config.exportCreditRatePhp,
    panelHealthFactor: 1.0,
    annualGenerationKwh: 0,
    annualDirectSelfUseKwh: 0,
    annualBatteryStoredUseKwh: 0,
    annualExportedKwh: 0,
    annualClippedKwh: 0,
    grossAnnualSavingsPhp: 0,
    replacementCostPhp: 0,
    netAnnualCashflowPhp: -initialCapex,
    cumulativeCashflowPhp: -initialCapex,
    discountedCumulativeNpvPhp: -initialCapex,
  });

  let cumulativeCashflow = -initialCapex;
  let discountedCumulativeNpv = -initialCapex;
  let totalUsefulEnergy = 0;
  let totalReplacementCosts = 0;

  let year1DailyDirectSelfUse = 0;
  let year1DailyBatteryStored = 0;
  let year1DailyBatteryCharged = 0;
  let year1DailyExported = 0;
  let year1DailyClipped = 0;
  let year1AnnualSavings = 0;

  for (let year = 1; year <= horizonYears; year++) {
    const healthFactor = Math.pow(1 - degradationRate, year - 1);
    const inflatedRetailRate = config.retailRatePhp * Math.pow(1 + inflationRate, year - 1);
    const inflatedExportRate = config.exportCreditRatePhp * Math.pow(1 + inflationRate, year - 1);

    const dailyGenKwh = baseYear1GenKwhPerDay * healthFactor;
    const directSelfUseKwh = Math.min(dailyGenKwh, dailyDaytimeLoad);
    const middaySurplusKwh = Math.max(0, dailyGenKwh - dailyDaytimeLoad);

    let batteryStoredKwh = 0;
    let batteryChargedKwh = 0;
    let exportedKwh = 0;
    let clippedKwh = 0;

    if (strategy === 'zero_export') {
      clippedKwh = middaySurplusKwh;
    } else if (strategy === 'net_metering') {
      exportedKwh = middaySurplusKwh;
    } else if (strategy === 'hybrid_battery' || strategy === 'hybrid_plus_net_metering') {
      if (batteryUsableKwh > 0 && middaySurplusKwh > 0) {
        const maxStoredUsable = Math.min(
          middaySurplusKwh * roundTripEff,
          batteryUsableKwh,
          dailyNighttimeLoad
        );
        batteryStoredKwh = maxStoredUsable;
        batteryChargedKwh = maxStoredUsable / roundTripEff;
        const remainder = Math.max(0, middaySurplusKwh - batteryChargedKwh);
        if (strategy === 'hybrid_plus_net_metering') {
          exportedKwh = remainder;
        } else {
          clippedKwh = remainder;
        }
      } else if (strategy === 'hybrid_plus_net_metering') {
        exportedKwh = middaySurplusKwh;
      } else {
        clippedKwh = middaySurplusKwh;
      }
    }

    if (year === 1) {
      year1DailyDirectSelfUse = directSelfUseKwh;
      year1DailyBatteryStored = batteryStoredKwh;
      year1DailyBatteryCharged = batteryChargedKwh;
      year1DailyExported = exportedKwh;
      year1DailyClipped = clippedKwh;
    }

    const annualGenKwh = dailyGenKwh * 365;
    const annualDirectKwh = directSelfUseKwh * 365;
    const annualBatteryKwh = batteryStoredKwh * 365;
    const annualExportKwh = exportedKwh * 365;
    const annualClippedKwh = clippedKwh * 365;

    const directSavingsPhp = (annualDirectKwh + annualBatteryKwh) * inflatedRetailRate;
    const exportCreditSavingsPhp = annualExportKwh * inflatedExportRate;
    let grossAnnualSavings = directSavingsPhp + exportCreditSavingsPhp;

    // ERC Net Metering rule: credits cannot exceed total annual bill minus fixed charges (95% cap)
    if (hasNetMetering && config.capExportCreditsAtBill) {
      const annualBillWithoutSolar = dailyTotalLoad * 365 * inflatedRetailRate;
      const maxAllowedAnnualSavings =
        annualBillWithoutSolar * CAPEX_BENCHMARKS.netMeteringBillCapRatio;
      if (grossAnnualSavings > maxAllowedAnnualSavings) {
        grossAnnualSavings = maxAllowedAnnualSavings;
      }
    }

    if (year === 1) {
      year1AnnualSavings = grossAnnualSavings;
    }

    let replacementCostPhp = 0;
    if (
      config.includeInverterReplacement &&
      year === config.inverterReplacementYear &&
      capex.inverterInitialCostPhp > 0
    ) {
      replacementCostPhp += capex.inverterInitialCostPhp * CAPEX_BENCHMARKS.inverterReplacementRatio;
    }

    if (
      isHybrid &&
      config.includeBatteryReplacement &&
      year === config.batteryReplacementYear &&
      capex.batteryInitialCostPhp > 0
    ) {
      replacementCostPhp += capex.batteryInitialCostPhp * CAPEX_BENCHMARKS.batteryReplacementRatio;
    }

    totalReplacementCosts += replacementCostPhp;
    totalUsefulEnergy += annualDirectKwh + annualBatteryKwh + annualExportKwh;

    const netAnnualCashflow = grossAnnualSavings - replacementCostPhp;
    cumulativeCashflow += netAnnualCashflow;

    const discountedCashflow = netAnnualCashflow / Math.pow(1 + discountRate, year);
    discountedCumulativeNpv += discountedCashflow;

    cashflowSeries.push({
      year,
      inflatedRetailRatePhp: Math.round(inflatedRetailRate * 100) / 100,
      inflatedExportRatePhp: Math.round(inflatedExportRate * 100) / 100,
      panelHealthFactor: Math.round(healthFactor * 1000) / 1000,
      annualGenerationKwh: Math.round(annualGenKwh),
      annualDirectSelfUseKwh: Math.round(annualDirectKwh),
      annualBatteryStoredUseKwh: Math.round(annualBatteryKwh),
      annualExportedKwh: Math.round(annualExportKwh),
      annualClippedKwh: Math.round(annualClippedKwh),
      grossAnnualSavingsPhp: Math.round(grossAnnualSavings),
      replacementCostPhp: Math.round(replacementCostPhp),
      netAnnualCashflowPhp: Math.round(netAnnualCashflow),
      cumulativeCashflowPhp: Math.round(cumulativeCashflow),
      discountedCumulativeNpvPhp: Math.round(discountedCumulativeNpv),
    });
  }

  let paybackYears: number | null = null;
  for (let i = 1; i < cashflowSeries.length; i++) {
    const prev = cashflowSeries[i - 1];
    const curr = cashflowSeries[i];

    if (prev.cumulativeCashflowPhp < 0 && curr.cumulativeCashflowPhp >= 0) {
      const denom = curr.cumulativeCashflowPhp - prev.cumulativeCashflowPhp;
      const fraction = denom > 0 ? -prev.cumulativeCashflowPhp / denom : 0;
      paybackYears = prev.year + Math.max(0, Math.min(1, fraction));
      break;
    }
  }

  const paybackMonthsTotal = paybackYears !== null ? Math.round(paybackYears * 12) : null;
  const paybackFormatted = formatPaybackPeriod(paybackYears, horizonYears);

  const netProfit10YearsPhp = Math.round(cumulativeCashflow);
  const npv10YearsPhp = Math.round(discountedCumulativeNpv);
  const totalLifecycleInvestment = initialCapex + totalReplacementCosts;
  const roiPercentage10Years =
    totalLifecycleInvestment > 0
      ? Math.round((netProfit10YearsPhp / totalLifecycleInvestment) * 1000) / 10
      : 0;

  const lcoePhpPerKwh =
    totalUsefulEnergy > 0
      ? Math.round((totalLifecycleInvestment / totalUsefulEnergy) * 100) / 100
      : 0;

  const monthlyConsumptionKwh = (dailyTotalLoad * 365) / 12;
  const year1MonthlyBillBeforePhp = Math.round(monthlyConsumptionKwh * config.retailRatePhp);
  const year1MonthlySavingsPhp = Math.round(year1AnnualSavings / 12);
  const year1MonthlyBillAfterPhp = Math.max(0, year1MonthlyBillBeforePhp - year1MonthlySavingsPhp);

  const totalGenDay1 = Math.max(0.001, baseYear1GenKwhPerDay);
  const energySplitPercent = {
    directDaytime: Math.round((year1DailyDirectSelfUse / totalGenDay1) * 100),
    batteryNighttime: Math.round((year1DailyBatteryCharged / totalGenDay1) * 100),
    gridExported: Math.round((year1DailyExported / totalGenDay1) * 100),
    clippedWasted: Math.round((year1DailyClipped / totalGenDay1) * 100),
  };

  const labels: Record<ExportStrategy, { title: string; note: string }> = {
    zero_export: {
      title: 'Grid-Tie + Zero-Export',
      note: 'Lowest CAPEX. Surplus midday solar is throttled/clipped by limiter to prevent backfeeding.',
    },
    net_metering: {
      title: 'Grid-Tie + ERC Net Metering',
      note: 'Exports midday surplus to utility at Generation Charge credit. Includes DU bi-directional meter fee.',
    },
    hybrid_battery: {
      title: 'Hybrid + LiFePO4 Battery',
      note: 'Stores midday surplus in LiFePO4 battery to offset nighttime power & provides power outage resilience.',
    },
    hybrid_plus_net_metering: {
      title: 'Hybrid + Battery & Net Metering',
      note: 'Fills LiFePO4 battery first for night self-consumption, then exports remaining surplus for maximum bill offset.',
    },
  };

  return {
    strategy,
    label: labels[strategy].title,
    summaryNote: labels[strategy].note,
    capex,
    initialCapexPhp: initialCapex,
    year1MonthlyBillBeforePhp,
    year1MonthlyBillAfterPhp,
    year1MonthlySavingsPhp,
    year1AnnualSavingsPhp: Math.round(year1AnnualSavings),
    paybackYears,
    paybackMonthsTotal,
    paybackFormatted,
    netProfit10YearsPhp,
    npv10YearsPhp,
    roiPercentage10Years,
    lcoePhpPerKwh,
    energySplitPercent,
    dailyKwhBreakdown: {
      generationKwh: Math.round(baseYear1GenKwhPerDay * 10) / 10,
      directSelfUseKwh: Math.round(year1DailyDirectSelfUse * 10) / 10,
      batteryStoredKwh: Math.round(year1DailyBatteryStored * 10) / 10,
      gridExportedKwh: Math.round(year1DailyExported * 10) / 10,
      clippedWastedKwh: Math.round(year1DailyClipped * 10) / 10,
    },
    cashflowSeries,
  };
}

export function simulateAllScenarios(
  input: SystemSizingInput,
  config: FinancialConfig
): Record<ExportStrategy, ScenarioSimulationResult> {
  return {
    zero_export: computeScenarioSimulation(input, config, 'zero_export'),
    net_metering: computeScenarioSimulation(input, config, 'net_metering'),
    hybrid_battery: computeScenarioSimulation(input, config, 'hybrid_battery'),
    hybrid_plus_net_metering: computeScenarioSimulation(input, config, 'hybrid_plus_net_metering'),
  };
}

export function estimateSizingFromMonthlyBill(
  monthlyBillPhp: number,
  retailRatePhp: number,
  psh: number = DEFAULT_PEAK_SUN_HOURS
): SystemSizingInput {
  const safeBill = Math.max(1000, monthlyBillPhp);
  const safeRate = Math.max(5.0, retailRatePhp);
  const monthlyKwh = safeBill / safeRate;
  const daysPerMonth = 365 / 12;
  const dailyTotalKwh = Math.round((monthlyKwh / daysPerMonth) * 100) / 100;

  // Typical residential daytime/evening split (~40% daytime, ~60% evening)
  const dailyDaytimeKwh = Math.round(dailyTotalKwh * 0.4 * 10) / 10;
  const dailyNighttimeKwh = Math.round((dailyTotalKwh - dailyDaytimeKwh) * 10) / 10;

  const effectivePsh = Math.max(3.0, psh);
  const rawKwp = dailyTotalKwh / (effectivePsh * DEFAULT_SYSTEM_EFFICIENCY);
  const pvKwp = Math.max(1.0, Math.round(rawKwp * 10) / 10);

  const targetAcKw = pvKwp / 1.18;
  const standardInverterSizes = [3, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];
  let inverterKw = standardInverterSizes[0];
  for (const size of standardInverterSizes) {
    if (size >= targetAcKw * 0.95) {
      inverterKw = size;
      break;
    }
  }

  const neededBattKwh = dailyNighttimeKwh * 0.7;
  const rackUnits = Math.max(1, Math.ceil(neededBattKwh / LIFEPO4_MODULE_KWH));
  const batteryKwh = Math.round(rackUnits * LIFEPO4_MODULE_KWH * 100) / 100;

  return {
    pvKwp,
    inverterKw,
    batteryKwh,
    dailyTotalKwh,
    dailyDaytimeKwh,
    dailyNighttimeKwh,
    effectivePsh,
    systemEfficiency: DEFAULT_SYSTEM_EFFICIENCY,
    batteryDod: LIFEPO4_BATTERY_DOD,
    batteryRoundTripEfficiency: LIFEPO4_ROUND_TRIP_EFFICIENCY,
    sourceLabel: `Estimated from ₱${safeBill.toLocaleString()}/mo bill`,
  };
}
