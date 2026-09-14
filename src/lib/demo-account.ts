/**
 * The public guest demo account visitors sign into via the homepage's "Try
 * the Live Demo" button (src/actions/demo.ts) — the only demo/test account
 * seeded by prisma/seed.ts.
 */
export function getDemoAccountCredentials(): { email: string; password: string } | null {
  const email = process.env.DEMO_ACCOUNT_EMAIL;
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Stripe runs in live mode in production (real card charges) — a visitor who
 * "upgrades" the shared, publicly-signed-into demo account would otherwise be
 * paying real money for a subscription they don't actually control. Used by
 * src/actions/billing.ts to route this account through a separate test-mode
 * Stripe client/price set instead (src/lib/stripe.ts), and by the daily reset
 * (src/lib/db/demo-account.ts) to clear isPro/billing fields so it can't get
 * stuck "Pro" forever.
 */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  const demoEmail = process.env.DEMO_ACCOUNT_EMAIL;
  return !!demoEmail && email === demoEmail;
}
