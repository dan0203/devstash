import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { ItemDrawerProvider } from "@/components/dashboard/item-drawer-context";
import { ItemDrawer } from "@/components/dashboard/ItemDrawer";
import { CommandPaletteProvider } from "@/components/dashboard/command-palette-context";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { EditorPreferencesProvider } from "@/components/dashboard/editor-preferences-context";
import { getItemTypesWithCounts, getAllItemsForSearch } from "@/lib/db/items";
import {
  getFavoriteCollections,
  getSidebarRecentCollections,
  getUserCollections,
  getAllCollections,
} from "@/lib/db/collections";
import { getEditorPreferences } from "@/lib/db/user";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  // proxy.ts's edge-only auth check can't see the DB-based invalidation in
  // src/auth.ts's jwt callback (e.g. a stale token after a password change),
  // so a "logged in" request here can still resolve to no session.
  if (!session?.user) {
    redirect("/sign-in");
  }
  const user = session.user;

  const [
    itemTypes,
    favoriteCollections,
    recentCollections,
    collections,
    searchItems,
    allCollections,
    editorPreferences,
  ] = await Promise.all([
    getItemTypesWithCounts(user.id),
    getFavoriteCollections(user.id),
    getSidebarRecentCollections(user.id, 5),
    getUserCollections(user.id),
    getAllItemsForSearch(user.id),
    getAllCollections(user.id),
    getEditorPreferences(user.id),
  ]);
  const searchCollections = allCollections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemCount: collection.itemCount,
  }));

  return (
    <SidebarProvider>
      <ItemDrawerProvider>
        <CommandPaletteProvider>
          <EditorPreferencesProvider initialPreferences={editorPreferences}>
            <div className="flex h-dvh flex-col">
              <TopBar itemTypes={itemTypes} collections={collections} isPro={user.isPro} />
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
            <ItemDrawer collections={collections} />
            <CommandPalette items={searchItems} collections={searchCollections} />
          </EditorPreferencesProvider>
        </CommandPaletteProvider>
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
