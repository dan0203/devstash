import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseOrError, passwordsMatchRefinement } from "@/lib/validation";

describe("parseOrError", () => {
  const schema = z.object({ name: z.string().min(1, "Name is required") });

  it("returns the parsed data on success", () => {
    const result = parseOrError(schema, { name: "Ada" });
    expect(result).toEqual({ data: { name: "Ada" } });
  });

  it("returns the first issue's message on failure", () => {
    const result = parseOrError(schema, { name: "" });
    expect(result).toEqual({ error: "Name is required" });
  });
});

describe("passwordsMatchRefinement", () => {
  const [check, options] = passwordsMatchRefinement("password", "confirmPassword");

  it("passes when both fields match", () => {
    expect(check({ password: "abc12345", confirmPassword: "abc12345" })).toBe(true);
  });

  it("fails when the fields differ", () => {
    expect(check({ password: "abc12345", confirmPassword: "different" })).toBe(false);
  });

  it("attaches the error to the confirm field", () => {
    expect(options).toEqual({ message: "Passwords do not match", path: ["confirmPassword"] });
  });

  it("wires into a real Zod schema via .refine()", () => {
    const schema = z
      .object({ password: z.string(), confirmPassword: z.string() })
      .refine(...passwordsMatchRefinement("password", "confirmPassword"));

    expect(schema.safeParse({ password: "a", confirmPassword: "b" }).success).toBe(false);
    expect(schema.safeParse({ password: "a", confirmPassword: "a" }).success).toBe(true);
  });
});
