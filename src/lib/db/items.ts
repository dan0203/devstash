import { prisma } from "@/lib/prisma";
import { formatItemTypeName, getSystemItemTypesOrdered, pluralize } from "@/lib/db/item-types";

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  itemType: {
    icon: string;
    color: string;
  };
}

export interface ItemStats {
  total: number;
  favorites: number;
}

export interface ItemTypeWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
}

function toItemWithType(item: {
  id: string;
  title: string;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: { icon: string; color: string };
}): ItemWithType {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    tags: item.tags.map((tag) => tag.name),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: item.updatedAt,
    itemType: item.itemType,
  };
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: { tags: true, itemType: true },
    orderBy: { updatedAt: "desc" },
  });

  return items.map(toItemWithType);
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: { tags: true, itemType: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return items.map(toItemWithType);
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}

export async function getItemTypesWithCounts(userId: string): Promise<ItemTypeWithCount[]> {
  const itemTypes = await getSystemItemTypesOrdered();

  const counts = await prisma.item.groupBy({
    by: ["itemTypeId"],
    where: { userId },
    _count: { itemTypeId: true },
  });
  const countByTypeId = new Map(counts.map((c) => [c.itemTypeId, c._count.itemTypeId]));

  return itemTypes.map((itemType) => ({
    id: itemType.id,
    name: formatItemTypeName(itemType.name),
    slug: pluralize(itemType.name),
    icon: itemType.icon,
    color: itemType.color,
    count: countByTypeId.get(itemType.id) ?? 0,
  }));
}
