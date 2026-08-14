"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createItem as createItemRecord,
  updateItem as updateItemRecord,
  deleteItem as deleteItemRecord,
  type ItemDetail,
} from "@/lib/db/items";
import { getItemTypeByName } from "@/lib/db/item-types";

const CREATABLE_ITEM_TYPES = ["snippet", "prompt", "command", "note", "link"] as const;

const createItemSchema = z
  .object({
    itemType: z.enum(CREATABLE_ITEM_TYPES),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim(),
    content: z.string(),
    language: z.string().trim(),
    url: z.string().trim(),
    tags: z.array(z.string().trim().min(1)),
  })
  .refine((data) => data.itemType !== "link" || z.string().url().safeParse(data.url).success, {
    message: "Please enter a valid URL",
    path: ["url"],
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;

export interface CreateItemState {
  success: boolean;
  data?: ItemDetail;
  error?: string;
}

export async function createItem(input: CreateItemInput): Promise<CreateItemState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const itemType = await getItemTypeByName(parsed.data.itemType);
  if (!itemType) {
    return { success: false, error: "Invalid item type" };
  }

  const isLink = parsed.data.itemType === "link";
  const created = await createItemRecord(session.user.id, itemType.id, {
    title: parsed.data.title,
    description: parsed.data.description || null,
    contentType: isLink ? "url" : "text",
    content: isLink ? null : parsed.data.content || null,
    url: isLink ? parsed.data.url : null,
    language: parsed.data.language || null,
    tags: parsed.data.tags,
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await updateItemRecord(session.user.id, itemId, parsed.data);
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const deleted = await deleteItemRecord(session.user.id, itemId);
  if (!deleted) {
    return { success: false, error: "Item not found" };
  }

  return { success: true };
}
