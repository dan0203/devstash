import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock factories are hoisted above imports/const declarations, so the
// mocks they reference must be created via vi.hoisted().
const { mockAuth, mockResponsesCreate, mockIsAiEnabled } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResponsesCreate: vi.fn(),
  mockIsAiEnabled: vi.fn(),
}));

vi.mock(import("@/auth"), () => ({
  auth: mockAuth,
}));

vi.mock(import("@/lib/openai"), () => ({
  openai: { responses: { create: mockResponsesCreate } },
  AI_MODEL: "gpt-5-nano",
  isAiEnabled: mockIsAiEnabled,
}) as never);

import { generateAutoTags, generateDescription } from "./ai";

const validInput = {
  title: "Docker full prune",
  content: "docker system prune -a --volumes",
};

const validDescriptionInput = {
  title: "Docker full prune",
  content: "docker system prune -a --volumes",
  url: null,
  language: "bash",
  itemType: "command",
};

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAiEnabled.mockReturnValue(true);
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the signed-in user is not Pro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "AI features require a Pro plan" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns an error when AI features aren't configured", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockIsAiEnabled.mockReturnValue(false);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "AI features are not configured" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title without calling OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });

    const result = await generateAutoTags({ ...validInput, title: "  " });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses a {tags: [...]} response, normalizing to lowercase", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ tags: ["Docker", "Cleanup", "docker"] }),
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, tags: ["docker", "cleanup"] });
  });

  it("parses a bare array response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify(["Bash", "System"]),
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, tags: ["bash", "system"] });
  });

  it("truncates content to 2000 chars before calling OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({ output_text: JSON.stringify({ tags: ["tag"] }) });
    const longContent = "a".repeat(5000);

    await generateAutoTags({ ...validInput, content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("a".repeat(2000));
    expect(call.input).not.toContain("a".repeat(2001));
  });

  it("returns a generic error when the OpenAI call throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValue(new Error("network error"));

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't generate tag suggestions. Try again.",
    });
  });

  it("returns a generic error when the response can't be parsed as tags", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({ output_text: "not json" });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't generate tag suggestions. Try again.",
    });
  });
});

describe("generateDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAiEnabled.mockReturnValue(true);
  });

  it("returns an error when there is no signed-in session", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({ success: false, error: "Not signed in" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns an error when the signed-in user is not Pro", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({ success: false, error: "AI features require a Pro plan" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns an error when AI features aren't configured", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockIsAiEnabled.mockReturnValue(false);

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({ success: false, error: "AI features are not configured" });
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title without calling OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });

    const result = await generateDescription({ ...validDescriptionInput, title: "  " });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(mockResponsesCreate).not.toHaveBeenCalled();
  });

  it("parses a {description: ...} response", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "Fully wipes unused Docker resources." }),
    });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: true,
      description: "Fully wipes unused Docker resources.",
    });
  });

  it("works for a link item with no content, using the URL instead", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "A link to the Lucide icon library." }),
    });

    const result = await generateDescription({
      title: "Lucide icons",
      content: null,
      url: "https://lucide.dev",
      language: null,
      itemType: "link",
    });

    expect(result).toEqual({ success: true, description: "A link to the Lucide icon library." });
    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("https://lucide.dev");
  });

  it("truncates content to 2000 chars before calling OpenAI", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({ description: "desc" }),
    });
    const longContent = "a".repeat(5000);

    await generateDescription({ ...validDescriptionInput, content: longContent });

    const call = mockResponsesCreate.mock.calls[0][0];
    expect(call.input).toContain("a".repeat(2000));
    expect(call.input).not.toContain("a".repeat(2001));
  });

  it("returns a generic error when the OpenAI call throws", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockRejectedValue(new Error("network error"));

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't generate a description. Try again.",
    });
  });

  it("returns a generic error when the response can't be parsed as a description", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
    mockResponsesCreate.mockResolvedValue({ output_text: "not json" });

    const result = await generateDescription(validDescriptionInput);

    expect(result).toEqual({
      success: false,
      error: "Couldn't generate a description. Try again.",
    });
  });
});