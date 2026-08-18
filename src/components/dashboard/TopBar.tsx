"use client";

import Link from "next/link";
import { Layers, Search, Menu, Star } from "lucide-react";
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
  isPro: boolean;
}

export function TopBar({ itemTypes, collections, isPro }: TopBarProps) {
  const { setMobileOpen } = useSidebar();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const creatableTypes = itemTypes.filter((type) => creatableTypeSlugs.has(type.slug));

  return (
    <header className="flex w-full shrink-0 items-center gap-2 border-b px-4 py-4 md:gap-4 md:px-6">
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Menu className="size-4" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Layers className="size-5 text-blue-500" />
          <span className="hidden font-semibold md:inline">DevStash</span>
        </Link>
      </div>

      <div className="hidden flex-1 md:flex md:justify-center md:px-4">
        <div className="relative w-full max-w-md">
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
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          className="md:hidden"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Favorites" nativeButton={false} render={<Link href="/favorites" />}>
          <Star className="size-4" />
        </Button>
        {!isPro && (
          <Button variant="ghost" nativeButton={false} render={<Link href="/upgrade" />}>
            Upgrade
          </Button>
        )}
        <NewCollectionDialog />
        <NewItemDialog itemTypes={creatableTypes} collections={collections} isPro={isPro} />
      </div>
    </header>
  );
}
