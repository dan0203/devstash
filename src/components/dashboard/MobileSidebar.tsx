"use client";

import type { Session } from "next-auth";

import { useSidebar } from "@/components/dashboard/sidebar-context";
import { SidebarContent } from "@/components/dashboard/SidebarContent";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionWithStats } from "@/lib/db/collections";

interface MobileSidebarProps {
  user: Session["user"];
  itemTypes: ItemTypeWithCount[];
  favoriteCollections: CollectionWithStats[];
  recentCollections: CollectionWithStats[];
}

export function MobileSidebar({
  user,
  itemTypes,
  favoriteCollections,
  recentCollections,
}: MobileSidebarProps) {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <div className="border-b border-sidebar-border px-4 py-4 font-semibold">
          <SheetTitle>Navigation</SheetTitle>
        </div>
        <SidebarContent
          user={user}
          itemTypes={itemTypes}
          favoriteCollections={favoriteCollections}
          recentCollections={recentCollections}
        />
      </SheetContent>
    </Sheet>
  );
}
