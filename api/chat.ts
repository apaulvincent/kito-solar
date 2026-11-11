// api/chat.ts
import { generateText, isStepCount } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import {
  ChatRequestSchema,
  buildCopilotSystemPrompt,
  collectToolInvocations,
  createCopilotTools,
  sanitizeInputText,
} from '../src/lib/copilotTools.js';
import type { ProjectSizingResult } from '../src/types/solar-ai.js';

export const maxDuration = 30;

interface RateLimitCheckResult {
  allowed: boolean;
  status?: number;
  reason?: string;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Fallback store when Upstash Redis credentials are not configured.
const memoryBurstStore = new Map<string, { timestamps: number[] }>();
const memoryDailyStore = new Map<string, { timestamps: number[] }>();
const memoryGlobalTimestamps: number[] = [];

function checkMemoryRateLimits(identifier: string): RateLimitCheckResult {
  const now = Date.now();

  // Global limit: 500 requests per hour across all users.
  const oneHourAgo = now - 3600 * 1000;
  while (memoryGlobalTimestamps.length > 0 && memoryGlobalTimestamps[0] < oneHourAgo) {
    memoryGlobalTimestamps.shift();
  }
  if (memoryGlobalTimestamps.length >= 500) {
    const oldest = memoryGlobalTimestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + 3600 * 1000 - now) / 1000));
    return {
      allowed: false,
      status: 503,
      reason: 'System is experiencing high load across all users. Please try again shortly.',
      limit: 500,
      remaining: 0,
      reset: oldest + 3600 * 1000,
      retryAfter,
    };
  }

  // Burst limit: 8 requests per 60 seconds.
  const oneMinAgo = now - 60 * 1000;
  let burstEntry = memoryBurstStore.get(identifier);
  if (!burstEntry) {
    burstEntry = { timestamps: [] };
    memoryBurstStore.set(identifier, burstEntry);
  }
  burstEntry.timestamps = burstEntry.timestamps.filter((ts) => ts > oneMinAgo);
  if (burstEntry.timestamps.length >= 8) {
    const oldest = burstEntry.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + 60 * 1000 - now) / 1000));
    return {
      allowed: false,
      status: 429,
      reason: 'Too many messages sent too quickly. Please wait a minute.',
      limit: 8,
      remaining: 0,
      reset: oldest + 60 * 1000,
      retryAfter,
    };
  }

  // Daily limit: 35 requests per 24 hours.
  const oneDayAgo = now - 86400 * 1000;
  let dailyEntry = memoryDailyStore.get(identifier);
  if (!dailyEntry) {
    dailyEntry = { timestamps: [] };
    memoryDailyStore.set(identifier, dailyEntry);
  }
  dailyEntry.timestamps = dailyEntry.timestamps.filter((ts) => ts > oneDayAgo);
  if (dailyEntry.timestamps.length >= 35) {
    const oldest = dailyEntry.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + 86400 * 1000 - now) / 1000));
    return {
      allowed: false,
      status: 429,
      reason: 'You have reached your daily limit of 35 solar sizing queries. Please try again tomorrow or contact our engineering team directly.',
      limit: 35,
      remaining: 0,
      reset: oldest + 86400 * 1000,
      retryAfter,
    };
  }

  memoryGlobalTimestamps.push(now);
  burstEntry.timestamps.push(now);
  dailyEntry.timestamps.push(now);

  return {
    allowed: true,
    limit: 8,
    remaining: Math.max(0, 8 - burstEntry.timestamps.length),
    reset: now + 60 * 1000,
  };
}

// Upstash Redis limiters for distributed environments.
let redisClient: Redis | null = null;
let burstLimiter: Ratelimit | null = null;
let dailyLimiter: Ratelimit | null = null;
let globalLimiter: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    burstLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(8, '60 s'),
      prefix: 'ratelimit:burst',
    });
    dailyLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.fixedWindow(35, '24 h'),
      prefix: 'ratelimit:daily',
    });
    globalLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.fixedWindow(500, '1 h'),
      prefix: 'ratelimit:global',
    });
  } catch (err) {
    console.warn('[RateLimit] Failed to connect to Upstash Redis, falling back to in-memory tracking:', err);
  }
}

async function checkRateLimits(identifier: string): Promise<RateLimitCheckResult> {
  if (burstLimiter && dailyLimiter && globalLimiter) {
    try {
      const globalCheck = await globalLimiter.limit('global_chat_limit');
      if (!globalCheck.success) {
        const retryAfter = Math.max(1, Math.ceil((globalCheck.reset - Date.now()) / 1000));
        return {
          allowed: false,
          status: 503,
          reason: 'System is experiencing high load across all users. Please try again shortly.',
          limit: globalCheck.limit,
          remaining: globalCheck.remaining,
          reset: globalCheck.reset,
          retryAfter,
        };
      }

      const burstCheck = await burstLimiter.limit(identifier);
      if (!burstCheck.success) {
        const retryAfter = Math.max(1, Math.ceil((burstCheck.reset - Date.now()) / 1000));
        return {
          allowed: false,
          status: 429,
          reason: 'Too many messages sent too quickly. Please wait a minute.',
          limit: burstCheck.limit,
          remaining: burstCheck.remaining,
          reset: burstCheck.reset,
          retryAfter,
        };
      }

      const dailyCheck = await dailyLimiter.limit(identifier);
      if (!dailyCheck.success) {
        const retryAfter = Math.max(1, Math.ceil((dailyCheck.reset - Date.now()) / 1000));
        return {
          allowed: false,
          status: 429,
          reason: 'You have reached your daily limit of 35 solar sizing queries. Please try again tomorrow or contact our engineering team directly.',
          limit: dailyCheck.limit,
          remaining: dailyCheck.remaining,
          reset: dailyCheck.reset,
          retryAfter,
        };
      }

      return {
        allowed: true,
        limit: burstCheck.limit,
        remaining: burstCheck.remaining,
        reset: burstCheck.reset,
      };
    } catch (redisErr) {
      console.warn('[RateLimit] Upstash Redis request failed, falling back to memory rate limiting:', redisErr);
      return checkMemoryRateLimits(identifier);
    }
  }

  return checkMemoryRateLimits(identifier);
}

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim()) return cfConnectingIp.trim();
  return '127.0.0.1';
}

function verifyOrigin(req: Request): boolean {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  if (!isProd) {
    return true; // Local development and automated testing
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const source = origin || (referer ? new URL(referer).origin : null);

  if (!source) {
    return false;
  }

  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase();
    return (
      host === 'kito-solar.vercel.app' ||
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyOrigin(req)) {
      return new Response(
        JSON.stringify({ error: 'Origin verification failed. Hotlinking or direct API access is not permitted.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Client Identifier & Rate Limiting Check
    const clientIp = getClientIdentifier(req);
    const rateLimit = await checkRateLimits(clientIp);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimit.reason,
          retryAfter: rateLimit.retryAfter,
          reset: rateLimit.reset,
        }),
        {
          status: rateLimit.status || 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    let bodyJson: unknown;
    try {
      bodyJson = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parseResult = ChatRequestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Payload validation failed. Only user and assistant messages under 3,000 characters are permitted.',
          issues: parseResult.error.issues,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, currentProjectState } = parseResult.data;

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

    const google = createGoogleGenerativeAI({ apiKey });

    // Limit conversation context to 15 turns and truncate long messages.
    const sanitizedMessages = messages.slice(-15).map((m) => ({
      role: m.role,
      content: sanitizeInputText(m.content).slice(0, 2000),
    }));

    let appliedPayload: ProjectSizingResult | null = null;

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
    ];

    const systemPrompt = buildCopilotSystemPrompt(currentProjectState);
    const toolsDefinition = createCopilotTools({
      deduplicate: true,
      onProposalBuilt: (proposal) => {
        appliedPayload = proposal;
      },
    });

    const runChatModel = (modelName: string) =>
      generateText({
        model: google(modelName),
        system: systemPrompt,
        messages: sanitizedMessages,
        maxOutputTokens: 1000,
        stopWhen: isStepCount(5),
        tools: toolsDefinition,
      });

    let result: Awaited<ReturnType<typeof runChatModel>> | null = null;
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        result = await runChatModel(modelName);
        if (result) break;
      } catch (err) {
        lastError = err;
        console.warn(
          `Model ${modelName} failed in /api/chat, trying next candidate:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    if (!result) {
      throw lastError || new Error('All candidate Gemini models failed');
    }

    const toolInvocations = collectToolInvocations(result.toolResults, appliedPayload);

    return new Response(
      JSON.stringify({
        text: result.text,
        toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.reset),
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
