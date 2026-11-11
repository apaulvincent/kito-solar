export type ExportStrategy = 'zero_export' | 'net_metering' | 'hybrid_battery' | 'hybrid_plus_net_metering';

export interface UtilityPreset {
  id: string;
  name: string;
  shortName: string;
  region: string;
  retailRatePhp: number;
  exportCreditRatePhp: number;
  netMeteringSetupCostPhp: number;
  description?: string;
}

export interface FinancialConfig {
  selectedUtilityId: string;
  retailRatePhp: number;
  exportCreditRatePhp: number;
  netMeteringSetupCostPhp: number;
  annualTariffInflationPercent: number;
  annualPanelDegradationPercent: number;
  discountRatePercent: number;
  exportStrategy: ExportStrategy;
  useCustomCapex: boolean;
  customCapexPhp: number | null;
  includeInverterReplacement: boolean;
  inverterReplacementYear: number;
  includeBatteryReplacement: boolean;
  batteryReplacementYear: number;
  capExportCreditsAtBill: boolean;
}

export interface SystemSizingInput {
  pvKwp: number;
  inverterKw: number;
  batteryKwh: number;
  dailyTotalKwh: number;
  dailyDaytimeKwh: number;
  dailyNighttimeKwh: number;
  effectivePsh: number;
  systemEfficiency: number;
  batteryDod: number;
  batteryRoundTripEfficiency: number;
  sourceLabel?: string;
}

export interface CapexBreakdown {
  pvArrayPhp: number;
  inverterPhp: number;
  batteryPhp: number;
  bosAndMountingPhp: number;
  laborAndPermitsPhp: number;
  netMeteringSetupPhp: number;
  totalCapexPhp: number;
  inverterInitialCostPhp: number;
  batteryInitialCostPhp: number;
}

export interface YearlyCashflowPoint {
  year: number;
  inflatedRetailRatePhp: number;
  inflatedExportRatePhp: number;
  panelHealthFactor: number;
  annualGenerationKwh: number;
  annualDirectSelfUseKwh: number;
  annualBatteryStoredUseKwh: number;
  annualExportedKwh: number;
  annualClippedKwh: number;
  grossAnnualSavingsPhp: number;
  replacementCostPhp: number;
  netAnnualCashflowPhp: number;
  cumulativeCashflowPhp: number;
  discountedCumulativeNpvPhp: number;
}

export interface ScenarioSimulationResult {
  strategy: ExportStrategy;
  label: string;
  summaryNote: string;
  capex: CapexBreakdown;
  initialCapexPhp: number;
  year1MonthlyBillBeforePhp: number;
  year1MonthlyBillAfterPhp: number;
  year1MonthlySavingsPhp: number;
  year1AnnualSavingsPhp: number;
  paybackYears: number | null;
  paybackMonthsTotal: number | null;
  paybackFormatted: string;
  netProfit10YearsPhp: number;
  npv10YearsPhp: number;
  roiPercentage10Years: number;
  lcoePhpPerKwh: number;
  energySplitPercent: {
    directDaytime: number;
    batteryNighttime: number;
    gridExported: number;
    clippedWasted: number;
  };
  dailyKwhBreakdown: {
    generationKwh: number;
    directSelfUseKwh: number;
    batteryStoredKwh: number;
    gridExportedKwh: number;
    clippedWastedKwh: number;
  };
  cashflowSeries: YearlyCashflowPoint[];
}
