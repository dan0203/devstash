import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const {
  mockAuth,
  mockCreateItem,
  mockUpdateItem,
  mockDeleteItem,
  mockToggleItemFavorite,
  mockToggleItemPin,
  mockGetItemTypeByName,
  mockGetItemStats,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCreateItem: vi.fn(),
  mockUpdateItem: vi.fn(),
  mockDeleteItem: vi.fn(),
  mockToggleItemFavorite: vi.fn(),
  mockToggleItemPin: vi.fn(),
  mockGetItemTypeByName: vi.fn(),
  mockGetItemStats: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/items"), () => ({
  createItem: mockCreateItem,
  updateItem: mockUpdateItem,
  deleteItem: mockDeleteItem,
  toggleItemFavorite: mockToggleItemFavorite,
  toggleItemPin: mockToggleItemPin,
  getItemStats: mockGetItemStats,
}) as never);

vi.mock(import("@/lib/db/item-types"), () => ({
  getItemTypeByName: mockGetItemTypeByName,
}) as never);

import { createItem, updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from "./items";

const validCreateInput = {
  itemType: "snippet" as const,
  title: "Docker full prune",
  description: "Reclaim disk space",
  content: "docker system prune -a --volumes",
  language: "bash",
  url: "",
  fileUrl: "",
  fileName: "",
  fileSize: null,
  tags: ["docker", "cleanup"],
  collectionIds: ["col-1"],
};

describe("createItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title without touching the database", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createItem({ ...validCreateInput, title: "  " });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("returns a validation error when a link has no URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createItem({ ...validCreateInput, itemType: "link", url: "" });

    expect(result).toEqual({ success: false, error: "Please enter a valid URL" });
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("returns Invalid item type when the item type can't be resolved", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetItemTypeByName.mockResolvedValue(null);

    const result = await createItem(validCreateInput);

    expect(result).toEqual({ success: false, error: "Invalid item type" });
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("validates, delegates to the query function, and returns the created item on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetItemTypeByName.mockResolvedValue({ id: "type-1", name: "snippet" });
    const created = { id: "item-1", title: "Docker full prune" };
    mockCreateItem.mockResolvedValue(created);

    const result = await createItem(validCreateInput);

    expect(mockGetItemTypeByName).toHaveBeenCalledWith("snippet");
    expect(mockCreateItem).toHaveBeenCalledWith("user-1", "type-1", {
      title: "Docker full prune",
      description: "Reclaim disk space",
      contentType: "text",
      content: "docker system prune -a --volumes",
      url: null,
      language: "bash",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      tags: ["docker", "cleanup"],
      collectionIds: ["col-1"],
    });
    expect(result).toEqual({ success: true, data: created });
  });

  it("stores the URL and omits content for a link item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetItemTypeByName.mockResolvedValue({ id: "type-link", name: "link" });
    mockCreateItem.mockResolvedValue({ id: "item-1" });

    await createItem({
      ...validCreateInput,
      itemType: "link",
      url: "https://example.com",
    });

    expect(mockCreateItem).toHaveBeenCalledWith(
      "user-1",
      "type-link",
      expect.objectContaining({ contentType: "url", content: null, url: "https://example.com" })
    );
  });

  it("returns a validation error when a file item has no uploaded file", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createItem({ ...validCreateInput, itemType: "file", fileUrl: "" });

    expect(result).toEqual({ success: false, error: "Please upload a file" });
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("stores file metadata and omits content/url for an image item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetItemTypeByName.mockResolvedValue({ id: "type-image", name: "image" });
    mockCreateItem.mockResolvedValue({ id: "item-1" });

    await createItem({
      ...validCreateInput,
      itemType: "image",
      fileUrl: "https://r2.example.com/user-1/photo.png",
      fileName: "photo.png",
      fileSize: 1024,
    });

    expect(mockCreateItem).toHaveBeenCalledWith(
      "user-1",
      "type-image",
      expect.objectContaining({
        contentType: "file",
        content: null,
        url: null,
        fileUrl: "https://r2.example.com/user-1/photo.png",
        fileName: "photo.png",
        fileSize: 1024,
      })
    );
  });

  describe("with ENFORCE_PLAN_LIMITS=true", () => {
    const originalEnforce = process.env.ENFORCE_PLAN_LIMITS;

    beforeEach(() => {
      process.env.ENFORCE_PLAN_LIMITS = "true";
    });

    afterEach(() => {
      process.env.ENFORCE_PLAN_LIMITS = originalEnforce;
    });

    it("rejects a free user at the item limit", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });
      mockGetItemStats.mockResolvedValue({ total: 50, favorites: 0 });

      const result = await createItem(validCreateInput);

      expect(result).toEqual({
        success: false,
        error: "Free plan limit reached (50 items). Upgrade to Pro for unlimited items.",
      });
      expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it("never blocks a pro user regardless of item count", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockGetItemStats.mockResolvedValue({ total: 200, favorites: 0 });
      mockGetItemTypeByName.mockResolvedValue({ id: "type-1", name: "snippet" });
      mockCreateItem.mockResolvedValue({ id: "item-1" });

      const result = await createItem(validCreateInput);

      expect(result.success).toBe(true);
      expect(mockCreateItem).toHaveBeenCalled();
    });

    it("rejects a free user creating a file item", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });
      mockGetItemStats.mockResolvedValue({ total: 0, favorites: 0 });

      const result = await createItem({
        ...validCreateInput,
        itemType: "file",
        fileUrl: "https://r2.example.com/user-1/doc.pdf",
      });

      expect(result).toEqual({
        success: false,
        error: "File and image uploads require a Pro plan",
      });
      expect(mockCreateItem).not.toHaveBeenCalled();
    });
  });
});

const validInput = {
  title: "Docker full prune",
  description: "Reclaim disk space",
  content: "docker system prune -a --volumes",
  url: null,
  language: "bash",
  tags: ["docker", "cleanup"],
  collectionIds: ["col-1"],
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

describe("toggleItemFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockToggleItemFavorite).not.toHaveBeenCalled();
  });

  it("returns Item not found when the query function can't find/own the item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemFavorite.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("delegates to the query function and returns the new favorite state", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemFavorite.mockResolvedValue(true);

    const result = await toggleItemFavorite("item-1");

    expect(mockToggleItemFavorite).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true, isFavorite: true });
  });
});

describe("toggleItemPin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await toggleItemPin("item-1");

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockToggleItemPin).not.toHaveBeenCalled();
  });

  it("returns Item not found when the query function can't find/own the item", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemPin.mockResolvedValue(null);

    const result = await toggleItemPin("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
  });

  it("delegates to the query function and returns the new pin state", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockToggleItemPin.mockResolvedValue(true);

    const result = await toggleItemPin("item-1");

    expect(mockToggleItemPin).toHaveBeenCalledWith("user-1", "item-1");
    expect(result).toEqual({ success: true, isPinned: true });
  });
});
