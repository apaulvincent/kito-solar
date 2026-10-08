// src/engine/calculateAts.ts

export interface AtsResult {
  isConfigured: boolean;
  recommendedRatingA: number | null;
  note: string;
  explanation: string;
}

export function calculateAts(mainBreakerA: number | null): AtsResult {
  if (!mainBreakerA || mainBreakerA <= 0) {
    return {
      isConfigured: false,
      recommendedRatingA: null,
      note: 'ATS not configured',
      explanation: 'No main utility panel breaker specified. Enter main breaker amperage if backup ATS transfer is desired.',
    };
  }

  const standardAtsRatings = [40, 63, 100, 125, 160, 200, 250, 400, 630];
  const matched = standardAtsRatings.find((r) => r >= mainBreakerA) || mainBreakerA;

  return {
    isConfigured: true,
    recommendedRatingA: matched,
    note: `${matched}A ATS matching main panel rating (${mainBreakerA}A)`,
    explanation: `Automatic Transfer Switch rated at ${matched} A selected to safely transition critical loads between grid utility and inverter backup supply without backfeeding.`,
  };
}
