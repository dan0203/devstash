import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Namespaced so a reset request can't delete/collide with a pending
// email-verification token for the same address (both reuse VerificationToken
// keyed by `identifier`).
function resetIdentifier(email: string) {
  return `password-reset:${email}`;
}

// TODO: switch to a verified sending domain once one is set up in Resend.
// Until then, onboarding@resend.dev only delivers to the Resend account owner's email.
const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

export async function createPasswordResetToken(email: string) {
  const identifier = resetIdentifier(email);
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return token;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = new URL("/reset-password", process.env.NEXT_PUBLIC_APP_URL);
  resetUrl.searchParams.set("token", token);

  // resend.emails.send() resolves with { data, error } rather than throwing
  // on API errors, so a failed send has to be surfaced manually.
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <p>We received a request to reset your DevStash password.</p>
      <p><a href="${resetUrl.toString()}">Reset password</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

export async function consumePasswordResetToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || !verificationToken.identifier.startsWith("password-reset:")) {
    return null;
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }

  await prisma.verificationToken.delete({ where: { token } });
  return verificationToken.identifier.slice("password-reset:".length);
}
