"use client";

import { useState } from "react";
import { toast } from "sonner";

import { explainCode } from "@/actions/ai";

interface UseExplainCodeOptions {
  content: string;
  language: string | null;
  itemType: string;
}

/** Explain-code trigger + generated explanation, used by the read-only CodeEditor in the item drawer. */
export function useExplainCode({ content, language, itemType }: UseExplainCodeOptions) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async (): Promise<boolean> => {
    if (explanation) return true;

    setLoading(true);
    const result = await explainCode({ content, language, itemType });
    setLoading(false);

    if (!result.success || !result.explanation) {
      toast.error(result.error ?? "Couldn't generate an explanation. Try again.");
      return false;
    }

    setExplanation(result.explanation);
    return true;
  };

  return { loading, explanation, handleExplain };
}