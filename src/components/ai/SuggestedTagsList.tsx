"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface SuggestedTagsListProps {
  tags: string[];
  onAccept: (tag: string) => void;
  onReject: (tag: string) => void;
}

export function SuggestedTagsList({ tags, onAccept, onReject }: SuggestedTagsListProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
          {tag}
          <button
            type="button"
            onClick={() => onAccept(tag)}
            aria-label={`Accept tag ${tag}`}
            className="rounded-sm p-0.5 text-green-500 hover:bg-green-500/20"
          >
            <Check className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onReject(tag)}
            aria-label={`Reject tag ${tag}`}
            className="rounded-sm p-0.5 text-red-500 hover:bg-red-500/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}