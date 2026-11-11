import { CloudRain, ShieldAlert, Sun, ZapOff, type LucideIcon } from 'lucide-react';
import {
  BrownoutSchedule,
  EmsDispatchMode,
  SystemTopologyMode,
  WeatherScenario,
} from '../types/yieldSimulator';

export interface GuidedScenarioSpec {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentClass: string;
  weatherScenario: WeatherScenario;
  systemTopology: SystemTopologyMode;
  emsMode: EmsDispatchMode;
  isZeroExport: boolean;
  instantBlackoutActive: boolean;
  brownout: Partial<BrownoutSchedule>;
  stepIndex: number;
}

export const GUIDED_SCENARIOS: readonly GuidedScenarioSpec[] = [
  {
    id: 'sunny-peak',
    badge: '12:00 PM Noon',
    title: 'Sunny Peak Day',
    description: 'Watch solar run your home, charge the battery, and export surplus',
    icon: Sun,
    accentClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    weatherScenario: 'clear_sky',
    systemTopology: 'hybrid',
    emsMode: 'self_consumption',
    isZeroExport: false,
    instantBlackoutActive: false,
    brownout: { enabled: false },
    stepIndex: 48,
  },
  {
    id: 'zero-export-full',
    badge: '1:30 PM Afternoon',
    title: 'Battery Full + Zero-Export',
    description: 'See how the inverter throttles extra solar when grid export is blocked',
    icon: ShieldAlert,
    accentClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    weatherScenario: 'clear_sky',
    systemTopology: 'hybrid',
    emsMode: 'backup_ups_priority',
    isZeroExport: true,
    instantBlackoutActive: false,
    brownout: { enabled: false },
    stepIndex: 54,
  },
  {
    id: 'evening-brownout',
    badge: '7:30 PM Outage',
    title: 'Evening Grid Blackout',
    description: 'Test a 4-hour 6PM–10PM utility outage while dinner and AC are running',
    icon: ZapOff,
    accentClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    weatherScenario: 'clear_sky',
    systemTopology: 'hybrid',
    emsMode: 'self_consumption',
    isZeroExport: false,
    instantBlackoutActive: false,
    brownout: { enabled: true, startHour: 18, endHour: 22 },
    stepIndex: 78,
  },
  {
    id: 'monsoon-rain',
    badge: '2:00 PM Rainy',
    title: 'Heavy Monsoon Clouds',
    description: 'Inspect solar output and battery reserves during an overcast rainy day',
    icon: CloudRain,
    accentClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    weatherScenario: 'monsoon_overcast',
    systemTopology: 'hybrid',
    emsMode: 'self_consumption',
    isZeroExport: false,
    instantBlackoutActive: false,
    brownout: { enabled: false },
    stepIndex: 56,
  },
];
