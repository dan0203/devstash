import { Mistral } from "@mistralai/mistralai";

// Fail-open-at-import posture matching src/lib/stripe.ts/r2.ts/rate-limit.ts —
// importing this module must never throw at build time (Next's page-data
// collection runs against .env.production, which may have an empty key).
export const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || "placeholder",
});

export const AI_MODEL = "ministral-14b-latest";

export function isAiEnabled(): boolean {
  return Boolean(process.env.MISTRAL_API_KEY);
}
