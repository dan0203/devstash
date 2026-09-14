import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDemoAccountCredentials } from "@/lib/demo-account";
import { resetDemoAccountData } from "@/lib/db/demo-account";

/**
 * Triggered daily by Vercel Cron (vercel.json) to wipe and re-seed the public
 * guest demo account's data back to its baseline. Vercel automatically sends
 * `Authorization: Bearer $CRON_SECRET` when invoking scheduled crons; we
 * re-verify it here since Next.js route handlers don't enforce that on their own.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const credentials = getDemoAccountCredentials();
  if (!credentials) {
    return NextResponse.json(
      { success: false, error: "Demo account is not configured" },
      { status: 500 }
    );
  }

  const demoUser = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (!demoUser) {
    return NextResponse.json({ success: false, error: "Demo account not found" }, { status: 404 });
  }

  await resetDemoAccountData(demoUser.id);

  return NextResponse.json({ success: true });
}
