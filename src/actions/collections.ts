"use server";

import { z } from "zod";

import { auth } from "@/auth";
import {
  createCollection as createCollectionRecord,
  updateCollection as updateCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  toggleCollectionFavorite as toggleCollectionFavoriteRecord,
  getCollectionStats,
  type Collection,
} from "@/lib/db/collections";
import { FREE_TIER_LIMITS, isOverCollectionLimit, isPlanLimitsEnforced } from "@/lib/plan-limits";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export interface CreateCollectionState {
  success: boolean;
  data?: Collection;
  error?: string;
}

export async function createCollection(
  input: CreateCollectionInput
): Promise<CreateCollectionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  if (isPlanLimitsEnforced()) {
    const stats = await getCollectionStats(session.user.id);
    if (isOverCollectionLimit(session.user.isPro ?? false, stats.total)) {
      return {
        success: false,
        error: `Free plan limit reached (${FREE_TIER_LIMITS.collections} collections). Upgrade to Pro for unlimited collections.`,
      };
    }
  }

  const created = await createCollectionRecord(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  return { success: true, data: created };
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim(),
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export interface UpdateCollectionState {
  success: boolean;
  data?: Collection;
  error?: string;
}

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput
): Promise<UpdateCollectionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await updateCollectionRecord(session.user.id, collectionId, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  if (!updated) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, data: updated };
}

export interface DeleteCollectionState {
  success: boolean;
  error?: string;
}

export async function deleteCollection(collectionId: string): Promise<DeleteCollectionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const deleted = await deleteCollectionRecord(session.user.id, collectionId);
  if (!deleted) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true };
}

export interface ToggleFavoriteState {
  success: boolean;
  isFavorite?: boolean;
  error?: string;
}

export async function toggleCollectionFavorite(collectionId: string): Promise<ToggleFavoriteState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const isFavorite = await toggleCollectionFavoriteRecord(session.user.id, collectionId);
  if (isFavorite === null) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, isFavorite };
}
