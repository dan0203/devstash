import { prisma } from "@/lib/prisma";
import { createSingleUseToken, resolveAppUrl, sendTransactionalEmail } from "@/lib/verification-tokens";

// Namespaced so a reset request can't delete/collide with a pending
// email-verification token for the same address (both reuse VerificationToken
// keyed by `identifier`).
function resetIdentifier(email: string) {
  return `password-reset:${email}`;
}

export async function createPasswordResetToken(email: string) {
  return createSingleUseToken(resetIdentifier(email));
}

export async function sendPasswordResetEmail(email: string, token: string, origin: string) {
  const resetUrl = resolveAppUrl("/reset-password", origin);
  resetUrl.searchParams.set("token", token);

  await sendTransactionalEmail({
    to: email,
    subject: "Reset your DevStash password",
    html: `
      <p>We received a request to reset your DevStash password.</p>
      <p><a href="${resetUrl.toString()}">Reset password</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
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
