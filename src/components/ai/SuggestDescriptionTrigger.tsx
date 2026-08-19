"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SuggestDescriptionTriggerProps {
  loading: boolean;
  onClick: () => void;
}

export function SuggestDescriptionTrigger({ loading, onClick }: SuggestDescriptionTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={loading}
      className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
    >
      <Sparkles className="size-3.5" />
      {loading ? "Generating..." : "Generate description"}
    </Button>
  );
}