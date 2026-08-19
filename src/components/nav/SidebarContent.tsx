"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";

import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionWithStats } from "@/lib/db/collections";
import { SidebarTypesList } from "@/components/nav/SidebarTypesList";
import { SidebarCollectionsSection } from "@/components/nav/SidebarCollectionsSection";
import { SidebarUserFooter } from "@/components/nav/SidebarUserFooter";
import { Separator } from "@/components/ui/separator";

interface SidebarContentProps {
  collapsed?: boolean;
  user: Session["user"];
  itemTypes: ItemTypeWithCount[];
  favoriteCollections: CollectionWithStats[];
  recentCollections: CollectionWithStats[];
}

export function SidebarContent({
  collapsed = false,
  user,
  itemTypes,
  favoriteCollections,
  recentCollections,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarTypesList collapsed={collapsed} itemTypes={itemTypes} isPro={user.isPro} pathname={pathname} />

        <Separator className="my-4" />

        <SidebarCollectionsSection
          collapsed={collapsed}
          favoriteCollections={favoriteCollections}
          recentCollections={recentCollections}
          pathname={pathname}
        />
      </nav>

      <SidebarUserFooter collapsed={collapsed} user={user} />
    </div>
  );
}