import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

import { requireApiSession, requireSession } from "@/lib/auth-utils";

describe("requireSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireSession();
    expect(result).toEqual({ ok: false, error: "Not signed in" });
  });

  it("returns the session's userId and isPro when signed in", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    const result = await requireSession();
    expect(result).toEqual({ ok: true, userId: "user-1", isPro: true });
  });

  it("defaults isPro to false when unset", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const result = await requireSession();
    expect(result).toEqual({ ok: true, userId: "user-1", isPro: false });
  });
});

describe("requireApiSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 401 NextResponse when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireApiSession();

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected ok: false");
    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({
      success: false,
      error: "Not signed in",
    });
  });

  it("returns the session's userId and isPro when signed in", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    const result = await requireApiSession();
    expect(result).toEqual({ ok: true, userId: "user-1", isPro: true });
  });
});
