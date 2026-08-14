import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  createVerificationToken,
  isEmailVerificationEnabled,
  sendVerificationEmail,
} from "@/lib/verification-email";

const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

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
