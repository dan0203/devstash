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
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111827;">Password reset request</h2>
        <p style="color: #374151; line-height: 1.6;">
          We received a request to reset the password for your DevStash account.
          Click the button below to choose a new one:
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl.toString()}"
             style="background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset my password
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this
          email — your password will remain unchanged.
        </p>
      </div>
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
