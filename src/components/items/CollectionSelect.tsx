"use client";

import { Folder, ChevronDown } from "lucide-react";

import { type CollectionOption } from "@/lib/db/collections";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface CollectionSelectProps {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CollectionSelect({ collections, selectedIds, onChange }: CollectionSelectProps) {
  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal" />
        }
      >
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Folder className="size-4" />
          {selectedIds.length > 0
            ? `${selectedIds.length} collection${selectedIds.length === 1 ? "" : "s"} selected`
            : "Add to collections"}
        </span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--anchor-width) max-h-64">
        {collections.length === 0 ? (
          <p className="px-1.5 py-1 text-sm text-muted-foreground">No collections yet.</p>
        ) : (
          collections.map((collection) => (
            <DropdownMenuCheckboxItem
              key={collection.id}
              checked={selectedIds.includes(collection.id)}
              closeOnClick={false}
              onCheckedChange={() => toggle(collection.id)}
            >
              {collection.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
