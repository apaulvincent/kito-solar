// src/components/ai/__tests__/copilotIntegration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCalculatorStore } from '@/store/useCalculatorStore';
import { computeAndMatchSolarSystem, recalculateWithOverrides } from '@/lib/solar/sizing-engine';
import { aiCopilotService } from '@/services/aiCopilotService';

describe('AI Copilot Studio Integration', () => {
  beforeEach(() => {
    useCalculatorStore.getState().resetToDefaults();
  });

  it('generates a solar proposal and applies it to the calculator store', () => {
    const proposal = computeAndMatchSolarSystem({
      monthlyBillPhp: 15000,
      location: 'Metro Manila',
      systemType: 'hybrid',
    });

    expect(proposal.engineeringSpecs.actualArrayKwp).toBeGreaterThan(9.0);
    expect(proposal.billOfMaterials.panel.quantity).toBeGreaterThanOrEqual(16);

    // Apply proposal to calculator
    useCalculatorStore.getState().applySizingProposal(proposal);

    const state = useCalculatorStore.getState();
    expect(state.panelCountOverride).toBe(proposal.billOfMaterials.panel.quantity);
    expect(state.selectedModule.pv_wattage_w).toBeDefined();
    expect(state.calculationResult).toBeDefined();
    expect(state.lastAppliedProposal).toEqual(proposal);
  });

  it('supports AI copilot deterministic fallback messaging with tool payload', async () => {
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'My electric bill is around ₱12,000 in San Pablo Laguna, need brownout backup',
        createdAt: new Date(),
      },
    ];

    const reply = await aiCopilotService.sendMessage(messages);
    expect(reply.role).toBe('assistant');
    expect(reply.content).toContain('kWp HYBRID Solar System');
    expect(reply.toolInvocations).toBeDefined();
    expect(reply.toolInvocations?.[0].toolName).toBe('generateSolarSetupFromBill');

    const result = reply.toolInvocations?.[0].result as any;
    expect(result.engineeringSpecs.actualArrayKwp).toBeGreaterThan(7.0);
    expect(result.financialRoi.estimatedMonthlySavingsPhp).toBeGreaterThan(8000);
  });

  it('handles what-if modification queries in AI copilot fallback', async () => {
    const proposal = computeAndMatchSolarSystem({
      monthlyBillPhp: 12000,
      location: 'San Pablo City, Laguna',
      systemType: 'hybrid',
    });

    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'My electric bill is around ₱12,000 in San Pablo Laguna, need brownout backup',
        createdAt: new Date(),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'Here is your setup',
        createdAt: new Date(),
        toolInvocations: [
          {
            toolName: 'generateSolarSetupFromBill' as const,
            state: 'result' as const,
            result: proposal,
          },
        ],
      },
      {
        id: '3',
        role: 'user' as const,
        content: 'What if we keep the 8kW inverter, drop the battery to 5kWh, and use 10 panels?',
        createdAt: new Date(),
      },
    ];

    const reply = await aiCopilotService.sendMessage(messages);
    expect(reply.role).toBe('assistant');
    expect(reply.toolInvocations?.[0].toolName).toBe('modifyExistingProjectSetup');

    const modified = reply.toolInvocations?.[0].result as any;
    expect(modified.billOfMaterials.panel.quantity).toBe(10);
    expect(modified.billOfMaterials.inverter.ratedAcKw).toBe(8);
  });

  it('accurately parses brand preference and applies Deye hybrid inverter to workbench', async () => {
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'how about 7000 but I want Deye Hybrid Inverter',
        createdAt: new Date(),
      },
    ];

    const reply = await aiCopilotService.sendMessage(messages);
    expect(reply.role).toBe('assistant');
    const result = reply.toolInvocations?.[0].result as any;
    expect(result).toBeDefined();
    expect(result.billOfMaterials.inverter.brand).toBe('Deye');
    expect(result.billOfMaterials.inverter.model).toBe('SUN-5K-SG05LP1-EU');

    // Now apply to calculator
    useCalculatorStore.getState().applySizingProposal(result);

    const state = useCalculatorStore.getState();
    expect(state.selectedInverter.brand.toUpperCase()).toBe('DEYE');
    expect(state.selectedInverter.model).toBe('SUN-5K-SG05LP1-EU');
    expect(state.panelCountOverride).toBe(result.billOfMaterials.panel.quantity);
  });

  it('correctly handles "7000 bill, I want deye inverter" without asking for bill again', async () => {
    const messages = [
      {
        id: '1',
        role: 'user' as const,
        content: '7000 bill, I want deye inverter',
        createdAt: new Date(),
      },
    ];

    const reply = await aiCopilotService.sendMessage(messages);
    expect(reply.role).toBe('assistant');
    expect(reply.toolInvocations).toBeDefined();
    expect(reply.toolInvocations?.[0].toolName).toBe('generateSolarSetupFromBill');

    const result = reply.toolInvocations?.[0].result as any;
    expect(result.inputSummary.monthlyBillPhp).toBe(7000);
    expect(result.billOfMaterials.inverter.brand).toBe('Deye');
    expect(result.billOfMaterials.inverter.model).toBe('SUN-5K-SG05LP1-EU');
  });
});
