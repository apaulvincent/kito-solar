// src/types/solar-ai.ts

export type SystemType = 'grid-tie' | 'hybrid' | 'off-grid';
export type BudgetTier = 'economy' | 'standard' | 'premium';

export interface UtilityTariffRecord {
  id: string;
  region_name: string;
  city_or_municipality: string;
  utility_provider: string;
  rate_php_per_kwh: number;
  net_metering_export_rate: number;
  peak_sun_hours: number;
  record_low_temp_c: number;
  ambient_high_temp_c: number;
}

export interface CatalogPanelRecord {
  id: string;
  brand: string;
  model: string;
  wattage_wp: number;
  voc_v: number;
  vmp_v: number;
  isc_a: number;
  imp_a: number;
  temp_coeff_voc_pct: number;
  efficiency_pct: number;
  length_m: number;
  width_m: number;
  price_php: number;
  tier: BudgetTier;
  in_stock: boolean;
}

export interface CatalogInverterRecord {
  id: string;
  brand: string;
  model: string;
  system_type: SystemType;
  rated_ac_kw: number;
  max_dc_input_kw: number;
  max_dc_voltage_v: number;
  mppt_min_v: number;
  mppt_max_v: number;
  startup_voltage_v: number;
  mppt_count: number;
  max_input_current_per_mppt_a: number;
  battery_voltage_nominal_v: number | null;
  phase: '1P' | '3P';
  price_php: number;
  tier: BudgetTier;
  in_stock: boolean;
}

export interface CatalogBatteryRecord {
  id: string;
  brand: string;
  model: string;
  capacity_kwh: number;
  nominal_voltage_v: number;
  capacity_ah: number;
  max_dod_pct: number;
  cycle_life: number;
  price_php: number;
  in_stock: boolean;
}

export interface SolarKnowledgeChunk {
  id: string;
  document_title: string;
  category: 'datasheet' | 'electrical_code' | 'net_metering' | 'sizing_guide' | 'faq';
  related_hardware_model?: string;
  content: string;
  metadata?: Record<string, unknown>;
  similarity?: number;
}

export interface StringConfiguration {
  mpptIndex: number;
  panelsInSeries: number;
  parallelStrings: number;
  stringVocColdV: number;
  stringVmpHotV: number;
  isWithinSafeLimits: boolean;
  validationMessage: string;
}

export interface ProjectSizingResult {
  projectId: string;
  inputSummary: {
    monthlyBillPhp: number;
    location: string;
    utilityProvider: string;
    tariffRatePhpPerKwh: number;
    peakSunHours: number;
    estimatedMonthlyKwh: number;
    estimatedDailyKwh: number;
    systemType: SystemType;
    daytimeLoadRatio: number;
  };
  engineeringSpecs: {
    targetArrayKwp: number;
    actualArrayKwp: number;
    dcAcRatio: number;
    estimatedDailyHarvestKwh: number;
    estimatedMonthlyHarvestKwh: number;
    billOffsetPercentage: number;
    requiredRoofAreaSqm: number;
    stringConfigurations: StringConfiguration[];
  };
  billOfMaterials: {
    panel: {
      id: string;
      brand: string;
      model: string;
      wattageWp: number;
      quantity: number;
      unitPricePhp: number;
      subtotalPhp: number;
    };
    inverter: {
      id: string;
      brand: string;
      model: string;
      ratedAcKw: number;
      systemType: SystemType;
      quantity: number;
      unitPricePhp: number;
      subtotalPhp: number;
    };
    battery: {
      id: string;
      brand: string;
      model: string;
      moduleCapacityKwh: number;
      quantity: number;
      totalStorageKwh: number;
      usableStorageKwh: number;
      unitPricePhp: number;
      subtotalPhp: number;
    } | null;
    bosAndInstallationPhp: number;
    totalSystemCostPhp: number;
  };
  financialRoi: {
    estimatedMonthlySavingsPhp: number;
    estimatedNewMonthlyBillPhp: number;
    annualSavingsPhp: number;
    paybackPeriodYears: number;
    twentyFiveYearNetSavingsPhp: number;
  };
}

export interface GenerateSolarSetupParams {
  projectId?: string;
  monthlyBillPhp: number;
  location?: string;
  systemType?: SystemType;
  daytimeLoadRatio?: number;
  targetOffsetRatio?: number;
  budgetTier?: BudgetTier;
  preferredInverterBrand?: string;
}

export interface ModifySolarSetupParams {
  projectId?: string;
  monthlyBillPhp: number;
  location?: string;
  systemType: SystemType;
  overridePanelCount?: number;
  overrideInverterKw?: number;
  overrideBatteryKwh?: number;
  budgetTier?: BudgetTier;
  preferredInverterBrand?: string;
}
