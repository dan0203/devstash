import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimiters, rateLimitResponse } from "@/lib/rate-limit";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const rateLimit = await checkRateLimit(rateLimiters.changePassword, session.user.id);
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit.reset);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
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

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash, passwordChangedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
