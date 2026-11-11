export type SystemType = 'grid-tie' | 'hybrid' | 'off-grid';

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
    fiveYearNetSavingsPhp: number;
    twentyFiveYearNetSavingsPhp?: number;
  };
}

export type CopilotToolName =
  | 'generateSolarSetup'
  | 'generateSolarSetupFromBill'
  | 'modifyExistingProjectSetup'
  | 'searchHardwareKnowledgeBase'
  | 'searchSolarKnowledgeBase';

export interface ToolInvocationRecord {
  toolName: CopilotToolName;
  state: 'result';
  result?: ProjectSizingResult | unknown;
}
