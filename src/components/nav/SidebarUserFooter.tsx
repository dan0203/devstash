import Link from "next/link";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";

import { UserAvatar } from "@/components/ui/user-avatar";
import { ProBadge } from "@/components/shared/ProBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarUserFooterProps {
  collapsed?: boolean;
  user: Session["user"];
}

export function SidebarUserFooter({ collapsed = false, user }: SidebarUserFooterProps) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
        <Link href="/profile" title="Profile" className="relative shrink-0">
          <UserAvatar name={user.name ?? user.email ?? "User"} image={user.image} />
          {collapsed && user.isPro && <ProBadge iconOnly className="absolute -right-1 -bottom-1 size-4" />}
        </Link>
        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left outline-none hover:bg-sidebar-accent focus-visible:bg-sidebar-accent">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">{user.name ?? "Unnamed user"}</p>
                {user.isPro && <ProBadge />}
              </div>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/sign-in" })}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
