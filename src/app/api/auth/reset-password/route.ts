import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { consumePasswordResetToken } from "@/lib/password-reset";

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

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

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { password: passwordHash, passwordChangedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
