import OpenAI from "openai";

// Fail-open-at-import posture matching src/lib/stripe.ts/r2.ts/rate-limit.ts —
// importing this module must never throw at build time (Next's page-data
// collection runs against .env.production, which may have an empty key).
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
  timeout: 20_000,
  maxRetries: 2,
});

export const AI_MODEL = "gpt-5-nano";

export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}