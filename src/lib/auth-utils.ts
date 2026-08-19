import { NextResponse } from "next/server";

import { auth } from "@/auth";

export type SessionResult =
  | { ok: true; userId: string; isPro: boolean }
  | { ok: false; error: string };

/** Resolves the current session for use in Server Actions, or a "Not signed in" error. */
export async function requireSession(): Promise<SessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not signed in" };
  }
  return { ok: true, userId: session.user.id, isPro: session.user.isPro ?? false };
}

export type ApiSessionResult =
  | { ok: true; userId: string; isPro: boolean }
  | { ok: false; response: NextResponse };

/** Resolves the current session for use in API routes, or a 401 NextResponse. */
export async function requireApiSession(): Promise<ApiSessionResult> {
  const session = await requireSession();
  if (!session.ok) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: session.error }, { status: 401 }),
    };
  }
  return session;
}