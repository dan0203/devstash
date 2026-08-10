import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once NextAuth is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

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

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user.id;
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

export async function getPinnedItems(): Promise<ItemWithType[]> {
  const userId = await getDemoUserId();

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: { tags: true, itemType: true },
    orderBy: { updatedAt: "desc" },
  });

  return items.map(toItemWithType);
}

export async function getRecentItems(limit = 10): Promise<ItemWithType[]> {
  const userId = await getDemoUserId();

  const items = await prisma.item.findMany({
    where: { userId },
    include: { tags: true, itemType: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  return items.map(toItemWithType);
}

export async function getItemStats(): Promise<ItemStats> {
  const userId = await getDemoUserId();

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
