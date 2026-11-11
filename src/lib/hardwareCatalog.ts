import { SystemType } from '../types/solar-ai.js';
import { roundUpToBatteryModules } from './solarConstants.js';

export interface HardwareMatchInput {
  targetKwp?: number;
  targetInverterKw?: number;
  targetBatteryKwh?: number;
  systemType?: SystemType;
  preferredInverterBrand?: string;
  preferredPanelBrand?: string;
}

export interface HardwareSearchInput {
  searchQuery: string;
  category?: 'panel' | 'inverter' | 'battery' | 'general';
}

export const INVERTER_CATALOG = [
  { id: 'inv-deye-5k-hyb', brand: 'Deye', model: 'SUN-5K-SG05LP1-EU', type: 'hybrid' as const, kw: 5, mpptMinV: 150, mpptMaxV: 425, maxDcV: 500, pricePhp: 68000 },
  { id: 'inv-deye-8k-hyb', brand: 'Deye', model: 'SUN-8K-SG01LP1-EU', type: 'hybrid' as const, kw: 8, mpptMinV: 150, mpptMaxV: 425, maxDcV: 500, pricePhp: 98000 },
  { id: 'inv-deye-12k-hyb', brand: 'Deye', model: 'SUN-12K-SG04LP3-EU', type: 'hybrid' as const, kw: 12, mpptMinV: 200, mpptMaxV: 650, maxDcV: 800, pricePhp: 135000 },
  { id: 'inv-growatt-5k-gt', brand: 'Growatt', model: 'MIN 5000TL-X', type: 'grid-tie' as const, kw: 5, mpptMinV: 100, mpptMaxV: 500, maxDcV: 550, pricePhp: 32000 },
  { id: 'inv-solis-6k-hyb', brand: 'Solis', model: 'S6-EH1P6K-L-EU', type: 'hybrid' as const, kw: 6, mpptMinV: 150, mpptMaxV: 450, maxDcV: 550, pricePhp: 64000 },
  { id: 'inv-solis-7k-gt', brand: 'Solis', model: 'S6-GR1P7K2', type: 'grid-tie' as const, kw: 7.2, mpptMinV: 90, mpptMaxV: 520, maxDcV: 600, pricePhp: 38000 },
];

export const PANEL_CATALOG = [
  { id: 'pnl-jinko-550', brand: 'Jinko', model: 'Tiger Pro 550W', watts: 550, voc: 49.4, vmp: 40.8, pricePhp: 6200 },
  { id: 'pnl-longi-550', brand: 'Longi', model: 'Hi-MO 5 545-570W', watts: 550, voc: 49.0, vmp: 39.5, pricePhp: 6300 },
  { id: 'pnl-canadian-580', brand: 'Canadian Solar', model: 'CS6R-580MS', watts: 580, voc: 51.2, vmp: 43.1, pricePhp: 6800 },
];

export const BATTERY_CATALOG = [
  { id: 'bat-deye-5k', brand: 'Deye', model: 'SE-G5.1 Pro-B LiFePO4', kwh: 5.12, voltage: 51.2, pricePhp: 65000 },
  { id: 'bat-generic-5k', brand: 'Generic', model: '51.2V-100 Ah', kwh: 5.1, voltage: 51.2, pricePhp: 62500 },
];

export async function matchHardwareCatalog(input: HardwareMatchInput) {
  let selectedPanel = PANEL_CATALOG[0];
  if (input.preferredPanelBrand) {
    const query = input.preferredPanelBrand.toLowerCase();
    const brandMatch = PANEL_CATALOG.find((p) => p.brand.toLowerCase().includes(query));
    if (brandMatch) selectedPanel = brandMatch;
  }

  const panelCount = input.targetKwp
    ? Math.max(4, Math.ceil((input.targetKwp * 1000) / selectedPanel.watts))
    : 0;
  const actualArrayKwp = Number(((panelCount * selectedPanel.watts) / 1000).toFixed(2));

  let candidateInverters = INVERTER_CATALOG.filter((inv) =>
    input.systemType ? inv.type === input.systemType : true
  );
  if (candidateInverters.length === 0) {
    candidateInverters = [...INVERTER_CATALOG];
  }

  if (input.preferredInverterBrand) {
    const query = input.preferredInverterBrand.toLowerCase();
    const brandFiltered = candidateInverters.filter((inv) => inv.brand.toLowerCase().includes(query));
    // Fall back across topologies when a user explicitly names a brand whose stock models are hybrid/grid-tie only.
    if (brandFiltered.length > 0) {
      candidateInverters = brandFiltered;
    } else {
      const anyTypeBrand = INVERTER_CATALOG.filter((inv) => inv.brand.toLowerCase().includes(query));
      if (anyTypeBrand.length > 0) candidateInverters = anyTypeBrand;
    }
  }

  const targetKw = input.targetInverterKw ?? 5;
  const selectedInverter =
    candidateInverters.find((inv) => inv.kw >= targetKw) ??
    candidateInverters[candidateInverters.length - 1] ??
    INVERTER_CATALOG[0];

  const selectedBattery = BATTERY_CATALOG[0];
  const batteryCount = roundUpToBatteryModules(input.targetBatteryKwh ?? 0, selectedBattery.kwh);

  const totalHardwareCostPhp =
    panelCount * selectedPanel.pricePhp +
    selectedInverter.pricePhp +
    batteryCount * selectedBattery.pricePhp;

  return {
    panel: selectedPanel,
    panelCount,
    actualArrayKwp,
    inverter: selectedInverter,
    battery: batteryCount > 0 ? selectedBattery : null,
    batteryCount,
    totalBatteryKwh: Number((batteryCount * selectedBattery.kwh).toFixed(2)),
    // 1.25x accounts for BOS (breakers, SPD, rails, MC4, wiring) & installation labor.
    estimatedTotalSystemCostPhp: Math.round(totalHardwareCostPhp * 1.25),
  };
}

export function searchHardwareCatalog(input: HardwareSearchInput) {
  const category = input.category ?? 'general';
  const tokens = input.searchQuery
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const matchesTokens = (text: string) =>
    tokens.length === 0 || tokens.some((token) => text.toLowerCase().includes(token));

  const inverters =
    category === 'general' || category === 'inverter'
      ? INVERTER_CATALOG.filter((inv) => matchesTokens(`${inv.brand} ${inv.model} ${inv.type} ${inv.kw}kw inverter`))
      : [];
  const panels =
    category === 'general' || category === 'panel'
      ? PANEL_CATALOG.filter((pnl) => matchesTokens(`${pnl.brand} ${pnl.model} ${pnl.watts}w panel solar module`))
      : [];
  const batteries =
    category === 'general' || category === 'battery'
      ? BATTERY_CATALOG.filter((bat) => matchesTokens(`${bat.brand} ${bat.model} ${bat.kwh}kwh ${bat.voltage}v battery lifepo4`))
      : [];

  return {
    query: input.searchQuery,
    category,
    inverters,
    panels,
    batteries,
    totalMatches: inverters.length + panels.length + batteries.length,
  };
}
