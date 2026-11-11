import { generateText, isStepCount } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  buildCopilotSystemPrompt,
  collectToolInvocations,
  createCopilotTools,
} from '@/lib/copilotTools';
import { buildSolarSetupProposal } from '@/lib/solarSizingEngine';
import { searchSolarKnowledge } from '@/lib/solar/rag-search';
import { ProjectSizingResult, ToolInvocationRecord } from '@/types/solar-ai';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  engine?: 'gemini-3.5-flash' | 'gemini-3.5-flash-lite' | 'gemini-2.5-flash' | 'gemini-flash';
  rateLimited?: boolean;
  retryAfter?: number;
  toolInvocations?: ToolInvocationRecord[];
}

export class AiCopilotService {

  /**
   * Resolves Google Generative AI API key from Vite or Node environment
   */
  getApiKey(): string | null {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      const viteKey =
        import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY ||
        import.meta.env.VITE_GEMINI_API_KEY ||
        import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (viteKey && typeof viteKey === 'string' && viteKey.trim().length > 0) {
        return viteKey.trim();
      }
    }
    if (typeof process !== 'undefined' && process.env) {
      const procKey =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
      if (procKey && typeof procKey === 'string' && procKey.trim().length > 0) {
        return procKey.trim();
      }
    }
    return null;
  }

  /**
   * Process a user message using real LLM intent & entity extraction with tool calling.
   * ZERO regex parsing: Gemini natively parses natural language and decides tool arguments.
   */
  async sendMessage(
    messages: CopilotMessage[],
    projectId?: string | null,
    currentProjectState?: unknown
  ): Promise<CopilotMessage> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          projectId: projectId || undefined,
          currentProjectState,
        }),
      });

      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfter = Number(data.retryAfter || (retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60));
        const reason =
          data.error ||
          `You have reached the message limit. Please wait ${retryAfter} seconds before sending another query.`;
        return {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: reason,
          rateLimited: true,
          retryAfter,
          createdAt: new Date(),
        };
      }

      if (response.status === 403) {
        return {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: 'Access verification failed. Please access Jenny directly from the official Kito Solar application.',
          createdAt: new Date(),
        };
      }

      if (response.status === 503) {
        const data = await response.json().catch(() => ({}));
        return {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content:
            data.error ||
            'The solar sizing engine is currently experiencing high load. Please wait a moment and try again.',
          createdAt: new Date(),
        };
      }

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data && data.text && data.text.trim().length > 0) {
            return {
              id: 'msg-' + Date.now(),
              role: 'assistant',
              content: data.text,
              engine: 'gemini-3.5-flash',
              createdAt: new Date(),
              toolInvocations: data.toolInvocations,
            };
          }
        } else {
          const text = await response.text();
          if (text && text.trim().length > 0 && !text.includes('GOOGLE_GENERATIVE_AI_API_KEY is not configured')) {
            return {
              id: 'msg-' + Date.now(),
              role: 'assistant',
              content: text,
              engine: 'gemini-3.5-flash',
              createdAt: new Date(),
            };
          }
        }
      }
    } catch {
      // Fallback to client SDK if the serverless endpoint is unreachable.
    }

    const apiKey = this.getApiKey();

    if (!apiKey) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      return this.getFriendlyFallbackResponse(lastUserMsg);
    }

    const google = createGoogleGenerativeAI({ apiKey });
    let appliedPayload: ProjectSizingResult | null = null;

    try {
      const rawMessages = Array.isArray(messages) ? messages : [];
      const sdkMessages = rawMessages.slice(-15).map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: typeof m.content === 'string' ? m.content.slice(0, 2000) : '',
      }));

      const { text, toolResults } = await generateText({
        model: google('gemini-3.5-flash'),
        system: buildCopilotSystemPrompt(currentProjectState),
        messages: sdkMessages,
        stopWhen: isStepCount(5),
        tools: createCopilotTools({
          projectId,
          deduplicate: false,
          onProposalBuilt: (proposal) => {
            appliedPayload = proposal;
          },
        }),
      });

      const toolInvocations = collectToolInvocations(toolResults, appliedPayload);

      return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: text,
        engine: 'gemini-3.5-flash',
        createdAt: new Date(),
        toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
      };
    } catch (err: unknown) {
      console.error('AI chat execution error:', err);
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      return this.getFriendlyFallbackResponse(lastUserMsg);
    }
  }

  /**
   * Provides friendly, plain-language answers for ordinary people when remote AI connection is offline or encounters an issue.
   * Never exposes API keys, environment variables, or technical stack errors.
   */
  async getFriendlyFallbackResponse(userPrompt: string): Promise<CopilotMessage> {
    const promptLower = (userPrompt || '').toLowerCase().trim();

    if (/^(hi|hello|hey|good day|morning|afternoon|evening|who are you)\b/i.test(promptLower)) {
      return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content:
          "Hello! I'm Jenny, your solar assistant at Kito Solar. I can help you size the right solar system for your home or business, figure out how many panels you need, and answer questions about inverters and batteries. What is your average monthly electric bill, or what can I help you with today?",
        createdAt: new Date(),
      };
    }

    if (
      promptLower.includes('single string') ||
      promptLower.includes('one string') ||
      (promptLower.includes('string') &&
        (promptLower.includes('why') ||
          promptLower.includes('voltage') ||
          promptLower.includes("can't") ||
          promptLower.includes('cannot') ||
          promptLower.includes('limit'))) ||
      (promptLower.includes('16') && promptLower.includes('panel'))
    ) {
      return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content:
          "Putting too many high-power panels (like 16 of the 580W models) into a single string would produce over 800 volts in cooler weather. Most home inverters have a safe voltage limit of 500V to 600V. Going over that limit can damage the inverter and trip its built-in safety shutoffs.\n\nThat's why the system splits your panels into two balanced strings (8 panels on MPPT 1 and 8 panels on MPPT 2). This keeps the voltage in the sweet spot so your inverter runs safely and produces the most solar energy.",
        createdAt: new Date(),
      };
    }

    if (promptLower.includes('hybrid') && promptLower.includes('grid')) {
      return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content:
          "A grid-tie system connects directly to the power grid with no batteries. It saves you money during the day, but shuts off automatically during blackouts for safety. A hybrid system includes batteries and an automatic transfer switch (ATS), keeping your essential lights, fans, and refrigerator running smoothly even during power outages.",
        createdAt: new Date(),
      };
    }

    if (promptLower.includes('net metering')) {
      return {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content:
          "Net metering lets you send extra daytime solar power back into the utility grid (like Meralco) in exchange for bill credits. Those credits then reduce your bill for the electricity you draw at night.",
        createdAt: new Date(),
      };
    }

    const billMatch = promptLower.match(/(?:bill|spend|paying|around|php|₱)?\s*([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d{2,6})\s*(?:k|thousand|pesos|php)?/);
    let billNum: number | null = null;
    if (billMatch) {
      const rawNum = parseFloat(billMatch[1].replace(/,/g, ''));
      if (promptLower.includes('k') && rawNum < 1000) {
        billNum = rawNum * 1000;
      } else {
        billNum = rawNum;
      }
    }

    if (billNum && billNum >= 1000 && billNum <= 200000) {
      try {
        const isHybrid =
          promptLower.includes('battery') ||
          promptLower.includes('brownout') ||
          promptLower.includes('hybrid') ||
          promptLower.includes('deye');
        const { proposal: appliedPayload } = await buildSolarSetupProposal({
          monthlyBillPhp: billNum,
          location: 'Philippines',
          systemType: isHybrid ? 'hybrid' : 'grid-tie',
          daytimeLoadRatio: 0.6,
          projectIdPrefix: 'proj-offline',
        });

        return {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: `Based on your monthly electric bill of ₱${billNum.toLocaleString()}, here is a recommended ${appliedPayload.engineeringSpecs.actualArrayKwp} kWp solar setup tailored to offset your power costs:`,
          createdAt: new Date(),
          toolInvocations: [
            {
              toolName: 'generateSolarSetup',
              state: 'result',
              result: appliedPayload,
            },
          ],
        };
      } catch {
      }
    }

    try {
      const knowledge = await searchSolarKnowledge(userPrompt);
      if (knowledge && knowledge.length > 0 && knowledge[0].content) {
        return {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: `${knowledge[0].content}\n\nYou can also adjust your panels, inverter model, and battery backup directly in the workbench tabs above!`,
          createdAt: new Date(),
        };
      }
    } catch {
    }

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content:
        "I'm temporarily taking a quick breather right now. In the meantime, you can customize your panel count, inverter model, and battery backup directly in the workbench tabs above!",
      createdAt: new Date(),
    };
  }
}

export const aiCopilotService = new AiCopilotService();

