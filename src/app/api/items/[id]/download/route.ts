import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";
import { getR2Object, r2KeyFromUrl } from "@/lib/r2";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]/download">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const item = await getItemDetail(session.user.id, id);
  if (!item || item.contentType !== "file" || !item.fileUrl) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const object = await getR2Object(r2KeyFromUrl(item.fileUrl));
  if (!object.Body) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const stream = await object.Body.transformToWebStream();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${item.fileName ?? "download"}"`,
      ...(object.ContentLength ? { "Content-Length": String(object.ContentLength) } : {}),
    },
  });
}
