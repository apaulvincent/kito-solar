import { BatteryRecord, SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { ProjectSizingResult } from '@/types/solar-ai';
import { parseNumericValue } from '@/lib/utils';

function parseRangeBounds(rangeStr?: string | null): { min: number; max: number } | null {
  if (!rangeStr || !rangeStr.includes('-')) return null;
  const [rawMin, rawMax] = rangeStr.split('-');
  const min = parseFloat(rawMin.trim());
  const max = parseFloat(rawMax.trim());
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min, max };
}

export function isBatteryCapableInverter(
  inverter: Pick<SolarInverterRecord, 'battery_type' | 'battery_voltage_range'>
): boolean {
  return Boolean(
    inverter.battery_type &&
      inverter.battery_voltage_range &&
      inverter.battery_type.toLowerCase() !== 'none'
  );
}

export function parseMpptVoltageRange(
  inverter: Pick<SolarInverterRecord, 'startup_voltage_v' | 'max_pv_input_voltage_v' | 'mppt_voltage_range'>,
  defaultMaxFallback?: number
): { minMpptV: number; maxMpptV: number } {
  const defaultMin = Number(inverter.startup_voltage_v) || 120;
  const defaultMax = Number(inverter.max_pv_input_voltage_v) || defaultMaxFallback || 500;
  const parsed = parseRangeBounds(inverter.mppt_voltage_range);
  return {
    minMpptV: parsed ? parsed.min : defaultMin,
    maxMpptV: parsed ? parsed.max : defaultMax,
  };
}

export function parseBatteryVoltageRange(
  inverter: Pick<SolarInverterRecord, 'battery_voltage_range'>
): { minV: number; maxV: number } | null {
  const parsed = parseRangeBounds(inverter.battery_voltage_range);
  return parsed ? { minV: parsed.min, maxV: parsed.max } : null;
}

function pickClosestByValue<T>(items: T[], getValue: (item: T) => number, target: number): T {
  let best = items[0];
  let bestDiff = Math.abs(getValue(best) - target);
  for (let i = 1; i < items.length; i++) {
    const diff = Math.abs(getValue(items[i]) - target);
    if (diff < bestDiff) {
      best = items[i];
      bestDiff = diff;
    }
  }
  return best;
}

export interface MatchedProposalHardware {
  selectedInverter: SolarInverterRecord;
  selectedModule: SolarModuleRecord;
  selectedBattery: BatteryRecord | null;
  batteryCount: number;
}

export function matchProposalHardware(
  proposal: ProjectSizingResult,
  catalog: {
    inverters: SolarInverterRecord[];
    modules: SolarModuleRecord[];
    batteries: BatteryRecord[];
    currentInverter: SolarInverterRecord;
    currentModule: SolarModuleRecord;
  }
): MatchedProposalHardware {
  const propInv = proposal.billOfMaterials.inverter;
  const isHybridProp = propInv.systemType !== 'grid-tie';
  const targetInvWatts = propInv.ratedAcKw * 1000;

  const exactInv = catalog.inverters.find(
    (inv) => inv.model.toLowerCase() === propInv.model.toLowerCase()
  );
  let matchedInverter = exactInv;
  if (!matchedInverter) {
    const brandAndTypeMatches = catalog.inverters.filter(
      (inv) =>
        inv.brand.toLowerCase().includes(propInv.brand.toLowerCase()) &&
        isBatteryCapableInverter(inv) === isHybridProp
    );
    const sameTypeMatches = catalog.inverters.filter(
      (inv) => isBatteryCapableInverter(inv) === isHybridProp
    );
    const pool =
      brandAndTypeMatches.length > 0
        ? brandAndTypeMatches
        : sameTypeMatches.length > 0
        ? sameTypeMatches
        : catalog.inverters;
    matchedInverter =
      pool.length > 0
        ? pickClosestByValue(pool, (inv) => parseNumericValue(inv.rated_ac_power_w), targetInvWatts)
        : catalog.currentInverter;
  }

  const propPanel = proposal.billOfMaterials.panel;
  const exactMod = catalog.modules.find(
    (m) => m.model.toLowerCase() === propPanel.model.toLowerCase()
  );
  let matchedModule = exactMod;
  if (!matchedModule) {
    const brandMods = catalog.modules.filter((m) =>
      m.brand.toLowerCase().includes(propPanel.brand.toLowerCase())
    );
    const pool = brandMods.length > 0 ? brandMods : catalog.modules;
    matchedModule =
      pool.length > 0
        ? pickClosestByValue(pool, (m) => parseNumericValue(m.pv_wattage_w), propPanel.wattageWp)
        : catalog.currentModule;
  }

  let matchedBattery: BatteryRecord | null = null;
  let batteryCount = 1;
  if (
    proposal.billOfMaterials.battery &&
    isBatteryCapableInverter(matchedInverter) &&
    catalog.batteries.length > 0
  ) {
    const targetStorageKwh = proposal.billOfMaterials.battery.totalStorageKwh;
    const vRange = parseBatteryVoltageRange(matchedInverter);
    const voltageCompatible = vRange
      ? catalog.batteries.filter((b) => {
          const nom = Number(b.nominal_voltage_v) || 0;
          return nom >= vRange.minV * 0.85 && nom <= vRange.maxV * 1.15;
        })
      : catalog.batteries;
    const batPool = voltageCompatible.length > 0 ? voltageCompatible : catalog.batteries;

    const getKwh = (b: BatteryRecord) =>
      (b.energy_wh || b.nominal_voltage_v * b.capacity_ah) / 1000;
    const maxSingleKwh = Math.max(...batPool.map(getKwh), 0);

    if (targetStorageKwh > maxSingleKwh * 1.1 && maxSingleKwh > 0) {
      const largest = pickClosestByValue(batPool, getKwh, maxSingleKwh);
      matchedBattery = largest;
      batteryCount = Math.max(1, Math.round(targetStorageKwh / getKwh(largest)));
    } else {
      matchedBattery = pickClosestByValue(batPool, getKwh, targetStorageKwh);
      batteryCount = 1;
    }
  }

  return {
    selectedInverter: {
      ...matchedInverter,
      price_php: propInv.unitPricePhp ?? matchedInverter.price_php ?? null,
    },
    selectedModule: {
      ...matchedModule,
      price_php: propPanel.unitPricePhp ?? matchedModule.price_php ?? null,
    },
    selectedBattery: matchedBattery
      ? {
          ...matchedBattery,
          price_php: proposal.billOfMaterials.battery?.unitPricePhp ?? matchedBattery.price_php ?? null,
        }
      : null,
    batteryCount,
  };
}
