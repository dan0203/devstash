import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const { mockAuth, mockUpdateItem, mockDeleteItem } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpdateItem: vi.fn(),
  mockDeleteItem: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/items"), () => ({
  updateItem: mockUpdateItem,
  deleteItem: mockDeleteItem,
}) as never);

import { updateItem, deleteItem } from "./items";

const validInput = {
  title: "Docker full prune",
  description: "Reclaim disk space",
  content: "docker system prune -a --volumes",
  url: null,
  language: "bash",
  tags: ["docker", "cleanup"],
};

describe("updateItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateItem("item-1", { ...validInput, title: "  " });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateItem("item-1", { ...validInput, url: "not-a-url" });

    expect(result).toEqual({ success: false, error: "Please enter a valid URL" });
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it("returns Item not found when the query function can't find/own the item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUpdateItem.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("validates, delegates to the query function, and returns the updated item on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const updated = { id: "item-1", title: "Docker full prune" };
    mockUpdateItem.mockResolvedValue(updated);

    const result = await updateItem("item-1", validInput);

    expect(mockUpdateItem).toHaveBeenCalledWith("user-1", "item-1", validInput);
    expect(result).toEqual({ success: true, data: updated });
  });
});

describe("deleteItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockDeleteItem).not.toHaveBeenCalled();
  });

  it("returns Item not found when the query function can't find/own the item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDeleteItem.mockResolvedValue(false);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("delegates to the query function and returns success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDeleteItem.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(mockDeleteItem).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true });
  });
});
