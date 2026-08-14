import { describe, expect, it, vi } from "vitest";

// item-types.ts imports the Prisma client purely for getSystemItemTypesOrdered();
// pluralize/formatItemTypeName are pure and don't need a real DB connection.
vi.mock(import("@/lib/prisma"), () => ({ prisma: {} }) as never);

import { formatItemTypeName, pluralize } from "./item-types";

describe("pluralize", () => {
  it("pluralizes regular words with 's'", () => {
    expect(pluralize("snippet")).toBe("snippets");
    expect(pluralize("prompt")).toBe("prompts");
    expect(pluralize("command")).toBe("commands");
    expect(pluralize("note")).toBe("notes");
    expect(pluralize("link")).toBe("links");
    expect(pluralize("file")).toBe("files");
    expect(pluralize("image")).toBe("images");
  });

  it("pluralizes words ending in s/x/z/sh/ch with 'es'", () => {
    expect(pluralize("box")).toBe("boxes");
    expect(pluralize("class")).toBe("classes");
    expect(pluralize("buzz")).toBe("buzzes");
    expect(pluralize("wish")).toBe("wishes");
  });

  it("pluralizes words ending in consonant+y with 'ies'", () => {
    expect(pluralize("category")).toBe("categories");
  });

  it("does not apply the consonant+y rule to vowel+y", () => {
    expect(pluralize("key")).toBe("keys");
  });
});

describe("formatItemTypeName", () => {
  it("pluralizes and capitalizes the first letter", () => {
    expect(formatItemTypeName("snippet")).toBe("Snippets");
    expect(formatItemTypeName("category")).toBe("Categories");
  });
});
