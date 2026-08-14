import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { ItemDrawerProvider } from "@/components/dashboard/item-drawer-context";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getFavoriteCollections, getSidebarRecentCollections } from "@/lib/db/collections";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  // proxy.ts's edge-only auth check can't see the DB-based invalidation in
  // src/auth.ts's jwt callback (e.g. a stale token after a password change),
  // so a "logged in" request here can still resolve to no session.
  if (!session?.user) {
    redirect("/sign-in");
  }
  const user = session.user;

  const [itemTypes, favoriteCollections, recentCollections] = await Promise.all([
    getItemTypesWithCounts(user.id),
    getFavoriteCollections(user.id),
    getSidebarRecentCollections(user.id, 5),
  ]);

  return (
    <SidebarProvider>
      <ItemDrawerProvider>
        <div className="flex h-dvh flex-col">
          <TopBar itemTypes={itemTypes} />
          <div className="flex min-h-0 flex-1">
            <Sidebar
              user={user}
              itemTypes={itemTypes}
              favoriteCollections={favoriteCollections}
              recentCollections={recentCollections}
            />
            <MobileSidebar
              user={user}
              itemTypes={itemTypes}
              favoriteCollections={favoriteCollections}
              recentCollections={recentCollections}
            />
            {children}
          </div>
        </div>
        <ItemDrawer />
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
