"use client";

import { Layers, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { NewItemDialog } from "@/components/dashboard/NewItemDialog";
import { NewCollectionDialog } from "@/components/dashboard/NewCollectionDialog";
import { type ItemTypeWithCount } from "@/lib/db/items";

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
}

export function TopBar({ itemTypes }: TopBarProps) {
  const { setMobileOpen } = useSidebar();
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
          className="pl-9"
        />
      </div>

      <div className="flex items-center justify-self-end gap-2">
        <NewCollectionDialog />
        <NewItemDialog itemTypes={creatableTypes} />
      </div>
    </header>
  );
}
