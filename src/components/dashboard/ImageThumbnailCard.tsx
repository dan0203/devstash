"use client";

import { Pin, Star } from "lucide-react";

import { type ItemWithType } from "@/lib/db/items";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { Card } from "@/components/ui/card";

export function ImageThumbnailCard({ item }: { item: ItemWithType }) {
  const { openDrawer } = useItemDrawer();

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={() => openDrawer(item.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDrawer(item.id);
        }
      }}
      className="cursor-pointer gap-0 p-0"
    >
      <div className="group relative aspect-video w-full overflow-hidden">
        {item.fileUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.fileUrl}
            alt={item.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-white drop-shadow">
          {item.isPinned && <Pin className="size-3.5" />}
          {item.isFavorite && <Star className="size-3.5 fill-yellow-400 text-yellow-400" />}
        </div>
      </div>

      <div className="px-3 py-2">
        <p className="truncate text-sm font-medium">{item.title}</p>
      </div>
    </Card>
  );
}
