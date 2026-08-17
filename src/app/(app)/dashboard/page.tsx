import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getRecentCollections, getCollectionStats } from "@/lib/db/collections";
import { getPinnedItems, getRecentItems, getItemStats } from "@/lib/db/items";
import { DASHBOARD_COLLECTIONS_LIMIT, DASHBOARD_RECENT_ITEMS_LIMIT } from "@/lib/constants";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";

export default async function DashboardPage() {
  const session = await auth();
  // proxy.ts's edge-only auth check can't see the DB-based invalidation in
  // src/auth.ts's jwt callback (e.g. a stale token after a password change),
  // so a "logged in" request here can still resolve to no session.
  if (!session?.user) {
    redirect("/sign-in");
  }
  const userId = session.user.id;

  const [recentCollections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(userId, DASHBOARD_COLLECTIONS_LIMIT),
      getCollectionStats(userId),
      getPinnedItems(userId),
      getRecentItems(userId, DASHBOARD_RECENT_ITEMS_LIMIT),
      getItemStats(userId),
    ]);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <StatsRow
          totalItems={itemStats.total}
          totalCollections={collectionStats.total}
          favoriteItems={itemStats.favorites}
          favoriteCollections={collectionStats.favorites}
        />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            RECENT COLLECTIONS
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            PINNED ITEMS
          </h2>
          {pinnedItems.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No pinned items yet.</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            RECENT ITEMS
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
