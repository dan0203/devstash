import { prisma } from "@/lib/prisma";
import { formatItemTypeName, getSystemItemTypesOrdered } from "@/lib/db/item-types";
import { getItemCountsByTypeId } from "@/lib/db/query-helpers";

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
  const [totalItems, totalCollections, itemTypes, countByTypeId] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    getSystemItemTypesOrdered(),
    getItemCountsByTypeId(userId),
  ]);

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
