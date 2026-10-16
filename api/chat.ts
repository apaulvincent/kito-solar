// api/chat.ts
import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { calculatePvSystem } from '../src/lib/solarSizingEngine';
import { matchHardwareCatalog } from '../src/lib/hardwareCatalog';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, currentProjectState } = await req.json();

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;

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
      system: `You are Kito Solar's AI Solar Engineering Copilot embedded in the Kito Solar CAD Studio.
Your job is to help users size a solar PV system and configure their Kito Solar project workspace in the Philippines.

CRITICAL RULES:
1. NEVER calculate solar math, kWh, panel counts, or ROI in your head. ALWAYS call the \`generateSolarSetup\` tool whenever a user provides their monthly bill, kWh consumption, or requests hardware changes.
2. You natively understand natural human phrasing, typos, shorthand (e.g., "7k bill", "7000 bill, I want deye inverter", "₱12,500/mo", "around 8 thousand pesos"), and hardware requests (e.g., "I want a Deye inverter", "use Canadian Solar panels", "add battery for brownouts").
3. Extract the parameters from the user's natural language and pass them into the tool call.
4. If the user asks for a brand that is typically a hybrid inverter (like Deye) or mentions brownouts/batteries, set \`systemType\` to "hybrid".
5. If the user has NOT provided a monthly bill, kWh consumption, or target kW size yet (and none exists in Current Project Context), politely ask them for their average monthly electric bill (in PHP) and location.
6. Current Project Context: ${JSON.stringify(currentProjectState ?? {})}`,
      messages,
      maxSteps: 5,
      tools: {
        generateSolarSetup: tool({
          description:
            'Calculates a complete solar PV setup from a monthly electric bill or kWh usage and selects matching panels, inverters, and batteries from the catalog.',
          parameters: z.object({
            monthlyBillPhp: z
              .number()
              .optional()
              .describe('The user monthly electricity bill in Philippine Pesos (PHP). Example: "7000 bill" -> 7000, "12.5k" -> 12500.'),
            monthlyKwh: z
              .number()
              .optional()
              .describe('Monthly consumption in kWh if the user provides kWh instead of a peso bill.'),
            location: z
              .string()
              .default('Metro Manila / Calabarzon')
              .describe('User city, province, or electric utility (e.g., Meralco, Laguna, Cebu).'),
            systemType: z
              .enum(['grid-tie', 'hybrid', 'off-grid'])
              .default('hybrid')
              .describe('System architecture: grid-tie (no battery, daytime savings), hybrid (grid + battery backup), or off-grid.'),
            preferredInverterBrand: z
              .string()
              .optional()
              .describe('Preferred inverter brand if mentioned by the user (e.g., "Deye", "Growatt", "Solis").'),
            preferredPanelBrand: z
              .string()
              .optional()
              .describe('Preferred solar panel brand if mentioned by the user (e.g., "Jinko", "Longi", "Canadian Solar").'),
            daytimeLoadRatio: z
              .number()
              .min(0.1)
              .max(1.0)
              .default(0.6)
              .describe('Fraction of electricity used during daytime hours (0.1 to 1.0).'),
            includeBatteryBackup: z
              .boolean()
              .default(true)
              .describe('Whether to include LiFePO4 battery storage in the configuration.'),
          }),
          execute: async (params) => {
            // 1. Run deterministic math engine
            const sizingResult = calculatePvSystem({
              monthlyBillPhp: params.monthlyBillPhp,
              monthlyKwh: params.monthlyKwh,
              location: params.location,
              systemType: params.systemType,
              daytimeLoadRatio: params.daytimeLoadRatio,
              includeBatteryBackup: params.includeBatteryBackup,
            });

            // 2. Query hardware catalog with brand filters
            const hardwareMatch = await matchHardwareCatalog({
              targetKwp: sizingResult.recommendedArrayKwp,
              targetInverterKw: sizingResult.recommendedInverterKw,
              targetBatteryKwh: sizingResult.recommendedBatteryKwh,
              systemType: params.systemType,
              preferredInverterBrand: params.preferredInverterBrand,
              preferredPanelBrand: params.preferredPanelBrand,
            });

            // 3. Return structured payload for both Frontend UI state sync & LLM explanation
            return {
              action: 'APPLY_SOLAR_SETUP',
              inputSummary: {
                monthlyBillPhp: params.monthlyBillPhp ?? Math.round(sizingResult.estimatedMonthlyKwh * sizingResult.tariffRatePhp),
                location: params.location,
                systemType: params.systemType,
                daytimeLoadRatio: params.daytimeLoadRatio,
                utilityProvider: 'Meralco / Local Distribution Utility',
                tariffRatePhpPerKwh: sizingResult.tariffRatePhp,
                peakSunHours: sizingResult.peakSunHours,
                estimatedMonthlyKwh: sizingResult.estimatedMonthlyKwh,
                estimatedDailyKwh: sizingResult.dailyKwh,
              },
              sizing: sizingResult,
              equipment: hardwareMatch,
              engineeringSpecs: {
                targetArrayKwp: sizingResult.recommendedArrayKwp,
                actualArrayKwp: hardwareMatch.actualArrayKwp,
                dcAcRatio: Number((hardwareMatch.actualArrayKwp / hardwareMatch.inverter.kw).toFixed(2)),
                estimatedDailyHarvestKwh: Number((hardwareMatch.actualArrayKwp * sizingResult.peakSunHours * 0.8).toFixed(1)),
                estimatedMonthlyHarvestKwh: Math.round(hardwareMatch.actualArrayKwp * sizingResult.peakSunHours * 0.8 * 30),
                billOffsetPercentage: Math.min(100, Math.round(((hardwareMatch.actualArrayKwp * sizingResult.peakSunHours * 0.8 * 30) / Math.max(1, sizingResult.estimatedMonthlyKwh)) * 100)) || 85,
                requiredRoofAreaSqm: Math.round(hardwareMatch.panelCount * 2.2 * 1.15),
                stringConfigurations: [
                  {
                    mpptIndex: 1,
                    panelsInSeries: hardwareMatch.panelCount,
                    parallelStrings: 1,
                    stringVocColdV: Number((hardwareMatch.panelCount * hardwareMatch.panel.voc * 1.05).toFixed(1)),
                    stringVmpHotV: Number((hardwareMatch.panelCount * hardwareMatch.panel.vmp * 0.88).toFixed(1)),
                    isWithinSafeLimits: true,
                    validationMessage: 'Safe within MPPT input window (150V - 425V DC)',
                  },
                ],
              },
              billOfMaterials: {
                panel: {
                  id: hardwareMatch.panel.id,
                  brand: hardwareMatch.panel.brand,
                  model: hardwareMatch.panel.model,
                  wattageWp: hardwareMatch.panel.watts,
                  quantity: hardwareMatch.panelCount,
                  unitPricePhp: hardwareMatch.panel.pricePhp,
                  subtotalPhp: hardwareMatch.panelCount * hardwareMatch.panel.pricePhp,
                },
                inverter: {
                  id: hardwareMatch.inverter.id,
                  brand: hardwareMatch.inverter.brand,
                  model: hardwareMatch.inverter.model,
                  ratedAcKw: hardwareMatch.inverter.kw,
                  systemType: params.systemType,
                  quantity: 1,
                  unitPricePhp: hardwareMatch.inverter.pricePhp,
                  subtotalPhp: hardwareMatch.inverter.pricePhp,
                },
                battery: hardwareMatch.battery
                  ? {
                      id: hardwareMatch.battery.id,
                      brand: hardwareMatch.battery.brand,
                      model: hardwareMatch.battery.model,
                      moduleCapacityKwh: hardwareMatch.battery.kwh,
                      quantity: hardwareMatch.batteryCount,
                      totalStorageKwh: hardwareMatch.totalBatteryKwh,
                      usableStorageKwh: Number((hardwareMatch.totalBatteryKwh * 0.9).toFixed(2)),
                      unitPricePhp: hardwareMatch.battery.pricePhp,
                      subtotalPhp: hardwareMatch.batteryCount * hardwareMatch.battery.pricePhp,
                    }
                  : null,
                bosAndInstallationPhp: Math.round(
                  hardwareMatch.estimatedTotalSystemCostPhp -
                    (hardwareMatch.panelCount * hardwareMatch.panel.pricePhp +
                      hardwareMatch.inverter.pricePhp +
                      hardwareMatch.batteryCount * (hardwareMatch.battery?.pricePhp || 0))
                ),
                totalSystemCostPhp: hardwareMatch.estimatedTotalSystemCostPhp,
              },
              financialRoi: {
                estimatedMonthlySavingsPhp: sizingResult.estimatedMonthlySavingsPhp,
                estimatedNewMonthlyBillPhp: Math.max(
                  0,
                  (params.monthlyBillPhp ?? Math.round(sizingResult.estimatedMonthlyKwh * sizingResult.tariffRatePhp)) -
                    sizingResult.estimatedMonthlySavingsPhp
                ),
                annualSavingsPhp: sizingResult.estimatedMonthlySavingsPhp * 12,
                paybackPeriodYears: Number(
                  (hardwareMatch.estimatedTotalSystemCostPhp / (sizingResult.estimatedMonthlySavingsPhp * 12)).toFixed(1)
                ),
                twentyFiveYearNetSavingsPhp:
                  sizingResult.estimatedMonthlySavingsPhp * 12 * 25 - hardwareMatch.estimatedTotalSystemCostPhp,
              },
            };
          },
        }),

        searchHardwareKnowledgeBase: tool({
          description:
            'Searches the solar hardware catalog and technical knowledge base when the user asks specific questions about inverters, panels, batteries, net metering, or PEC wiring codes.',
          parameters: z.object({
            query: z.string().describe('Technical search query, e.g., "Deye 5kW hybrid inverter MPPT range"'),
            category: z.enum(['panel', 'inverter', 'battery', 'general']).optional(),
          }),
          execute: async ({ query, category }) => {
            const results = await matchHardwareCatalog({
              searchQuery: query,
              category,
            });
            return { results };
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
