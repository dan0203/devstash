import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth-utils";
import { getAllItemsForSearch } from "@/lib/db/items";
import { getAllCollections } from "@/lib/db/collections";

export async function GET() {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const [items, collections] = await Promise.all([
    getAllItemsForSearch(session.userId),
    getAllCollections(session.userId),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items,
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        itemCount: collection.itemCount,
      })),
    },
  });
}
