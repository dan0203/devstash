"use client";

import { useState } from "react";
import { toast } from "sonner";

import { generateAutoTags } from "@/actions/ai";

interface UseSuggestTagsOptions {
  title: string;
  content: string;
  existingTags: string[];
  onAcceptTag: (tag: string) => void;
}

/** Suggest-tags trigger + accept/reject state, shared by the create-item and item-drawer-edit tag inputs. */
export function useSuggestTags({ title, content, existingTags, onAcceptTag }: UseSuggestTagsOptions) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSuggest = async () => {
    if (!title.trim()) {
      toast.error("Add a title first");
      return;
    }

    setLoading(true);
    const result = await generateAutoTags({ title, content });
    setLoading(false);

    if (!result.success || !result.tags) {
      toast.error(result.error ?? "Couldn't generate tag suggestions. Try again.");
      return;
    }

    const existingLower = new Set(existingTags.map((tag) => tag.toLowerCase()));
    const fresh = result.tags.filter((tag) => !existingLower.has(tag));
    if (fresh.length === 0) {
      toast.info("No new tag suggestions");
      return;
    }

    setSuggestions(fresh);
  };

  const handleAccept = (tag: string) => {
    onAcceptTag(tag);
    setSuggestions((current) => current.filter((t) => t !== tag));
  };

  const handleReject = (tag: string) => {
    setSuggestions((current) => current.filter((t) => t !== tag));
  };

  const reset = () => {
    setSuggestions([]);
  };

  return { loading, suggestions, handleSuggest, handleAccept, handleReject, reset };
}