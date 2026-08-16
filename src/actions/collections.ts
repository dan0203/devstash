"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { createCollection as createCollectionRecord, type Collection } from "@/lib/db/collections";

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

  const created = await createCollectionRecord(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description || null,
  });

  return { success: true, data: created };
}
