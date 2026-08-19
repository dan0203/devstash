import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { type ItemWithType } from "@/lib/db/items";
import { aggregateTypeCounts, findOwnedCollection, toggleBooleanColumn } from "@/lib/db/query-helpers";

export type CollectionTypeSummary = ReturnType<typeof aggregateTypeCounts>[number];

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
    let lastUpdated: Date | null = null;
    for (const { item } of collection.items) {
      if (!lastUpdated || item.updatedAt > lastUpdated) {
        lastUpdated = item.updatedAt;
      }
    }

    const types = aggregateTypeCounts(collection.items.map(({ item }) => item));

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

export interface PaginatedCollections {
  collections: CollectionWithStats[];
  totalCount: number;
}

export async function getCollectionsPage(
  userId: string,
  page: number,
  perPage: number
): Promise<PaginatedCollections> {
  const withStats = await getCollectionsWithStats(userId);
  const start = (page - 1) * perPage;
  return {
    collections: withStats.slice(start, start + perPage),
    totalCount: withStats.length,
  };
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
  totalCount: number;
}

export async function getCollectionDetail(
  userId: string,
  collectionId: string,
  page: number,
  perPage: number
): Promise<CollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { id: true, name: true, description: true, isFavorite: true },
  });
  if (!collection) return null;

  // Type counts are aggregated over every item in the collection (not just the
  // current page), so this stays a lightweight, non-paginated query — only the
  // itemType relation is selected, no item content/tags/file fields.
  const [allItemTypes, pagedItemCollections, totalCount] = await Promise.all([
    prisma.itemCollection.findMany({
      where: { collectionId },
      select: { item: { select: { itemType: { select: { id: true, icon: true, color: true } } } } },
    }),
    prisma.itemCollection.findMany({
      where: { collectionId },
      include: { item: { include: { tags: true, itemType: true } } },
      orderBy: [{ item: { isPinned: "desc" } }, { item: { updatedAt: "desc" } }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.itemCollection.count({ where: { collectionId } }),
  ]);

  const types = aggregateTypeCounts(allItemTypes.map(({ item }) => item));

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    isFavorite: collection.isFavorite,
    items: pagedItemCollections.map(({ item }) => ({
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
    types,
    totalCount,
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

export interface UpdateCollectionData {
  name: string;
  description: string | null;
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: UpdateCollectionData
): Promise<Collection | null> {
  const existing = await findOwnedCollection(userId, collectionId, { id: true });
  if (!existing) return null;

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: data.name,
      description: data.description,
    },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
  };
}

export async function toggleCollectionFavorite(
  userId: string,
  collectionId: string
): Promise<boolean | null> {
  const existing = await findOwnedCollection(userId, collectionId, { isFavorite: true });
  if (!existing) return null;

  return toggleBooleanColumn("Collection", "isFavorite", collectionId, existing.isFavorite);
}

export async function deleteCollection(userId: string, collectionId: string): Promise<boolean> {
  const existing = await findOwnedCollection(userId, collectionId, { id: true });
  if (!existing) return false;

  // Only removes the Collection row (and its ItemCollection join rows via the
  // schema's onDelete: Cascade) — items themselves are untouched.
  await prisma.collection.delete({ where: { id: collectionId } });
  return true;
}
