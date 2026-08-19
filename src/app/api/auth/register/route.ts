import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/verification-email";
import { enforceRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/api-request";
import { passwordsMatchRefinement } from "@/lib/validation";

const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(...passwordsMatchRefinement("password", "confirmPassword"));

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, registerSchema);
  if ("response" in parsed) return parsed.response;
  const { name, email, password } = parsed.data;

  const ip = getClientIp(request);
  const rateLimited = await enforceRateLimit(rateLimiters.register, ip);
  if (rateLimited) return rateLimited;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // Respond identically to a successful registration so this endpoint
    // doesn't leak whether the email is already registered.
    return NextResponse.json({ success: true });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verificationEnabled = isEmailVerificationEnabled();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      emailVerified: verificationEnabled ? null : new Date(),
    },
  });

  if (verificationEnabled) {
    try {
      const token = await createVerificationToken(email);
      await sendVerificationEmail(email, token, new URL(request.url).origin);
    } catch (error) {
      console.error("Failed to send verification email", error);
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send your verification email. Please try again.",
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name },
  });
}
