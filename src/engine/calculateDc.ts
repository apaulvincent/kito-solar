// src/engine/calculateDc.ts
import { SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { DcCalculationResult } from '@/types/calculator';
import { ruleService } from '@/services/ruleService';

export function calculateDc(
  inverter: SolarInverterRecord,
  module: SolarModuleRecord
): DcCalculationResult {
  const rawCurrentA = Number(module.isc_a) || 0;
  // Computed current: PV Isc * 1.25 (125% continuous duty multiplier)
  const computedCurrentA = Number((rawCurrentA * 1.25).toFixed(3));

  // Breaker rating from DC breaker table
  const breakerRatingA = ruleService.findBreaker('dc', computedCurrentA);

  // PV DC Wire from dc_pv group based on breaker rating
  const wireSpec = ruleService.findWire('dc_pv', breakerRatingA);
  const wireNote = 'Use 2 cables — 1 red and 1 black';

  // DC Isolator mapped from breaker rating
  const isolatorRatingA = ruleService.findIsolator('dc', breakerRatingA);

  // DC SPD based on inverter max PV input voltage
  const maxPvVoltage = Number(inverter.max_pv_input_voltage_v) || 0;
  let spdRating = '600V DC SPD';
  let spdRatingV = 600;

  if (maxPvVoltage <= 600) {
    spdRating = '600V DC SPD';
    spdRatingV = 600;
  } else if (maxPvVoltage <= 1000) {
    spdRating = '1000V DC SPD';
    spdRatingV = 1000;
  } else if (maxPvVoltage <= 1500) {
    spdRating = '1500V DC SPD';
    spdRatingV = 1500;
  } else {
    spdRating = 'SPD Not Available';
    spdRatingV = 0;
  }

  // DC Conduit
  const conduitSpec = ruleService.findConduit('dc_pv', wireSpec);

  // Grounding
  const groundInfo = ruleService.findGrounding(breakerRatingA);

  return {
    rawCurrentA,
    computedCurrentA,
    breakerRatingA,
    wireSpec,
    wireNote,
    isolatorRatingA,
    spdRating,
    spdRatingV,
    conduitSpec,
    groundConductorSpec: groundInfo.conductor,
    groundRodSpec: groundInfo.rod,
    explanation: {
      breaker: `Selected based on continuous PV Isc (${rawCurrentA} A × 125% = ${computedCurrentA} A) mapped to standard DC breaker tier.`,
      wire: `Conductor ampacity sized to safely carry DC breaker rating (${breakerRatingA} A).`,
      isolator: `DC disconnect sized for load-break isolation rating above DC breaker capacity (${isolatorRatingA} A).`,
      spd: `Sized for inverter maximum open-circuit PV input voltage ceiling (${maxPvVoltage} V DC).`,
      conduit: `Conduit inner diameter accommodates double-insulated solar homerun cables (1 Red +, 1 Black -).`,
      grounding: `Equipment grounding conductor sized per electrical standard for DC circuit protection.`,
    },
  };
}
