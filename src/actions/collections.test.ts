import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const { mockAuth, mockCreateCollection } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateCollection: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/collections"), () => ({
  createCollection: mockCreateCollection,
}) as never);

import { createCollection } from "./collections";

const validCreateInput = {
  name: "React Patterns",
  description: "Reusable React hooks and components",
};

describe("createCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createCollection(validCreateInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockCreateCollection).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty name without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createCollection({ ...validCreateInput, name: "  " });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Name is required");
    expect(mockCreateCollection).not.toHaveBeenCalled();
  });

  it("creates a collection with a trimmed name and null description when omitted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateCollection.mockResolvedValue({
      id: "col-1",
      name: "React Patterns",
      description: null,
    });

    const result = await createCollection({ name: "React Patterns", description: "" });

    expect(mockCreateCollection).toHaveBeenCalledWith("user-1", {
      name: "React Patterns",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: { id: "col-1", name: "React Patterns", description: null },
    });
  });

  it("delegates to createCollection with a description when provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCreateCollection.mockResolvedValue({
      id: "col-2",
      name: "AI Workflows",
      description: "Prompts and pipelines",
    });

    const result = await createCollection({
      name: "AI Workflows",
      description: "Prompts and pipelines",
    });

    expect(mockCreateCollection).toHaveBeenCalledWith("user-1", {
      name: "AI Workflows",
      description: "Prompts and pipelines",
    });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("AI Workflows");
  });
});
