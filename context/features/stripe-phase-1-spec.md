# Stripe Integration Phase 1 — Core Infrastructure

## Overview

Lay the foundation for Stripe billing: schema, Stripe client, the DB layer for reading/writing subscription state, the session-staleness fix that lets `session.user.isPro` reflect webhook updates, and the free-tier limit-checking utility. No webhook route, no checkout/portal UI yet — that's Phase 2. Reference: `docs/stripe-integration-plan.md` (research doc — nothing in it has been implemented; this spec turns §4.1–§4.2's foundational pieces and §4.3's `auth.ts` fix into Phase 1 scope).

## Requirements

- Add the two missing billing columns to `User` via a real migration (`prisma migrate dev`, never `db push`)
- Install the `stripe` server SDK (skip `@stripe/stripe-js` — Phase 2 uses hosted Checkout/Portal redirects, not embedded Elements)
- Add a Stripe client singleton that fails gracefully (no keys configured) rather than throwing at import time, matching `src/lib/rate-limit.ts`/`src/lib/r2.ts`'s existing posture
- Add a `src/lib/db/billing.ts` query layer: read billing info for a user, and write subscription state (used later by the Phase 2 webhook handler)
- Fix the `isPro` staleness bug in `src/auth.ts`'s `jwt` callback so a DB change (e.g. a future webhook) is picked up on the next request instead of only at sign-in
- Add `src/lib/plan-limits.ts` with the free-tier limit constants and boundary-check functions
- Unit tests for `plan-limits.ts`

## Schema Changes

`prisma/schema.prisma`'s `User` model already has `isPro`/`stripeCustomerId`/`stripeSubscriptionId` (unused, no migration needed for those three). Add two more:

```prisma
model User {
  ...
  stripePriceId          String?   // which price (monthly/yearly) — for billing UI copy in Phase 2
  stripeCurrentPeriodEnd DateTime? // renewal/expiry date; also lets isPro be safely flipped false past this date if a cancellation webhook is ever missed
  ...
}
```

Run via `prisma migrate dev --name add_stripe_billing_fields`.

## Files to Create

**`src/lib/stripe.ts`** — Stripe client singleton:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "...", // pin to whatever apiVersion the installed `stripe` package's types expect
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY ?? "",
} as const;
```

**`src/lib/db/billing.ts`** — following `src/lib/db/user.ts`'s pattern:

```ts
export interface BillingInfo {
  isPro: boolean;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
}

export async function getBillingInfo(userId: string): Promise<BillingInfo> { ... }

// Called only from the Phase 2 webhook handler — service-role writes, no ownership
// check needed since the webhook payload's customer/subscription IDs are the source of truth.
export async function upsertSubscriptionFromWebhook(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  isPro: boolean;
  currentPeriodEnd: Date | null;
}): Promise<void> { ... }

export async function getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> { ... }
```

Out of Vitest scope (`src/lib/db/**`), same as every other DB query wrapper — no unit tests for this file.

**`src/lib/plan-limits.ts`**:

```ts
export const FREE_TIER_LIMITS = { items: 50, collections: 3 } as const;

export function isOverItemLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.items;
}
export function isOverCollectionLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.collections;
}
```

Do **not** wire this into `createItem`/`createCollection` yet — that's Phase 2's last step, and per `context/project-overview.md`'s "leave all features unlocked during development" dev-mode note it should ship soft/disabled initially even then. Phase 1 only adds the utility + its tests.

## Files to Modify

- **`prisma/schema.prisma`** — add `stripePriceId`/`stripeCurrentPeriodEnd` (see above), new migration.
- **`src/auth.ts`** — extend the `jwt` callback's existing `passwordChangedAt` DB read to also select+resync `isPro`, instead of adding a second query:

```ts
if (token.sub) {
  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { passwordChangedAt: true, isPro: true }, // + isPro
  });
  token.isPro = dbUser?.isPro ?? false; // always resync, not just at sign-in
  const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
  ...
}
```

  This is the one change everything in Phase 2 depends on — without it, `session.user.isPro` won't reflect a webhook update until the user signs out and back in. Zero additional queries versus today (same query, one more column) since `auth()` is already wrapped in React's `cache()`.
- **`package.json`** — add `stripe`.
- **`.env.example`** — already has all 5 Stripe vars (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`); no change needed. Fill in `.env` with real test-mode keys once the Stripe Dashboard is set up.

## Stripe Dashboard Setup (needed to have real keys/price IDs to test against)

1. Create a Stripe account (or use existing) in **test mode**.
2. **Products & Prices**: create one Product ("DevStash Pro") with two recurring Prices — $8.00/month and $72.00/year. Copy both Price IDs into `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_YEARLY`.
3. **API keys**: copy the test-mode Secret key → `STRIPE_SECRET_KEY`, Publishable key → `STRIPE_PUBLISHABLE_KEY` (unused until/unless Elements is added later).

Webhook endpoint and Customer Portal setup are Phase 2 concerns (need the webhook route and portal action to exist first).

## Unit Testing

Per `context/ai-interaction.md`'s Vitest scope (server actions + `src/lib/**` excluding `src/lib/db/**`):

- [ ] `src/lib/plan-limits.test.ts` — `isOverItemLimit`/`isOverCollectionLimit` boundary cases (49/50/51 items, 2/3/4 collections; `isPro: true` always returns `false` regardless of count).

`src/lib/stripe.ts` and `src/lib/db/billing.ts` are out of scope (thin client construction / DB query wrapper), verified manually instead — confirm the app doesn't crash with `STRIPE_SECRET_KEY` unset.

## Testing Checklist

- [ ] `prisma migrate status` shows the new migration applied cleanly.
- [ ] `getBillingInfo` returns sane defaults (`isPro: false`, nulls) for a user with no Stripe data yet.
- [ ] Sign in, manually flip `isPro` to `true` directly in the DB, reload any page (not sign out/in) — confirm `session.user.isPro` picks it up on the next request via the `jwt` callback fix. Revert afterward.
- [ ] App still builds/runs correctly with `STRIPE_SECRET_KEY`/price ID env vars unset (fail-open posture, matching `rate-limit.ts`).
- [ ] `npm run build`, `npm run lint`, `npm test` all pass.

## Out of Scope (Phase 2)

- Webhook route (`/api/webhooks/stripe`)
- `createCheckoutSession`/`createPortalSession` Server Actions
- `BillingSettings.tsx` + settings page wiring
- Actually gating `createItem`/`createCollection`/file-upload on plan limits
- Stripe CLI-based webhook testing

## References

- `docs/stripe-integration-plan.md` — full research/analysis this spec is derived from
- Stripe Node SDK: https://github.com/stripe/stripe-node
