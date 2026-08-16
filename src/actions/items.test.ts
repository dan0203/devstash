import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const { mockAuth, mockCreateItem, mockUpdateItem, mockDeleteItem, mockGetItemTypeByName } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCreateItem: vi.fn(),
    mockUpdateItem: vi.fn(),
    mockDeleteItem: vi.fn(),
    mockGetItemTypeByName: vi.fn(),
  }));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/db/items"), () => ({
  createItem: mockCreateItem,
  updateItem: mockUpdateItem,
  deleteItem: mockDeleteItem,
}) as never);

vi.mock(import("@/lib/db/item-types"), () => ({
  getItemTypeByName: mockGetItemTypeByName,
}) as never);

import { createItem, updateItem, deleteItem } from "./items";

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
});

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
