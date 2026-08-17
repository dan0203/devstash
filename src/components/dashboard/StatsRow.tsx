import { Layers, FolderKanban, Star, FolderHeart } from "lucide-react";

import { Card } from "@/components/ui/card";

interface StatsRowProps {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

export function StatsRow({
  totalItems,
  totalCollections,
  favoriteItems,
  favoriteCollections,
}: StatsRowProps) {
  const stats = [
    { label: "Items", value: totalItems, icon: Layers },
    { label: "Collections", value: totalCollections, icon: FolderKanban },
    { label: "Favorite items", value: favoriteItems, icon: Star },
    { label: "Favorite collections", value: favoriteCollections, icon: FolderHeart },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label} size="sm" className="flex-row items-center gap-3 p-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xl leading-none font-semibold">{value}</p>
            <p className="text-xs leading-tight text-muted-foreground">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
