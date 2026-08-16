import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getItemTypeBySlug, formatItemTypeName } from "@/lib/db/item-types";
import { getItemsByType } from "@/lib/db/items";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageThumbnailCard } from "@/components/dashboard/ImageThumbnailCard";

export default async function ItemTypePage(props: PageProps<"/items/[type]">) {
  const session = await auth();
  // proxy.ts's edge-only auth check can't see the DB-based invalidation in
  // src/auth.ts's jwt callback (e.g. a stale token after a password change),
  // so a "logged in" request here can still resolve to no session.
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { type } = await props.params;
  const itemType = await getItemTypeBySlug(type);
  if (!itemType) {
    notFound();
  }

  const items = await getItemsByType(session.user.id, itemType.id);
  const typeName = formatItemTypeName(itemType.name);
  const isImageGallery = itemType.name === "image";

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <h1 className="text-lg font-semibold">{typeName}</h1>

        {items.length > 0 ? (
          <div
            className={
              isImageGallery
                ? "grid grid-cols-3 gap-4"
                : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {items.map((item) =>
              isImageGallery ? (
                <ImageThumbnailCard key={item.id} item={item} />
              ) : (
                <ItemCard key={item.id} item={item} />
              )
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {typeName.toLowerCase()} yet.
          </p>
        )}
      </div>
    </main>
  );
}
