import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCollectionDetail } from "@/lib/db/collections";
import { itemTypeIcons } from "@/lib/icon-map";
import { ItemCard } from "@/components/dashboard/ItemCard";
import { ImageThumbnailCard } from "@/components/dashboard/ImageThumbnailCard";
import { FileListRow } from "@/components/dashboard/FileListRow";

export default async function CollectionDetailPage(props: PageProps<"/collections/[id]">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id } = await props.params;
  const collection = await getCollectionDetail(session.user.id, id);
  if (!collection) {
    notFound();
  }

  const imageItems = collection.items.filter((item) => item.itemType.name === "image");
  const fileItems = collection.items.filter((item) => item.itemType.name === "file");
  const otherItems = collection.items.filter(
    (item) => item.itemType.name !== "image" && item.itemType.name !== "file"
  );

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground">{collection.description}</p>
          )}
          {collection.types.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {collection.types.map(({ icon, color, count }) => {
                const Icon = itemTypeIcons[icon];
                return (
                  <div key={icon} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {Icon && <Icon className="size-3.5" style={{ color }} />}
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {collection.items.length > 0 ? (
          <div className="flex flex-col gap-6">
            {otherItems.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {imageItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                  IMAGES
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {imageItems.map((item) => (
                    <ImageThumbnailCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {fileItems.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                  FILES
                </h2>
                <div className="flex flex-col gap-2">
                  {fileItems.map((item) => (
                    <FileListRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        )}
      </div>
    </main>
  );
}
