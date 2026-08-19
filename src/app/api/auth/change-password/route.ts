import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { updateUserPassword } from "@/lib/db/user";
import { requireApiSession } from "@/lib/auth-utils";
import { enforceRateLimit, rateLimiters } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-request";
import { passwordsMatchRefinement } from "@/lib/validation";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine(...passwordsMatchRefinement("newPassword", "confirmNewPassword"));

export async function POST(request: Request) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const parsed = await parseJsonBody(request, changePasswordSchema);
  if ("response" in parsed) return parsed.response;
  const { currentPassword, newPassword } = parsed.data;

  const rateLimited = await enforceRateLimit(rateLimiters.changePassword, session.userId);
  if (rateLimited) return rateLimited;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.password) {
    return NextResponse.json(
      { success: false, error: "This account signs in with GitHub and has no password to change" },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  await updateUserPassword({ id: user.id }, newPassword);

  return NextResponse.json({ success: true });
}
