"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  updateItem as updateItemRecord,
  deleteItem as deleteItemRecord,
  type ItemDetail,
} from "@/lib/db/items";

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
