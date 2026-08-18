import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAllItemsForSearch } from "@/lib/db/items";
import { getAllCollections } from "@/lib/db/collections";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const [items, collections] = await Promise.all([
    getAllItemsForSearch(session.user.id),
    getAllCollections(session.user.id),
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