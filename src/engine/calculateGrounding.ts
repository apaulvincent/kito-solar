// src/engine/calculateGrounding.ts
import { ruleService } from '@/services/ruleService';

export interface GroundingResult {
  conductorSpec: string;
  rodSpec: string;
  explanation: string;
}

export function calculateGrounding(circuitBreakerA: number): GroundingResult {
  const result = ruleService.findGrounding(circuitBreakerA);
  return {
    conductorSpec: result.conductor,
    rodSpec: result.rod,
    explanation: `Grounding electrode conductor (${result.conductor}) and driven rod (${result.rod}) sized per grounding standard based on ${circuitBreakerA} A circuit protection.`,
  };
}
