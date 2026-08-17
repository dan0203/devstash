"use client";

import { type ItemWithType } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { useDrawerCardProps } from "@/components/dashboard/use-drawer-card-props";
import { Badge } from "@/components/ui/badge";

export function FavoriteItemRow({ item }: { item: ItemWithType }) {
  const Icon = itemTypeIcons[item.itemType.icon];
  const drawerCardProps = useDrawerCardProps(item.id);
  const typeName = item.itemType.name.charAt(0).toUpperCase() + item.itemType.name.slice(1);

  return (
    <div
      {...drawerCardProps}
      className="flex cursor-pointer items-center gap-3 px-1 py-2 transition-colors hover:bg-accent/50"
    >
      {Icon && <Icon className="size-3.5 shrink-0" style={{ color: item.itemType.color }} />}
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <Badge
        variant="outline"
        className="shrink-0 font-mono text-[10px]"
        style={{ borderColor: item.itemType.color, color: item.itemType.color }}
      >
        {typeName}
      </Badge>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {formatRelativeTime(item.updatedAt)}
      </span>
    </div>
  );
}
