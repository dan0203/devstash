import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/verification-email";
import { checkRateLimit, getClientIp, rateLimiters, rateLimitResponse } from "@/lib/rate-limit";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resendSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(rateLimiters.resendVerification, `${ip}:${email}`);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

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
