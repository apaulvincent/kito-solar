import { useMemo } from 'react';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { useApplianceLoadStore } from '@/store/useApplianceLoadStore';
import { useSolarMapperStore } from '@/features/solar-mapper/store/useSolarMapperStore';
import { estimateSizingFromMonthlyBill } from '@/features/financial-roi/utils/financialEngine';
import { SystemSizingInput } from '@/features/financial-roi/types/financialRoi';
import { SystemTopologyMode } from '@/features/yield-simulator/types/yieldSimulator';
import {
  DEFAULT_PEAK_SUN_HOURS,
  DEFAULT_SYSTEM_EFFICIENCY,
  LIFEPO4_BATTERY_DOD,
  LIFEPO4_MODULE_KWH,
  LIFEPO4_ROUND_TRIP_EFFICIENCY,
} from '@/lib/solarConstants';

export interface StudioHardwareSnapshot {
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  hasBattery: boolean;
  topology: SystemTopologyMode;
}

export function readStudioHardwareSnapshot(defaultBatteryIfMissing = 0): StudioHardwareSnapshot {
  const res = useCalculatorStore.getState().calculationResult;
  if (!res || res.summary.totalArrayPowerKw <= 0) {
    return {
      pvArrayKwp: 6.0,
      inverterKw: 6.0,
      batteryCapacityKwh: 10.24,
      hasBattery: true,
      topology: 'hybrid',
    };
  }
  const hasBattery = res.battery.hasBattery && res.battery.totalEnergyWh > 0;
  return {
    pvArrayKwp: Number((res.summary.totalArrayPowerKw || 6.0).toFixed(2)),
    inverterKw: Number((res.summary.inverterPowerKw || 6.0).toFixed(2)),
    batteryCapacityKwh: hasBattery
      ? Number((res.battery.totalEnergyWh / 1000).toFixed(2))
      : defaultBatteryIfMissing,
    hasBattery,
    topology: res.systemType === 'hybrid' && hasBattery ? 'hybrid' : 'grid_tie',
  };
}

export function readCrossStoreFinancialSizingInput(params: {
  retailRatePhp: number;
  standaloneMonthlyBillPhp: number;
  useStandaloneBillOverride: boolean;
}): SystemSizingInput {
  const mapperProfile = useSolarMapperStore.getState().irradianceProfile;
  const effectivePsh =
    mapperProfile?.annualAvgEffectivePsh && mapperProfile.annualAvgEffectivePsh > 0
      ? mapperProfile.annualAvgEffectivePsh
      : DEFAULT_PEAK_SUN_HOURS;

  if (params.useStandaloneBillOverride) {
    return estimateSizingFromMonthlyBill(
      params.standaloneMonthlyBillPhp,
      params.retailRatePhp,
      effectivePsh
    );
  }

  const loadState = useApplianceLoadStore.getState();
  if (loadState.items && loadState.items.length > 0) {
    const sizing = loadState.getSizingResult();
    if (sizing.totalDailyKwh > 0) {
      return {
        pvKwp: Math.max(1.0, sizing.recommendedPvKwp),
        inverterKw: Math.max(1.0, sizing.recommendedInverterKw),
        batteryKwh: sizing.recommendedBatteryKwh || LIFEPO4_MODULE_KWH,
        dailyTotalKwh: sizing.totalDailyKwh,
        dailyDaytimeKwh: sizing.daytimeKwh,
        dailyNighttimeKwh: sizing.nighttimeKwh,
        effectivePsh,
        systemEfficiency: DEFAULT_SYSTEM_EFFICIENCY,
        batteryDod: LIFEPO4_BATTERY_DOD,
        batteryRoundTripEfficiency: LIFEPO4_ROUND_TRIP_EFFICIENCY,
        sourceLabel: `Synced from Appliance Load (${loadState.items.length} appliances, ${sizing.totalDailyKwh.toFixed(1)} kWh/day)`,
      };
    }
  }

  const calcResult = useCalculatorStore.getState().calculationResult;
  if (calcResult && calcResult.summary.totalArrayPowerKw > 0) {
    const pvKwp = calcResult.summary.totalArrayPowerKw;
    const inverterKw = calcResult.summary.inverterPowerKw;
    const batteryKwh = calcResult.battery?.hasBattery
      ? calcResult.battery.totalEnergyWh / 1000
      : LIFEPO4_MODULE_KWH;
    const dailyGen = pvKwp * effectivePsh * DEFAULT_SYSTEM_EFFICIENCY;

    return {
      pvKwp,
      inverterKw,
      batteryKwh,
      dailyTotalKwh: dailyGen,
      dailyDaytimeKwh: Math.round(dailyGen * 0.45 * 10) / 10,
      dailyNighttimeKwh: Math.round(dailyGen * 0.55 * 10) / 10,
      effectivePsh,
      systemEfficiency: DEFAULT_SYSTEM_EFFICIENCY,
      batteryDod: LIFEPO4_BATTERY_DOD,
      batteryRoundTripEfficiency: LIFEPO4_ROUND_TRIP_EFFICIENCY,
      sourceLabel: `Synced from Solar Engineering Workbench (${pvKwp.toFixed(2)} kWp Array)`,
    };
  }

  return estimateSizingFromMonthlyBill(
    params.standaloneMonthlyBillPhp,
    params.retailRatePhp,
    effectivePsh
  );
}

export function useCrossFeatureFinancialSizingInput(params: {
  retailRatePhp: number;
  standaloneMonthlyBillPhp: number;
  useStandaloneBillOverride: boolean;
}): SystemSizingInput {
  const loadItems = useApplianceLoadStore((s) => s.items);
  const loadConfig = useApplianceLoadStore((s) => s.config);
  const effectivePsh = useSolarMapperStore((s) => s.irradianceProfile?.annualAvgEffectivePsh);
  const calculationResult = useCalculatorStore((s) => s.calculationResult);

  return useMemo(
    () =>
      readCrossStoreFinancialSizingInput({
        retailRatePhp: params.retailRatePhp,
        standaloneMonthlyBillPhp: params.standaloneMonthlyBillPhp,
        useStandaloneBillOverride: params.useStandaloneBillOverride,
      }),
    [
      params.retailRatePhp,
      params.standaloneMonthlyBillPhp,
      params.useStandaloneBillOverride,
      loadItems,
      loadConfig,
      effectivePsh,
      calculationResult,
    ]
  );
}

export function useCrossFeatureYieldContext() {
  const appliances = useApplianceLoadStore((s) => s.items);
  const addPreset = useApplianceLoadStore((s) => s.addPreset);
  const coordinates = useSolarMapperStore((s) => s.coordinates);
  const designBasis = useSolarMapperStore((s) => s.designBasis);
  const irradianceProfile = useSolarMapperStore((s) => s.irradianceProfile);
  const getSelectedPsh = useSolarMapperStore((s) => s.getSelectedPsh);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const selectedPsh = useMemo(() => getSelectedPsh(), [getSelectedPsh, designBasis, irradianceProfile]);

  return {
    appliances,
    addPreset,
    coordinates,
    selectedPsh,
    setActiveView,
  };
}

export function readLoadSizingSnapshot() {
  return useApplianceLoadStore.getState().getSizingResult();
}

export function useRoofVsLoadContext() {
  const items = useApplianceLoadStore((s) => s.items);
  const config = useApplianceLoadStore((s) => s.config);
  const getSizingResult = useApplianceLoadStore((s) => s.getSizingResult);
  const setActiveView = useCalculatorStore((s) => s.setActiveView);

  const loadResult = useMemo(() => getSizingResult(), [getSizingResult, items, config]);

  return { loadResult, setActiveView };
}
