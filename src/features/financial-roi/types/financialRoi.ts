// src/features/financial-roi/types/financialRoi.ts
// Domain types for Financial ROI, ERC Net Metering & 25-Year Cashflow Simulation.

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
  retailRatePhp: number;                // default 11.85
  exportCreditRatePhp: number;          // default 6.40
  netMeteringSetupCostPhp: number;      // default 35000
  annualTariffInflationPercent: number; // default 4.5%
  annualPanelDegradationPercent: number;// default 0.45%
  discountRatePercent: number;          // default 5.0%
  exportStrategy: ExportStrategy;
  useCustomCapex: boolean;
  customCapexPhp: number | null;
  includeInverterReplacement: boolean;  // default true (Year 12)
  inverterReplacementYear: number;      // default 12
  includeBatteryReplacement: boolean;   // default true (Year 11)
  batteryReplacementYear: number;       // default 11
  capExportCreditsAtBill: boolean;      // default true (ERC net metering rule)
}

export interface SystemSizingInput {
  pvKwp: number;
  inverterKw: number;
  batteryKwh: number;
  dailyTotalKwh: number;
  dailyDaytimeKwh: number;
  dailyNighttimeKwh: number;
  effectivePsh: number;
  systemEfficiency: number;             // default 0.80
  batteryDod: number;                   // default 0.80
  batteryRoundTripEfficiency: number;   // default 0.90
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
  year: number;                         // 0 to 25
  inflatedRetailRatePhp: number;
  inflatedExportRatePhp: number;
  panelHealthFactor: number;            // 1.00 down to ~0.89
  annualGenerationKwh: number;
  annualDirectSelfUseKwh: number;
  annualBatteryStoredUseKwh: number;
  annualExportedKwh: number;
  annualClippedKwh: number;
  grossAnnualSavingsPhp: number;
  replacementCostPhp: number;           // 0 on normal years, >0 on Year 11/12
  netAnnualCashflowPhp: number;
  cumulativeCashflowPhp: number;
  discountedCumulativeNpvPhp: number;
}

export interface ScenarioSimulationResult {
  strategy: ExportStrategy;
  label: string;
  summaryNote: string;
  initialCapexPhp: number;
  year1MonthlyBillBeforePhp: number;
  year1MonthlyBillAfterPhp: number;
  year1MonthlySavingsPhp: number;
  year1AnnualSavingsPhp: number;
  paybackYears: number | null;          // e.g. 4.25 (null if > 25 years)
  paybackMonthsTotal: number | null;    // e.g. 51 months
  paybackFormatted: string;             // e.g. "4 yrs 3 mos" or "> 25 yrs"
  netProfit25YearsPhp: number;
  npv25YearsPhp: number;
  roiPercentage25Years: number;
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
  cashflowSeries: YearlyCashflowPoint[]; // 26 points (Year 0 to Year 25)
}
