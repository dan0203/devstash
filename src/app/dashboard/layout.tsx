import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { getItemTypesWithCounts } from "@/lib/db/items";
import { getFavoriteCollections, getSidebarRecentCollections } from "@/lib/db/collections";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const [itemTypes, favoriteCollections, recentCollections] = await Promise.all([
    getItemTypesWithCounts(),
    getFavoriteCollections(),
    getSidebarRecentCollections(5),
  ]);

  return (
    <SidebarProvider>
      <div className="flex h-dvh flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar
            itemTypes={itemTypes}
            favoriteCollections={favoriteCollections}
            recentCollections={recentCollections}
          />
          <MobileSidebar
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
