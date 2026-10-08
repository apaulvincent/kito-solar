// src/engine/calculateBattery.ts
import { SolarInverterRecord, BatteryRecord } from '@/types/supabase';
import { BatteryCalculationResult } from '@/types/calculator';
import { ruleService } from '@/services/ruleService';

export function calculateBattery(
  inverter: SolarInverterRecord,
  battery: BatteryRecord | null,
  batteryCount: number = 1
): BatteryCalculationResult {
  const isBatteryCapable = Boolean(
    inverter.battery_type &&
    inverter.battery_voltage_range &&
    inverter.battery_type.toLowerCase() !== 'none'
  );

  if (!isBatteryCapable || !battery || batteryCount <= 0) {
    return {
      hasBattery: false,
      batteryType: inverter.battery_type || 'No Battery Required (Grid-Tied)',
      totalCapacityAh: 0,
      totalEnergyWh: 0,
      bankVoltageV: 0,
      dischargeCurrentA: 0,
      recommendedBreakerA: 0,
      wireSpec: 'No battery needed',
      explanation: {
        breaker: 'Battery bank omitted or inverter is configured for pure grid-tied operation without storage.',
        wire: 'No DC battery cables required.',
        sizing: 'Storage disabled in this system topology.',
      },
    };
  }

  const singleCapacityAh = Number(battery.capacity_ah) || 0;
  const nominalVoltageV = Number(battery.nominal_voltage_v) || 0;
  const singleEnergyWh = Number(battery.energy_wh) || singleCapacityAh * nominalVoltageV;
  const singleDischargeCurrent = Number(battery.discharge_current_a) || singleCapacityAh;

  // Single or parallel battery configuration
  const totalCapacityAh = singleCapacityAh * batteryCount;
  const totalEnergyWh = singleEnergyWh * batteryCount;
  const bankVoltageV = nominalVoltageV;
  const dischargeCurrentA = singleDischargeCurrent;

  // Recommended breaker: use battery record recommended_breaker_a (or derived from discharge current * 1.25)
  const baseBreakerA = Number(battery.recommended_breaker_a) || Math.ceil(singleDischargeCurrent * 1.25);
  // Scale breaker if parallel inputs require, but maintain standard single unit or bank sizing
  const recommendedBreakerA = baseBreakerA;

  // Battery wire from 'battery' rule table
  const wireSpec = ruleService.findWire('battery', recommendedBreakerA);

  return {
    hasBattery: true,
    batteryType: battery.model,
    totalCapacityAh,
    totalEnergyWh,
    bankVoltageV,
    dischargeCurrentA,
    recommendedBreakerA,
    wireSpec,
    explanation: {
      breaker: `Battery DC MCCB rated at ${recommendedBreakerA} A provides rapid fault interruption for high-short-circuit lithium/lead storage.`,
      wire: `Heavy-gauge flexible battery cabling (${wireSpec}) sized to minimize DC voltage drop and thermal degradation.`,
      sizing: `${batteryCount}x ${battery.model} configured for ${totalEnergyWh >= 1000 ? (totalEnergyWh / 1000).toFixed(1) + ' kWh' : totalEnergyWh + ' Wh'} usable bank capacity.`,
    },
  };
}
