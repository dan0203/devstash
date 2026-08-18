export const FREE_TIER_LIMITS = { items: 50, collections: 3 } as const;

export function isOverItemLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.items;
}

export function isOverCollectionLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.collections;
}
