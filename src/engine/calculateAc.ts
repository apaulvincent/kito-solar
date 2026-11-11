import { SolarInverterRecord } from '@/types/supabase';
import { AcCalculationResult } from '@/types/calculator';
import { parseNumericValue } from '@/lib/utils';
import { electricalRules } from './electricalRules';

export function calculateAc(
  inverter: SolarInverterRecord,
  gridVoltageV: number = 230,
  mainBreakerA: number | null = null
): AcCalculationResult {
  const rawCurrentA =
    parseNumericValue(inverter.max_ac_current_a) ||
    parseNumericValue(inverter.rated_ac_current_a) ||
    0;
  // Continuous duty factor of 125% per NEC 705.12 / PEC 7.05
  const computedCurrentA = Number((rawCurrentA * 1.25).toFixed(3));

  const breakerRatingA = electricalRules.findBreaker('ac', computedCurrentA);
  const wireSpec = electricalRules.findWire('ac', breakerRatingA);
  const isolatorRatingA = electricalRules.findIsolator('ac', breakerRatingA);

  let spdRating = '440V AC SPD';
  let spdRatingV = 440;
  if (gridVoltageV <= 120) {
    spdRating = '275V AC SPD';
    spdRatingV = 275;
  } else if (gridVoltageV <= 240) {
    spdRating = '440V AC SPD';
    spdRatingV = 440;
  } else if (gridVoltageV <= 415) {
    spdRating = '500V AC SPD';
    spdRatingV = 500;
  }

  let atsConfigured = false;
  let atsRatingA: number | null = null;
  let atsNote = 'ATS not configured';

  if (mainBreakerA && mainBreakerA > 0) {
    atsConfigured = true;
    const atsTiers = [40, 63, 100, 125, 160, 200, 250, 400, 630];
    const matchedAts = atsTiers.find((tier) => tier >= mainBreakerA) || mainBreakerA;
    atsRatingA = matchedAts;
    atsNote = `${matchedAts}A ATS configured matching main service breaker (${mainBreakerA}A)`;
  }

  const epsBreakerRatingA = breakerRatingA;

  return {
    rawCurrentA,
    computedCurrentA,
    breakerRatingA,
    wireSpec,
    isolatorRatingA,
    spdRating,
    spdRatingV,
    atsConfigured,
    atsRatingA,
    atsNote,
    epsBreakerRatingA,
    explanation: {
      breaker: `Sized for inverter maximum continuous AC current (${rawCurrentA} A × 125% = ${computedCurrentA} A) rounded to standard breaker frame.`,
      wire: `Selected to withstand continuous current and breaker trip threshold (${breakerRatingA} A) under thermal derating rules.`,
      isolator: `Lockable rotary AC isolator sized with safety headroom above breaker rating (${isolatorRatingA} A).`,
      spd: `Type 2 AC surge protective device matched to nominal grid utility voltage (${gridVoltageV} V AC).`,
      ats: atsConfigured
        ? `Automatic Transfer Switch rated for ${atsRatingA} A to safely transfer essential loads.`
        : 'Optional ATS omitted; configure main panel service breaker to size transfer switch.',
      eps: 'Dedicated breaker safeguarding the Emergency Power Supply / off-grid backup port.',
    },
  };
}
