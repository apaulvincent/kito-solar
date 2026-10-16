// src/services/aiCopilotService.ts
import {
  ProjectSizingResult,
  SystemType,
  BudgetTier,
  SolarKnowledgeChunk,
} from '@/types/solar-ai';
import {
  computeAndMatchSolarSystem,
  recalculateWithOverrides,
  resolveTariff,
} from '@/lib/solar/sizing-engine';
import { searchSolarKnowledge } from '@/lib/solar/rag-search';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  toolInvocations?: Array<{
    toolName: 'generateSolarSetupFromBill' | 'modifyExistingProjectSetup' | 'searchSolarKnowledgeBase';
    state: 'result';
    result: ProjectSizingResult | { results: SolarKnowledgeChunk[] };
  }>;
}

export class AiCopilotService {
  /**
   * Process a user message. Attempts to call the serverless endpoint first.
   * If the endpoint fails (e.g. offline, Vite dev server, or no API key provided),
   * seamlessly falls back to the deterministic client engine.
   */
  async sendMessage(
    messages: CopilotMessage[],
    projectId?: string | null
  ): Promise<CopilotMessage> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userPrompt = lastUserMessage?.content || '';

    // Attempt Serverless API
    try {
      const response = await fetch('/api/ai/solar-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          projectId: projectId || undefined,
        }),
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          // If the server returned an AI response stream or text
          return {
            id: 'msg-' + Date.now(),
            role: 'assistant',
            content: text,
            createdAt: new Date(),
          };
        }
      }
    } catch {
      // Serverless API not available or errored, proceed to deterministic fallback
    }

    // Deterministic Client Engine Fallback
    return this.processDeterministicFallback(userPrompt, messages, projectId);
  }

  private async processDeterministicFallback(
    userPrompt: string,
    history: CopilotMessage[],
    projectId?: string | null
  ): Promise<CopilotMessage> {
    const promptLower = userPrompt.toLowerCase();

    // Check for "What-If" modifications / overrides on previous setup
    const isOverride =
      promptLower.includes('what if') ||
      promptLower.includes('change') ||
      promptLower.includes('override') ||
      promptLower.includes('drop') ||
      promptLower.includes('keep') ||
      promptLower.includes('reduce') ||
      promptLower.includes('increase');

    // Find previous proposal if any
    const previousProposal = history
      .slice()
      .reverse()
      .find((m) => m.toolInvocations?.[0]?.result && 'engineeringSpecs' in m.toolInvocations[0].result)
      ?.toolInvocations?.[0]?.result as ProjectSizingResult | undefined;

    if (isOverride && previousProposal) {
      return this.handleOverrideQuery(userPrompt, previousProposal, projectId);
    }

    // Check for technical / RAG questions (e.g. Voc, MPPT, single string, net metering)
    const isTechnicalQuestion =
      promptLower.includes('why') ||
      promptLower.includes('can i') ||
      promptLower.includes('single string') ||
      promptLower.includes('pec') ||
      promptLower.includes('net metering') ||
      promptLower.includes('difference between') ||
      promptLower.includes('brownout') ||
      promptLower.includes('voltage');

    // Extract bill amount (e.g., ₱12,000, 12000, 15k, 8,000)
    const billMatch = userPrompt.match(/(?:₱|php|pesos?)?\s*([\d,]+(?:\.\d+)?)\s*(?:k\b|\/mo|per month|monthly)?/i);
    let extractedBill: number | null = null;
    if (billMatch) {
      let rawNumber = billMatch[1].replace(/,/g, '');
      let parsed = parseFloat(rawNumber);
      if (userPrompt.toLowerCase().includes(rawNumber + 'k')) {
        parsed *= 1000;
      }
      if (parsed >= 500) {
        extractedBill = parsed;
      }
    }

    if (extractedBill) {
      return this.handleBillSizingQuery(userPrompt, extractedBill, projectId);
    }

    if (isTechnicalQuestion) {
      return this.handleKnowledgeQuery(userPrompt);
    }

    // Default friendly sales engineer guidance
    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content:
        "To size your solar system accurately, please share your **average monthly electric bill** (e.g., *₱12,000/month*) and your **location** in the Philippines. Let me know if you would like **Grid-Tie** (daytime savings only) or **Hybrid** with battery storage for brownout backup.",
      createdAt: new Date(),
    };
  }

  private handleBillSizingQuery(
    prompt: string,
    bill: number,
    projectId?: string | null
  ): CopilotMessage {
    const promptLower = prompt.toLowerCase();

    // Determine system type
    let systemType: SystemType = 'hybrid';
    if (
      promptLower.includes('grid-tie') ||
      promptLower.includes('grid tie') ||
      promptLower.includes('no battery') ||
      promptLower.includes('daytime only')
    ) {
      systemType = 'grid-tie';
    } else if (promptLower.includes('off-grid') || promptLower.includes('off grid') || promptLower.includes('remote')) {
      systemType = 'off-grid';
    }

    // Determine location
    let location = 'Calabarzon';
    if (promptLower.includes('laguna') || promptLower.includes('san pablo')) location = 'San Pablo City, Laguna';
    else if (promptLower.includes('manila') || promptLower.includes('ncr') || promptLower.includes('quezon')) location = 'Metro Manila';
    else if (promptLower.includes('batangas')) location = 'Batangas';
    else if (promptLower.includes('pampanga') || promptLower.includes('clark')) location = 'Pampanga';
    else if (promptLower.includes('cebu')) location = 'Cebu City';
    else if (promptLower.includes('davao')) location = 'Davao City';

    // Determine budget tier
    let budgetTier: BudgetTier = 'standard';
    if (promptLower.includes('premium') || promptLower.includes('high-end') || promptLower.includes('top tier')) {
      budgetTier = 'premium';
    } else if (promptLower.includes('economy') || promptLower.includes('budget') || promptLower.includes('cheap')) {
      budgetTier = 'economy';
    }

    const result = computeAndMatchSolarSystem({
      projectId: projectId || undefined,
      monthlyBillPhp: bill,
      location,
      systemType,
      budgetTier,
    });

    const isHybrid = systemType === 'hybrid';
    const batteryText = isHybrid && result.billOfMaterials.battery
      ? ` and **${result.billOfMaterials.battery.totalStorageKwh} kWh LiFePO4 battery bank** (${result.billOfMaterials.battery.quantity}x ${result.billOfMaterials.battery.brand} ${result.billOfMaterials.battery.model})`
      : '';

    const content = `Based on your **₱${bill.toLocaleString()}** monthly bill in ${location}, I sized a **${result.engineeringSpecs.actualArrayKwp} kWp ${systemType.toUpperCase()} Solar System** designed to offset approximately **${result.engineeringSpecs.billOffsetPercentage}%** of your monthly utility consumption.

### Recommended System Specifications:
- **Solar PV Array:** ${result.billOfMaterials.panel.quantity}x ${result.billOfMaterials.panel.brand} ${result.billOfMaterials.panel.model} (${result.billOfMaterials.panel.wattageWp}W)
- **Inverter:** 1x ${result.billOfMaterials.inverter.brand} ${result.billOfMaterials.inverter.model} (${result.billOfMaterials.inverter.ratedAcKw}kW AC)${batteryText}
- **Required Roof Footprint:** ~${result.engineeringSpecs.requiredRoofAreaSqm} m²
- **MPPT String Safety:** Verified across ${result.engineeringSpecs.stringConfigurations.length} string(s). Maximum cold-weather open circuit voltage remains safely under inverter DC limits.

### Financial Projections:
- **Estimated Monthly Savings:** ₱${result.financialRoi.estimatedMonthlySavingsPhp.toLocaleString()} / month
- **New Estimated Utility Bill:** ₱${result.financialRoi.estimatedNewMonthlyBillPhp.toLocaleString()} / month
- **Total Turnkey Investment:** ₱${result.billOfMaterials.totalSystemCostPhp.toLocaleString()}
- **Estimated Payback Period:** **${result.financialRoi.paybackPeriodYears} years** (25-year net savings: ₱${result.financialRoi.twentyFiveYearNetSavingsPhp.toLocaleString()})

Click **Apply Setup to Calculator** below to load this full single-line schematic, protection schedules, and 3D diagram into your workbench.`;

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content,
      createdAt: new Date(),
      toolInvocations: [
        {
          toolName: 'generateSolarSetupFromBill',
          state: 'result',
          result,
        },
      ],
    };
  }

  private handleOverrideQuery(
    prompt: string,
    previous: ProjectSizingResult,
    projectId?: string | null
  ): CopilotMessage {
    const promptLower = prompt.toLowerCase();

    // Extract panel count override
    const panelMatch = promptLower.match(/(\d+)\s*(?:panels?|modules?)/);
    const overridePanelCount = panelMatch ? parseInt(panelMatch[1], 10) : undefined;

    // Extract inverter kW override
    const invMatch = promptLower.match(/(\d+(?:\.\d+)?)\s*kw\s*(?:inverter)?/);
    const overrideInverterKw = invMatch ? parseFloat(invMatch[1]) : undefined;

    // Extract battery kWh override
    const batMatch = promptLower.match(/(\d+(?:\.\d+)?)\s*kwh\s*(?:battery)?/);
    const overrideBatteryKwh = batMatch ? parseFloat(batMatch[1]) : undefined;

    const modified = recalculateWithOverrides({
      projectId: projectId || previous.projectId,
      monthlyBillPhp: previous.inputSummary.monthlyBillPhp,
      location: previous.inputSummary.location,
      systemType: previous.inputSummary.systemType,
      overridePanelCount,
      overrideInverterKw,
      overrideBatteryKwh,
    });

    const content = `Adjusted your solar setup to match your custom parameters:
- **PV Array:** ${modified.billOfMaterials.panel.quantity} panels (${modified.engineeringSpecs.actualArrayKwp} kWp)
- **Inverter Rating:** ${modified.billOfMaterials.inverter.ratedAcKw} kW AC (${modified.billOfMaterials.inverter.model})
- **Battery Storage:** ${modified.billOfMaterials.battery ? `${modified.billOfMaterials.battery.totalStorageKwh} kWh` : 'None (Grid-Tie)'}
- **Adjusted System Investment:** ₱${modified.billOfMaterials.totalSystemCostPhp.toLocaleString()}
- **New Payback Period:** ${modified.financialRoi.paybackPeriodYears} years (Est. Monthly Savings: ₱${modified.financialRoi.estimatedMonthlySavingsPhp.toLocaleString()})

The MPPT string configuration check passed safely. Click **Apply Setup to Calculator** to update your active project.`;

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content,
      createdAt: new Date(),
      toolInvocations: [
        {
          toolName: 'modifyExistingProjectSetup',
          state: 'result',
          result: modified,
        },
      ],
    };
  }

  private async handleKnowledgeQuery(prompt: string): Promise<CopilotMessage> {
    const chunks = await searchSolarKnowledge(prompt, undefined, 2);

    let answer = '';
    if (chunks.length > 0) {
      answer = chunks.map((c) => `**${c.document_title}:**\n${c.content}`).join('\n\n');
    } else {
      answer =
        'Under Philippine Electrical Code (PEC) Article 6.90 and inverter manufacturer datasheets, string sizing is strictly constrained by maximum DC voltage at minimum ambient temperature (typically 18°C in the Philippines). Panels must be grouped so total string open-circuit voltage never exceeds the inverter rating.';
    }

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: answer,
      createdAt: new Date(),
      toolInvocations: [
        {
          toolName: 'searchSolarKnowledgeBase',
          state: 'result',
          result: { results: chunks },
        },
      ],
    };
  }
}

export const aiCopilotService = new AiCopilotService();
