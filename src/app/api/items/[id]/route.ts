import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth-utils";
import { getItemDetail } from "@/lib/db/items";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]">) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const { id } = await ctx.params;
  const item = await getItemDetail(session.userId, id);
  if (!item) {
    return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: item });
}
