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
