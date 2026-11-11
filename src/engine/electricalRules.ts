import {
  RuleBreakerRecord,
  RuleWireRecord,
  RuleConduitRecord,
  RuleIsolatorRecord,
  RuleGroundingRecord,
} from '@/types/supabase';

import breakerRulesSeed from '@/data/seed/calculator_rule_breakers.json';
import wireRulesSeed from '@/data/seed/calculator_rule_wires.json';
import conduitRulesSeed from '@/data/seed/calculator_rule_conduit.json';
import isolatorRulesSeed from '@/data/seed/calculator_rule_isolators.json';
import groundingRulesSeed from '@/data/seed/calculator_rule_grounding.json';

class ElectricalRulesLookup {
  private breakers: RuleBreakerRecord[] = breakerRulesSeed as RuleBreakerRecord[];
  private wires: RuleWireRecord[] = wireRulesSeed as RuleWireRecord[];
  private conduits: RuleConduitRecord[] = conduitRulesSeed as RuleConduitRecord[];
  private isolators: RuleIsolatorRecord[] = isolatorRulesSeed as RuleIsolatorRecord[];
  private grounding: RuleGroundingRecord[] = groundingRulesSeed as RuleGroundingRecord[];

  findBreaker(systemSide: 'dc' | 'ac', currentA: number): number {
    const sideBreakers = this.breakers
      .filter((b) => b.system_side === systemSide)
      .sort((a, b) => a.breaker_rating_a - b.breaker_rating_a);

    const match = sideBreakers.find(
      (b) => currentA >= b.min_current_a && currentA <= b.max_current_a
    );
    if (match) return match.breaker_rating_a;

    const nextHighest = sideBreakers.find((b) => b.breaker_rating_a >= currentA);
    if (nextHighest) return nextHighest.breaker_rating_a;

    return sideBreakers[sideBreakers.length - 1]?.breaker_rating_a || Math.ceil(currentA);
  }

  findWire(wireGroup: 'dc_pv' | 'ac' | 'battery', ratingOrCurrentA: number): string {
    const groupWires = this.wires
      .filter((w) => w.wire_group === wireGroup)
      .sort((a, b) => a.max_current_a - b.max_current_a);

    const match = groupWires.find((w) => w.max_current_a >= ratingOrCurrentA);
    if (match) return match.wire_spec;

    return groupWires[groupWires.length - 1]?.wire_spec || '500.0mm² THHN/THWN cable';
  }

  findConduit(wireGroup: 'dc_pv' | 'ac' | 'battery', wireSpec: string): string {
    const match = this.conduits.find(
      (c) => c.wire_group === wireGroup && c.wire_spec.trim() === wireSpec.trim()
    );
    if (match) return match.conduit_spec;

    const partial = this.conduits.find(
      (c) => c.wire_group === wireGroup && wireSpec.includes(c.wire_spec.split(' ')[0])
    );
    return partial?.conduit_spec || '32mm² diameter PVC pipe';
  }

  findIsolator(systemSide: 'dc' | 'ac', breakerRatingA: number): number {
    const sideIsolators = this.isolators
      .filter((i) => i.system_side === systemSide)
      .sort((a, b) => a.breaker_rating_a - b.breaker_rating_a);

    const match = sideIsolators.find((i) => i.breaker_rating_a === breakerRatingA);
    if (match) return match.isolator_rating_a;

    const next = sideIsolators.find((i) => i.breaker_rating_a >= breakerRatingA);
    if (next) return next.isolator_rating_a;

    return sideIsolators[sideIsolators.length - 1]?.isolator_rating_a || Math.ceil(breakerRatingA * 1.25);
  }

  findGrounding(currentA: number): { conductor: string; rod: string } {
    const sorted = [...this.grounding].sort((a, b) => a.min_current_a - b.min_current_a);
    const match = sorted.find(
      (g) => currentA >= g.min_current_a && currentA <= g.max_current_a
    );

    if (match) {
      return { conductor: match.conductor_spec, rod: match.rod_spec };
    }

    return {
      conductor: sorted[0]?.conductor_spec || '14 AWG Copper / 12 AWG Aluminum',
      rod: sorted[0]?.rod_spec || '5/8 inches x 8 feet Copper-Clad Steel',
    };
  }
}

export const electricalRules = new ElectricalRulesLookup();
