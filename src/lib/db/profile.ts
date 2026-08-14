import { prisma } from "@/lib/prisma";
import { formatItemTypeName, getSystemItemTypesOrdered } from "@/lib/db/item-types";

export interface ProfileTypeBreakdown {
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  typeBreakdown: ProfileTypeBreakdown[];
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, itemTypes, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    getSystemItemTypesOrdered(),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { itemTypeId: true },
    }),
  ]);

  const countByTypeId = new Map(counts.map((c) => [c.itemTypeId, c._count.itemTypeId]));

  return {
    totalItems,
    totalCollections,
    typeBreakdown: itemTypes.map((itemType) => ({
      name: formatItemTypeName(itemType.name),
      icon: itemType.icon,
      color: itemType.color,
      count: countByTypeId.get(itemType.id) ?? 0,
    })),
  };
}
