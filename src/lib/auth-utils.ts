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