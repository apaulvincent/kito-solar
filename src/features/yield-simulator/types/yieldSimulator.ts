// src/features/yield-simulator/types/yieldSimulator.ts
import { ApplianceItem } from '@/lib/applianceSizingEngine';

export type WeatherScenario =
  | 'clear_sky'
  | 'partly_cloudy'
  | 'monsoon_overcast'
  | 'live_open_meteo';

export type EmsDispatchMode =
  | 'self_consumption'
  | 'backup_ups_priority'
  | 'peak_shaving';

export type SimulationSpeed = 1 | 5 | 15;

export type SystemTopologyMode = 'hybrid' | 'grid_tie' | 'off_grid';

export interface BrownoutSchedule {
  enabled: boolean;
  startHour: number; // e.g., 18.0 (6:00 PM)
  endHour: number; // e.g., 23.5 (11:30 PM)
  shedNonCriticalLoads: boolean; // Automatically turn off non-critical loads during outage
}

export interface TelemetryTimeStep {
  stepIndex: number; // 0 to 95 (15-min intervals)
  timeLabel: string; // "00:00", "00:15", ..., "23:45"
  hourDecimal: number; // 0.0 to 23.75
  irradianceWm2: number; // 0 to ~1080 W/m2
  ambientTempC: number;
  cellTempC: number;
  potentialPvKw: number; // Unclipped DC potential after thermal derating
  actualPvKw: number; // Harvested PV after inverter/curtailment limits
  clippedPvKw: number; // Total wasted/curtailed solar power
  inverterClippedKw: number; // Clipped due to DC-to-AC inverter rating ceiling
  zeroExportClippedKw: number; // Curtailed due to full battery + Zero-Export limit
  antiIslandingClippedKw: number; // Shut down due to Grid-Tie anti-islanding protection
  totalHomeLoadKw: number;
  criticalLoadKw: number;
  nonCriticalLoadKw: number;
  activeLoadKw: number; // Actual load served
  unmetLoadKw: number; // >0 only if Grid is offline AND Battery hits min Reserve SoC or trips
  batteryPowerKw: number; // Positive = Charging (+kW), Negative = Discharging (-kW)
  batterySocPercent: number; // 0% to 100%
  batteryVoltageV: number; // Dynamic LiFePO4 pack voltage (e.g., 49.2V to 54.4V)
  batteryCRate: number; // Charge/discharge C-rate
  gridImportKw: number;
  gridExportKw: number;
  isGridOnline: boolean;
  isOverloadFault: boolean;
  isAntiIslandingTripped: boolean;
  isLowBatteryShutdown: boolean;
}

export interface DiagnosticInsight {
  id: string;
  type: 'curtailment' | 'clipping' | 'brownout' | 'anti_islanding' | 'overload';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  detail: string;
  recommendation: string;
  actionLabel?: string;
  actionType?:
    | 'shift_loads_midday'
    | 'add_battery_module'
    | 'switch_to_hybrid'
    | 'shed_non_critical';
}

export interface DailySimulationSummary {
  totalPotentialPvKwh: number;
  totalHarvestedPvKwh: number;
  totalClippedPvKwh: number;
  inverterClippedKwh: number;
  zeroExportCurtailedKwh: number;
  curtailmentStartTime: string | null; // e.g., "12:45" when battery hits 100% under Zero-Export
  totalLoadConsumedKwh: number;
  totalUnmetLoadKwh: number;
  directSolarToLoadKwh: number;
  batteryChargedKwh: number;
  batteryDischargedKwh: number;
  gridImportedKwh: number;
  gridExportedKwh: number;
  selfSufficiencyPercent: number; // % of home load met by Solar + Battery
  solarSelfConsumptionPercent: number; // % of generated solar used locally (not exported/clipped)
  minBatterySocPercent: number;
  maxBatterySocPercent: number;
  brownoutSurvived: boolean;
  blackoutUnmetMinutes: number;
  batteryDepletedTimeLabel: string | null;
  overloadFaultDetected: boolean;
  antiIslandingDetected: boolean;
  diagnostics: DiagnosticInsight[];
  steps: TelemetryTimeStep[]; // Array of 96 points
}

export interface OpenMeteoHourlyPayload {
  time: string[];
  temperature_2m: number[];
  cloud_cover: number[];
  shortwave_radiation: number[];
  direct_normal_irradiance: number[];
  diffuse_radiation: number[];
}

export interface OpenMeteoForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: OpenMeteoHourlyPayload;
}

export interface YieldSimulationInput {
  pvArrayKwp: number;
  inverterKw: number;
  batteryCapacityKwh: number;
  initialBatterySocPercent: number;
  minReserveSocPercent: number;
  roundTripEfficiency: number; // e.g., 0.92
  maxBatteryCRate: number; // e.g., 0.5C continuous charge/discharge
  systemTopology: SystemTopologyMode;
  isZeroExport: boolean;
  weatherScenario: WeatherScenario;
  emsMode: EmsDispatchMode;
  peakSunHours: number; // Location daily PSH (e.g., 4.6)
  latitude: number;
  noctC?: number; // Default 45°C
  tempCoeffPercentPerC?: number; // Default -0.34%/°C (-0.0034)
  dcWiringEfficiency?: number; // Default 0.97
  tariffPhpPerKwh?: number; // Default 11.85 PHP/kWh
  brownout: BrownoutSchedule;
  instantBlackoutActive: boolean;
  currentStepIndex: number;
  appliances: ApplianceItem[];
  disabledApplianceIds: string[];
  forcedOnApplianceIds: string[];
  shiftedToMiddayIds: string[];
  liveWeatherHourly?: OpenMeteoHourlyPayload | null;
}
