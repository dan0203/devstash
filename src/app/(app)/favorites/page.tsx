import { redirect } from "next/navigation";
import { Star } from "lucide-react";

import { auth } from "@/auth";
import { getFavoriteItems } from "@/lib/db/items";
import { getFavoriteCollections } from "@/lib/db/collections";
import { FavoritesList } from "@/components/favorites/FavoritesList";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [items, collections] = await Promise.all([
    getFavoriteItems(session.user.id),
    getFavoriteCollections(session.user.id),
  ]);

  const isEmpty = items.length === 0 && collections.length === 0;

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Star className="size-5 fill-yellow-400 text-yellow-400" />
          Favorites
        </h1>

        {isEmpty ? (
          <p className="text-sm text-muted-foreground">No favorites yet.</p>
        ) : (
          <FavoritesList items={items} collections={collections} />
        )}
      </div>
    </main>
  );
}
