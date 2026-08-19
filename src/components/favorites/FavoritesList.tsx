"use client";

import { useMemo, useState } from "react";

import { type ItemWithType } from "@/lib/db/items";
import { type CollectionWithStats } from "@/lib/db/collections";
import { FavoriteItemRow } from "@/components/favorites/FavoriteItemRow";
import { FavoriteCollectionRow } from "@/components/favorites/FavoriteCollectionRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "newest" | "oldest" | "az" | "za" | "type";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  az: "A to Z",
  za: "Z to A",
  type: "Item type",
};

function sortItems(items: ItemWithType[], sort: SortOption): ItemWithType[] {
  const sorted = [...items];
  switch (sort) {
    case "az":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "za":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "type":
      return sorted.sort(
        (a, b) =>
          a.itemType.name.localeCompare(b.itemType.name) || a.title.localeCompare(b.title),
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      );
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

function sortCollections(
  collections: CollectionWithStats[],
  sort: SortOption,
): CollectionWithStats[] {
  const sorted = [...collections];
  switch (sort) {
    case "za":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    // Collections have no single type, so "Item type" falls back to A-Z.
    case "type":
    case "az":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "oldest":
      return sorted.sort((a, b) => {
        const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return aTime - bTime;
      });
    case "newest":
    default:
      return sorted.sort((a, b) => {
        const aTime = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const bTime = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return bTime - aTime;
      });
  }
}

interface FavoritesListProps {
  items: ItemWithType[];
  collections: CollectionWithStats[];
}

export function FavoritesList({ items, collections }: FavoritesListProps) {
  const [sort, setSort] = useState<SortOption>("newest");

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);
  const sortedCollections = useMemo(() => sortCollections(collections, sort), [collections, sort]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Sort by</span>
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="w-36 font-mono text-xs" size="sm">
            <SelectValue>{(value: SortOption) => SORT_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <SelectItem key={option} value={option} className="font-mono text-xs">
                {SORT_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-6 font-mono text-sm">
        {sortedItems.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Items ({sortedItems.length})
            </h2>
            <div className="flex flex-col divide-y divide-border/60 border-y">
              {sortedItems.map((item) => (
                <FavoriteItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {sortedCollections.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="px-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Collections ({sortedCollections.length})
            </h2>
            <div className="flex flex-col divide-y divide-border/60 border-y">
              {sortedCollections.map((collection) => (
                <FavoriteCollectionRow key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
