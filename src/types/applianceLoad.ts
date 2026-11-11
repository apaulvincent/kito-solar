export type ApplianceCategory = 'cooling' | 'kitchen' | 'work_tech' | 'lighting_utility' | 'custom';

export type LoadType = 'resistive' | 'inductive_motor' | 'inverter_motor' | 'electronic';

export type ApplianceScheduleProfile =
  | 'always_on'
  | 'kitchen_burst'
  | 'overnight_cooling'
  | 'standard';

export interface ApplianceItem {
  id: string;
  presetId?: string;
  name: string;
  category: ApplianceCategory;
  loadType: LoadType;
  scheduleProfile?: ApplianceScheduleProfile;
  quantity: number;
  runningWatts: number;
  surgeMultiplier: number;
  dutyCycle: number;
  hoursPerDay: number;
  daytimeRatio: number;
  isCriticalBackup: boolean;
}

export interface PresetAppliance {
  id: string;
  name: string;
  category: ApplianceCategory;
  loadType: LoadType;
  scheduleProfile: ApplianceScheduleProfile;
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
