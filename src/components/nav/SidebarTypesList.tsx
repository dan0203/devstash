import Link from "next/link";

import { type ItemTypeWithCount } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const proTypeSlugs = new Set(["files", "images"]);

interface SidebarTypesListProps {
  collapsed?: boolean;
  itemTypes: ItemTypeWithCount[];
  isPro: boolean;
  pathname: string;
}

export function SidebarTypesList({ collapsed = false, itemTypes, isPro, pathname }: SidebarTypesListProps) {
  return (
    <>
      {!collapsed && (
        <p className="px-2 pb-2 text-xs font-semibold tracking-wider text-muted-foreground">TYPES</p>
      )}
      <div className="space-y-0.5">
        {itemTypes.map((type) => {
          const Icon = itemTypeIcons[type.icon];
          const href = `/items/${type.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={type.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-sidebar-accent",
                collapsed && "justify-center",
                active && "bg-sidebar-accent font-medium text-foreground"
              )}
              title={collapsed ? type.name : undefined}
            >
              {Icon && <Icon className="size-4 shrink-0" style={{ color: type.color }} />}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{type.name}</span>
                  {!isPro && proTypeSlugs.has(type.slug) && (
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
    </>
  );
}