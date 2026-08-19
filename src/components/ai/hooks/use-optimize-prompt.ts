"use client";

import { useState } from "react";
import { toast } from "sonner";

import { optimizePrompt } from "@/actions/ai";

interface UseOptimizePromptOptions {
  content: string;
}

/** Optimize-prompt trigger + accept/reject state for a prompt-type MarkdownEditor. */
export function useOptimizePrompt({ content }: UseOptimizePromptOptions) {
  const [loading, setLoading] = useState(false);
  const [optimized, setOptimized] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!content.trim()) {
      toast.error("Add some content first");
      return;
    }

    setLoading(true);
    const result = await optimizePrompt({ content });
    setLoading(false);

    if (!result.success || !result.optimizedContent) {
      toast.error(result.error ?? "Couldn't optimize this prompt. Try again.");
      return;
    }

    if (result.optimizedContent.trim() === content.trim()) {
      toast.info("This prompt is already well-optimized");
      return;
    }

    setOptimized(result.optimizedContent);
  };

  const reset = () => setOptimized(null);

  return { loading, optimized, handleOptimize, reset };
}