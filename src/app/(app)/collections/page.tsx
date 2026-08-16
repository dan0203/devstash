import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAllCollections } from "@/lib/db/collections";
import { CollectionCard } from "@/components/dashboard/CollectionCard";

export default async function CollectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const collections = await getAllCollections(session.user.id);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <h1 className="text-lg font-semibold">Collections</h1>

        {collections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        )}
      </div>
    </main>
  );
}
