import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Issues a single-use, 24h-expiring token for the given identifier, replacing any existing one. */
export async function createSingleUseToken(identifier: string): Promise<string> {
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

// TODO: switch to a verified sending domain once one is set up in Resend.
// Until then, onboarding@resend.dev only delivers to the Resend account owner's email.
const FROM_ADDRESS = "DevStash <onboarding@resend.dev>";

export interface TransactionalEmail {
  to: string;
  subject: string;
  html: string;
}

export async function sendTransactionalEmail({ to, subject, html }: TransactionalEmail): Promise<void> {
  // resend.emails.send() resolves with { data, error } rather than throwing
  // on API errors, so a failed send has to be surfaced manually.
  const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
}

/** Builds an absolute app URL, preferring the configured public URL over the request's own origin. */
export function resolveAppUrl(path: string, origin: string): URL {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? origin);
}
