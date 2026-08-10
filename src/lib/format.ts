const UNITS: [string, number][] = [
  ["y", 1000 * 60 * 60 * 24 * 365],
  ["mo", 1000 * 60 * 60 * 24 * 30],
  ["w", 1000 * 60 * 60 * 24 * 7],
  ["d", 1000 * 60 * 60 * 24],
  ["h", 1000 * 60 * 60],
  ["m", 1000 * 60],
];

export function formatRelativeTime(dateString: string, now: Date = new Date()) {
  const diffMs = now.getTime() - new Date(dateString).getTime();

  if (diffMs < 60 * 1000) return "just now";

  for (const [suffix, ms] of UNITS) {
    if (diffMs >= ms) {
      return `${Math.floor(diffMs / ms)}${suffix} ago`;
    }
  }
  return "just now";
}
