"use client";

import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";

import { type CollectionWithStats } from "@/lib/db/collections";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function FavoriteCollectionRow({ collection }: { collection: CollectionWithStats }) {
  const router = useRouter();
  const href = `/collections/${collection.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
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
