import { Pin, Star } from "lucide-react";

import { itemTypes, type Item } from "@/lib/mock-data";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ItemCard({ item }: { item: Item }) {
  const type = itemTypes.find((t) => t.id === item.itemTypeId);
  const Icon = type ? itemTypeIcons[type.icon] : undefined;

  return (
    <Card
      size="sm"
      className={cn("gap-2 border p-4", item.isPinned ? "border-2" : "border-transparent")}
      style={item.isPinned && type ? { borderColor: type.color } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        {type && (
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${type.color}26` }}
          >
            {Icon && <Icon className="size-4" style={{ color: type.color }} />}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {item.isPinned && <Pin className="size-3.5" />}
          {item.isFavorite && <Star className="size-3.5 fill-yellow-400 text-yellow-400" />}
        </div>
      </div>

      <div>
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeTime(item.updatedAt)}
        </span>
      </div>
    </Card>
  );
}
