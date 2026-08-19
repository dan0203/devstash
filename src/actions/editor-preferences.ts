"use server";

import { z } from "zod";

import { updateEditorPreferences as updateEditorPreferencesRecord } from "@/lib/db/user";
import { EDITOR_FONT_SIZES, EDITOR_TAB_SIZES, EDITOR_THEMES } from "@/types/editor-preferences";
import type { EditorPreferences } from "@/types/editor-preferences";
import { requireSession } from "@/lib/auth-utils";
import { parseOrError } from "@/lib/validation";

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
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsed = parseOrError(updateEditorPreferencesSchema, input);
  if ("error" in parsed) {
    return { success: false, error: parsed.error };
  }

  const updated = await updateEditorPreferencesRecord(auth.userId, parsed.data);

  return { success: true, data: updated };
}
