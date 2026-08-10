import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once NextAuth is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

export interface CollectionTypeSummary {
  icon: string;
  color: string;
  count: number;
}

export interface CollectionWithStats {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  color: string;
  types: CollectionTypeSummary[];
  lastUpdated: Date | null;
}

export interface CollectionStats {
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

export async function getRecentCollections(limit = 6): Promise<CollectionWithStats[]> {
  const userId = await getDemoUserId();

  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          item: { include: { itemType: true } },
        },
      },
    },
  });

  const withStats = collections.map((collection) => {
    const typeCounts = new Map<string, CollectionTypeSummary>();
    let lastUpdated: Date | null = null;

    for (const { item } of collection.items) {
      const existing = typeCounts.get(item.itemType.id);
      typeCounts.set(item.itemType.id, {
        icon: item.itemType.icon,
        color: item.itemType.color,
        count: (existing?.count ?? 0) + 1,
      });
      if (!lastUpdated || item.updatedAt > lastUpdated) {
        lastUpdated = item.updatedAt;
      }
    }

    const types = [...typeCounts.values()].sort((a, b) => b.count - a.count);

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection.items.length,
      color: types[0]?.color ?? "#6b7280",
      types,
      lastUpdated,
    };
  });

  return withStats
    .sort((a, b) => (b.lastUpdated?.getTime() ?? 0) - (a.lastUpdated?.getTime() ?? 0))
    .slice(0, limit);
}

export async function getCollectionStats(): Promise<CollectionStats> {
  const userId = await getDemoUserId();

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
