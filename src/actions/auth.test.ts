import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const { mockAuth, mockSignOut, mockUserDelete } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockSignOut: vi.fn(),
  mockUserDelete: vi.fn(),
}));

// The real `next-auth` package eagerly imports `next/server`, which Next.js's
// (deliberately non-standard) package.json#exports map doesn't expose to
// strict-resolution bundlers like Vite/Vitest outside of Next's own build.
// Re-export the framework-agnostic error classes from @auth/core instead so
// `instanceof` checks in src/actions/auth.ts still behave correctly.
vi.mock(import("next-auth"), async () => {
  const { AuthError, CredentialsSignin } = await import("@auth/core/errors");
  return { AuthError, CredentialsSignin };
});

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
  signIn: vi.fn(),
  signOut: mockSignOut,
}));

vi.mock(import("@/lib/prisma"), () => ({
  prisma: { user: { delete: mockUserDelete } },
}) as never);

import { deleteAccount } from "./auth";

describe("deleteAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteAccount();

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockUserDelete).not.toHaveBeenCalled();
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("deletes the signed-in user and signs out", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUserDelete.mockResolvedValue({ id: "user-1" });
    mockSignOut.mockResolvedValue(undefined);

    const result = await deleteAccount();

    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
    expect(result).toEqual({ success: true });
  });
});
