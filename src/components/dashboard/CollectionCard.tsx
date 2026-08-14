import { Star } from "lucide-react";

import { type CollectionWithStats } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { Card } from "@/components/ui/card";

export function CollectionCard({ collection }: { collection: CollectionWithStats }) {
  return (
    <Card size="sm" className="gap-1.5 p-4">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: collection.color }}
          aria-hidden="true"
        />
        <p className="flex-1 truncate text-sm font-medium">{collection.name}</p>
        {collection.isFavorite && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
      </div>
      {collection.description && (
        <p className="line-clamp-1 text-xs text-muted-foreground">{collection.description}</p>
      )}
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
