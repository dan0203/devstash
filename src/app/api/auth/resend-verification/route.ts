import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/verification-email";
import { enforceRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-request";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, resendSchema);
  if ("response" in parsed) return parsed.response;
  const { email } = parsed.data;

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(rateLimiters.resendVerification, `${ip}:${email}`);
  if (rateLimited) return rateLimited;

  if (!isEmailVerificationEnabled()) {
    return NextResponse.json({ success: true });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.password && !user.emailVerified) {
      const token = await createVerificationToken(email);
      await sendVerificationEmail(email, token, new URL(request.url).origin);
    }
  } catch (error) {
    console.error("Failed to resend verification email", error);
  }

  // Always return success, even if the account doesn't exist or is already
  // verified, so this endpoint doesn't leak account existence.
  return NextResponse.json({ success: true });
}
