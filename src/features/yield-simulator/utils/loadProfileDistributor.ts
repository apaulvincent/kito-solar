import { ApplianceItem } from '@/lib/applianceSizingEngine';

export interface StepLoadBreakdown {
  stepIndex: number;
  hourDecimal: number;
  totalHomeLoadKw: number;
  criticalLoadKw: number;
  nonCriticalLoadKw: number;
  applianceWatts: Record<string, number>;
}

export interface LoadDistributorOptions {
  appliances: ApplianceItem[];
  disabledApplianceIds?: string[];
  forcedOnApplianceIds?: string[];
  shiftedToMiddayIds?: string[];
}

export function formatStepTimeLabel(stepIndex: number): string {
  const clamped = Math.max(0, Math.min(95, Math.floor(stepIndex)));
  const totalMinutes = clamped * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getApplianceWeightAtHour(
  item: ApplianceItem,
  hourDecimal: number,
  isShiftedToMidday: boolean
): number {
  const hours = Math.max(0.25, Math.min(24, item.hoursPerDay));
  const profile = item.scheduleProfile;

  // 1. Always-On 24h loads (Refrigerator, Wi-Fi Router)
  if (hours >= 20 || profile === 'always_on') {
    if (item.dutyCycle < 0.95) {
      const afternoonThermalBoost =
        hourDecimal >= 11 && hourDecimal <= 16.5 ? 1.15 : hourDecimal < 6 ? 0.88 : 1.0;
      const compressorRipple = 1 + 0.12 * Math.sin((hourDecimal * Math.PI) / 1.5);
      return Math.min(1.0, item.dutyCycle * afternoonThermalBoost * compressorRipple);
    }
    return item.dutyCycle;
  }

  // 2. Shifted to Midday Solar Window (12:30 - 16:30)
  if (isShiftedToMidday) {
    const startH = 12.5;
    const endH = Math.min(16.5, startH + hours);
    return hourDecimal >= startH && hourDecimal < endH ? item.dutyCycle : 0;
  }

  // 3. Morning / Evening short-burst kitchen & water pump loads
  const isKitchenOrPump =
    profile === 'kitchen_burst' || (!profile && item.category === 'kitchen');
  if (isKitchenOrPump && hours <= 4) {
    if (item.daytimeRatio >= 0.65) {
      const start = 9.5;
      const end = start + hours;
      return hourDecimal >= start && hourDecimal < end ? item.dutyCycle : 0;
    }
    const halfHours = hours / 2;
    const inMorning = hourDecimal >= 6.25 && hourDecimal < 6.25 + halfHours;
    const inEvening = hourDecimal >= 18.25 && hourDecimal < 18.25 + halfHours;
    return inMorning || inEvening ? item.dutyCycle : 0;
  }

  // 4. Daytime WFH / Cooling loads
  if (item.daytimeRatio >= 0.65) {
    const center = 12.75;
    const start = Math.max(7.0, center - hours / 2);
    const end = Math.min(18.5, start + hours);
    return hourDecimal >= start && hourDecimal < end ? item.dutyCycle : 0;
  }

  // 5. Nighttime / Evening Peak + Overnight Sleep loads
  if (item.daytimeRatio <= 0.35) {
    const isCooling =
      profile === 'overnight_cooling' || (!profile && item.category === 'cooling');
    if (isCooling && hours >= 6) {
      const startEvening = 20.5;
      const eveningHours = 24 - startEvening;
      const morningEnd = Math.max(0, hours - eveningHours);
      if (hourDecimal >= startEvening) {
        return hourDecimal < 22.5 ? Math.min(1.0, item.dutyCycle * 1.15) : item.dutyCycle * 0.85;
      }
      if (hourDecimal < morningEnd) {
        return item.dutyCycle * 0.82;
      }
      return 0;
    }

    const start = 18.0;
    const end = start + hours;
    if (end <= 24) {
      return hourDecimal >= start && hourDecimal < end ? item.dutyCycle : 0;
    }
    const wrapEnd = end - 24;
    return hourDecimal >= start || hourDecimal < wrapEnd ? item.dutyCycle : 0;
  }

  // 6. Balanced Day + Evening schedule (0.35 < daytimeRatio < 0.65)
  const dayDuration = hours * item.daytimeRatio;
  const nightDuration = hours * (1 - item.daytimeRatio);

  const dayStart = 10.0;
  const dayEnd = dayStart + dayDuration;
  const nightStart = 18.0;
  const nightEnd = nightStart + nightDuration;

  const inDayWindow = hourDecimal >= dayStart && hourDecimal < dayEnd;
  const inNightWindow =
    nightEnd <= 24
      ? hourDecimal >= nightStart && hourDecimal < nightEnd
      : hourDecimal >= nightStart || hourDecimal < nightEnd - 24;

  return inDayWindow || inNightWindow ? item.dutyCycle : 0;
}

export function distributeHouseholdLoadProfile({
  appliances,
  disabledApplianceIds = [],
  forcedOnApplianceIds = [],
  shiftedToMiddayIds = [],
}: LoadDistributorOptions): StepLoadBreakdown[] {
  const disabledSet = new Set(disabledApplianceIds);
  const forcedOnSet = new Set(forcedOnApplianceIds);
  const shiftedSet = new Set(shiftedToMiddayIds);

  const steps: StepLoadBreakdown[] = [];

  for (let stepIndex = 0; stepIndex < 96; stepIndex++) {
    const hourDecimal = stepIndex * 0.25;
    let totalWatts = 0;
    let criticalWatts = 0;
    let nonCriticalWatts = 0;
    const applianceWatts: Record<string, number> = {};

    for (const item of appliances) {
      if (disabledSet.has(item.id)) {
        applianceWatts[item.id] = 0;
        continue;
      }

      const nominalTotalWatts = item.quantity * item.runningWatts;
      const stepWatts = forcedOnSet.has(item.id)
        ? Math.round(nominalTotalWatts)
        : Math.round(
            nominalTotalWatts * getApplianceWeightAtHour(item, hourDecimal, shiftedSet.has(item.id))
          );

      applianceWatts[item.id] = stepWatts;
      totalWatts += stepWatts;
      if (item.isCriticalBackup) {
        criticalWatts += stepWatts;
      } else {
        nonCriticalWatts += stepWatts;
      }
    }

    steps.push({
      stepIndex,
      hourDecimal,
      totalHomeLoadKw: Number((totalWatts / 1000).toFixed(4)),
      criticalLoadKw: Number((criticalWatts / 1000).toFixed(4)),
      nonCriticalLoadKw: Number((nonCriticalWatts / 1000).toFixed(4)),
      applianceWatts,
    });
  }

  return steps;
}
