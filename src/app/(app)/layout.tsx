import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TopBar } from "@/components/nav/TopBar";
import { Sidebar } from "@/components/nav/Sidebar";
import { MobileSidebar } from "@/components/nav/MobileSidebar";
import { SidebarProvider } from "@/components/nav/hooks/sidebar-context";
import { ItemDrawerProvider } from "@/components/items/hooks/item-drawer-context";
import { ItemDrawer } from "@/components/items/ItemDrawer";
import { CommandPaletteProvider } from "@/components/command-palette/hooks/command-palette-context";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { EditorPreferencesProvider } from "@/components/editor/hooks/editor-preferences-context";
import { getItemTypesWithCounts } from "@/lib/db/items";
import {
  getFavoriteCollections,
  getSidebarRecentCollections,
  getUserCollections,
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

  const [itemTypes, favoriteCollections, recentCollections, collections, editorPreferences] =
    await Promise.all([
      getItemTypesWithCounts(user.id),
      getFavoriteCollections(user.id),
      getSidebarRecentCollections(user.id, 5),
      getUserCollections(user.id),
      getEditorPreferences(user.id),
    ]);

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
            <ItemDrawer collections={collections} isPro={user.isPro} />
            <CommandPalette />
          </EditorPreferencesProvider>
        </CommandPaletteProvider>
      </ItemDrawerProvider>
    </SidebarProvider>
  );
}
