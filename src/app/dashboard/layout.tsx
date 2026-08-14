import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getFavoriteCollections, getSidebarRecentCollections } from "@/lib/db/collections";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [session, itemTypes, favoriteCollections, recentCollections] = await Promise.all([
    auth(),
    getItemTypesWithCounts(),
    getFavoriteCollections(),
    getSidebarRecentCollections(5),
  ]);

  // proxy.ts already redirects unauthenticated requests before they reach this layout.
  const user = session!.user;

  return (
    <SidebarProvider>
      <div className="flex h-dvh flex-col">
        <TopBar />
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
    </SidebarProvider>
  );
}
