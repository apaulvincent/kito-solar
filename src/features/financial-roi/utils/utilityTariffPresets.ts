// src/features/financial-roi/utils/utilityTariffPresets.ts
// Pre-configured Philippine utility rate presets, Net Metering export generation credits, and benchmark CAPEX figures.

import { FinancialConfig, UtilityPreset } from '../types/financialRoi';

export const UTILITY_PRESETS: UtilityPreset[] = [
  {
    id: 'meralco',
    name: 'Meralco (Residential D-100)',
    shortName: 'Meralco',
    region: 'Metro Manila, Cavite, Laguna, Batangas, Bulacan, Rizal',
    retailRatePhp: 11.85,
    exportCreditRatePhp: 6.40,
    netMeteringSetupCostPhp: 35000,
    description: 'Blended residential effective tariff ~₱11.85/kWh; ERC Net Metering export credited at Gen Charge ~₱6.40/kWh.',
  },
  {
    id: 'batelec_2',
    name: 'BATELEC II',
    shortName: 'BATELEC II',
    region: 'Batangas (Lipa, Malvar, Tanauan, Batangas City, etc.)',
    retailRatePhp: 11.20,
    exportCreditRatePhp: 6.10,
    netMeteringSetupCostPhp: 30000,
    description: 'Electric Cooperative serving eastern/central Batangas; Net Metering setup fee ~₱30,000.',
  },
  {
    id: 'batelec_1',
    name: 'BATELEC I',
    shortName: 'BATELEC I',
    region: 'Western Batangas (Nasugbu, Balayan, Calaca, Lemery)',
    retailRatePhp: 11.45,
    exportCreditRatePhp: 6.15,
    netMeteringSetupCostPhp: 30000,
    description: 'Serving western coastal Batangas townships; Gen charge export credit ~₱6.15/kWh.',
  },
  {
    id: 'veco',
    name: 'VECO (Visayan Electric)',
    shortName: 'VECO',
    region: 'Metro Cebu (Cebu City, Mandaue, Talisay, Consolacion)',
    retailRatePhp: 12.30,
    exportCreditRatePhp: 6.60,
    netMeteringSetupCostPhp: 35000,
    description: 'Second largest private distribution utility in the Philippines; retail rate ~₱12.30/kWh.',
  },
  {
    id: 'dlpc',
    name: 'DLPC (Davao Light & Power)',
    shortName: 'Davao Light',
    region: 'Davao City & Panabo City',
    retailRatePhp: 10.85,
    exportCreditRatePhp: 5.90,
    netMeteringSetupCostPhp: 30000,
    description: 'AboitizPower DU serving Davao metropolitan area; retail rate ~₱10.85/kWh.',
  },
  {
    id: 'cepalco',
    name: 'CEPALCO',
    shortName: 'CEPALCO',
    region: 'Cagayan de Oro & Misamis Oriental',
    retailRatePhp: 11.60,
    exportCreditRatePhp: 6.20,
    netMeteringSetupCostPhp: 32000,
    description: 'Cagayan Electric Power & Light Co; Net Metering export credit ~₱6.20/kWh.',
  },
  {
    id: 'provincial_coop',
    name: 'FLECO / PELCO / Provincial Coops',
    shortName: 'Provincial Coop',
    region: 'Regional Electric Cooperatives Average',
    retailRatePhp: 13.20,
    exportCreditRatePhp: 6.80,
    netMeteringSetupCostPhp: 32000,
    description: 'Provincial EC benchmark average reflecting higher distribution and fuel cost passes.',
  },
  {
    id: 'custom',
    name: 'Custom Utility Tariff',
    shortName: 'Custom',
    region: 'User Defined Tariff & Rates',
    retailRatePhp: 11.85,
    exportCreditRatePhp: 6.40,
    netMeteringSetupCostPhp: 35000,
    description: 'Directly configure custom retail electricity rate and net metering export credit.',
  },
];

export const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  selectedUtilityId: 'meralco',
  retailRatePhp: 11.85,
  exportCreditRatePhp: 6.40,
  netMeteringSetupCostPhp: 35000,
  annualTariffInflationPercent: 4.5,
  annualPanelDegradationPercent: 0.45,
  discountRatePercent: 5.0,
  exportStrategy: 'net_metering',
  useCustomCapex: false,
  customCapexPhp: null,
  includeInverterReplacement: true,
  inverterReplacementYear: 12,
  includeBatteryReplacement: true,
  batteryReplacementYear: 11,
  capExportCreditsAtBill: true,
};

// Turnkey CAPEX benchmarks in the Philippine solar installer market (2025/2026)
export const CAPEX_BENCHMARKS = {
  pvArrayPerKwpPhp: 24000,      // Tier-1 N-Type TOPCon Panels, Aluminum Rail Mounting, DC Isolator, SPD, BOS
  gridTieInverterPerKwPhp: 8500, // On-Grid String Inverter (e.g., Sungrow, Huawei, GoodWe, Solis)
  hybridInverterPerKwPhp: 14500, // Hybrid Low/High Voltage Inverter (e.g., Deye, Luxpower, Megarevo)
  batteryPerKwhPhp: 13500,      // 51.2V 100Ah LiFePO4 server-rack/wall-mount battery pack (~₱68k per 5.12kWh)
  laborAndPermitsRatio: 0.12,   // 12% of hardware subtotal for engineering, PE-stamped drawings, LGU permits
  inverterReplacementRatio: 0.65, // Year 12 replacement is 65% of initial inverter cost due to hardware deflation
  batteryReplacementRatio: 0.60,  // Year 11 replacement is 60% of initial LiFePO4 cost
  defaultPsh: 4.5,              // Conservative PH annual daily PSH
  defaultSystemEfficiency: 0.80,// Wire loss, soiling, thermal coefficient, mismatch
  batteryDod: 0.80,             // 80% Depth of Discharge for LiFePO4 warranty life
  batteryRoundTripEfficiency: 0.90, // 90% AC-to-battery-to-AC roundtrip efficiency
  netMeteringBillCapRatio: 0.95, // Under ERC rules, fixed distribution/metering fees cannot be offset by exported kWh
};
