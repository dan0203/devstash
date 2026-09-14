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
 * Validates a URL, treating a value with no scheme (e.g. "google.fr") as if it were prefixed
 * with "https://" first. Returns the normalized http(s) URL when valid, or null otherwise.
 * Rejects single-label hosts like "google" (no TLD) and bare IPv4 loopback-style hosts, requiring
 * either a dot-separated hostname or a bracketed IPv6 literal.
 */
export function isValidUrl(url: string): string | null {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }
  const hostname = parsed.hostname;
  if (!hostname) {
    return null;
  }
  const isIpv6 = hostname.startsWith("[") && hostname.endsWith("]");
  if (!isIpv6 && !hostname.includes(".") && hostname !== "localhost") {
    return null;
  }
  return normalized;
}

/**
 * Builds the predicate + options pair for a Zod `.refine()` call that checks
 * two password fields match, e.g. `.refine(...passwordsMatchRefinement("password", "confirmPassword"))`.
 */
export function passwordsMatchRefinement<T extends string, U extends string>(
  passwordField: T,
  confirmField: U,
): [(data: Record<T | U, string>) => boolean, { message: string; path: [U] }] {
  return [
    (data) => data[passwordField] === data[confirmField],
    { message: "Passwords do not match", path: [confirmField] },
  ];
}
