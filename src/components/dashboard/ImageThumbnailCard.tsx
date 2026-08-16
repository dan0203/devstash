"use client";

import Image from "next/image";
import { Pin, Star } from "lucide-react";

import { type ItemWithType } from "@/lib/db/items";
import { useDrawerCardProps } from "@/components/dashboard/use-drawer-card-props";
import { Card } from "@/components/ui/card";

export function ImageThumbnailCard({ item }: { item: ItemWithType }) {
  const drawerCardProps = useDrawerCardProps(item.id);

  return (
    <Card
      size="sm"
      {...drawerCardProps}
      className="cursor-pointer gap-0 p-0"
    >
      <div className="group relative aspect-video w-full overflow-hidden">
        {item.fileUrl && (
          <Image
            src={item.fileUrl}
            alt={item.title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
