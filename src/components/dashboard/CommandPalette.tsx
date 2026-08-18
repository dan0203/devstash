"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultFilter } from "cmdk";
import { Folder } from "lucide-react";

import { type CollectionOption } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { useCommandPalette } from "@/components/dashboard/command-palette-context";
import { useCommandPaletteData } from "@/components/dashboard/use-command-palette-data";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export interface SearchCollection extends CollectionOption {
  itemCount: number;
}

// cmdk's default filter (command-score) matches loose, out-of-order character
// subsequences, so unrelated results can still score just above 0 for short
// queries. A small minimum score keeps room for typos (transposed/missing
// letters) while cutting off those unrelated matches.
const MIN_MATCH_SCORE = 0.05;

function filterWithTypoTolerance(value: string, search: string) {
  const score = defaultFilter(value, search);
  return score >= MIN_MATCH_SCORE ? score : 0;
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { openDrawer } = useItemDrawer();
  const router = useRouter();
  const { items, collections, loading } = useCommandPaletteData(open);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  function selectItem(itemId: string) {
    setOpen(false);
    openDrawer(itemId);
  }

  function selectCollection(collectionId: string) {
    setOpen(false);
    router.push(`/collections/${collectionId}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search items and collections"
    >
      <Command filter={filterWithTypoTolerance}>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          <CommandGroup heading="Items">
            {items.map((item) => {
              const Icon = itemTypeIcons[item.itemType.icon];
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.preview ?? ""}`}
                  onSelect={() => selectItem(item.id)}
                >
                  {Icon && <Icon className="size-4" style={{ color: item.itemType.color }} />}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{item.title}</span>
                    {item.preview && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.preview}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.id}
                value={collection.name}
                onSelect={() => selectCollection(collection.id)}
              >
                <Folder className="size-4" />
                <span className="flex-1 truncate">{collection.name}</span>
                <span className="text-xs text-muted-foreground">
                  {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
