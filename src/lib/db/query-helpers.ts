import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Flips a boolean column via raw SQL, bypassing Prisma Client's mutation
 * resolver (which sets @updatedAt on every .update() call) — used for
 * toggles (favorite/pin) that shouldn't reorder recency-sorted lists.
 * `table`/`field` are always internal string-literal constants at call
 * sites, never user input, so the identifier interpolation is safe.
 */
export async function toggleBooleanColumn(
  table: "Item" | "Collection",
  field: string,
  id: string,
  currentValue: boolean
): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Record<string, boolean>[]>(
    `UPDATE "${table}" SET "${field}" = $1 WHERE "id" = $2 RETURNING "${field}"`,
    !currentValue,
    id
  );
  return rows[0][field];
}

export function findOwnedItem<T extends Prisma.ItemSelect>(
  userId: string,
  itemId: string,
  select: T
) {
  return prisma.item.findFirst({ where: { id: itemId, userId }, select });
}

export function findOwnedCollection<T extends Prisma.CollectionSelect>(
  userId: string,
  collectionId: string,
  select: T
) {
  return prisma.collection.findFirst({ where: { id: collectionId, userId }, select });
}

export interface TypeCountable {
  itemType: { id: string; icon: string; color: string };
}

export interface TypeCount {
  icon: string;
  color: string;
  count: number;
}

/** Aggregates per-item-type counts, sorted most-used first. */
export function aggregateTypeCounts(items: TypeCountable[]): TypeCount[] {
  const typeCounts = new Map<string, TypeCount>();

  for (const { itemType } of items) {
    const existing = typeCounts.get(itemType.id);
    typeCounts.set(itemType.id, {
      icon: itemType.icon,
      color: itemType.color,
      count: (existing?.count ?? 0) + 1,
    });
  }

  return [...typeCounts.values()].sort((a, b) => b.count - a.count);
}

/** Maps each of a user's item-type ids to how many items they have of that type. */
export async function getItemCountsByTypeId(userId: string): Promise<Map<string, number>> {
  const counts = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId },
    _count: { itemTypeId: true },
  });

  return new Map(counts.map((c) => [c.itemTypeId, c._count.itemTypeId]));
}