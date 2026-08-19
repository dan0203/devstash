"use client";

import { Folder } from "lucide-react";

import { type CollectionWithStats } from "@/lib/db/collections";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useNavigateCardProps } from "@/components/shared/hooks/use-navigate-card-props";

export function FavoriteCollectionRow({ collection }: { collection: CollectionWithStats }) {
  const navigateProps = useNavigateCardProps(`/collections/${collection.id}`);

  return (
    <div
      {...navigateProps}
      className="flex cursor-pointer items-center gap-3 px-1 py-2 transition-colors hover:bg-accent/50"
    >
      <Folder className="size-3.5 shrink-0" style={{ color: collection.color }} />
      <span className="min-w-0 flex-1 truncate">{collection.name}</span>
      <Badge
        variant="outline"
        className="shrink-0 font-mono text-[10px]"
        style={{ borderColor: collection.color, color: collection.color }}
      >
        Collection
      </Badge>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {collection.lastUpdated ? formatRelativeTime(collection.lastUpdated) : "—"}
      </span>
    </div>
  );
}
