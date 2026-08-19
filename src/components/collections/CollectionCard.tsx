"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { toggleCollectionFavorite } from "@/actions/collections";
import { type CollectionWithStats } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CollectionCardMenu } from "@/components/collections/CollectionCardMenu";

export function CollectionCard({ collection }: { collection: CollectionWithStats }) {
  const router = useRouter();
  const href = `/collections/${collection.id}`;

  const handleToggleFavorite = async () => {
    const result = await toggleCollectionFavorite(collection.id);
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update favorite");
    }
  };

  return (
    <Card
      size="sm"
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
      className={cn(
        "cursor-pointer gap-1.5 border-l-2 p-4 transition-colors hover:bg-accent/50",
        collection.isFavorite && "border-l-4"
      )}
      style={{ borderLeftColor: collection.color }}
    >
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: collection.color }}
          aria-hidden="true"
        />
        <p className="flex-1 truncate text-sm font-medium">{collection.name}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collection.isFavorite ? "Unfavorite" : "Favorite"}
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            handleToggleFavorite();
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Star
            className={
              collection.isFavorite ? "size-3.5 fill-yellow-400 text-yellow-400" : "size-3.5"
            }
          />
        </Button>
        <CollectionCardMenu collection={collection} onToggleFavorite={handleToggleFavorite} />
      </div>
      <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
        {collection.description}
      </p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </p>
        {collection.types.length > 0 && (
          <div className="flex items-center gap-1">
            {collection.types.map(({ icon, color }) => {
              const Icon = itemTypeIcons[icon];
              return Icon ? (
                <Icon key={icon} className="size-3.5" style={{ color }} />
              ) : null;
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
