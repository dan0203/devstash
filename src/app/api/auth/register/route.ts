import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createVerificationToken, sendVerificationEmail } from "@/lib/verification-email";

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
    return NextResponse.json(
      { success: false, error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: passwordHash },
  });

  try {
    const token = await createVerificationToken(email);
    await sendVerificationEmail(email, token);
  } catch (error) {
    console.error("Failed to send verification email", error);
  }

  return NextResponse.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name },
  });
}
