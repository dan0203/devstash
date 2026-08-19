import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { updateUserPassword } from "@/lib/db/user";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { enforceRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-request";
import { passwordsMatchRefinement } from "@/lib/validation";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(...passwordsMatchRefinement("password", "confirmPassword"));

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, resetPasswordSchema);
  if ("response" in parsed) return parsed.response;
  const { token, password } = parsed.data;

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(rateLimiters.resetPassword, ip);
  if (rateLimited) return rateLimited;

  const email = await consumePasswordResetToken(token);
  if (!email) {
    return NextResponse.json(
      { success: false, error: "That reset link is invalid or expired" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password) {
    return NextResponse.json(
      {
        success: false,
        error: "This account signs in with GitHub and doesn't have a password to reset",
      },
      { status: 400 }
    );
  }

  await updateUserPassword({ email }, password);

  return NextResponse.json({ success: true });
}
