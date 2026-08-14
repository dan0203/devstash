import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// TODO: switch to resend@danzerbib.me once that domain is verified in Resend.
// Until then, onboarding@resend.dev only delivers to the Resend account owner's email.
const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

export async function createVerificationToken(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return token;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = new URL("/api/auth/verify-email", process.env.NEXT_PUBLIC_APP_URL);
  verifyUrl.searchParams.set("token", token);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your DevStash email address",
    html: `
      <p>Welcome to DevStash — confirm your email address to finish setting up your account.</p>
      <p><a href="${verifyUrl.toString()}">Verify email address</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
