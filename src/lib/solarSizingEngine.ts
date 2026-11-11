import { ProjectSizingResult, SystemType } from '../types/solar-ai.js';
import {
  DAYS_PER_MONTH,
  DEFAULT_PEAK_SUN_HOURS,
  DEFAULT_SYSTEM_EFFICIENCY,
  DEFAULT_SYSTEM_LOSSES,
  LIFEPO4_BATTERY_DOD,
  LIFEPO4_MODULE_KWH,
  WORKBENCH_DEFAULT_TARIFF_PHP_PER_KWH,
  roundUpToBatteryModules,
} from './solarConstants.js';
import { matchHardwareCatalog } from './hardwareCatalog.js';

export interface SizingInput {
  monthlyBillPhp?: number;
  monthlyKwh?: number;
  systemType?: SystemType;
  daytimeLoadRatio?: number;
  includeBatteryBackup?: boolean;
}

export interface SizingOutput {
  estimatedMonthlyKwh: number;
  dailyKwh: number;
  tariffRatePhp: number;
  peakSunHours: number;
  recommendedArrayKwp: number;
  recommendedInverterKw: number;
  recommendedBatteryKwh: number;
  estimatedMonthlySavingsPhp: number;
}

export interface SetupProposalInput extends SizingInput {
  projectId?: string;
  location?: string;
  preferredInverterBrand?: string;
  preferredPanelBrand?: string;
  projectIdPrefix?: string;
}

const STANDARD_INVERTER_SIZES_KW = [3, 5, 6, 8, 10, 12, 15, 20, 30, 50];

export function calculatePvSystem(input: SizingInput): SizingOutput {
  const tariffRatePhp = WORKBENCH_DEFAULT_TARIFF_PHP_PER_KWH;
  const peakSunHours = DEFAULT_PEAK_SUN_HOURS;

  const safeBill =
    typeof input.monthlyBillPhp === 'number' && !Number.isNaN(input.monthlyBillPhp)
      ? Math.max(0, Math.min(input.monthlyBillPhp, 10_000_000))
      : undefined;

  const safeKwh =
    typeof input.monthlyKwh === 'number' && !Number.isNaN(input.monthlyKwh)
      ? Math.max(0, Math.min(input.monthlyKwh, 1_000_000))
      : undefined;

  const estimatedMonthlyKwh = safeKwh ?? (safeBill ? safeBill / tariffRatePhp : 0);
  const dailyKwh = estimatedMonthlyKwh / DAYS_PER_MONTH;

  // Target 60% daytime load offset for grid-tie vs 90% overall offset when backed by storage.
  const targetOffsetRatio = input.systemType === 'grid-tie' ? (input.daytimeLoadRatio ?? 0.6) : 0.9;
  const targetDailySolarKwh = dailyKwh * targetOffsetRatio;

  const recommendedArrayKwp = Number(
    (targetDailySolarKwh / (peakSunHours * DEFAULT_SYSTEM_EFFICIENCY)).toFixed(2)
  );

  // Target ~1.15 DC/AC ratio to avoid excessive peak clipping while preserving morning/afternoon harvest.
  const rawInverterKw = recommendedArrayKwp / 1.15;
  const recommendedInverterKw =
    STANDARD_INVERTER_SIZES_KW.find((size) => size >= rawInverterKw) ?? Math.ceil(rawInverterKw);

  let recommendedBatteryKwh = 0;
  if (input.systemType !== 'grid-tie' && input.includeBatteryBackup !== false) {
    const nightLoadKwh = dailyKwh * 0.4;
    const rawBatteryKwh = nightLoadKwh / LIFEPO4_BATTERY_DOD;
    recommendedBatteryKwh = Math.max(
      LIFEPO4_MODULE_KWH,
      roundUpToBatteryModules(rawBatteryKwh, LIFEPO4_MODULE_KWH) * LIFEPO4_MODULE_KWH
    );
  }

  const monthlySolarGenerationKwh =
    recommendedArrayKwp * peakSunHours * (1 - DEFAULT_SYSTEM_LOSSES) * DAYS_PER_MONTH;
  const estimatedMonthlySavingsPhp = Math.round(
    Math.min(estimatedMonthlyKwh, monthlySolarGenerationKwh) * tariffRatePhp
  );

  return {
    estimatedMonthlyKwh: Math.round(estimatedMonthlyKwh),
    dailyKwh: Number(dailyKwh.toFixed(1)),
    tariffRatePhp,
    peakSunHours,
    recommendedArrayKwp,
    recommendedInverterKw,
    recommendedBatteryKwh: Number(recommendedBatteryKwh.toFixed(2)),
    estimatedMonthlySavingsPhp,
  };
}

export async function buildSolarSetupProposal(
  params: SetupProposalInput
): Promise<{
  sizingResult: SizingOutput;
  hardwareMatch: Awaited<ReturnType<typeof matchHardwareCatalog>>;
  proposal: ProjectSizingResult;
}> {
  const systemType: SystemType = params.systemType ?? 'hybrid';
  const location = params.location ?? 'Metro Manila / Calabarzon';
  const sizingResult = calculatePvSystem({
    monthlyBillPhp: params.monthlyBillPhp,
    monthlyKwh: params.monthlyKwh,
    systemType,
    daytimeLoadRatio: params.daytimeLoadRatio,
    includeBatteryBackup: params.includeBatteryBackup,
  });

  const hardwareMatch = await matchHardwareCatalog({
    targetKwp: sizingResult.recommendedArrayKwp,
    targetInverterKw: sizingResult.recommendedInverterKw,
    targetBatteryKwh: sizingResult.recommendedBatteryKwh,
    systemType,
    preferredInverterBrand: params.preferredInverterBrand,
    preferredPanelBrand: params.preferredPanelBrand,
  });

  const effectiveMonthlyBill =
    params.monthlyBillPhp || Math.round(sizingResult.estimatedMonthlyKwh * sizingResult.tariffRatePhp);

  const estimatedDailyHarvestKwh = Number(
    (hardwareMatch.actualArrayKwp * sizingResult.peakSunHours * DEFAULT_SYSTEM_EFFICIENCY).toFixed(1)
  );
  const estimatedMonthlyHarvestKwh = Math.round(estimatedDailyHarvestKwh * DAYS_PER_MONTH);
  const billOffsetPercentage = Math.min(
    98,
    Math.round((sizingResult.estimatedMonthlySavingsPhp / Math.max(1, effectiveMonthlyBill)) * 100)
  );

  const stringVocColdV = Number((hardwareMatch.panelCount * hardwareMatch.panel.voc * 1.05).toFixed(1));
  const stringVmpHotV = Number((hardwareMatch.panelCount * hardwareMatch.panel.vmp * 0.88).toFixed(1));
  const isWithinSafeLimits =
    stringVocColdV <= hardwareMatch.inverter.maxDcV &&
    stringVmpHotV >= hardwareMatch.inverter.mpptMinV;

  const panelSubtotal = hardwareMatch.panelCount * hardwareMatch.panel.pricePhp;
  const inverterSubtotal = hardwareMatch.inverter.pricePhp;
  const batterySubtotal = hardwareMatch.battery
    ? hardwareMatch.batteryCount * hardwareMatch.battery.pricePhp
    : 0;
  const totalSystemCostPhp = hardwareMatch.estimatedTotalSystemCostPhp;
  const bosAndInstallationPhp = Math.max(
    0,
    totalSystemCostPhp - (panelSubtotal + inverterSubtotal + batterySubtotal)
  );

  const annualSavingsPhp = sizingResult.estimatedMonthlySavingsPhp * 12;
  const paybackPeriodYears =
    annualSavingsPhp > 0 ? Number((totalSystemCostPhp / annualSavingsPhp).toFixed(1)) : 0;

  const idPrefix = params.projectIdPrefix ?? 'proj';
  const proposal: ProjectSizingResult = {
    projectId: params.projectId ?? `${idPrefix}-${Math.random().toString(36).substring(2, 9)}`,
    inputSummary: {
      monthlyBillPhp: effectiveMonthlyBill,
      location,
      utilityProvider: location.toLowerCase().includes('cebu') ? 'VECO' : 'Meralco / DU',
      tariffRatePhpPerKwh: sizingResult.tariffRatePhp,
      peakSunHours: sizingResult.peakSunHours,
      estimatedMonthlyKwh: sizingResult.estimatedMonthlyKwh,
      estimatedDailyKwh: sizingResult.dailyKwh,
      systemType,
      daytimeLoadRatio: params.daytimeLoadRatio ?? 0.5,
    },
    engineeringSpecs: {
      targetArrayKwp: sizingResult.recommendedArrayKwp,
      actualArrayKwp: hardwareMatch.actualArrayKwp,
      dcAcRatio: Number((hardwareMatch.actualArrayKwp / hardwareMatch.inverter.kw).toFixed(2)),
      estimatedDailyHarvestKwh,
      estimatedMonthlyHarvestKwh,
      billOffsetPercentage,
      // 2.5 m^2/module footprint x 1.15 row-spacing / maintenance walkway factor.
      requiredRoofAreaSqm: Number((hardwareMatch.panelCount * 2.5 * 1.15).toFixed(1)),
      stringConfigurations: [
        {
          mpptIndex: 1,
          panelsInSeries: hardwareMatch.panelCount,
          parallelStrings: 1,
          stringVocColdV,
          stringVmpHotV,
          isWithinSafeLimits,
          validationMessage: `MPPT input window (${hardwareMatch.inverter.mpptMinV}V - ${hardwareMatch.inverter.mpptMaxV}V DC)`,
        },
      ],
    },
    billOfMaterials: {
      panel: {
        id: hardwareMatch.panel.id,
        brand: hardwareMatch.panel.brand,
        model: hardwareMatch.panel.model,
        wattageWp: hardwareMatch.panel.watts,
        quantity: hardwareMatch.panelCount,
        unitPricePhp: hardwareMatch.panel.pricePhp,
        subtotalPhp: panelSubtotal,
      },
      inverter: {
        id: hardwareMatch.inverter.id,
        brand: hardwareMatch.inverter.brand,
        model: hardwareMatch.inverter.model,
        ratedAcKw: hardwareMatch.inverter.kw,
        systemType: hardwareMatch.inverter.type,
        quantity: 1,
        unitPricePhp: hardwareMatch.inverter.pricePhp,
        subtotalPhp: inverterSubtotal,
      },
      battery: hardwareMatch.battery
        ? {
            id: hardwareMatch.battery.id,
            brand: hardwareMatch.battery.brand,
            model: hardwareMatch.battery.model,
            moduleCapacityKwh: hardwareMatch.battery.kwh,
            quantity: hardwareMatch.batteryCount,
            totalStorageKwh: hardwareMatch.totalBatteryKwh,
            usableStorageKwh: Number((hardwareMatch.totalBatteryKwh * LIFEPO4_BATTERY_DOD).toFixed(2)),
            unitPricePhp: hardwareMatch.battery.pricePhp,
            subtotalPhp: batterySubtotal,
          }
        : null,
      bosAndInstallationPhp,
      totalSystemCostPhp,
    },
    financialRoi: {
      estimatedMonthlySavingsPhp: sizingResult.estimatedMonthlySavingsPhp,
      estimatedNewMonthlyBillPhp: Math.max(
        0,
        effectiveMonthlyBill - sizingResult.estimatedMonthlySavingsPhp
      ),
      annualSavingsPhp,
      paybackPeriodYears,
      fiveYearNetSavingsPhp: annualSavingsPhp * 5 - totalSystemCostPhp,
      twentyFiveYearNetSavingsPhp: annualSavingsPhp * 25 - totalSystemCostPhp,
    },
  };

  return { sizingResult, hardwareMatch, proposal };
}
