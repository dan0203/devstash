import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCollectionsPage } from "@/lib/db/collections";
import { COLLECTIONS_PER_PAGE } from "@/lib/constants";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { PaginationControls } from "@/components/shared/PaginationControls";

export default async function CollectionsPage(props: PageProps<"/collections">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { page: pageParam } = await props.searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { collections, totalCount } = await getCollectionsPage(
    session.user.id,
    page,
    COLLECTIONS_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / COLLECTIONS_PER_PAGE));

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

        <PaginationControls basePath="/collections" currentPage={page} totalPages={totalPages} />
      </div>
    </main>
  );
}
