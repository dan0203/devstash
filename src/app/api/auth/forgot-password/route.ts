import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createPasswordResetToken, sendPasswordResetEmail } from "@/lib/password-reset";
import { enforceRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-request";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, forgotPasswordSchema);
  if ("response" in parsed) return parsed.response;
  const { email } = parsed.data;

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(rateLimiters.forgotPassword, ip);
  if (rateLimited) return rateLimited;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.password) {
      const token = await createPasswordResetToken(email);
      await sendPasswordResetEmail(email, token, new URL(request.url).origin);
    }
  } catch (error) {
    console.error("Failed to send password reset email", error);
  }

  // Always return success, even if the account doesn't exist or is
  // OAuth-only, so this endpoint doesn't leak account existence.
  return NextResponse.json({ success: true });
}
