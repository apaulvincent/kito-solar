// src/lib/hardwareCatalog.ts

export interface HardwareMatchInput {
  targetKwp?: number;
  targetInverterKw?: number;
  targetBatteryKwh?: number;
  systemType?: 'grid-tie' | 'hybrid' | 'off-grid';
  preferredInverterBrand?: string;
  preferredPanelBrand?: string;
  searchQuery?: string;
  category?: 'panel' | 'inverter' | 'battery' | 'general';
}

export const INVERTER_CATALOG = [
  { id: 'inv-deye-5k-hyb', brand: 'Deye', model: 'SUN-5K-SG05LP1-EU', type: 'hybrid', kw: 5, mpptMinV: 150, mpptMaxV: 425, maxDcV: 500, pricePhp: 68000 },
  { id: 'inv-deye-8k-hyb', brand: 'Deye', model: 'SUN-8K-SG01LP1-EU', type: 'hybrid', kw: 8, mpptMinV: 150, mpptMaxV: 425, maxDcV: 500, pricePhp: 98000 },
  { id: 'inv-deye-12k-hyb', brand: 'Deye', model: 'SUN-12K-SG04LP3-EU', type: 'hybrid', kw: 12, mpptMinV: 200, mpptMaxV: 650, maxDcV: 800, pricePhp: 135000 },
  { id: 'inv-growatt-5k-gt', brand: 'Growatt', model: 'MIN 5000TL-X', type: 'grid-tie', kw: 5, mpptMinV: 100, mpptMaxV: 500, maxDcV: 550, pricePhp: 32000 },
  { id: 'inv-growatt-6k-hyb', brand: 'Growatt', model: 'SPH 6000TL BL-UP', type: 'hybrid', kw: 6, mpptMinV: 150, mpptMaxV: 450, maxDcV: 550, pricePhp: 64000 },
  { id: 'inv-solis-5k-gt', brand: 'Solis', model: 'S6-GR1P5K', type: 'grid-tie', kw: 5, mpptMinV: 90, mpptMaxV: 520, maxDcV: 600, pricePhp: 34000 },
];

export const PANEL_CATALOG = [
  { id: 'pnl-jinko-550', brand: 'Jinko', model: 'Tiger Pro 550W Mono', watts: 550, voc: 49.6, vmp: 41.7, pricePhp: 6200 },
  { id: 'pnl-longi-550', brand: 'Longi', model: 'Hi-MO 5 550W', watts: 550, voc: 49.8, vmp: 41.9, pricePhp: 6300 },
  { id: 'pnl-canadian-580', brand: 'Canadian Solar', model: 'TOPHiKu6 580W N-Type', watts: 580, voc: 51.2, vmp: 43.1, pricePhp: 6800 },
];

export const BATTERY_CATALOG = [
  { id: 'bat-deye-5k', brand: 'Deye', model: 'SE-G5.1 Pro-B LiFePO4', kwh: 5.12, voltage: 51.2, pricePhp: 65000 },
  { id: 'bat-lvtopsun-5k', brand: 'LVTOPSUN', model: 'LVTS-512100 5.12kWh LiFePO4', kwh: 5.12, voltage: 51.2, pricePhp: 55000 },
];

export async function matchHardwareCatalog(input: HardwareMatchInput) {
  // 1. Select Panel
  let selectedPanel = PANEL_CATALOG[0];
  if (input.preferredPanelBrand) {
    const brandMatch = PANEL_CATALOG.find((p) =>
      p.brand.toLowerCase().includes(input.preferredPanelBrand!.toLowerCase())
    );
    if (brandMatch) selectedPanel = brandMatch;
  }

  const panelCount = input.targetKwp
    ? Math.max(4, Math.ceil((input.targetKwp * 1000) / selectedPanel.watts))
    : 0;
  const actualArrayKwp = Number(((panelCount * selectedPanel.watts) / 1000).toFixed(2));

  // 2. Select Inverter (Filter by systemType and preferredInverterBrand)
  let candidateInverters = INVERTER_CATALOG.filter((inv) =>
    input.systemType ? inv.type === input.systemType : true
  );

  if (input.preferredInverterBrand) {
    const brandFiltered = candidateInverters.filter((inv) =>
      inv.brand.toLowerCase().includes(input.preferredInverterBrand!.toLowerCase())
    );
    // If brand match found (even if user didn't specify hybrid, e.g., Deye is hybrid), fall back to all inverters of that brand
    if (brandFiltered.length > 0) {
      candidateInverters = brandFiltered;
    } else {
      const anyTypeBrand = INVERTER_CATALOG.filter((inv) =>
        inv.brand.toLowerCase().includes(input.preferredInverterBrand!.toLowerCase())
      );
      if (anyTypeBrand.length > 0) candidateInverters = anyTypeBrand;
    }
  }

  const targetKw = input.targetInverterKw ?? 5;
  const selectedInverter =
    candidateInverters.find((inv) => inv.kw >= targetKw) ??
    candidateInverters[candidateInverters.length - 1] ??
    INVERTER_CATALOG[0];

  // 3. Select Battery
  const selectedBattery = BATTERY_CATALOG[0];
  const batteryCount =
    input.targetBatteryKwh && input.targetBatteryKwh > 0
      ? Math.ceil(input.targetBatteryKwh / selectedBattery.kwh)
      : 0;

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
    estimatedTotalSystemCostPhp: Math.round(totalHardwareCostPhp * 1.25), // Includes BOS & installation
  };
}
