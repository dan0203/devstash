"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ExplainCodeTriggerProps {
  isPro: boolean;
  loading: boolean;
  onClick: () => void;
}

export function ExplainCodeTrigger({ isPro, loading, onClick }: ExplainCodeTriggerProps) {
  if (!isPro) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Explain (requires Pro)"
              aria-disabled="true"
              className="h-auto cursor-not-allowed gap-1.5 px-2 py-1 text-xs text-neutral-400 opacity-50 hover:bg-transparent hover:text-neutral-400"
              onClick={(e) => e.preventDefault()}
            />
          }
        >
          <Crown className="size-3.5 text-amber-400" />
          Explain
        </TooltipTrigger>
        <TooltipContent>AI features require Pro subscription</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Explain code"
      className="h-auto gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      {loading ? "Explaining..." : "Explain"}
    </Button>
  );
}