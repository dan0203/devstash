import { prisma } from "@/lib/prisma";
import { formatItemTypeName, getSystemItemTypesOrdered, pluralize } from "@/lib/db/item-types";
import { deleteFromR2, r2KeyFromUrl } from "@/lib/r2";

export interface ItemWithType {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  content: string | null;
  url: string | null;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
}

export interface ItemStats {
  total: number;
  favorites: number;
}

export interface ItemDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
  collections: { id: string; name: string }[];
}

export interface ItemTypeWithCount {
  id: string;
  value: string;
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
  createdAt: Date;
  updatedAt: Date;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  content: string | null;
  url: string | null;
  tags: { name: string }[];
  itemType: { name: string; icon: string; color: string };
}): ItemWithType {
  return {
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

const itemDetailInclude = {
  tags: true,
  itemType: true,
  collections: { include: { collection: true } },
} as const;

function toItemDetail(item: {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  content: string | null;
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  language: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: { name: string; icon: string; color: string };
  collections: { collection: { id: string; name: string } }[];
}): ItemDetail {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    contentType: item.contentType,
    content: item.content,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    language: item.language,
    tags: item.tags.map((tag) => tag.name),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemType: {
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
    collections: item.collections.map(({ collection }) => ({
      id: collection.id,
      name: collection.name,
    })),
  };
}

export async function getItemDetail(userId: string, itemId: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: itemDetailInclude,
  });
  if (!item) return null;

  return toItemDetail(item);
}

async function ownedCollectionIds(userId: string, collectionIds: string[]): Promise<string[]> {
  if (collectionIds.length === 0) return [];
  const owned = await prisma.collection.findMany({
    where: { id: { in: collectionIds }, userId },
    select: { id: true },
  });
  return owned.map((c) => c.id);
}

export interface UpdateItemData {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemData
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const collectionIds = await ownedCollectionIds(userId, data.collectionIds);

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { name, userId },
        })),
      },
      collections: {
        deleteMany: {},
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });

  return toItemDetail(item);
}

export interface CreateItemData {
  title: string;
  description: string | null;
  contentType: "text" | "url" | "file";
  content: string | null;
  url: string | null;
  language: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  collectionIds: string[];
}

export async function createItem(
  userId: string,
  itemTypeId: string,
  data: CreateItemData
): Promise<ItemDetail> {
  const collectionIds = await ownedCollectionIds(userId, data.collectionIds);

  const item = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      userId,
      itemTypeId,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { name, userId },
        })),
      },
      collections: {
        create: collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
    include: itemDetailInclude,
  });

  return toItemDetail(item);
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, contentType: true, fileUrl: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id: itemId } });

  if (existing.contentType === "file" && existing.fileUrl) {
    await deleteFromR2(r2KeyFromUrl(existing.fileUrl));
  }

  return true;
}

export interface PaginatedItems {
  items: ItemWithType[];
  totalCount: number;
}

export async function getItemsByType(
  userId: string,
  itemTypeId: string,
  page: number,
  perPage: number
): Promise<PaginatedItems> {
  const where = { userId, itemTypeId };

  const [items, totalCount] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { tags: true, itemType: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.item.count({ where }),
  ]);

  return { items: items.map(toItemWithType), totalCount };
}

export interface SearchItem {
  id: string;
  title: string;
  preview: string | null;
  itemType: {
    name: string;
    icon: string;
    color: string;
  };
}

export async function getAllItemsForSearch(userId: string): Promise<SearchItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      url: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    preview: item.description ?? item.content ?? item.url ?? null,
    itemType: item.itemType,
  }));
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
    value: itemType.name,
    name: formatItemTypeName(itemType.name),
    slug: pluralize(itemType.name),
    icon: itemType.icon,
    color: itemType.color,
    count: countByTypeId.get(itemType.id) ?? 0,
  }));
}
