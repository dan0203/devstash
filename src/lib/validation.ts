import type { ZodType } from "zod";

/** Runs a Zod schema and reduces a failure to its first issue's message. */
export function parseOrError<T>(schema: ZodType<T>, input: unknown): { data: T } | { error: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  return { data: parsed.data };
}