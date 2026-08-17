"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Pin, Star } from "lucide-react";
import { toast } from "sonner";

import { toggleItemFavorite } from "@/actions/items";
import { type ItemWithType } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { useDrawerCardProps } from "@/components/dashboard/use-drawer-card-props";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ItemCard({ item }: { item: ItemWithType }) {
  const router = useRouter();
  const Icon = itemTypeIcons[item.itemType.icon];
  const drawerCardProps = useDrawerCardProps(item.id);
  const copyText = item.content ?? item.url ?? "";

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(copyText);
    toast.success("Copied to clipboard");
  };

  const handleToggleFavorite = async (e: MouseEvent) => {
    e.stopPropagation();
    const result = await toggleItemFavorite(item.id);
    if (result.success) {
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update favorite");
    }
  };

  return (
    <Card
      size="sm"
      {...drawerCardProps}
      className="cursor-pointer gap-2 border-l-2 p-4"
      style={{ borderLeftColor: item.itemType.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${item.itemType.color}26` }}
        >
          {Icon && <Icon className="size-4" style={{ color: item.itemType.color }} />}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {item.isPinned && <Pin className="size-3.5" />}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={item.isFavorite ? "Unfavorite" : "Favorite"}
            className="size-6 text-muted-foreground hover:text-foreground"
            onClick={handleToggleFavorite}
          >
            <Star
              className={item.isFavorite ? "size-3.5 fill-yellow-400 text-yellow-400" : "size-3.5"}
            />
          </Button>
          {copyText && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Copy"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              <Copy className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground">{item.description}</p>
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
