import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const item = await getItemDetail(session.user.id, id);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: item });
}
