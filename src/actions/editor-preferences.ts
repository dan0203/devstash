"use server";

import { z } from "zod";

import { auth } from "@/auth";
import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/user";
import { EDITOR_FONT_SIZES, EDITOR_TAB_SIZES, EDITOR_THEMES } from "@/types/editor-preferences";
import type { EditorPreferences } from "@/types/editor-preferences";

const updateEditorPreferencesSchema = z.object({
  fontSize: z
    .number()
    .refine((size) => (EDITOR_FONT_SIZES as readonly number[]).includes(size), "Invalid font size"),
  tabSize: z
    .number()
    .refine((size) => (EDITOR_TAB_SIZES as readonly number[]).includes(size), "Invalid tab size"),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export interface UpdateEditorPreferencesState {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

export async function updateEditorPreferences(
  input: EditorPreferences
): Promise<UpdateEditorPreferencesState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const parsed = updateEditorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await updateEditorPreferencesRecord(session.user.id, parsed.data);

  return { success: true, data: updated };
}
