import { Star } from "lucide-react";

import { type Collection } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";

export function CollectionCard({ collection, itemCount }: { collection: Collection; itemCount: number }) {
  return (
    <Card size="sm" className="gap-1.5 p-4">
      <div className="flex items-center gap-2">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: collection.color }}
        />
        <p className="flex-1 truncate text-sm font-medium">{collection.name}</p>
        {collection.isFavorite && <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
      </div>
      <p className="line-clamp-1 text-xs text-muted-foreground">{collection.description}</p>
      <p className="text-xs text-muted-foreground">
        {itemCount} {itemCount === 1 ? "item" : "items"}
      </p>
    </Card>
  );
}
