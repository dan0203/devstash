export const FREE_TIER_LIMITS = { items: 50, collections: 3 } as const;

// Per project-overview.md's dev-mode note ("leave all features unlocked for all
// users during development"), callers must gate on this before acting on
// isOverItemLimit/isOverCollectionLimit — defaults off, unlike
// EMAIL_VERIFICATION_ENABLED which defaults on.
export function isPlanLimitsEnforced(): boolean {
  return process.env.ENFORCE_PLAN_LIMITS === "true";
}

export function isOverItemLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.items;
}

export function isOverCollectionLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.collections;
}
