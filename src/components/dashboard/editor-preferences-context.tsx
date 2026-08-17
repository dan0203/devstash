"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import type { EditorPreferences } from "@/types/editor-preferences";

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  setPreferences: (preferences: EditorPreferences) => void;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferencesState] = useState(initialPreferences);

  const setPreferences = (next: EditorPreferences) => {
    setPreferencesState(next);
    void updateEditorPreferences(next).then((result) => {
      if (result.success) {
        toast.success("Editor preferences saved");
      } else {
        toast.error(result.error ?? "Failed to save editor preferences");
      }
    });
  };

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);
  if (!context) {
    throw new Error("useEditorPreferences must be used within an EditorPreferencesProvider");
  }
  return context;
}
