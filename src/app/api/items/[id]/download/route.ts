import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth-utils";
import { getItemDetail } from "@/lib/db/items";
import { getR2Object, r2KeyFromUrl } from "@/lib/r2";

export async function GET(_request: Request, ctx: RouteContext<"/api/items/[id]/download">) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const { id } = await ctx.params;
  const item = await getItemDetail(session.userId, id);
  if (!item || item.contentType !== "file" || !item.fileUrl) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const object = await getR2Object(r2KeyFromUrl(item.fileUrl));
  if (!object.Body) {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }

  const stream = await object.Body.transformToWebStream();
  // Strip characters that could break out of the quoted filename param and
  // inject extra Content-Disposition directives.
  const safeFileName = (item.fileName ?? "download").replace(/["\r\n]/g, "");

  return new NextResponse(stream, {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      ...(object.ContentLength ? { "Content-Length": String(object.ContentLength) } : {}),
    },
  });
}
