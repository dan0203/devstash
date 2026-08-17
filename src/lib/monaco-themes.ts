import type { Monaco } from "@monaco-editor/react";

// vs-dark ships built into Monaco; monokai/github-dark don't, so we register
// them once per editor instance via defineTheme before Monaco applies a theme.
export function defineCustomMonacoThemes(monaco: Monaco) {
  monaco.editor.defineTheme("monokai", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "75715E" },
      { token: "keyword", foreground: "F92672" },
      { token: "string", foreground: "E6DB74" },
      { token: "number", foreground: "AE81FF" },
      { token: "type", foreground: "66D9EF", fontStyle: "italic" },
      { token: "function", foreground: "A6E22E" },
      { token: "variable", foreground: "F8F8F2" },
    ],
    colors: {
      "editor.background": "#272822",
      "editor.foreground": "#F8F8F2",
      "editorLineNumber.foreground": "#75715E",
      "editorLineNumber.activeForeground": "#F8F8F2",
      "editor.selectionBackground": "#49483E",
      "editorCursor.foreground": "#F8F8F0",
    },
  });

  monaco.editor.defineTheme("github-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8B949E" },
      { token: "keyword", foreground: "FF7B72" },
      { token: "string", foreground: "A5D6FF" },
      { token: "number", foreground: "79C0FF" },
      { token: "type", foreground: "FFA657" },
      { token: "function", foreground: "D2A8FF" },
      { token: "variable", foreground: "C9D1D9" },
    ],
    colors: {
      "editor.background": "#0D1117",
      "editor.foreground": "#C9D1D9",
      "editorLineNumber.foreground": "#8B949E",
      "editorLineNumber.activeForeground": "#C9D1D9",
      "editor.selectionBackground": "#264F78",
      "editorCursor.foreground": "#C9D1D9",
    },
  });
}
