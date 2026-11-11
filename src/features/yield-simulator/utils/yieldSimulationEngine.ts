// src/features/yield-simulator/utils/yieldSimulationEngine.ts
import {
  DailySimulationSummary,
  DiagnosticInsight,
  TelemetryTimeStep,
  WeatherScenario,
  YieldSimulationInput,
} from '../types/yieldSimulator';
import {
  distributeHouseholdLoadProfile,
  formatStepTimeLabel,
} from './loadProfileDistributor';

const STEP_HOURS = 0.25; // 15-minute resolution (96 steps/day)

/**
 * Checks whether a given hourDecimal (0..23.75) falls within a scheduled window [startHour, endHour).
 * Supports overnight wrap-around (e.g., 18.0 to 02.0).
 */
export function isHourInWindow(
  hourDecimal: number,
  startHour: number,
  endHour: number
): boolean {
  if (Math.abs(startHour - endHour) < 0.001) return false;
  if (startHour < endHour) {
    return hourDecimal >= startHour && hourDecimal < endHour;
  }
  // Wraps past midnight
  return hourDecimal >= startHour || hourDecimal < endHour;
}

/**
 * Deterministic cloud attenuation factor f_cloud(t) for synthetic weather scenarios.
 */
export function getCloudAttenuationFactor(
  hourDecimal: number,
  scenario: WeatherScenario
): number {
  if (scenario === 'clear_sky') {
    return 1.0;
  }

  if (scenario === 'monsoon_overcast') {
    // Heavy overcast diffuse light between 0.18 and 0.34
    const wave =
      0.26 +
      0.05 * Math.sin(hourDecimal * 0.85) +
      0.03 * Math.cos(hourDecimal * 2.1);
    return Math.max(0.18, Math.min(0.35, wave));
  }

  if (scenario === 'partly_cloudy') {
    // Passing cumulus clouds between 10:00 and 16:00 with brief cloud-edge enhancement (1.08)
    if (hourDecimal < 9.25 || hourDecimal > 16.5) {
      return 0.96;
    }
    const fastWave =
      Math.sin(hourDecimal * 3.6) * 0.32 +
      Math.cos(hourDecimal * 7.2) * 0.18;
    if (fastWave > 0.22) {
      // Cloud-edge scatter enhancement (+8%)
      return 1.08;
    }
    if (fastWave < -0.1) {
      // Cumulus core shadow (38% to 58%)
      return Math.max(0.38, Math.min(0.6, 0.52 + fastWave * 0.25));
    }
    return 0.88;
  }

  return 1.0;
}

/**
 * Computes synthetic ambient temperature (°C) across 24 hours based on weather scenario.
 */
function getSyntheticAmbientTempC(
  hourDecimal: number,
  scenario: WeatherScenario
): number {
  const minTemp =
    scenario === 'monsoon_overcast' ? 24.0 : scenario === 'partly_cloudy' ? 25.0 : 25.5;
  const maxTemp =
    scenario === 'monsoon_overcast' ? 27.8 : scenario === 'partly_cloudy' ? 31.8 : 34.2;

  // Minimum around 05:00, peak around 14:00
  const phase = ((hourDecimal - 5.0) / 24.0) * 2 * Math.PI;
  const normalized = 0.5 * (1 - Math.cos(phase));
  return Number((minTemp + (maxTemp - minTemp) * normalized).toFixed(1));
}

/**
 * Interpolates a 24-element hourly array from Open-Meteo at a fractional hour (0..23.75).
 */
function interpolateHourlySeries(
  series: number[] | undefined,
  hourDecimal: number,
  fallback: number
): number {
  if (!series || series.length === 0) return fallback;
  const idx0 = Math.max(0, Math.min(series.length - 1, Math.floor(hourDecimal)));
  const idx1 = Math.min(series.length - 1, idx0 + 1);
  const frac = hourDecimal - Math.floor(hourDecimal);
  const v0 = Number.isFinite(series[idx0]) ? series[idx0] : fallback;
  const v1 = Number.isFinite(series[idx1]) ? series[idx1] : v0;
  return v0 + (v1 - v0) * frac;
}

/**
 * Estimates 16S LiFePO4 battery pack terminal voltage (V) from SoC (%) and charge/discharge C-rate.
 */
function estimateLiFePO4Voltage(socPercent: number, cRateSigned: number): number {
  const soc = Math.max(0, Math.min(100, socPercent)) / 100;
  // Open-circuit plateau around 51.2V - 53.2V (3.20V to 3.33V/cell)
  let ocv = 50.4 + 2.8 * soc;
  if (soc > 0.92) {
    ocv += (soc - 0.92) * 10.0; // Absorption rise toward 54.4V
  } else if (soc < 0.15) {
    ocv -= (0.15 - soc) * 12.0; // Knee drop toward 48.0V
  }
  const internalResistanceShift = cRateSigned * 1.4;
  return Number(Math.max(47.5, Math.min(55.2, ocv + internalResistanceShift)).toFixed(1));
}

/**
 * Runs the 96-step (15-minute resolution) Solar Yield & EMS Digital Twin Simulation.
 */
export function runYieldSimulation(
  input: YieldSimulationInput
): DailySimulationSummary {
  const pvArrayKwp = Math.max(0, input.pvArrayKwp);
  const inverterKw = Math.max(0.5, input.inverterKw);
  const hasBattery =
    input.systemTopology !== 'grid_tie' && input.batteryCapacityKwh > 0.1;
  const batteryCapacityKwh = hasBattery ? Math.max(0.5, input.batteryCapacityKwh) : 0;

  const minReserveSocPercent = hasBattery
    ? Math.max(5, Math.min(90, input.minReserveSocPercent))
    : 0;
  const roundTripEfficiency = Math.max(0.7, Math.min(0.99, input.roundTripEfficiency || 0.92));
  const oneWayEff = Math.sqrt(roundTripEfficiency);
  const maxBatteryCRate = Math.max(0.2, Math.min(1.5, input.maxBatteryCRate || 0.5));
  const maxBatteryPowerKw = batteryCapacityKwh * maxBatteryCRate;

  const noctC = input.noctC ?? 45;
  const gamma = input.tempCoeffPercentPerC ?? -0.0034; // -0.34%/°C
  const dcWiringEff = input.dcWiringEfficiency ?? 0.97;
  const tariffPhp = input.tariffPhpPerKwh ?? 11.85;

  // Sunrise and sunset (e.g., ~05:45 to ~17:55 for tropical latitudes)
  const latFactor = Math.max(-0.5, Math.min(0.5, (input.latitude - 14.5) * 0.015));
  const sunriseHour = 5.75 - latFactor;
  const sunsetHour = 17.92 + latFactor;
  const dayLengthHours = sunsetHour - sunriseHour;
  const alpha = 1.35;

  // Pre-calibrate G_peak so clear-sky integral over 96 steps equals peakSunHours * 1000 Wh/m2
  let unscaledIntegralHours = 0;
  const rawClearShape: number[] = new Array(96).fill(0);
  for (let i = 0; i < 96; i++) {
    const h = i * STEP_HOURS;
    if (h > sunriseHour && h < sunsetHour) {
      const s = Math.sin((Math.PI * (h - sunriseHour)) / dayLengthHours);
      if (s > 0) {
        const val = Math.pow(s, alpha);
        rawClearShape[i] = val;
        unscaledIntegralHours += val * STEP_HOURS;
      }
    }
  }

  const targetPsh = Math.max(1.5, Math.min(7.5, input.peakSunHours || 4.6));
  // Clear-sky envelope peaks ~1,000-1,040 W/m2 (since site PSH is an all-weather annual mean)
  const clearSkyPsh = targetPsh * 1.52;
  const gPeakClear =
    unscaledIntegralHours > 0
      ? Math.max(950, (clearSkyPsh * 1000) / unscaledIntegralHours)
      : 1000;

  // Distribute household appliances across the 96 15-minute intervals
  const loadBreakdown = distributeHouseholdLoadProfile({
    appliances: input.appliances,
    disabledApplianceIds: input.disabledApplianceIds,
    forcedOnApplianceIds: input.forcedOnApplianceIds,
    shiftedToMiddayIds: input.shiftedToMiddayIds,
  });

  // Initial battery State of Charge (%)
  let currentSocPercent = hasBattery
    ? Math.max(
        minReserveSocPercent,
        Math.min(
          100,
          input.emsMode === 'backup_ups_priority'
            ? Math.max(92, input.initialBatterySocPercent)
            : input.initialBatterySocPercent
        )
      )
    : 0;

  const steps: TelemetryTimeStep[] = [];

  let totalPotentialPvKwh = 0;
  let totalHarvestedPvKwh = 0;
  let totalClippedPvKwh = 0;
  let inverterClippedKwh = 0;
  let zeroExportCurtailedKwh = 0;
  let curtailmentStartTime: string | null = null;
  let totalLoadConsumedKwh = 0;
  let totalUnmetLoadKwh = 0;
  let directSolarToLoadKwh = 0;
  let batteryChargedKwh = 0;
  let batteryDischargedKwh = 0;
  let gridImportedKwh = 0;
  let gridExportedKwh = 0;
  let minBatterySocPercent = hasBattery ? currentSocPercent : 0;
  let maxBatterySocPercent = hasBattery ? currentSocPercent : 0;
  let blackoutUnmetMinutes = 0;
  let batteryDepletedTimeLabel: string | null = null;
  let overloadFaultDetected = false;
  let antiIslandingDetected = false;

  for (let i = 0; i < 96; i++) {
    const hourDecimal = i * STEP_HOURS;
    const timeLabel = formatStepTimeLabel(i);
    const loadStep = loadBreakdown[i];

    // 1. Solar irradiance G(t) & Ambient Temperature T_amb(t)
    let irradianceWm2 = 0;
    let ambientTempC = 28;

    const useLiveWeather =
      input.weatherScenario === 'live_open_meteo' &&
      input.liveWeatherHourly &&
      input.liveWeatherHourly.shortwave_radiation?.length > 0;

    if (useLiveWeather && input.liveWeatherHourly) {
      irradianceWm2 = Math.max(
        0,
        interpolateHourlySeries(
          input.liveWeatherHourly.shortwave_radiation,
          hourDecimal,
          0
        )
      );
      ambientTempC = Number(
        interpolateHourlySeries(
          input.liveWeatherHourly.temperature_2m,
          hourDecimal,
          28
        ).toFixed(1)
      );
    } else {
      const clearWm2 = gPeakClear * rawClearShape[i];
      const cloudFactor = getCloudAttenuationFactor(
        hourDecimal,
        input.weatherScenario
      );
      irradianceWm2 = Math.max(0, Math.round(clearWm2 * cloudFactor));
      ambientTempC = getSyntheticAmbientTempC(hourDecimal, input.weatherScenario);
    }

    // 2. Cell temperature & thermally derated DC potential power
    const cellTempC = Number(
      (ambientTempC + ((noctC - 20) / 800) * irradianceWm2).toFixed(1)
    );
    const thermalFactor = Math.max(0.7, 1 + gamma * (cellTempC - 25));
    const potentialPvKw = Math.max(
      0,
      pvArrayKwp * (irradianceWm2 / 1000) * thermalFactor * dcWiringEff
    );

    // 3. Determine Grid Status at step i
    const inScheduledBrownout =
      input.brownout.enabled &&
      isHourInWindow(hourDecimal, input.brownout.startHour, input.brownout.endHour);

    // If instant blackout toggle is active, simulate outage at the active step and a 4-hour test window from currentStepIndex
    const inInstantBlackout =
      input.instantBlackoutActive &&
      i >= input.currentStepIndex &&
      i < Math.min(96, input.currentStepIndex + 16);

    const isGridOnline =
      input.systemTopology === 'off_grid'
        ? false
        : !inScheduledBrownout && !inInstantBlackout;

    // 4. Determine Target Load (accounting for automatic non-critical load shedding during outage)
    const totalHomeLoadKw = loadStep.totalHomeLoadKw;
    const criticalLoadKw = loadStep.criticalLoadKw;
    const nonCriticalLoadKw = loadStep.nonCriticalLoadKw;

    const shouldShedNonCritical =
      !isGridOnline && input.brownout.shedNonCriticalLoads;
    const targetLoadKw = shouldShedNonCritical ? criticalLoadKw : totalHomeLoadKw;

    // 5. Power Dispatch Solver
    let actualPvKw = 0;
    let inverterClippedKw = 0;
    let zeroExportClippedKw = 0;
    let antiIslandingClippedKw = 0;
    let activeLoadKw = 0;
    let unmetLoadKw = 0;
    let batteryPowerKw = 0; // + charge, - discharge
    let gridImportKw = 0;
    let gridExportKw = 0;
    let isOverloadFault = false;
    let isAntiIslandingTripped = false;
    let isLowBatteryShutdown = false;

    // Edge Case 1: Grid-Tie Anti-Islanding Shutdown during utility outage
    if (input.systemTopology === 'grid_tie' && !isGridOnline) {
      isAntiIslandingTripped = true;
      antiIslandingDetected = true;
      actualPvKw = 0;
      antiIslandingClippedKw = potentialPvKw;
      activeLoadKw = 0;
      unmetLoadKw = totalHomeLoadKw;
      if (unmetLoadKw > 0.01) {
        blackoutUnmetMinutes += 15;
      }
    } else {
      // Inverter AC/MPPT Ceiling Clipping
      const pvAfterInverterCeiling = Math.min(potentialPvKw, inverterKw);
      inverterClippedKw = Math.max(0, potentialPvKw - pvAfterInverterCeiling);

      // Check off-grid inverter overload fault (when off-grid and target load exceeds inverter rating)
      if (!isGridOnline && targetLoadKw > inverterKw * 1.02) {
        isOverloadFault = true;
        overloadFaultDetected = true;
      }

      // Max possible battery charge/discharge power at this 15-min step based on SoC bounds and C-rate
      const headRoomKwh = hasBattery
        ? Math.max(0, ((100 - currentSocPercent) / 100) * batteryCapacityKwh)
        : 0;
      const maxChargeKwBySoc = hasBattery
        ? headRoomKwh / (STEP_HOURS * oneWayEff)
        : 0;
      const maxChargeKw = hasBattery
        ? Math.min(maxBatteryPowerKw, maxChargeKwBySoc)
        : 0;

      const availableDischargeKwh = hasBattery
        ? Math.max(
            0,
            ((currentSocPercent - minReserveSocPercent) / 100) * batteryCapacityKwh
          )
        : 0;
      const maxDischargeKwBySoc = hasBattery
        ? (availableDischargeKwh * oneWayEff) / STEP_HOURS
        : 0;
      const maxDischargeKw = hasBattery
        ? Math.min(maxBatteryPowerKw, maxDischargeKwBySoc)
        : 0;

      // Determine whether EMS allows battery discharge at this step
      const isPeakTariffHour = hourDecimal >= 10.0 && hourDecimal < 21.0;
      let allowBatteryDischarge = false;
      if (hasBattery) {
        if (!isGridOnline) {
          allowBatteryDischarge = true; // Always back up critical loads during outage
        } else if (input.emsMode === 'self_consumption') {
          allowBatteryDischarge = true;
        } else if (input.emsMode === 'backup_ups_priority') {
          allowBatteryDischarge = false; // Hold 100% reserve while grid is online
        } else if (input.emsMode === 'peak_shaving') {
          allowBatteryDischarge = isPeakTariffHour; // Discharge only during peak tariff window
        }
      }

      // Effective load demand (capped by inverter capacity when off-grid)
      const demandKw = !isGridOnline
        ? Math.min(targetLoadKw, inverterKw)
        : targetLoadKw;

      if (pvAfterInverterCeiling >= demandKw) {
        // Solar covers 100% of demandKw
        activeLoadKw = demandKw;
        const directSolar = demandKw;
        directSolarToLoadKwh += directSolar * STEP_HOURS;

        const excessSolarKw = pvAfterInverterCeiling - demandKw;
        const battChargeFromSolarKw = Math.min(excessSolarKw, maxChargeKw);
        const remainingAfterBattKw = excessSolarKw - battChargeFromSolarKw;

        // If in Backup/UPS mode and Grid is online and SoC < 98%, top up battery from grid if solar wasn't enough
        let gridChargeKw = 0;
        if (
          hasBattery &&
          isGridOnline &&
          input.emsMode === 'backup_ups_priority' &&
          currentSocPercent < 98 &&
          battChargeFromSolarKw < maxChargeKw
        ) {
          gridChargeKw = Math.min(
            maxChargeKw - battChargeFromSolarKw,
            inverterKw * 0.25
          );
        }

        batteryPowerKw = battChargeFromSolarKw + gridChargeKw;
        gridImportKw = gridChargeKw;

        if (isGridOnline && !input.isZeroExport && gridChargeKw === 0) {
          gridExportKw = remainingAfterBattKw;
          zeroExportClippedKw = 0;
        } else {
          gridExportKw = 0;
          zeroExportClippedKw = remainingAfterBattKw;
          if (
            zeroExportClippedKw > 0.05 &&
            curtailmentStartTime === null &&
            currentSocPercent >= 99.0
          ) {
            curtailmentStartTime = timeLabel;
          }
        }

        actualPvKw = activeLoadKw + battChargeFromSolarKw + gridExportKw;
        unmetLoadKw = Math.max(0, targetLoadKw - activeLoadKw);
      } else {
        // Solar is less than demandKw
        actualPvKw = pvAfterInverterCeiling;
        directSolarToLoadKwh += actualPvKw * STEP_HOURS;

        const deficitKw = demandKw - actualPvKw;
        const battDischargeKw = allowBatteryDischarge
          ? Math.min(deficitKw, maxDischargeKw)
          : 0;

        const remainingDeficitKw = deficitKw - battDischargeKw;

        if (isGridOnline) {
          activeLoadKw = demandKw;
          // In Backup/UPS mode while grid is online, also trickle-charge battery if below 98% SoC
          let gridChargeKw = 0;
          if (
            hasBattery &&
            input.emsMode === 'backup_ups_priority' &&
            currentSocPercent < 98 &&
            battDischargeKw === 0
          ) {
            gridChargeKw = Math.min(maxChargeKw, inverterKw * 0.25);
          }
          batteryPowerKw = gridChargeKw > 0 ? gridChargeKw : -battDischargeKw;
          gridImportKw = remainingDeficitKw + gridChargeKw;
          gridExportKw = 0;
          unmetLoadKw = 0;
        } else {
          // Off-grid / Brownout: only Solar + Battery available
          activeLoadKw = actualPvKw + battDischargeKw;
          batteryPowerKw = -battDischargeKw;
          gridImportKw = 0;
          gridExportKw = 0;
          unmetLoadKw = Math.max(0, targetLoadKw - activeLoadKw);

          if (unmetLoadKw > 0.01) {
            blackoutUnmetMinutes += 15;
            if (hasBattery && currentSocPercent <= minReserveSocPercent + 0.5) {
              isLowBatteryShutdown = true;
              if (batteryDepletedTimeLabel === null) {
                batteryDepletedTimeLabel = timeLabel;
              }
            }
          }
        }
      }

      // Advance battery State of Charge (SoC %) for next step
      if (hasBattery && batteryCapacityKwh > 0) {
        if (batteryPowerKw > 0) {
          const storedKwh = batteryPowerKw * STEP_HOURS * oneWayEff;
          currentSocPercent = Math.min(
            100,
            currentSocPercent + (storedKwh / batteryCapacityKwh) * 100
          );
          batteryChargedKwh += batteryPowerKw * STEP_HOURS;
        } else if (batteryPowerKw < 0) {
          const dischargedBusKwh = Math.abs(batteryPowerKw) * STEP_HOURS;
          const cellDrawnKwh = dischargedBusKwh / oneWayEff;
          currentSocPercent = Math.max(
            0,
            currentSocPercent - (cellDrawnKwh / batteryCapacityKwh) * 100
          );
          batteryDischargedKwh += dischargedBusKwh;
        }
        minBatterySocPercent = Math.min(minBatterySocPercent, currentSocPercent);
        maxBatterySocPercent = Math.max(maxBatterySocPercent, currentSocPercent);
      }
    }

    const clippedPvKw = Math.max(
      0,
      potentialPvKw - actualPvKw
    );

    const cRateSigned =
      hasBattery && batteryCapacityKwh > 0
        ? batteryPowerKw / batteryCapacityKwh
        : 0;
    const batteryVoltageV = hasBattery
      ? estimateLiFePO4Voltage(currentSocPercent, cRateSigned)
      : 0;

    // Accumulate daily totals (kWh)
    totalPotentialPvKwh += potentialPvKw * STEP_HOURS;
    totalHarvestedPvKwh += actualPvKw * STEP_HOURS;
    totalClippedPvKwh += clippedPvKw * STEP_HOURS;
    inverterClippedKwh += inverterClippedKw * STEP_HOURS;
    zeroExportCurtailedKwh += zeroExportClippedKw * STEP_HOURS;
    totalLoadConsumedKwh += activeLoadKw * STEP_HOURS;
    totalUnmetLoadKwh += unmetLoadKw * STEP_HOURS;
    gridImportedKwh += gridImportKw * STEP_HOURS;
    gridExportedKwh += gridExportKw * STEP_HOURS;

    steps.push({
      stepIndex: i,
      timeLabel,
      hourDecimal,
      irradianceWm2: Number(irradianceWm2.toFixed(1)),
      ambientTempC,
      cellTempC,
      potentialPvKw: Number(potentialPvKw.toFixed(4)),
      actualPvKw: Number(actualPvKw.toFixed(4)),
      clippedPvKw: Number(clippedPvKw.toFixed(4)),
      inverterClippedKw: Number(inverterClippedKw.toFixed(4)),
      zeroExportClippedKw: Number(zeroExportClippedKw.toFixed(4)),
      antiIslandingClippedKw: Number(antiIslandingClippedKw.toFixed(4)),
      totalHomeLoadKw: Number(totalHomeLoadKw.toFixed(4)),
      criticalLoadKw: Number(criticalLoadKw.toFixed(4)),
      nonCriticalLoadKw: Number(nonCriticalLoadKw.toFixed(4)),
      activeLoadKw: Number(activeLoadKw.toFixed(4)),
      unmetLoadKw: Number(unmetLoadKw.toFixed(4)),
      batteryPowerKw: Number(batteryPowerKw.toFixed(4)),
      batterySocPercent: Number(currentSocPercent.toFixed(2)),
      batteryVoltageV,
      batteryCRate: Number(Math.abs(cRateSigned).toFixed(2)),
      gridImportKw: Number(gridImportKw.toFixed(4)),
      gridExportKw: Number(gridExportKw.toFixed(4)),
      isGridOnline,
      isOverloadFault,
      isAntiIslandingTripped,
      isLowBatteryShutdown,
      applianceWatts: loadStep.applianceWatts,
    });
  }

  const solarAndBattServedKwh = Math.max(
    0,
    totalLoadConsumedKwh - gridImportedKwh
  );
  const selfSufficiencyPercent =
    totalLoadConsumedKwh > 0.01
      ? Math.min(
          100,
          Math.max(0, (solarAndBattServedKwh / totalLoadConsumedKwh) * 100)
        )
      : 100;

  const locallyUsedSolarKwh = Math.max(0, totalHarvestedPvKwh - gridExportedKwh);
  const solarSelfConsumptionPercent =
    totalPotentialPvKwh > 0.01
      ? Math.min(
          100,
          Math.max(0, (locallyUsedSolarKwh / totalPotentialPvKwh) * 100)
        )
      : 0;

  const brownoutSurvived = blackoutUnmetMinutes === 0;

  // Build Engineering Diagnostic Insights (strictly free of em dashes or decorative emojis)
  const diagnostics: DiagnosticInsight[] = [];

  if (antiIslandingDetected) {
    diagnostics.push({
      id: 'diag-anti-islanding',
      type: 'anti_islanding',
      severity: 'critical',
      title: 'Anti-Islanding Shutdown Active (IEEE 1547 Protection)',
      detail:
        'Standard Grid-Tie inverters must de-energize immediately during a utility blackout to prevent back-feeding utility lines.',
      recommendation:
        'Switch topology to a Hybrid Inverter + LiFePO4 Battery bank to form an isolated microgrid and keep solar harvesting during brownouts.',
      actionLabel: 'Switch to Hybrid + Battery',
      actionType: 'switch_to_hybrid',
    });
  }

  if (zeroExportCurtailedKwh >= 0.4) {
    const lostPhp = (zeroExportCurtailedKwh * tariffPhp).toFixed(0);
    const startStr = curtailmentStartTime || '12:45';
    diagnostics.push({
      id: 'diag-zero-export-curtailment',
      type: 'curtailment',
      severity: 'warning',
      title: 'Afternoon Zero-Export Solar Curtailment',
      detail: `Battery reaches 100% SoC by ${startStr}, forcing the MPPT controller to throttle ${zeroExportCurtailedKwh.toFixed(
        2
      )} kWh of afternoon solar (worth PHP ${lostPhp}/day at current tariff).`,
      recommendation:
        'Schedule daytime loads (water pump, laundry, cooling) between 12:30 PM and 3:30 PM or add a 5.12 kWh LiFePO4 module.',
      actionLabel: 'Shift Flexible Loads to 12:30 PM',
      actionType: 'shift_loads_midday',
    });
  }

  if (inverterClippedKwh >= 0.15) {
    const dcAcRatio = (pvArrayKwp / inverterKw).toFixed(2);
    diagnostics.push({
      id: 'diag-inverter-clipping',
      type: 'clipping',
      severity: 'info',
      title: `Midday Inverter AC Ceiling Clipping (${dcAcRatio} DC:AC Ratio)`,
      detail: `Your ${pvArrayKwp.toFixed(
        2
      )} kWp array saturates the ${inverterKw.toFixed(
        1
      )} kW inverter ceiling at midday peak, clipping ${inverterClippedKwh.toFixed(
        2
      )} kWh.`,
      recommendation:
        'A 1.20 to 1.40 DC:AC ratio is normal engineering practice and boosts early-morning and cloudy-day harvest.',
    });
  }

  if (overloadFaultDetected) {
    diagnostics.push({
      id: 'diag-overload-fault',
      type: 'overload',
      severity: 'critical',
      title: 'Inverter Overload Fault During Off-Grid Operation',
      detail: `Active household demand exceeded the ${inverterKw.toFixed(
        1
      )} kW continuous off-grid inverter rating during the simulated outage.`,
      recommendation:
        'Enable automatic non-critical load shedding during brownouts or step up to the next hybrid inverter rating.',
      actionLabel: 'Shed Non-Critical Loads',
      actionType: 'shed_non_critical',
    });
  }

  if (
    (input.brownout.enabled || input.instantBlackoutActive) &&
    !antiIslandingDetected
  ) {
    if (brownoutSurvived) {
      const reserveMarginHours =
        hasBattery && minBatterySocPercent > minReserveSocPercent
          ? (
              (((minBatterySocPercent - minReserveSocPercent) / 100) *
                batteryCapacityKwh) /
              Math.max(0.35, input.appliances.reduce((acc, a) => acc + (a.isCriticalBackup ? a.runningWatts * a.quantity * a.dutyCycle : 0), 0) / 1000)
            ).toFixed(1)
          : '0.0';
      diagnostics.push({
        id: 'diag-brownout-passed',
        type: 'brownout',
        severity: 'success',
        title: 'Outage Stress Test Passed (Zero Unmet Load)',
        detail: `Critical loads rode through the utility outage seamlessly. Battery SoC bottomed at ${minBatterySocPercent.toFixed(
          0
        )}% (above the ${minReserveSocPercent}% reserve floor) with ~${reserveMarginHours} hrs of backup margin remaining.`,
        recommendation:
          'Current battery capacity and critical sub-panel separation are well matched for this outage window.',
      });
    } else {
      const depletedAt = batteryDepletedTimeLabel || 'late night';
      diagnostics.push({
        id: 'diag-brownout-failed',
        type: 'brownout',
        severity: 'critical',
        title: `Low Battery Protection Shutdown at ${depletedAt}`,
        detail: `Battery drained to the ${minReserveSocPercent}% protection floor during the outage, leaving ${blackoutUnmetMinutes} minutes (${totalUnmetLoadKwh.toFixed(
          2
        )} kWh) of unserved load before sunrise.`,
        recommendation:
          'Add +5.12 kWh of LiFePO4 battery storage or enable non-critical load shedding during outages.',
        actionLabel: 'Add +5.12 kWh Battery Module',
        actionType: 'add_battery_module',
      });
    }
  }

  return {
    totalPotentialPvKwh: Number(totalPotentialPvKwh.toFixed(2)),
    totalHarvestedPvKwh: Number(totalHarvestedPvKwh.toFixed(2)),
    totalClippedPvKwh: Number(totalClippedPvKwh.toFixed(2)),
    inverterClippedKwh: Number(inverterClippedKwh.toFixed(2)),
    zeroExportCurtailedKwh: Number(zeroExportCurtailedKwh.toFixed(2)),
    curtailmentStartTime,
    totalLoadConsumedKwh: Number(totalLoadConsumedKwh.toFixed(2)),
    totalUnmetLoadKwh: Number(totalUnmetLoadKwh.toFixed(2)),
    directSolarToLoadKwh: Number(directSolarToLoadKwh.toFixed(2)),
    batteryChargedKwh: Number(batteryChargedKwh.toFixed(2)),
    batteryDischargedKwh: Number(batteryDischargedKwh.toFixed(2)),
    gridImportedKwh: Number(gridImportedKwh.toFixed(2)),
    gridExportedKwh: Number(gridExportedKwh.toFixed(2)),
    selfSufficiencyPercent: Number(selfSufficiencyPercent.toFixed(1)),
    solarSelfConsumptionPercent: Number(
      solarSelfConsumptionPercent.toFixed(1)
    ),
    minBatterySocPercent: Number(minBatterySocPercent.toFixed(1)),
    maxBatterySocPercent: Number(maxBatterySocPercent.toFixed(1)),
    brownoutSurvived,
    blackoutUnmetMinutes,
    batteryDepletedTimeLabel,
    overloadFaultDetected,
    antiIslandingDetected,
    diagnostics,
    steps,
  };
}
