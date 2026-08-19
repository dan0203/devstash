"use server";

import { z } from "zod";

import {
  createCollection as createCollectionRecord,
  updateCollection as updateCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  toggleCollectionFavorite as toggleCollectionFavoriteRecord,
  getCollectionStats,
  type Collection,
} from "@/lib/db/collections";
import { FREE_TIER_LIMITS, checkPlanLimit, isOverCollectionLimit, isPlanLimitsEnforced } from "@/lib/plan-limits";
import { requireSession } from "@/lib/auth-utils";
import { parseOrError } from "@/lib/validation";

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
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = parseOrError(createCollectionSchema, input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  if (isPlanLimitsEnforced()) {
    const stats = await getCollectionStats(auth.userId);
    const limitError = checkPlanLimit(
      isOverCollectionLimit(auth.isPro, stats.total),
      FREE_TIER_LIMITS.collections,
      "collections"
    );
    if (limitError) {
      return { success: false, error: limitError };
    }
  }

  const created = await createCollectionRecord(auth.userId, {
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
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = parseOrError(updateCollectionSchema, input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  const updated = await updateCollectionRecord(auth.userId, collectionId, {
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
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const deleted = await deleteCollectionRecord(auth.userId, collectionId);
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
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const isFavorite = await toggleCollectionFavoriteRecord(auth.userId, collectionId);
  if (isFavorite === null) {
    return { success: false, error: "Collection not found" };
  }

  return { success: true, isFavorite };
}
