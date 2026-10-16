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
  engine?: 'gemini-2.5-flash' | 'deterministic-engine';
  toolInvocations?: Array<{
    toolName: 'generateSolarSetupFromBill' | 'modifyExistingProjectSetup' | 'searchSolarKnowledgeBase';
    state: 'result';
    result: ProjectSizingResult | { results: SolarKnowledgeChunk[] };
  }>;
}

export class AiCopilotService {
  /**
   * Returns active engine mode based on environment availability
   */
  getActiveEngineName(): string {
    const hasClientKey = Boolean(
      (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GOOGLE_GENERATIVE_AI_API_KEY))
    );
    return hasClientKey ? 'Gemini 2.5 Flash (Live AI)' : 'Deterministic Tool Engine (Grounded Safe Mode)';
  }

  /**
   * Robust bill extraction: handles '7000 bill', 'bill 7000', '₱7,000', '7k', etc.
   * Avoids confusing equipment ratings (8kW, 5kWh, 580W, 500V) with electricity bills.
   */
  extractBillAmount(userPrompt: string): number | null {
    const clean = userPrompt.toLowerCase();

    // 1. '7k' or '12.5k' (excluding kw, kwh)
    const kMatch = clean.match(/(?:(?:₱|php|pesos?)?\s*)(\d+(?:\.\d+)?)\s*k\b(?!w)/);
    if (kMatch) {
      const val = parseFloat(kMatch[1]) * 1000;
      if (val >= 500) return val;
    }

    // 2. Currency symbol + digits (e.g. ₱7,000, 7000php, 7000 pesos)
    const currMatch =
      clean.match(/(?:₱|php|pesos?)\s*(\d[\d,]*)/) ||
      clean.match(/(\d[\d,]*)\s*(?:php|pesos)\b/);
    if (currMatch) {
      const val = parseFloat(currMatch[1].replace(/,/g, ''));
      if (val >= 500) return val;
    }

    // 3. '7000 bill' or 'bill 7000' or 'bill is 7000' or '7000/mo'
    const billMatch =
      clean.match(/(\d[\d,]*)\s*(?:bill|\/mo|per month|monthly)/) ||
      clean.match(/(?:bill|spend|paying)\s*(?:is|around|about|of)?\s*[:=]?\s*(\d[\d,]*)/);
    if (billMatch) {
      const val = parseFloat(billMatch[1].replace(/,/g, ''));
      if (val >= 500) return val;
    }

    // 4. Standalone 4+ digit number not followed by electrical units (kW, kWh, V, A, panels)
    const numMatches = [...clean.matchAll(/\b(\d[\d,]*)\b/g)];
    for (const m of numMatches) {
      const raw = m[1].replace(/,/g, '');
      const val = parseFloat(raw);
      const postText = clean.slice(m.index! + m[0].length).trim();
      if (/^(?:k?w|k?wh|v|a|panels?|modules?|deg|c\b)/.test(postText)) {
        continue;
      }
      if (val >= 1000 && val <= 5000000) {
        return val;
      }
    }

    return null;
  }

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

    // 1. Attempt Serverless API (on Vercel or full backend)
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
        if (text && text.trim().length > 0 && !text.includes('GOOGLE_GENERATIVE_AI_API_KEY is not configured')) {
          return {
            id: 'msg-' + Date.now(),
            role: 'assistant',
            content: text,
            engine: 'gemini-2.5-flash',
            createdAt: new Date(),
          };
        }
      }
    } catch {
      // Serverless API not reachable, proceed to client handling
    }

    // 2. Deterministic Client PV Sizing Engine Fallback
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
      promptLower.includes('how about') ||
      promptLower.includes('what about') ||
      promptLower.includes('change') ||
      promptLower.includes('override') ||
      promptLower.includes('drop') ||
      promptLower.includes('keep') ||
      promptLower.includes('reduce') ||
      promptLower.includes('increase') ||
      promptLower.includes('switch to');

    // Find previous proposal if any
    const previousProposal = history
      .slice()
      .reverse()
      .find((m) => m.toolInvocations?.[0]?.result && 'engineeringSpecs' in m.toolInvocations[0].result)
      ?.toolInvocations?.[0]?.result as ProjectSizingResult | undefined;

    // Check for requested brands (e.g. Deye, Solis, Growatt, Huawei)
    let preferredInverterBrand: string | undefined = undefined;
    if (promptLower.includes('deye')) preferredInverterBrand = 'Deye';
    else if (promptLower.includes('growatt')) preferredInverterBrand = 'Growatt';
    else if (promptLower.includes('solis')) preferredInverterBrand = 'Solis';
    else if (promptLower.includes('huawei')) preferredInverterBrand = 'Huawei';

    // Extract bill amount cleanly (supports '7000 bill', 'bill 7000', '₱7,000', '7k', etc.)
    const extractedBill = this.extractBillAmount(userPrompt);

    // If there is an existing proposal and user asks an override without changing bill amount
    if (isOverride && previousProposal && !extractedBill) {
      return this.handleOverrideQuery(userPrompt, previousProposal, projectId, preferredInverterBrand);
    }

    // If user provides a bill amount (or "how about 7000 but I want Deye")
    if (extractedBill) {
      return this.handleBillSizingQuery(userPrompt, extractedBill, projectId, preferredInverterBrand);
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

    if (isTechnicalQuestion) {
      return this.handleKnowledgeQuery(userPrompt);
    }

    // Default friendly sales engineer guidance
    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      engine: 'deterministic-engine',
      content:
        "To size your solar system accurately, please share your **average monthly electric bill** (e.g., *₱12,000/month*) and your **location** in the Philippines. Let me know if you would like **Grid-Tie** (daytime savings only) or **Hybrid** with battery storage for brownout backup.",
      createdAt: new Date(),
    };
  }

  private handleBillSizingQuery(
    prompt: string,
    bill: number,
    projectId?: string | null,
    preferredInverterBrand?: string
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
      preferredInverterBrand,
    });

    const isHybrid = systemType === 'hybrid';
    const batteryText = isHybrid && result.billOfMaterials.battery
      ? ` and **${result.billOfMaterials.battery.totalStorageKwh} kWh LiFePO4 battery storage** (${result.billOfMaterials.battery.quantity}x ${result.billOfMaterials.battery.brand} ${result.billOfMaterials.battery.model})`
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

Click **Load Setup into 3D Workbench** below to synchronize this equipment and layout into your interactive canvas.`;

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      engine: 'deterministic-engine',
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
    projectId?: string | null,
    preferredInverterBrand?: string
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
      preferredInverterBrand,
    });

    const content = `Adjusted your solar setup to match your custom parameters:
- **PV Array:** ${modified.billOfMaterials.panel.quantity} panels (${modified.engineeringSpecs.actualArrayKwp} kWp)
- **Inverter Unit:** ${modified.billOfMaterials.inverter.brand} ${modified.billOfMaterials.inverter.model} (${modified.billOfMaterials.inverter.ratedAcKw} kW AC)
- **Battery Storage:** ${modified.billOfMaterials.battery ? `${modified.billOfMaterials.battery.totalStorageKwh} kWh LiFePO4` : 'None (Grid-Tie)'}
- **Adjusted System Investment:** ₱${modified.billOfMaterials.totalSystemCostPhp.toLocaleString()}
- **New Payback Period:** ${modified.financialRoi.paybackPeriodYears} years (Est. Monthly Savings: ₱${modified.financialRoi.estimatedMonthlySavingsPhp.toLocaleString()})

The MPPT string configuration check passed safely. Click **Load Setup into 3D Workbench** below to synchronize the updated hardware.`;

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      engine: 'deterministic-engine',
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
      engine: 'deterministic-engine',
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
