import {
  DEFAULT_INVERTER_EFFICIENCY,
  DEFAULT_PANEL_WATTAGE_W,
  DEFAULT_PEAK_SUN_HOURS,
  DEFAULT_SYSTEM_EFFICIENCY,
  LIFEPO4_BATTERY_DOD,
  LIFEPO4_MODULE_KWH,
  STANDARD_INVERTER_TIERS_KW,
  roundUpToBatteryModules,
} from './solarConstants';
import type {
  ApplianceCategory,
  ApplianceItem,
  GridReliability,
  LoadType,
  PresetAppliance,
  PrimaryGoal,
  SystemTopology,
} from '@/types/applianceLoad';

export type {
  ApplianceCategory,
  ApplianceItem,
  GridReliability,
  LoadType,
  PresetAppliance,
  PrimaryGoal,
  SystemTopology,
};

export interface SizingConfig {
  primaryGoal: PrimaryGoal;
  gridReliability: GridReliability;
  peakSunHours: number;          // default 4.5
  panelWattage: 550 | 580 | 600; // default 580
  systemEfficiency: number;      // default 0.80
  batteryDod: number;            // default 0.80 (LiFePO4)
  inverterEfficiency: number;    // default 0.92
  autonomyDays: number;          // default 1.5 for off-grid
  simultaneityFactor: number;    // default 1.0 (worst-case) or 0.75 (diverse)
}

export interface SizingResult {
  totalDailyWh: number;
  totalDailyKwh: number;
  daytimeKwh: number;
  nighttimeKwh: number;
  criticalBackupDailyKwh: number;
  continuousRunningWatts: number;
  criticalRunningWatts: number;
  largestSurgeSpikeWatts: number;
  largestSurgeApplianceName: string | null;
  peakSystemSurgeWatts: number;
  recommendedInverterKw: number;
  inverterLoadPercentage: number;
  inverterSurgePercentage: number;
  recommendedPvKwp: number;
  recommendedPanelCount: number;
  estimatedRoofAreaSqm: number;  // ~2.6 sqm per 580W panel
  recommendedBatteryKwh: number;
  recommendedBatteryUnits5kWh: number; // 51.2V 100Ah (5.12 kWh) modules
  estimatedBackupHours: number;
  recommendedTopology: SystemTopology;
  topologyReasoning: string[];
  warnings: string[];
}

// 18+ realistic appliance presets matching the PRD specification

export { PRESET_APPLIANCES, STARTER_PROFILES } from '@/data/appliancePresets';
export type { StarterProfile } from '@/data/appliancePresets';
export const STANDARD_INVERTER_TIERS: readonly number[] = STANDARD_INVERTER_TIERS_KW;

export const DEFAULT_SIZING_CONFIG: SizingConfig = {
  primaryGoal: 'bill_savings',
  gridReliability: 'stable',
  peakSunHours: DEFAULT_PEAK_SUN_HOURS,
  panelWattage: DEFAULT_PANEL_WATTAGE_W,
  systemEfficiency: DEFAULT_SYSTEM_EFFICIENCY,
  batteryDod: LIFEPO4_BATTERY_DOD,
  inverterEfficiency: DEFAULT_INVERTER_EFFICIENCY,
  autonomyDays: 1.5,
  simultaneityFactor: 1.0,
};

/**
 * Pure calculation function for household appliance load and solar hardware sizing.
 */
export function calculateApplianceSizing(
  items: ApplianceItem[],
  config: SizingConfig = DEFAULT_SIZING_CONFIG
): SizingResult {
  const warnings: string[] = [];
  const topologyReasoning: string[] = [];

  if (!items || items.length === 0) {
    return {
      totalDailyWh: 0,
      totalDailyKwh: 0,
      daytimeKwh: 0,
      nighttimeKwh: 0,
      criticalBackupDailyKwh: 0,
      continuousRunningWatts: 0,
      criticalRunningWatts: 0,
      largestSurgeSpikeWatts: 0,
      largestSurgeApplianceName: null,
      peakSystemSurgeWatts: 0,
      recommendedInverterKw: 0,
      inverterLoadPercentage: 0,
      inverterSurgePercentage: 0,
      recommendedPvKwp: 0,
      recommendedPanelCount: 0,
      estimatedRoofAreaSqm: 0,
      recommendedBatteryKwh: 0,
      recommendedBatteryUnits5kWh: 0,
      estimatedBackupHours: 0,
      recommendedTopology: 'grid_tie',
      topologyReasoning: ['Add appliances to size your solar system.'],
      warnings: [],
    };
  }

  const simultaneity = Math.max(0.1, Math.min(1.0, config.simultaneityFactor || 1.0));

  // 1. Running Watts & Energy Calculation
  let rawRunningWatts = 0;
  let rawCriticalWatts = 0;
  let totalDailyWh = 0;
  let daytimeWh = 0;
  let criticalDailyWh = 0;

  let largestSurgeSpikeWatts = 0;
  let largestSurgeApplianceName: string | null = null;

  items.forEach((item) => {
    const qty = Math.max(0, item.quantity);
    const runWatts = Math.max(0, item.runningWatts);
    const surgeMultiplier = Math.max(1.0, item.surgeMultiplier);
    const dutyCycle = Math.max(0.05, Math.min(1.0, item.dutyCycle));
    const hours = Math.max(0.1, Math.min(24, item.hoursPerDay));
    const daytimeRatio = Math.max(0, Math.min(1.0, item.daytimeRatio));

    // Continuous running contribution
    const itemTotalRunWatts = qty * runWatts;
    rawRunningWatts += itemTotalRunWatts;
    if (item.isCriticalBackup) {
      rawCriticalWatts += itemTotalRunWatts;
    }

    // Daily Energy: Qty * RunWatts * Hours * DutyCycle
    const itemDailyWh = itemTotalRunWatts * hours * dutyCycle;
    totalDailyWh += itemDailyWh;
    daytimeWh += itemDailyWh * daytimeRatio;

    if (item.isCriticalBackup) {
      criticalDailyWh += itemDailyWh;
    }

    // Surge calculation:
    // Individual spike = (RunWatts * Multiplier) - RunWatts
    // Note: In an electrical system, if multiple units of the same item exist, the worst-case
    // instantaneous motor start happens on 1 unit while others may already be operating.
    if (qty > 0 && runWatts > 0) {
      const peakItemWatts = runWatts * surgeMultiplier;
      const spikeWatts = peakItemWatts - runWatts;
      if (spikeWatts > largestSurgeSpikeWatts) {
        largestSurgeSpikeWatts = spikeWatts;
        largestSurgeApplianceName = item.name;
      }
    }
  });

  const continuousRunningWatts = Math.round(rawRunningWatts * simultaneity);
  const criticalRunningWatts = Math.round(rawCriticalWatts * simultaneity);
  const peakSystemSurgeWatts = Math.round(continuousRunningWatts + largestSurgeSpikeWatts);

  const totalDailyKwh = Number((totalDailyWh / 1000).toFixed(2));
  const daytimeKwh = Number((daytimeWh / 1000).toFixed(2));
  const nighttimeKwh = Number(Math.max(0, (totalDailyWh - daytimeWh) / 1000).toFixed(2));
  const criticalBackupDailyKwh = Number((criticalDailyWh / 1000).toFixed(2));

  // 2. Inverter Sizing
  // Standard rule: 25% continuous safety headroom (1.25x),
  // and inverter surge capability (usually 2.0x continuous rating) must handle peakSystemSurgeWatts.
  const minRequiredWattsFromContinuous = continuousRunningWatts * 1.25;
  const minRequiredWattsFromSurge = peakSystemSurgeWatts / 2.0;
  const rawMinInverterWatts = Math.max(minRequiredWattsFromContinuous, minRequiredWattsFromSurge);
  const rawMinInverterKw = rawMinInverterWatts / 1000;

  // Round up to standard commercial inverter tiers
  let recommendedInverterKw = STANDARD_INVERTER_TIERS[STANDARD_INVERTER_TIERS.length - 1];
  for (const tier of STANDARD_INVERTER_TIERS) {
    if (tier >= rawMinInverterKw) {
      recommendedInverterKw = tier;
      break;
    }
  }
  if (rawMinInverterKw > STANDARD_INVERTER_TIERS[STANDARD_INVERTER_TIERS.length - 1]) {
    // If above 20kW, step in increments of 5kW
    recommendedInverterKw = Math.ceil(rawMinInverterKw / 5) * 5;
  }

  const inverterContinuousCapacityWatts = recommendedInverterKw * 1000;
  const inverterSurgeCapacityWatts = inverterContinuousCapacityWatts * 2.0;

  const inverterLoadPercentage =
    inverterContinuousCapacityWatts > 0
      ? Math.round((continuousRunningWatts / inverterContinuousCapacityWatts) * 100)
      : 0;

  const inverterSurgePercentage =
    inverterSurgeCapacityWatts > 0
      ? Math.round((peakSystemSurgeWatts / inverterSurgeCapacityWatts) * 100)
      : 0;

  // Edge-case check: Was the inverter bumped up due to motor surge rather than continuous load?
  if (minRequiredWattsFromSurge > minRequiredWattsFromContinuous && largestSurgeApplianceName) {
    warnings.push(
      `Inverter sized up to ${recommendedInverterKw} kW to absorb the startup surge from "${largestSurgeApplianceName}" (+${largestSurgeSpikeWatts.toLocaleString()}W spike).`
    );
  }

  // 3. Topology Recommendation Matrix
  const daytimeFraction = totalDailyWh > 0 ? daytimeWh / totalDailyWh : 0.5;
  let recommendedTopology: SystemTopology = 'grid_tie';

  if (config.primaryGoal === 'off_grid' || config.gridReliability === 'no_grid') {
    recommendedTopology = 'off_grid';
    topologyReasoning.push('100% off-grid independence selected with zero reliance on the utility grid.');
    topologyReasoning.push('Sized with battery autonomy buffer to sustain essential loads during non-sunny days.');
  } else if (
    config.primaryGoal === 'bill_and_backup' ||
    config.gridReliability === 'occasional_outages' ||
    config.gridReliability === 'frequent_outages'
  ) {
    recommendedTopology = 'hybrid';
    topologyReasoning.push('Hybrid configuration with automatic <10ms UPS switchover protects critical loads during brownouts.');
    if (config.gridReliability === 'frequent_outages') {
      topologyReasoning.push('Local grid has frequent outages; dedicated battery backup is essential.');
    } else {
      topologyReasoning.push('Offsets high daytime utility tariffs while storing reserve power for nighttime outages.');
    }
  } else if (config.primaryGoal === 'bill_savings') {
    if (config.gridReliability === 'stable' && daytimeFraction >= 0.55) {
      recommendedTopology = 'grid_tie';
      topologyReasoning.push('Grid-Tie (On-Grid) offers the lowest initial capital cost and fastest payback period (3 to 4.5 years).');
      topologyReasoning.push(`Your usage is ${(daytimeFraction * 100).toFixed(0)}% daytime, maximizing direct solar self-consumption.`);
    } else if (daytimeFraction < 0.40) {
      // High nighttime usage requires storage unless 1:1 net metering is guaranteed
      recommendedTopology = 'hybrid';
      topologyReasoning.push(`High nighttime consumption (${((1 - daytimeFraction) * 100).toFixed(0)}%) requires battery storage to avoid buying expensive grid power after sunset.`);
    } else {
      recommendedTopology = 'grid_tie';
      topologyReasoning.push('Direct solar self-consumption offsets daytime consumption with minimal hardware overhead.');
    }
  }

  // Warning for critical appliances selected with Grid-Tie
  const hasCritical = items.some((i) => i.isCriticalBackup && i.quantity > 0);
  if (recommendedTopology === 'grid_tie' && hasCritical) {
    warnings.push(
      'Standard Grid-Tie inverters shut down during brownouts for anti-islanding safety. Switch to a Hybrid setup if you require continuous power during utility outages.'
    );
  }

  // 4. Solar PV Array Sizing
  // P_pv = (E_daily * f_offset) / (PSH * eta_sys)
  const psh = Math.max(2.5, Math.min(6.5, config.peakSunHours || DEFAULT_PEAK_SUN_HOURS));
  const sysEff = Math.max(0.65, Math.min(0.95, config.systemEfficiency || DEFAULT_SYSTEM_EFFICIENCY));
  const targetOffset = recommendedTopology === 'off_grid' ? 1.3 : 1.0;

  const rawPvKwp = (totalDailyKwh * targetOffset) / (psh * sysEff);
  const recommendedPvKwp = Number(Math.max(0.5, rawPvKwp).toFixed(2));

  const panelWattage = config.panelWattage || DEFAULT_PANEL_WATTAGE_W;
  const recommendedPanelCount = Math.max(1, Math.ceil((recommendedPvKwp * 1000) / panelWattage));
  const estimatedRoofAreaSqm = Number((recommendedPanelCount * 2.6).toFixed(1));

  // 5. LiFePO4 Battery Sizing
  const dod = Math.max(0.5, Math.min(0.95, config.batteryDod || LIFEPO4_BATTERY_DOD));
  const invEff = Math.max(0.8, Math.min(0.98, config.inverterEfficiency || DEFAULT_INVERTER_EFFICIENCY));
  let recommendedBatteryKwh = 0;
  let recommendedBatteryUnits5kWh = 0;
  let estimatedBackupHours = 0;

  if (recommendedTopology === 'grid_tie') {
    recommendedBatteryKwh = 0;
    recommendedBatteryUnits5kWh = 0;
    estimatedBackupHours = 0;
  } else if (recommendedTopology === 'hybrid') {
    // Sized for critical backup loads or night consumption
    const targetDailyKwh = hasCritical && criticalBackupDailyKwh > 0
      ? criticalBackupDailyKwh
      : Math.max(1.0, nighttimeKwh > 0 ? nighttimeKwh : totalDailyKwh * 0.5);

    const requiredGrossKwh = targetDailyKwh / (dod * invEff);
    recommendedBatteryUnits5kWh = Math.max(1, roundUpToBatteryModules(requiredGrossKwh));
    recommendedBatteryKwh = Number((recommendedBatteryUnits5kWh * LIFEPO4_MODULE_KWH).toFixed(2));

    const effectiveUsableKwh = recommendedBatteryKwh * dod * invEff;
    const backupWatts = criticalRunningWatts > 0 ? criticalRunningWatts : continuousRunningWatts;
    estimatedBackupHours =
      backupWatts > 0 ? Number(((effectiveUsableKwh * 1000) / backupWatts).toFixed(1)) : 0;
  } else {
    // Off-Grid: Multiply by days of autonomy
    const autonomy = Math.max(1.0, config.autonomyDays || 1.5);
    const requiredGrossKwh = (totalDailyKwh * autonomy) / (dod * invEff);
    recommendedBatteryUnits5kWh = Math.max(1, roundUpToBatteryModules(requiredGrossKwh));
    recommendedBatteryKwh = Number((recommendedBatteryUnits5kWh * LIFEPO4_MODULE_KWH).toFixed(2));

    const effectiveUsableKwh = recommendedBatteryKwh * dod * invEff;
    const backupWatts = continuousRunningWatts > 0 ? continuousRunningWatts : 200;
    estimatedBackupHours = Number(((effectiveUsableKwh * 1000) / backupWatts).toFixed(1));
  }

  return {
    totalDailyWh: Math.round(totalDailyWh),
    totalDailyKwh,
    daytimeKwh,
    nighttimeKwh,
    criticalBackupDailyKwh,
    continuousRunningWatts,
    criticalRunningWatts,
    largestSurgeSpikeWatts,
    largestSurgeApplianceName,
    peakSystemSurgeWatts,
    recommendedInverterKw,
    inverterLoadPercentage,
    inverterSurgePercentage,
    recommendedPvKwp,
    recommendedPanelCount,
    estimatedRoofAreaSqm,
    recommendedBatteryKwh,
    recommendedBatteryUnits5kWh,
    estimatedBackupHours,
    recommendedTopology,
    topologyReasoning,
    warnings,
  };
}
