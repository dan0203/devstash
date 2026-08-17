"use client";

import { useEditorPreferences } from "@/components/dashboard/editor-preferences-context";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  isEditorTheme,
  type EditorTheme,
} from "@/types/editor-preferences";

const THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

const PREVIEW_SNIPPET = `function greet(name) {\n  // say hello\n  return \`Hello, \${name}!\`;\n}`;

export function EditorPreferencesSettings() {
  const { preferences, setPreferences } = useEditorPreferences();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="editor-font-size">Font size</Label>
          <Select
            value={String(preferences.fontSize)}
            onValueChange={(value) =>
              setPreferences({ ...preferences, fontSize: Number(value) })
            }
          >
            <SelectTrigger id="editor-font-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_FONT_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="editor-tab-size">Tab size</Label>
          <Select
            value={String(preferences.tabSize)}
            onValueChange={(value) =>
              setPreferences({ ...preferences, tabSize: Number(value) })
            }
          >
            <SelectTrigger id="editor-tab-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_TAB_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="editor-theme">Theme</Label>
          <Select
            value={preferences.theme}
            onValueChange={(value) => {
              if (value && isEditorTheme(value)) {
                setPreferences({ ...preferences, theme: value });
              }
            }}
          >
            <SelectTrigger id="editor-theme" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEMES.map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {THEME_LABELS[theme]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-input px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="editor-word-wrap">Word wrap</Label>
          <span className="text-xs text-muted-foreground">
            Wrap long lines instead of scrolling horizontally
          </span>
        </div>
        <Switch
          id="editor-word-wrap"
          checked={preferences.wordWrap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, wordWrap: checked })}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-input px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="editor-minimap">Minimap</Label>
          <span className="text-xs text-muted-foreground">
            Show a miniature preview of the file on the right
          </span>
        </div>
        <Switch
          id="editor-minimap"
          checked={preferences.minimap}
          onCheckedChange={(checked) => setPreferences({ ...preferences, minimap: checked })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Preview</Label>
        <CodeEditor value={PREVIEW_SNIPPET} language="javascript" readOnly />
      </div>
    </div>
  );
}
