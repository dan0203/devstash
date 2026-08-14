"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { ChevronDown, ChevronRight, LogOut, Star } from "lucide-react";

import { currentUser } from "@/lib/mock-data";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionWithStats } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const proTypeSlugs = new Set(["files", "images"]);

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
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const showCollectionsList = collapsed || collectionsOpen;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-2 pb-2 text-xs font-semibold tracking-wider text-muted-foreground">
            TYPES
          </p>
        )}
        <div className="space-y-0.5">
          {itemTypes.map((type) => {
            const Icon = itemTypeIcons[type.icon];
            return (
              <Link
                key={type.id}
                href={`/items/${type.slug}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-sidebar-accent",
                  collapsed && "justify-center"
                )}
                title={collapsed ? type.name : undefined}
              >
                {Icon && <Icon className="size-4 shrink-0" style={{ color: type.color }} />}
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{type.name}</span>
                    {!currentUser.isPro && proTypeSlugs.has(type.slug) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] tracking-wide text-muted-foreground uppercase"
                      >
                        Pro
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{type.count}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>

        <Separator className="my-4" />

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
            {!collapsed && <SidebarLink href="/favorites" label="Favorites" />}
            <div className={cn("space-y-0.5", !collapsed && "pl-3")}>
              {favoriteCollections.map((collection) => (
                <CollectionLink key={collection.id} collection={collection} collapsed={collapsed} favorite />
              ))}
            </div>
            {!collapsed && <SidebarLink href="/recent" label="Recent" />}
            <div className={cn("space-y-0.5", !collapsed && "pl-3")}>
              {recentCollections.map((collection) => (
                <CollectionLink key={collection.id} collection={collection} collapsed={collapsed} />
              ))}
            </div>
            {!collapsed && <SidebarLink href="/collections" label="View all collections" />}
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <Link href="/profile" title="Profile">
            <UserAvatar name={user.name ?? user.email ?? "User"} image={user.image} />
          </Link>
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left outline-none hover:bg-sidebar-accent focus-visible:bg-sidebar-accent">
                <p className="truncate text-sm font-medium">{user.name ?? "Unnamed user"}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent"
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}

function CollectionLink({
  collection,
  collapsed,
  favorite,
}: {
  collection: CollectionWithStats;
  collapsed?: boolean;
  favorite?: boolean;
}) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-sidebar-accent",
        collapsed && "justify-center"
      )}
      title={collapsed ? collection.name : undefined}
    >
      {favorite ? (
        <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
      ) : (
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: collection.color }}
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
