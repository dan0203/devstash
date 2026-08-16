import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { uploadToR2 } from "@/lib/r2";
import { FILE_CONSTRAINTS, type UploadItemType } from "@/lib/file-constraints";

function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const itemType = formData.get("itemType");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }
  if (itemType !== "image" && itemType !== "file") {
    return NextResponse.json({ success: false, error: "Invalid item type" }, { status: 400 });
  }

  const constraints = FILE_CONSTRAINTS[itemType as UploadItemType];
  const extension = getExtension(file.name);

  if (!constraints.extensions.includes(extension as never)) {
    return NextResponse.json(
      { success: false, error: `Unsupported file extension: ${extension || "unknown"}` },
      { status: 400 }
    );
  }
  if (!constraints.mimeTypes.includes(file.type as never)) {
    return NextResponse.json(
      { success: false, error: `Unsupported file type: ${file.type || "unknown"}` },
      { status: 400 }
    );
  }
  if (file.size > constraints.maxSize) {
    return NextResponse.json(
      {
        success: false,
        error: `File exceeds the ${constraints.maxSize / (1024 * 1024)}MB limit`,
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${session.user.id}/${crypto.randomUUID()}-${sanitizedName}`;

  const url = await uploadToR2(key, buffer, file.type);

  return NextResponse.json({
    success: true,
    data: { url, fileName: file.name, fileSize: file.size },
  });
}
