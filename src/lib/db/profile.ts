import { prisma } from "@/lib/prisma";

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

const ITEM_TYPE_DISPLAY_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
];

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [totalItems, totalCollections, itemTypes, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({ where: { isSystem: true } }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId },
      _count: { itemTypeId: true },
    }),
  ]);

  itemTypes.sort(
    (a, b) => ITEM_TYPE_DISPLAY_ORDER.indexOf(a.name) - ITEM_TYPE_DISPLAY_ORDER.indexOf(b.name)
  );
  const countByTypeId = new Map(counts.map((c) => [c.itemTypeId, c._count.itemTypeId]));

  return {
    totalItems,
    totalCollections,
    typeBreakdown: itemTypes.map((itemType) => ({
      name: itemType.name.charAt(0).toUpperCase() + itemType.name.slice(1) + "s",
      icon: itemType.icon,
      color: itemType.color,
      count: countByTypeId.get(itemType.id) ?? 0,
    })),
  };
}
