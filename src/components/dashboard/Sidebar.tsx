"use client";

import type { Session } from "next-auth";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { useSidebar } from "@/components/dashboard/sidebar-context";
import { SidebarContent } from "@/components/dashboard/SidebarContent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionWithStats } from "@/lib/db/collections";

interface SidebarProps {
  user: Session["user"];
  itemTypes: ItemTypeWithCount[];
  favoriteCollections: CollectionWithStats[];
  recentCollections: CollectionWithStats[];
}

export function Sidebar({ user, itemTypes, favoriteCollections, recentCollections }: SidebarProps) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden min-h-0 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex md:flex-col",
        collapsed ? "md:w-16" : "md:w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-sidebar-border px-4 py-4",
          collapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        {!collapsed && <span className="font-semibold">Navigation</span>}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      <SidebarContent
        collapsed={collapsed}
        user={user}
        itemTypes={itemTypes}
        favoriteCollections={favoriteCollections}
        recentCollections={recentCollections}
      />
    </aside>
  );
}
