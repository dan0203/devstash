import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function createLimiter(prefix: string, requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: `ratelimit:${prefix}`,
  });
}

// Limits per context/features/rate-limiting-spec.md.
export const rateLimiters = {
  login: createLimiter("login", 5, "15 m"),
  register: createLimiter("register", 3, "1 h"),
  forgotPassword: createLimiter("forgot-password", 3, "1 h"),
  resetPassword: createLimiter("reset-password", 5, "15 m"),
  resendVerification: createLimiter("resend-verification", 3, "15 m"),
  changePassword: createLimiter("change-password", 5, "15 m"),
  upload: createLimiter("upload", 20, "1 h"),
  aiSuggestTags: createLimiter("ai-suggest-tags", 20, "1 h"),
  aiSuggestDescription: createLimiter("ai-suggest-description", 20, "1 h"),
  aiExplainCode: createLimiter("ai-explain-code", 20, "1 h"),
  aiOptimizePrompt: createLimiter("ai-optimize-prompt", 20, "1 h"),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/** Fails open (allows the request) if Upstash isn't configured or unreachable. */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, remaining: Infinity, reset: 0 };
  }
  try {
    return await limiter.limit(key);
  } catch (error) {
    console.error("Rate limit check failed, allowing request", error);
    return { success: true, remaining: Infinity, reset: 0 };
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimitErrorMessage(reset: number): string {
  const minutes = Math.max(1, Math.ceil((reset - Date.now()) / 60_000));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export function rateLimitResponse(reset: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return NextResponse.json(
    { success: false, error: rateLimitErrorMessage(reset) },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
