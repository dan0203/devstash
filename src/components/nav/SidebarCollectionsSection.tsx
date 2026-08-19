"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Star } from "lucide-react";

import { type CollectionWithStats } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

interface SidebarCollectionsSectionProps {
  collapsed?: boolean;
  favoriteCollections: CollectionWithStats[];
  recentCollections: CollectionWithStats[];
  pathname: string;
}

export function SidebarCollectionsSection({
  collapsed = false,
  favoriteCollections,
  recentCollections,
  pathname,
}: SidebarCollectionsSectionProps) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const showCollectionsList = collapsed || collectionsOpen;

  return (
    <>
      {!collapsed && (
        <button
          type="button"
          onClick={() => setCollectionsOpen((prev) => !prev)}
          className="flex items-center gap-1 px-2 pb-2 text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground"
          aria-expanded={collectionsOpen}
          aria-label={collectionsOpen ? "Collapse collections" : "Expand collections"}
        >
          {collectionsOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
          COLLECTIONS
        </button>
      )}

      {showCollectionsList && (
        <div className="space-y-0.5">
          {!collapsed && (
            <SidebarLink href="/favorites" label="Favorites" active={pathname === "/favorites"} />
          )}
          <div className={cn("space-y-0.5", !collapsed && "pl-3")}>
            {favoriteCollections.map((collection) => (
              <CollectionLink
                key={collection.id}
                collection={collection}
                collapsed={collapsed}
                favorite
                active={pathname === `/collections/${collection.id}`}
              />
            ))}
          </div>
          {!collapsed && <SidebarLink href="/recent" label="Recent" active={pathname === "/recent"} />}
          <div className={cn("space-y-0.5", !collapsed && "pl-3")}>
            {recentCollections.map((collection) => (
              <CollectionLink
                key={collection.id}
                collection={collection}
                collapsed={collapsed}
                active={pathname === `/collections/${collection.id}`}
              />
            ))}
          </div>
          {!collapsed && (
            <SidebarLink
              href="/collections"
              label="View all collections"
              active={pathname === "/collections"}
            />
          )}
        </div>
      )}
    </>
  );
}

function SidebarLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-accent font-medium text-foreground"
      )}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}

function CollectionLink({
  collection,
  collapsed,
  favorite,
  active,
}: {
  collection: CollectionWithStats;
  collapsed?: boolean;
  favorite?: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-sidebar-accent",
        collapsed && "justify-center",
        active && "bg-sidebar-accent font-medium text-foreground"
      )}
      title={collapsed ? collection.name : undefined}
    >
      {favorite ? (
        <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
      ) : (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: collection.color }}
          aria-hidden="true"
        />
      )}
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{collection.name}</span>
          <span className="text-xs text-muted-foreground">{collection.itemCount}</span>
        </>
      )}
    </Link>
  );
}