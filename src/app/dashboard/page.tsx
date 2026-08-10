import { collections, items } from "@/lib/mock-data";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { CollectionCard } from "@/components/dashboard/CollectionCard";
import { ItemCard } from "@/components/dashboard/ItemCard";

function itemCountFor(collectionId: string) {
  return items.filter((item) => item.collectionIds.includes(collectionId)).length;
}

export default function DashboardPage() {
  const pinnedItems = items.filter((item) => item.isPinned);

  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const recentCollections = [...collections]
    .map((collection) => ({
      collection,
      lastUpdated: Math.max(
        0,
        ...items
          .filter((item) => item.collectionIds.includes(collection.id))
          .map((item) => new Date(item.updatedAt).getTime())
      ),
    }))
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 4)
    .map((entry) => entry.collection);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <StatsRow
          totalItems={items.length}
          totalCollections={collections.length}
          favoriteItems={items.filter((item) => item.isFavorite).length}
          favoriteCollections={collections.filter((c) => c.isFavorite).length}
        />

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            RECENT COLLECTIONS
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                itemCount={itemCountFor(collection.id)}
              />
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
