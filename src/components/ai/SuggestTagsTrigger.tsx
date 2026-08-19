"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SuggestTagsTriggerProps {
  loading: boolean;
  onClick: () => void;
}

export function SuggestTagsTrigger({ loading, onClick }: SuggestTagsTriggerProps) {
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
      {loading ? "Suggesting..." : "Suggest tags"}
    </Button>
  );
}