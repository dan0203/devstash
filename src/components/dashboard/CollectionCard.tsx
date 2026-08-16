import Link from "next/link";
import { Star } from "lucide-react";

import { type CollectionWithStats } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollectionCard({ collection }: { collection: CollectionWithStats }) {
  return (
    <Link href={`/collections/${collection.id}`} className="block">
      <Card
        size="sm"
        className={cn(
          "gap-1.5 border-l-2 p-4 transition-colors hover:bg-accent/50",
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
          {collection.isFavorite && (
            <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
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
    </Link>
  );
}
