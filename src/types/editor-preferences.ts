export const EDITOR_FONT_SIZES = [12, 13, 14, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export function isEditorTheme(value: string): value is EditorTheme {
  return (EDITOR_THEMES as readonly string[]).includes(value);
}
