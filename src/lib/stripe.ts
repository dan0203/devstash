import Stripe from "stripe";

// The Stripe SDK throws synchronously at construction if given an empty
// string, unlike other clients in this codebase (r2.ts, rate-limit.ts) that
// fail open at import and only error when actually called — a placeholder
// key keeps that same posture so importing this module never crashes page
// data collection (e.g. the webhook route) when Stripe isn't configured.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-07-29.dahlia",
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY ?? "",
} as const;

// A separate test-mode client/price set used only for the public guest demo
// account (src/lib/demo-account.ts) — lets a visitor go through a real,
// fully-functional Stripe Checkout flow with a test card, with zero chance of
// a real charge, since test-mode API keys can't move real money. See
// src/app/api/webhooks/stripe/route.ts for how the webhook handles both modes.
export const stripeTest = new Stripe(process.env.STRIPE_SECRET_KEY_TEST || "sk_test_placeholder", {
  apiVersion: "2026-07-29.dahlia",
});

export const STRIPE_TEST_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY_TEST ?? "",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY_TEST ?? "",
} as const;

export function isStripeTestModeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY_TEST &&
    process.env.STRIPE_PRICE_ID_MONTHLY_TEST &&
    process.env.STRIPE_PRICE_ID_YEARLY_TEST
  );
}
