import type { ZodType } from "zod";

/** Runs a Zod schema and reduces a failure to its first issue's message. */
export function parseOrError<T>(schema: ZodType<T>, input: unknown): { data: T } | { error: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  return { data: parsed.data };
}

/**
 * Builds the predicate + options pair for a Zod `.refine()` call that checks
 * two password fields match, e.g. `.refine(...passwordsMatchRefinement("password", "confirmPassword"))`.
 */
export function passwordsMatchRefinement<T extends string, U extends string>(
  passwordField: T,
  confirmField: U
): [(data: Record<T | U, string>) => boolean, { message: string; path: [U] }] {
  return [
    (data) => data[passwordField] === data[confirmField],
    { message: "Passwords do not match", path: [confirmField] },
  ];
}