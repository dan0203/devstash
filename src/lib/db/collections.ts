import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { type ItemWithType } from "@/lib/db/items";

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

const getCollectionsWithStats = cache(async (userId: string): Promise<CollectionWithStats[]> => {
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

  return withStats.sort(
    (a, b) => (b.lastUpdated?.getTime() ?? 0) - (a.lastUpdated?.getTime() ?? 0)
  );
});

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionWithStats[]> {
  const withStats = await getCollectionsWithStats(userId);
  return withStats.slice(0, limit);
}

export async function getAllCollections(userId: string): Promise<CollectionWithStats[]> {
  return getCollectionsWithStats(userId);
}

export async function getFavoriteCollections(userId: string): Promise<CollectionWithStats[]> {
  const withStats = await getCollectionsWithStats(userId);
  return withStats.filter((collection) => collection.isFavorite);
}

export async function getSidebarRecentCollections(
  userId: string,
  limit = 5
): Promise<CollectionWithStats[]> {
  const withStats = await getCollectionsWithStats(userId);
  return withStats.filter((collection) => !collection.isFavorite).slice(0, limit);
}

export interface CollectionOption {
  id: string;
  name: string;
}

export async function getUserCollections(userId: string): Promise<CollectionOption[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return collections;
}

export async function getCollectionStats(userId: string): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}

export interface CollectionDetail {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  items: ItemWithType[];
  types: CollectionTypeSummary[];
}

export async function getCollectionDetail(
  userId: string,
  collectionId: string
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      items: {
        include: {
          item: { include: { tags: true, itemType: true } },
        },
        orderBy: { item: { updatedAt: "desc" } },
      },
    },
  });
  if (!collection) return null;

  const typeCounts = new Map<string, CollectionTypeSummary>();
  for (const { item } of collection.items) {
    const existing = typeCounts.get(item.itemType.id);
    typeCounts.set(item.itemType.id, {
      icon: item.itemType.icon,
      color: item.itemType.color,
      count: (existing?.count ?? 0) + 1,
    });
  }

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    items: collection.items.map(({ item }) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      tags: item.tags.map((tag) => tag.name),
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      fileSize: item.fileSize,
      content: item.content,
      url: item.url,
      itemType: {
        name: item.itemType.name,
        icon: item.itemType.icon,
        color: item.itemType.color,
      },
    })),
    types: [...typeCounts.values()].sort((a, b) => b.count - a.count),
  };
}

export interface CreateCollectionData {
  name: string;
  description: string | null;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
}

export async function createCollection(
  userId: string,
  data: CreateCollectionData
): Promise<Collection> {
  const collection = await prisma.collection.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
    },
  });

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
  };
}
