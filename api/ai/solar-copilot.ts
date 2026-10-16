// api/ai/solar-copilot.ts
import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { computeAndMatchSolarSystem, recalculateWithOverrides } from '../../src/lib/solar/sizing-engine';
import { searchSolarKnowledge } from '../../src/lib/solar/rag-search';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Kito Solar AI Sales Engineer embedded inside the Kito Solar PV Sizing Studio.
Your role is to help homeowners, commercial facility managers, and solar engineers size code-compliant solar PV installations in the Philippines.

CRITICAL RULES:
1. NEVER calculate kWh, panel count, inverter sizing, string voltage, or financial ROI in your head. ALWAYS call the provided tools.
2. When a user provides their monthly electricity bill (or monthly kWh) and location, immediately invoke "generateSolarSetupFromBill".
3. If the user does not specify whether they want Grid-Tie (daytime bill offset only, zero power during utility blackouts) or Hybrid (includes LiFePO4 battery storage for brownout backup and evening load offset), recommend Hybrid by default or explain the trade-offs concisely.
4. Only recommend solar panels, inverters, and batteries returned by the tools. Never invent hardware models or arbitrary prices.
5. After calling a sizing tool, summarize the key engineering specs, hardware selection, MPPT string safety validation, and financial payback period in clean, persuasive, humanized language. Remind the user they can click "Apply Setup to Calculator" to update their live workbench.`;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, projectId } = await req.json();

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GOOGLE_GENERATIVE_AI_API_KEY is not configured on the server.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: SYSTEM_PROMPT,
      messages,
      maxSteps: 5,
      tools: {
        generateSolarSetupFromBill: tool({
          description:
            'Calculates a complete, code-compliant solar PV setup from a user monthly electricity bill and matches real hardware from the catalog.',
          parameters: z.object({
            monthlyBillPhp: z.number().positive().describe('Monthly electricity bill in Philippine Pesos (PHP)'),
            location: z
              .string()
              .default('Calabarzon')
              .describe('City, municipality, or province in the Philippines (e.g., San Pablo City, Laguna, Metro Manila, Cebu)'),
            systemType: z
              .enum(['grid-tie', 'hybrid', 'off-grid'])
              .default('hybrid')
              .describe('grid-tie for daytime savings only, hybrid for battery backup + night offset, off-grid for standalone'),
            daytimeLoadRatio: z
              .number()
              .min(0.1)
              .max(1.0)
              .default(0.6)
              .describe('Fraction of electricity used between 8 AM and 4 PM (0.1 to 1.0)'),
            targetOffsetRatio: z
              .number()
              .min(0.3)
              .max(1.0)
              .default(0.85)
              .describe('Target percentage of the total bill the user wants to eliminate (0.3 to 1.0)'),
            budgetTier: z
              .enum(['economy', 'standard', 'premium'])
              .default('standard')
              .describe('Equipment tier preference'),
          }),
          execute: async (params) => {
            const setupResult = computeAndMatchSolarSystem({
              projectId,
              ...params,
            });
            return setupResult;
          },
        }),

        modifyExistingProjectSetup: tool({
          description:
            'Modifies an already generated solar setup when the user asks to change panel count, inverter size, battery capacity, or system type.',
          parameters: z.object({
            monthlyBillPhp: z.number().positive(),
            location: z.string().optional(),
            systemType: z.enum(['grid-tie', 'hybrid', 'off-grid']),
            overridePanelCount: z.number().int().positive().optional().describe('Exact number of solar panels requested'),
            overrideInverterKw: z.number().positive().optional().describe('Target inverter AC rating in kW'),
            overrideBatteryKwh: z.number().min(0).optional().describe('Target total battery bank capacity in kWh'),
          }),
          execute: async (params) => {
            const updatedSetup = recalculateWithOverrides({
              projectId,
              ...params,
            });
            return updatedSetup;
          },
        }),

        searchSolarKnowledgeBase: tool({
          description:
            'Searches the RAG vector database for solar panel/inverter datasheets, Philippine Electrical Code (PEC) rules, net metering regulations, and technical FAQs.',
          parameters: z.object({
            query: z.string().describe('The technical question or hardware model to search for'),
            category: z
              .enum(['datasheet', 'electrical_code', 'net_metering', 'sizing_guide', 'faq'])
              .optional(),
          }),
          execute: async ({ query, category }) => {
            const chunks = await searchSolarKnowledge(query, category);
            return { results: chunks };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
