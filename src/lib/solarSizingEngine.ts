// src/lib/solarSizingEngine.ts

export interface SizingInput {
  monthlyBillPhp?: number;
  monthlyKwh?: number;
  location?: string;
  systemType: 'grid-tie' | 'hybrid' | 'off-grid';
  daytimeLoadRatio?: number;
  includeBatteryBackup?: boolean;
}

export interface SizingOutput {
  estimatedMonthlyKwh: number;
  dailyKwh: number;
  tariffRatePhp: number;
  peakSunHours: number;
  recommendedArrayKwp: number;
  recommendedInverterKw: number;
  recommendedBatteryKwh: number;
  estimatedMonthlySavingsPhp: number;
}

export function calculatePvSystem(input: SizingInput): SizingOutput {
  const tariffRatePhp = 12.0; // Default PH rate (or lookup by input.location)
  const peakSunHours = 4.5;   // Default PH PSH (or lookup by input.location)
  const systemLosses = 0.20;  // 80% performance ratio

  const estimatedMonthlyKwh =
    input.monthlyKwh ?? (input.monthlyBillPhp ? input.monthlyBillPhp / tariffRatePhp : 0);

  const dailyKwh = estimatedMonthlyKwh / 30;

  // Target offset: 70% for grid-tie daytime, 90% for hybrid/off-grid
  const targetOffsetRatio = input.systemType === 'grid-tie' ? (input.daytimeLoadRatio ?? 0.6) : 0.9;
  const targetDailySolarKwh = dailyKwh * targetOffsetRatio;

  const recommendedArrayKwp = Number(
    (targetDailySolarKwh / (peakSunHours * (1 - systemLosses))).toFixed(2)
  );

  // DC/AC ratio ~1.15 - 1.2
  const rawInverterKw = recommendedArrayKwp / 1.15;
  const standardInverterSizes = [3, 5, 6, 8, 10, 12, 15, 20, 30, 50];
  const recommendedInverterKw =
    standardInverterSizes.find((size) => size >= rawInverterKw) ?? Math.ceil(rawInverterKw);

  // Battery sizing for night load / backup
  let recommendedBatteryKwh = 0;
  if (input.systemType !== 'grid-tie' && input.includeBatteryBackup !== false) {
    const nightLoadKwh = dailyKwh * 0.4; // 40% night/backup coverage
    const dod = 0.8;
    const rawBatteryKwh = nightLoadKwh / dod;
    // Snap to standard 5.12 kWh LiFePO4 modules
    recommendedBatteryKwh = Math.max(5.12, Math.ceil(rawBatteryKwh / 5.12) * 5.12);
  }

  const monthlySolarGenerationKwh = recommendedArrayKwp * peakSunHours * (1 - systemLosses) * 30;
  const estimatedMonthlySavingsPhp = Math.round(
    Math.min(estimatedMonthlyKwh, monthlySolarGenerationKwh) * tariffRatePhp
  );

  return {
    estimatedMonthlyKwh: Math.round(estimatedMonthlyKwh),
    dailyKwh: Number(dailyKwh.toFixed(1)),
    tariffRatePhp,
    peakSunHours,
    recommendedArrayKwp,
    recommendedInverterKw,
    recommendedBatteryKwh: Number(recommendedBatteryKwh.toFixed(2)),
    estimatedMonthlySavingsPhp,
  };
}
