import { SolarInverterRecord, SolarModuleRecord } from '@/types/supabase';
import { DcCalculationResult } from '@/types/calculator';
import { electricalRules } from './electricalRules';

export function calculateDc(
  inverter: SolarInverterRecord,
  module: SolarModuleRecord
): DcCalculationResult {
  const rawCurrentA = Number(module.isc_a) || 0;
  // 125% continuous duty multiplier per NEC 690.8 / PEC 6.90
  const computedCurrentA = Number((rawCurrentA * 1.25).toFixed(3));

  const breakerRatingA = electricalRules.findBreaker('dc', computedCurrentA);
  const wireSpec = electricalRules.findWire('dc_pv', breakerRatingA);
  const wireNote = 'Use 2 cables — 1 red and 1 black';
  const isolatorRatingA = electricalRules.findIsolator('dc', breakerRatingA);

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

  const conduitSpec = electricalRules.findConduit('dc_pv', wireSpec);
  const groundInfo = electricalRules.findGrounding(breakerRatingA);

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
      conduit: 'Conduit inner diameter accommodates double-insulated solar homerun cables (1 Red +, 1 Black -).',
      grounding: 'Equipment grounding conductor sized per electrical standard for DC circuit protection.',
    },
  };
}
