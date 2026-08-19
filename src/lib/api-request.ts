import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { parseOrError } from "@/lib/validation";

/** Parses and validates an API route's JSON body, or a 400 NextResponse. */
export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T } | { response: NextResponse }> {
  const body = await request.json();
  const result = parseOrError(schema, body);
  if ("error" in result) {
    return { response: NextResponse.json({ success: false, error: result.error }, { status: 400 }) };
  }
  return { data: result.data };
}
