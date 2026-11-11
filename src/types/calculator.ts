import { SolarInverterRecord, SolarModuleRecord, BatteryRecord, AccessoryRecord } from './supabase';
import { Layout3DState } from './layout3d';

export type SystemType = 'hybrid' | 'ongrid';

export interface CalculationInput {
  inverter: SolarInverterRecord;
  module: SolarModuleRecord;
  battery: BatteryRecord | null;
  batteryCount: number;
  gridVoltageV: number; // default 230
  mainBreakerA: number | null; // optional main panel breaker
  panelCountOverride?: number | null;
  accessories?: AccessoryRecord[];
  customPrices?: Record<string, number | null>;
  layout3d?: Layout3DState | null;
}

export interface DcCalculationResult {
  computedCurrentA: number; // PV Isc * 1.25
  rawCurrentA: number; // PV Isc
  breakerRatingA: number;
  wireSpec: string;
  wireNote: string;
  isolatorRatingA: number;
  spdRating: string;
  spdRatingV: number;
  conduitSpec: string;
  groundConductorSpec: string;
  groundRodSpec: string;
  explanation: {
    breaker: string;
    wire: string;
    isolator: string;
    spd: string;
    conduit: string;
    grounding: string;
  };
}

export interface AcCalculationResult {
  computedCurrentA: number; // Max AC Current * 1.25
  rawCurrentA: number; // Max AC Current
  breakerRatingA: number;
  wireSpec: string;
  isolatorRatingA: number;
  spdRating: string;
  spdRatingV: number;
  atsConfigured: boolean;
  atsRatingA: number | null;
  atsNote: string;
  epsBreakerRatingA: number;
  explanation: {
    breaker: string;
    wire: string;
    isolator: string;
    spd: string;
    ats: string;
    eps: string;
  };
}

export interface BatteryCalculationResult {
  hasBattery: boolean;
  batteryType: string;
  totalCapacityAh: number;
  totalEnergyWh: number;
  bankVoltageV: number;
  dischargeCurrentA: number;
  recommendedBreakerA: number;
  wireSpec: string;
  explanation: {
    breaker: string;
    wire: string;
    sizing: string;
  };
}

export interface PvSizingResult {
  minPanels: number;
  recommendedPanels: number;
  maxPanels: number;
  activePanelCount: number;
  totalPvPowerW: number;
  dcAcRatio: number;
  totalVocV: number;
  totalVmpV: number;
  minMpptV: number;
  maxMpptV: number;
  explanation: {
    min: string;
    recommended: string;
    max: string;
  };
}

export interface StringSizingResult {
  trackerCount: number;
  recommendedStrings: number;
  stringConfigRaw: string;
  panelsPerString: number;
  voltagePerStringVmp: number;
  voltagePerStringVoc: number;
  maxPvVoltageV: number;
  withinMpptRange: boolean;
  explanation: string;
}

export interface MountingItemDimensions {
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  thicknessMm?: number;
  holeDiameterMm?: number;
  fastenerSpec?: string;
  torqueNm?: string;
}

export interface MountingItem {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  specification: string;
  explanation: string;
  calculationBasis: string;
  imagePath: string;
  dimensions?: MountingItemDimensions;
  material?: string;
  finish?: string;
  standards?: string[];
  unitPricePhp?: number | null;
  totalPricePhp?: number | null;
}

export interface MountingCalculationResult {
  items: MountingItem[];
  panelCount: number;
  totalRails: number;
  totalLFeet: number;
  totalMidClamps: number;
  totalSplices: number;
  totalMc4Pairs: number;
  totalEndClamps: number;
  totalMountingCostPhp?: number;
}

export interface ProjectCostItem {
  key: string;
  name: string;
  category: 'equipment' | 'mounting' | 'protection' | 'wiring' | 'conduit' | 'grounding' | 'transfer';
  quantity: number;
  unit: string;
  unitPricePhp?: number | null;
  totalPricePhp?: number | null;
  isTbd: boolean;
  isCustomPrice?: boolean;
}

export interface FinancialRoiSummary {
  estimatedMonthlySavingsPhp: number;
  annualSavingsPhp: number;
  paybackPeriodYears: number | null;
  canComputeRoi: boolean;
  roiUnavailableReason?: string;
  isBenchmarkEstimate?: boolean;
}

export interface Custom3DBomSummary {
  totalAddedComponents: number;
  totalWireCount: number;
  positiveWireMeters: number;
  negativeWireMeters: number;
  groundWireMeters?: number;
  addedSubtotalPhp: number;
}

export interface ProjectCostSummary {
  items: ProjectCostItem[];
  equipmentSubtotalPhp: number;
  mountingSubtotalPhp: number;
  switchgearSubtotalPhp: number;
  grandTotalPhp: number;
  tbdItemCount: number;
  isFullyEstimated: boolean;
  financialRoi?: FinancialRoiSummary;
  custom3dSummary?: Custom3DBomSummary;
}

export type WarningSeverity = 'info' | 'warning' | 'error';

export interface SystemWarning {
  id: string;
  severity: WarningSeverity;
  category: 'pv' | 'dc' | 'ac' | 'battery' | 'grid' | 'safety';
  title: string;
  message: string;
  recommendation?: string;
}

export interface SystemCalculationResult {
  systemType: SystemType;
  dc: DcCalculationResult;
  ac: AcCalculationResult;
  battery: BatteryCalculationResult;
  pvSizing: PvSizingResult;
  stringSizing: StringSizingResult;
  mounting: MountingCalculationResult;
  costSummary: ProjectCostSummary;
  warnings: SystemWarning[];
  summary: {
    inverterModel: string;
    inverterPowerKw: number;
    moduleModel: string;
    modulePowerW: number;
    totalPanels: number;
    totalArrayPowerKw: number;
    dcAcRatio: number;
    batteryBankSummary: string;
  };
}
