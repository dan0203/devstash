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
    subject: "Confirm your email to get started with DevStash",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111827;">Welcome to DevStash 👋</h2>
        <p style="color: #374151; line-height: 1.6;">
          Thanks for signing up! You're one step away from having all your snippets,
          prompts, commands, and notes in one searchable place.
        </p>
        <p style="color: #374151; line-height: 1.6;">
          Please confirm your email address to activate your account:
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl.toString()}"
             style="background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Verify my email
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          This link expires in 24 hours. If you didn't create a DevStash account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
