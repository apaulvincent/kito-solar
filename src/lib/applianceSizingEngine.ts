// src/lib/applianceSizingEngine.ts
// Deterministic engineering calculation engine for household appliance load analysis & solar PV sizing.

export type ApplianceCategory = 'cooling' | 'kitchen' | 'work_tech' | 'lighting_utility' | 'custom';

export type LoadType = 'resistive' | 'inductive_motor' | 'inverter_motor' | 'electronic';

export interface ApplianceItem {
  id: string;
  presetId?: string;
  name: string;
  category: ApplianceCategory;
  loadType: LoadType;
  quantity: number;
  runningWatts: number;
  surgeMultiplier: number; // e.g. 1.0 for resistive, 1.2 for inverter, 3.5 for jet pump
  dutyCycle: number;       // 0.1 to 1.0 (e.g. 0.45 for fridge, 0.70 for inverter AC)
  hoursPerDay: number;     // 0.25 to 24
  daytimeRatio: number;    // 0.0 to 1.0 (fraction between 8 AM and 4 PM)
  isCriticalBackup: boolean;
}

export interface PresetAppliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  loadType: LoadType;
  defaultRunningWatts: number;
  surgeMultiplier: number;
  dutyCycle: number;
  defaultHoursPerDay: number;
  defaultDaytimeRatio: number;
  description: string;
}

export type PrimaryGoal = 'bill_savings' | 'bill_and_backup' | 'off_grid';
export type GridReliability = 'stable' | 'occasional_outages' | 'frequent_outages' | 'no_grid';
export type SystemTopology = 'grid_tie' | 'hybrid' | 'off_grid';

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
export const PRESET_APPLIANCES: PresetAppliance[] = [
  // Cooling & HVAC
  {
    id: 'ac_split_1hp_inverter',
    name: '1.0 HP Inverter Split AC',
    category: 'cooling',
    loadType: 'inverter_motor',
    defaultRunningWatts: 750,
    surgeMultiplier: 1.2,
    dutyCycle: 0.70,
    defaultHoursPerDay: 8,
    defaultDaytimeRatio: 0.50,
    description: 'Soft-starting variable refrigerant inverter compressor with thermal cycling',
  },
  {
    id: 'ac_window_1hp_non_inverter',
    name: '1.0 HP Non-Inverter Window AC',
    category: 'cooling',
    loadType: 'inductive_motor',
    defaultRunningWatts: 950,
    surgeMultiplier: 3.0,
    dutyCycle: 0.80,
    defaultHoursPerDay: 8,
    defaultDaytimeRatio: 0.50,
    description: 'Direct-on-line induction compressor with high starting inrush current',
  },
  {
    id: 'ac_split_1_5hp_inverter',
    name: '1.5 HP Inverter Split AC',
    category: 'cooling',
    loadType: 'inverter_motor',
    defaultRunningWatts: 1100,
    surgeMultiplier: 1.2,
    dutyCycle: 0.70,
    defaultHoursPerDay: 8,
    defaultDaytimeRatio: 0.50,
    description: 'High-capacity soft-start inverter compressor for medium to large living spaces',
  },
  {
    id: 'fan_ceiling_stand_std',
    name: 'Ceiling Fan',
    category: 'cooling',
    loadType: 'inductive_motor',
    defaultRunningWatts: 65,
    surgeMultiplier: 1.5,
    dutyCycle: 1.00,
    defaultHoursPerDay: 12,
    defaultDaytimeRatio: 0.50,
    description: 'Standard ceiling fan with continuous air circulation',
  },
  {
    id: 'fan_dc_inverter',
    name: 'Stand Fan',
    category: 'cooling',
    loadType: 'electronic',
    defaultRunningWatts: 25,
    surgeMultiplier: 1.1,
    dutyCycle: 1.00,
    defaultHoursPerDay: 12,
    defaultDaytimeRatio: 0.50,
    description: 'Energy-efficient stand fan with minimal startup surge',
  },

  // Kitchen
  {
    id: 'fridge_inverter_2door',
    name: 'Inverter Refrigerator (2-Door)',
    category: 'kitchen',
    loadType: 'inverter_motor',
    defaultRunningWatts: 120,
    surgeMultiplier: 1.5,
    dutyCycle: 0.45,
    defaultHoursPerDay: 24,
    defaultDaytimeRatio: 0.50,
    description: 'Variable-speed linear/inverter compressor cycling on temperature setpoints',
  },
  {
    id: 'fridge_standard_non_inverter',
    name: 'Standard Non-Inverter Fridge',
    category: 'kitchen',
    loadType: 'inductive_motor',
    defaultRunningWatts: 180,
    surgeMultiplier: 3.5,
    dutyCycle: 0.50,
    defaultHoursPerDay: 24,
    defaultDaytimeRatio: 0.50,
    description: 'Single-speed reciprocating compressor with heavy starting current spike',
  },
  {
    id: 'rice_cooker_std',
    name: 'Rice Cooker (Standard)',
    category: 'kitchen',
    loadType: 'resistive',
    defaultRunningWatts: 700,
    surgeMultiplier: 1.0,
    dutyCycle: 1.00,
    defaultHoursPerDay: 1,
    defaultDaytimeRatio: 0.70,
    description: 'Pure resistive heating element with unity power factor and zero surge',
  },
  {
    id: 'microwave_oven',
    name: 'Microwave Oven',
    category: 'kitchen',
    loadType: 'inductive_motor',
    defaultRunningWatts: 1200,
    surgeMultiplier: 1.5,
    dutyCycle: 1.00,
    defaultHoursPerDay: 0.5,
    defaultDaytimeRatio: 0.70,
    description: 'Magnetron with high-voltage transformer and cooling fan inrush',
  },
  {
    id: 'induction_cooker_1burner',
    name: 'Induction Cooker (1 Burner)',
    category: 'kitchen',
    loadType: 'electronic',
    defaultRunningWatts: 1800,
    surgeMultiplier: 1.1,
    dutyCycle: 0.80,
    defaultHoursPerDay: 1,
    defaultDaytimeRatio: 0.60,
    description: 'High-power magnetic induction cooktop with digital power modulation',
  },
  {
    id: 'electric_kettle_airfryer',
    name: 'Electric Kettle / Air Fryer',
    category: 'kitchen',
    loadType: 'resistive',
    defaultRunningWatts: 1500,
    surgeMultiplier: 1.0,
    dutyCycle: 1.00,
    defaultHoursPerDay: 0.5,
    defaultDaytimeRatio: 0.80,
    description: 'High-draw resistive rapid-boil or forced-air convective heating coil',
  },

  // Work & Entertainment
  {
    id: 'pc_gaming_workstation',
    name: 'Gaming / Workstation PC',
    category: 'work_tech',
    loadType: 'electronic',
    defaultRunningWatts: 450,
    surgeMultiplier: 1.2,
    dutyCycle: 0.85,
    defaultHoursPerDay: 6,
    defaultDaytimeRatio: 0.50,
    description: 'Active PFC power supply powering multi-core CPU and dedicated GPU load',
  },
  {
    id: 'laptop_monitor_setup',
    name: 'Laptop + Monitor Setup',
    category: 'work_tech',
    loadType: 'electronic',
    defaultRunningWatts: 90,
    surgeMultiplier: 1.1,
    dutyCycle: 1.00,
    defaultHoursPerDay: 8,
    defaultDaytimeRatio: 0.80,
    description: 'USB-C dock, external display, and laptop charging power adapter',
  },
  {
    id: 'wifi_router_modem',
    name: 'Wi-Fi Router / Fiber Modem',
    category: 'work_tech',
    loadType: 'electronic',
    defaultRunningWatts: 15,
    surgeMultiplier: 1.0,
    dutyCycle: 1.00,
    defaultHoursPerDay: 24,
    defaultDaytimeRatio: 0.50,
    description: 'Continuous network optical terminal and dual-band wireless router',
  },
  {
    id: 'tv_led_smart_55',
    name: '55" LED Smart TV',
    category: 'work_tech',
    loadType: 'electronic',
    defaultRunningWatts: 110,
    surgeMultiplier: 1.1,
    dutyCycle: 1.00,
    defaultHoursPerDay: 5,
    defaultDaytimeRatio: 0.30,
    description: 'LED backlit smart television and integrated audio soundbar',
  },

  // Lighting & Utility
  {
    id: 'led_bulb_10w',
    name: 'LED Bulb (9W–12W)',
    category: 'lighting_utility',
    loadType: 'electronic',
    defaultRunningWatts: 10,
    surgeMultiplier: 1.0,
    dutyCycle: 1.00,
    defaultHoursPerDay: 6,
    defaultDaytimeRatio: 0.10,
    description: 'High-efficiency solid-state LED luminaire with electronic driver',
  },
  {
    id: 'water_pump_jet_0_5hp',
    name: 'Water Pump (0.5 HP Jet Pump)',
    category: 'lighting_utility',
    loadType: 'inductive_motor',
    defaultRunningWatts: 375,
    surgeMultiplier: 3.5,
    dutyCycle: 1.00,
    defaultHoursPerDay: 1,
    defaultDaytimeRatio: 0.80,
    description: 'Shallow-well pressure boost jet pump with direct capacitor start',
  },
  {
    id: 'water_pump_submersible_1hp',
    name: 'Water Pump (1.0 HP Submersible)',
    category: 'lighting_utility',
    loadType: 'inductive_motor',
    defaultRunningWatts: 750,
    surgeMultiplier: 4.0,
    dutyCycle: 1.00,
    defaultHoursPerDay: 1,
    defaultDaytimeRatio: 0.80,
    description: 'Deep-well submersible induction motor with high locked-rotor startup spike',
  },
  {
    id: 'washing_machine_inverter',
    name: 'Washing Machine (Inverter)',
    category: 'lighting_utility',
    loadType: 'inverter_motor',
    defaultRunningWatts: 400,
    surgeMultiplier: 1.5,
    dutyCycle: 0.70,
    defaultHoursPerDay: 1.5,
    defaultDaytimeRatio: 0.90,
    description: 'Direct-drive inverter drum motor with modulated agitation spin cycles',
  },
];

// Standard commercial inverter tiers (kW)
export const STANDARD_INVERTER_TIERS = [1.0, 2.0, 3.0, 3.6, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0];

export interface StarterProfile {
  id: 'small_home_wfh' | 'standard_family_home' | 'offgrid_cabin_farm';
  name: string;
  tagline: string;
  recommendedGoal: PrimaryGoal;
  recommendedGrid: GridReliability;
  items: Omit<ApplianceItem, 'id'>[];
}

export const STARTER_PROFILES: Record<string, StarterProfile> = {
  small_home_wfh: {
    id: 'small_home_wfh',
    name: 'Small Home / WFH Backup',
    tagline: 'Wi-Fi, workstation, fans, LEDs, and inverter fridge for brownout resilience',
    recommendedGoal: 'bill_and_backup',
    recommendedGrid: 'occasional_outages',
    items: [
      {
        presetId: 'led_bulb_10w',
        name: 'LED Bulb (9W–12W)',
        category: 'lighting_utility',
        loadType: 'electronic',
        quantity: 4,
        runningWatts: 10,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 6,
        daytimeRatio: 0.10,
        isCriticalBackup: true,
      },
      {
        presetId: 'fan_dc_inverter',
        name: 'Stand Fan',
        category: 'cooling',
        loadType: 'electronic',
        quantity: 2,
        runningWatts: 25,
        surgeMultiplier: 1.1,
        dutyCycle: 1.00,
        hoursPerDay: 12,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'wifi_router_modem',
        name: 'Wi-Fi Router / Fiber Modem',
        category: 'work_tech',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 15,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'laptop_monitor_setup',
        name: 'Laptop + Monitor Setup',
        category: 'work_tech',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 90,
        surgeMultiplier: 1.1,
        dutyCycle: 1.00,
        hoursPerDay: 8,
        daytimeRatio: 0.80,
        isCriticalBackup: true,
      },
      {
        presetId: 'fridge_inverter_2door',
        name: 'Inverter Refrigerator (2-Door)',
        category: 'kitchen',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 120,
        surgeMultiplier: 1.5,
        dutyCycle: 0.45,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
    ],
  },
  standard_family_home: {
    id: 'standard_family_home',
    name: 'Standard Family Home (w/ 2 ACs)',
    tagline: 'Daytime bill reduction with 2 inverter ACs, family fridge, entertainment, and pump',
    recommendedGoal: 'bill_savings',
    recommendedGrid: 'stable',
    items: [
      {
        presetId: 'ac_split_1hp_inverter',
        name: '1.0 HP Inverter Split AC',
        category: 'cooling',
        loadType: 'inverter_motor',
        quantity: 2,
        runningWatts: 750,
        surgeMultiplier: 1.2,
        dutyCycle: 0.70,
        hoursPerDay: 8,
        daytimeRatio: 0.50,
        isCriticalBackup: false,
      },
      {
        presetId: 'fridge_inverter_2door',
        name: 'Inverter Refrigerator (2-Door)',
        category: 'kitchen',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 120,
        surgeMultiplier: 1.5,
        dutyCycle: 0.45,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'tv_led_smart_55',
        name: '55" LED Smart TV',
        category: 'work_tech',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 110,
        surgeMultiplier: 1.1,
        dutyCycle: 1.00,
        hoursPerDay: 5,
        daytimeRatio: 0.30,
        isCriticalBackup: false,
      },
      {
        presetId: 'rice_cooker_std',
        name: 'Rice Cooker (Standard)',
        category: 'kitchen',
        loadType: 'resistive',
        quantity: 1,
        runningWatts: 700,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 1,
        daytimeRatio: 0.70,
        isCriticalBackup: false,
      },
      {
        presetId: 'washing_machine_inverter',
        name: 'Washing Machine (Inverter)',
        category: 'lighting_utility',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 400,
        surgeMultiplier: 1.5,
        dutyCycle: 0.70,
        hoursPerDay: 1.5,
        daytimeRatio: 0.90,
        isCriticalBackup: false,
      },
      {
        presetId: 'fan_ceiling_stand_std',
        name: 'Ceiling Fan',
        category: 'cooling',
        loadType: 'inductive_motor',
        quantity: 3,
        runningWatts: 65,
        surgeMultiplier: 1.5,
        dutyCycle: 1.00,
        hoursPerDay: 12,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'led_bulb_10w',
        name: 'LED Bulb (9W–12W)',
        category: 'lighting_utility',
        loadType: 'electronic',
        quantity: 8,
        runningWatts: 10,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 6,
        daytimeRatio: 0.10,
        isCriticalBackup: true,
      },
      {
        presetId: 'wifi_router_modem',
        name: 'Wi-Fi Router / Fiber Modem',
        category: 'work_tech',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 15,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'water_pump_jet_0_5hp',
        name: 'Water Pump (0.5 HP Jet Pump)',
        category: 'lighting_utility',
        loadType: 'inductive_motor',
        quantity: 1,
        runningWatts: 375,
        surgeMultiplier: 3.5,
        dutyCycle: 1.00,
        hoursPerDay: 1,
        daytimeRatio: 0.80,
        isCriticalBackup: false,
      },
    ],
  },
  offgrid_cabin_farm: {
    id: 'offgrid_cabin_farm',
    name: 'Off-Grid Cabin / Farm',
    tagline: '100% autonomous power for water pump, refrigeration, induction cooking, and living',
    recommendedGoal: 'off_grid',
    recommendedGrid: 'no_grid',
    items: [
      {
        presetId: 'water_pump_submersible_1hp',
        name: 'Water Pump (1.0 HP Submersible)',
        category: 'lighting_utility',
        loadType: 'inductive_motor',
        quantity: 1,
        runningWatts: 750,
        surgeMultiplier: 4.0,
        dutyCycle: 1.00,
        hoursPerDay: 1.5,
        daytimeRatio: 0.80,
        isCriticalBackup: true,
      },
      {
        presetId: 'fridge_inverter_2door',
        name: 'Inverter Refrigerator (2-Door)',
        category: 'kitchen',
        loadType: 'inverter_motor',
        quantity: 1,
        runningWatts: 120,
        surgeMultiplier: 1.5,
        dutyCycle: 0.45,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'fan_dc_inverter',
        name: 'Stand Fan',
        category: 'cooling',
        loadType: 'electronic',
        quantity: 2,
        runningWatts: 25,
        surgeMultiplier: 1.1,
        dutyCycle: 1.00,
        hoursPerDay: 12,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'led_bulb_10w',
        name: 'LED Bulb (9W–12W)',
        category: 'lighting_utility',
        loadType: 'electronic',
        quantity: 6,
        runningWatts: 10,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 6,
        daytimeRatio: 0.10,
        isCriticalBackup: true,
      },
      {
        presetId: 'wifi_router_modem',
        name: 'Wi-Fi Router / Fiber Modem',
        category: 'work_tech',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 15,
        surgeMultiplier: 1.0,
        dutyCycle: 1.00,
        hoursPerDay: 24,
        daytimeRatio: 0.50,
        isCriticalBackup: true,
      },
      {
        presetId: 'induction_cooker_1burner',
        name: 'Induction Cooker (1 Burner)',
        category: 'kitchen',
        loadType: 'electronic',
        quantity: 1,
        runningWatts: 1800,
        surgeMultiplier: 1.1,
        dutyCycle: 0.80,
        hoursPerDay: 1,
        daytimeRatio: 0.60,
        isCriticalBackup: false,
      },
    ],
  },
};

export const DEFAULT_SIZING_CONFIG: SizingConfig = {
  primaryGoal: 'bill_savings',
  gridReliability: 'stable',
  peakSunHours: 4.5,
  panelWattage: 580,
  systemEfficiency: 0.80,
  batteryDod: 0.80,
  inverterEfficiency: 0.92,
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
  const psh = Math.max(2.5, Math.min(6.5, config.peakSunHours || 4.5));
  const sysEff = Math.max(0.65, Math.min(0.95, config.systemEfficiency || 0.80));
  const targetOffset = recommendedTopology === 'off_grid' ? 1.3 : 1.0;

  const rawPvKwp = (totalDailyKwh * targetOffset) / (psh * sysEff);
  const recommendedPvKwp = Number(Math.max(0.5, rawPvKwp).toFixed(2));

  const panelWattage = config.panelWattage || 580;
  const recommendedPanelCount = Math.max(1, Math.ceil((recommendedPvKwp * 1000) / panelWattage));
  const estimatedRoofAreaSqm = Number((recommendedPanelCount * 2.6).toFixed(1));

  // 5. LiFePO4 Battery Sizing
  const dod = Math.max(0.5, Math.min(0.95, config.batteryDod || 0.80));
  const invEff = Math.max(0.8, Math.min(0.98, config.inverterEfficiency || 0.92));
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
    // Standard 51.2V 100Ah = 5.12 kWh modules
    recommendedBatteryUnits5kWh = Math.max(1, Math.ceil(requiredGrossKwh / 5.12));
    recommendedBatteryKwh = Number((recommendedBatteryUnits5kWh * 5.12).toFixed(2));

    const effectiveUsableKwh = recommendedBatteryKwh * dod * invEff;
    const backupWatts = criticalRunningWatts > 0 ? criticalRunningWatts : continuousRunningWatts;
    estimatedBackupHours =
      backupWatts > 0 ? Number(((effectiveUsableKwh * 1000) / backupWatts).toFixed(1)) : 0;
  } else {
    // Off-Grid: Multiply by days of autonomy
    const autonomy = Math.max(1.0, config.autonomyDays || 1.5);
    const requiredGrossKwh = (totalDailyKwh * autonomy) / (dod * invEff);
    recommendedBatteryUnits5kWh = Math.max(1, Math.ceil(requiredGrossKwh / 5.12));
    recommendedBatteryKwh = Number((recommendedBatteryUnits5kWh * 5.12).toFixed(2));

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
