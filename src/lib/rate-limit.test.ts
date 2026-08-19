import { describe, expect, it } from "vitest";
import type { Ratelimit } from "@upstash/ratelimit";

import { enforceRateLimit, getClientIp, rateLimitErrorMessage } from "@/lib/rate-limit";

function fakeLimiter(result: { success: boolean; remaining: number; reset: number }): Ratelimit {
  return { limit: async () => result } as unknown as Ratelimit;
}

describe("getClientIp", () => {
  it("reads the first entry from x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(getClientIp(request)).toBe("9.9.9.9");
  });

  it("falls back to unknown when neither header is present", () => {
    expect(getClientIp(new Request("http://localhost"))).toBe("unknown");
  });
});

describe("rateLimitErrorMessage", () => {
  it("pluralizes minutes correctly", () => {
    expect(rateLimitErrorMessage(Date.now() + 30_000)).toContain("1 minute.");
    expect(rateLimitErrorMessage(Date.now() + 120_000)).toContain("2 minutes.");
  });
});

describe("enforceRateLimit", () => {
  it("returns null (allowed) when no limiter is configured", async () => {
    expect(await enforceRateLimit(null, "key")).toBeNull();
  });

  it("returns null (allowed) when the limiter succeeds", async () => {
    const limiter = fakeLimiter({ success: true, remaining: 1, reset: 0 });
    expect(await enforceRateLimit(limiter, "key")).toBeNull();
  });

  it("returns a 429 NextResponse with Retry-After when the limiter is exceeded", async () => {
    const reset = Date.now() + 60_000;
    const limiter = fakeLimiter({ success: false, remaining: 0, reset });

    const response = await enforceRateLimit(limiter, "key");
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBeTruthy();
    await expect(response?.json()).resolves.toMatchObject({ success: false });
  });
});
