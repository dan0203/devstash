import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

// See src/actions/auth.test.ts for why next-auth itself needs mocking.
vi.mock(import("next-auth"), async () => {
  const { AuthError, CredentialsSignin } = await import("@auth/core/errors");
  return { AuthError, CredentialsSignin };
});

vi.mock(import("@/auth"), () => ({
  signIn: mockSignIn,
}));

import { signInAsDemoUser } from "./demo";

describe("signInAsDemoUser", () => {
  const originalEmail = process.env.DEMO_ACCOUNT_EMAIL;
  const originalPassword = process.env.DEMO_ACCOUNT_PASSWORD;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEMO_ACCOUNT_EMAIL = "guest@devstash.io";
    process.env.DEMO_ACCOUNT_PASSWORD = "correct-horse-battery-staple";
  });

  afterEach(() => {
    process.env.DEMO_ACCOUNT_EMAIL = originalEmail;
    process.env.DEMO_ACCOUNT_PASSWORD = originalPassword;
  });

  it("returns demo_unavailable when the demo account isn't configured", async () => {
    delete process.env.DEMO_ACCOUNT_EMAIL;

    const result = await signInAsDemoUser();

    expect(result).toEqual({ code: "demo_unavailable" });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("signs in with the configured demo credentials", async () => {
    mockSignIn.mockResolvedValue(undefined);

    const result = await signInAsDemoUser();

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "guest@devstash.io",
      password: "correct-horse-battery-staple",
      redirectTo: "/dashboard",
    });
    expect(result).toEqual({ code: null });
  });

  it("surfaces a CredentialsSignin error's code", async () => {
    const { CredentialsSignin } = await import("@auth/core/errors");
    class TestError extends CredentialsSignin {
      code = "rate_limited";
    }
    mockSignIn.mockRejectedValue(new TestError());

    const result = await signInAsDemoUser();

    expect(result).toEqual({ code: "rate_limited" });
  });
});
