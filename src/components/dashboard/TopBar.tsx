"use client";

import { Layers, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { useCommandPalette } from "@/components/dashboard/command-palette-context";
import { NewItemDialog } from "@/components/dashboard/NewItemDialog";
import { NewCollectionDialog } from "@/components/dashboard/NewCollectionDialog";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionOption } from "@/lib/db/collections";

const creatableTypeSlugs = new Set([
  "snippets",
  "prompts",
  "commands",
  "notes",
  "links",
  "files",
  "images",
]);

interface TopBarProps {
  itemTypes: ItemTypeWithCount[];
  collections: CollectionOption[];
}

export function TopBar({ itemTypes, collections }: TopBarProps) {
  const { setMobileOpen } = useSidebar();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const creatableTypes = itemTypes.filter((type) => creatableTypeSlugs.has(type.slug));

  return (
    <header className="grid w-full shrink-0 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="size-4" />
        </Button>
        <Layers className="size-5" />
        <span className="font-semibold">DevStash</span>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search snippets, prompts, tags..."
          aria-label="Search"
          className="cursor-pointer pl-9 pr-12"
          readOnly
          onClick={() => setCommandPaletteOpen(true)}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-xs text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center justify-self-end gap-2">
        <NewCollectionDialog />
        <NewItemDialog itemTypes={creatableTypes} collections={collections} />
      </div>
    </header>
  );
}
