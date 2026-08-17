import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_TAB_SIZES,
  EDITOR_FONT_SIZES,
  isEditorTheme,
  type EditorPreferences,
} from "@/types/editor-preferences";

export interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  hasPassword: boolean;
  createdAt: Date;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, password: true, createdAt: true },
  });
  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    hasPassword: user.password !== null,
    createdAt: user.createdAt,
  };
}

function parseEditorPreferences(raw: unknown): EditorPreferences {
  if (!raw || typeof raw !== "object") return DEFAULT_EDITOR_PREFERENCES;

  const stored = raw as Partial<Record<keyof EditorPreferences, unknown>>;
  return {
    fontSize:
      typeof stored.fontSize === "number" &&
      (EDITOR_FONT_SIZES as readonly number[]).includes(stored.fontSize)
        ? stored.fontSize
        : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize:
      typeof stored.tabSize === "number" &&
      (EDITOR_TAB_SIZES as readonly number[]).includes(stored.tabSize)
        ? stored.tabSize
        : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap: typeof stored.wordWrap === "boolean" ? stored.wordWrap : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap: typeof stored.minimap === "boolean" ? stored.minimap : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme:
      typeof stored.theme === "string" && isEditorTheme(stored.theme)
        ? stored.theme
        : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  return parseEditorPreferences(user?.editorPreferences);
}

export async function updateEditorPreferences(
  userId: string,
  preferences: EditorPreferences
): Promise<EditorPreferences> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: preferences as unknown as InputJsonValue },
    select: { editorPreferences: true },
  });

  return parseEditorPreferences(updated.editorPreferences);
}
