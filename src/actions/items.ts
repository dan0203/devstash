"use server";

import { z } from "zod";

import {
  createItem as createItemRecord,
  updateItem as updateItemRecord,
  deleteItem as deleteItemRecord,
  toggleItemFavorite as toggleItemFavoriteRecord,
  toggleItemPin as toggleItemPinRecord,
  getItemStats,
  type ItemDetail,
} from "@/lib/db/items";
import { getItemTypeByName } from "@/lib/db/item-types";
import { FREE_TIER_LIMITS, checkPlanLimit, isOverItemLimit, isPlanLimitsEnforced } from "@/lib/plan-limits";
import { requireSession } from "@/lib/auth-utils";
import { parseOrError } from "@/lib/validation";

const CREATABLE_ITEM_TYPES = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
] as const;
const FILE_ITEM_TYPES = new Set(["file", "image"]);

function buildCreateItemSchema(isPro: boolean) {
  return z
    .object({
      itemType: z.enum(CREATABLE_ITEM_TYPES),
      title: z.string().trim().min(1, "Title is required"),
      description: z.string().trim(),
      content: z.string(),
      language: z.string().trim(),
      url: z.string().trim(),
      fileUrl: z.string().trim(),
      fileName: z.string().trim(),
      fileSize: z.number().nullable(),
      tags: z.array(z.string().trim().min(1)),
      collectionIds: z.array(z.string()),
    })
    .refine((data) => data.itemType !== "link" || z.string().url().safeParse(data.url).success, {
      message: "Please enter a valid URL",
      path: ["url"],
    })
    .refine((data) => !FILE_ITEM_TYPES.has(data.itemType) || data.fileUrl.length > 0, {
      message: "Please upload a file",
      path: ["fileUrl"],
    })
    .refine(
      (data) =>
        !FILE_ITEM_TYPES.has(data.itemType) ||
        !process.env.R2_PUBLIC_URL ||
        data.fileUrl.startsWith(process.env.R2_PUBLIC_URL),
      { message: "Invalid file reference", path: ["fileUrl"] }
    )
    .refine(
      (data) => !isPlanLimitsEnforced() || !FILE_ITEM_TYPES.has(data.itemType) || isPro,
      { message: "File and image uploads require a Pro plan", path: ["itemType"] }
    );
}

export type CreateItemInput = z.infer<ReturnType<typeof buildCreateItemSchema>>;

export interface CreateItemState {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

export async function createItem(input: CreateItemInput): Promise<CreateItemState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = parseOrError(buildCreateItemSchema(auth.isPro), input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  if (isPlanLimitsEnforced()) {
    const stats = await getItemStats(auth.userId);
    const limitError = checkPlanLimit(
      isOverItemLimit(auth.isPro, stats.total),
      FREE_TIER_LIMITS.items,
      "items"
    );
    if (limitError) {
      return { success: false, error: limitError };
    }
  }

  const itemType = await getItemTypeByName(parsed.data.itemType);
  if (!itemType) {
    return { success: false, error: "Invalid item type" };
  }

  const isLink = parsed.data.itemType === "link";
  const isFile = FILE_ITEM_TYPES.has(parsed.data.itemType);
  const created = await createItemRecord(auth.userId, itemType.id, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    contentType: isFile ? "file" : isLink ? "url" : "text",
    content: isFile || isLink ? null : parsed.data.content || null,
    url: isLink ? parsed.data.url : null,
    language: parsed.data.language || null,
    fileUrl: isFile ? parsed.data.fileUrl : null,
    fileName: isFile ? parsed.data.fileName : null,
    fileSize: isFile ? parsed.data.fileSize : null,
    tags: parsed.data.tags,
    collectionIds: parsed.data.collectionIds,
  });

  return { success: true, data: created };
}

const updateItemSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().nullable(),
    content: z.string().nullable(),
    url: z.string().nullable(),
    language: z.string().nullable(),
    tags: z.array(z.string().trim().min(1)),
    collectionIds: z.array(z.string()),
  })
  .refine((data) => !data.url || z.string().url().safeParse(data.url).success, {
    message: "Please enter a valid URL",
    path: ["url"],
  });

export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export interface UpdateItemState {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

export async function updateItem(itemId: string, input: UpdateItemInput): Promise<UpdateItemState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = parseOrError(updateItemSchema, input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  const updated = await updateItemRecord(auth.userId, itemId, parsed.data);
  if (!updated) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, data: updated };
}

export interface DeleteItemState {
  success: boolean;
  error?: string;
}

export async function deleteItem(itemId: string): Promise<DeleteItemState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const deleted = await deleteItemRecord(auth.userId, itemId);
  if (!deleted) {
    return { success: false, error: "Item not found" };
  }

  return { success: true };
}

export interface ToggleFavoriteState {
  success: boolean;
  isFavorite?: boolean;
  error?: string;
}

export async function toggleItemFavorite(itemId: string): Promise<ToggleFavoriteState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const isFavorite = await toggleItemFavoriteRecord(auth.userId, itemId);
  if (isFavorite === null) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, isFavorite };
}

export interface TogglePinState {
  success: boolean;
  isPinned?: boolean;
  error?: string;
}

export async function toggleItemPin(itemId: string): Promise<TogglePinState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const isPinned = await toggleItemPinRecord(auth.userId, itemId);
  if (isPinned === null) {
    return { success: false, error: "Item not found" };
  }

  return { success: true, isPinned };
}
