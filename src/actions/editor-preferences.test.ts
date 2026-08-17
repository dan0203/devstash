import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockUpdateEditorPreferences } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpdateEditorPreferences: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/user"), () => ({
  updateEditorPreferences: mockUpdateEditorPreferences,
}) as never);

import { updateEditorPreferences } from "./editor-preferences";

const validInput = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark" as const,
};

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateEditorPreferences(validInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("returns a validation error for an unsupported font size without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({ ...validInput, fontSize: 15 });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid font size");
    expect(mockUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("returns a validation error for an unsupported tab size without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({ ...validInput, tabSize: 3 });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid tab size");
    expect(mockUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("returns a validation error for an unsupported theme without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateEditorPreferences({
      ...validInput,
      theme: "monokai-nope" as unknown as "monokai",
    });

    expect(result.success).toBe(false);
    expect(mockUpdateEditorPreferences).not.toHaveBeenCalled();
  });

  it("delegates to updateEditorPreferences and returns the saved preferences", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateEditorPreferences.mockResolvedValue(validInput);

    const result = await updateEditorPreferences(validInput);

    expect(mockUpdateEditorPreferences).toHaveBeenCalledWith("user-1", validInput);
    expect(result).toEqual({ success: true, data: validInput });
  });
});
