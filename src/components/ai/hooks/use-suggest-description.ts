"use client";

import { useState } from "react";
import { toast } from "sonner";

import { generateDescription } from "@/actions/ai";

interface UseSuggestDescriptionOptions {
  title: string;
  content: string;
  url: string;
  language: string;
  itemType: string;
  onGenerated: (description: string) => void;
}

/** Suggest-description trigger, shared by the create-item and item-drawer-edit description fields. */
export function useSuggestDescription({
  title,
  content,
  url,
  language,
  itemType,
  onGenerated,
}: UseSuggestDescriptionOptions) {
  const [loading, setLoading] = useState(false);

  const handleSuggest = async () => {
    if (!title.trim()) {
      toast.error("Add a title first");
      return;
    }

    setLoading(true);
    const result = await generateDescription({ title, content, url, language, itemType });
    setLoading(false);

    if (!result.success || !result.description) {
      toast.error(result.error ?? "Couldn't generate a description. Try again.");
      return;
    }

    onGenerated(result.description);
  };

  return { loading, handleSuggest };
}