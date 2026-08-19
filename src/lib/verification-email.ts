import { createSingleUseToken, resolveAppUrl, sendTransactionalEmail } from "@/lib/verification-tokens";

// Defaults to enabled (secure by default) unless explicitly turned off — e.g.
// while no Resend sending domain is verified yet in this environment.
export function isEmailVerificationEnabled() {
  return process.env.EMAIL_VERIFICATION_ENABLED !== "false";
}

export async function createVerificationToken(email: string) {
  return createSingleUseToken(email);
}

export async function sendVerificationEmail(email: string, token: string, origin: string) {
  const verifyUrl = resolveAppUrl("/api/auth/verify-email", origin);
  verifyUrl.searchParams.set("token", token);

  await sendTransactionalEmail({
    to: email,
    subject: "Verify your DevStash email address",
    html: `
      <p>Welcome to DevStash — confirm your email address to finish setting up your account.</p>
      <p><a href="${verifyUrl.toString()}">Verify email address</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
