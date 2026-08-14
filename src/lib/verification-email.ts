import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Defaults to enabled (secure by default) unless explicitly turned off — e.g.
// while no Resend sending domain is verified yet in this environment.
export function isEmailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

// TODO: switch to a verified sending domain once one is set up in Resend.
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

  // resend.emails.send() resolves with { data, error } rather than throwing
  // on API errors, so a failed send has to be surfaced manually.
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Verify your DevStash email address",
    html: `
      <p>Welcome to DevStash — confirm your email address to finish setting up your account.</p>
      <p><a href="${verifyUrl.toString()}">Verify email address</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}
