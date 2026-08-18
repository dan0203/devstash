# Stripe Integration Phase 2 — Webhooks, Feature Gating & UI

## Overview

Build on Phase 1's foundation (schema, `src/lib/stripe.ts`, `src/lib/db/billing.ts`, the `isPro`-resync JWT fix, `src/lib/plan-limits.ts`) to add the actual upgrade/manage flow: the Stripe webhook handler, checkout/portal Server Actions, the Billing settings card, and free-tier gating in the real creation paths. Requires Phase 1 merged first. Reference: `docs/stripe-integration-plan.md` (research doc this spec is derived from — see §3 API/webhook patterns, §4.2–§4.3 files, §5 Dashboard setup, §7 implementation order).

**This phase requires the Stripe CLI for local webhook testing** (`stripe listen`/`stripe trigger`) — not available via automated browser testing, so the Testing Checklist below is manual/CLI-driven rather than Playwright-driven.

## Requirements

- Webhook route (`/api/webhooks/stripe`) verifying Stripe's signature against the **raw** request body and persisting subscription state via Phase 1's `upsertSubscriptionFromWebhook`
- `createCheckoutSession`/`createPortalSession` Server Actions
- A "Billing" card on `/settings` showing current plan/renewal date with Upgrade/Manage actions
- Real free-tier enforcement: item count (50), collection count (3), and file/image upload (Pro-only) — currently only cosmetically gated (a "PRO" badge in the sidebar) with nothing actually blocking a free user
- Complete Stripe Dashboard webhook + Customer Portal setup

## API Route

**`src/app/api/webhooks/stripe/route.ts`** — the one legitimate API-route exception in this integration: no `auth()` session (Stripe calls it server-to-server), and it must read the **raw** body, not `request.json()`, for signature verification.

```ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upsertSubscriptionFromWebhook, getUserIdByStripeCustomerId } from "@/lib/db/billing";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // session.customer + session.subscription -> fetch the subscription,
      // persist stripeCustomerId/stripeSubscriptionId/stripePriceId, isPro: true
      break;
    }
    case "customer.subscription.updated": {
      // sync price id / current_period_end / isPro (status === "active" | "trialing")
      break;
    }
    case "customer.subscription.deleted": {
      // isPro: false, clear stripeSubscriptionId
      break;
    }
    case "invoice.payment_failed": {
      // optional: flip isPro false after Stripe's own retry/dunning exhausts,
      // or leave alone and let subscription.updated (status -> past_due/canceled) handle it
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

Writes must be idempotent (`upsertSubscriptionFromWebhook` upserts, not inserts) — Stripe can redeliver the same event.

## Server Actions

**`src/actions/billing.ts`** — following `src/actions/collections.ts`'s `{success, data?, error?}` shape. Server Actions, not API routes, since neither needs a specific HTTP status/header (`coding-standards.md` reserves API routes for things like webhooks, which is exactly why the webhook route above is the exception).

```ts
"use server";

export async function createCheckoutSession(
  plan: "monthly" | "yearly"
): Promise<{ success: boolean; url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not signed in" };

  // Reuse existing stripeCustomerId if present, else create one and persist it
  // Create a Stripe Checkout Session (mode: "subscription", the matching price id,
  // success_url back to /settings?checkout=success, cancel_url to /settings)
  // Return { success: true, url: checkoutSession.url }
}

export async function createPortalSession(): Promise<{ success: boolean; url?: string; error?: string }> {
  // auth() check, require existing stripeCustomerId (error if not a Stripe customer yet),
  // create a Billing Portal session, return its url
}
```

Client redirects via `window.location.href = url` (Stripe Checkout/Portal are hosted pages, not embeddable) — matches the app's existing "redirect to provider" pattern for GitHub OAuth.

## UI Components

**`src/components/settings/BillingSettings.tsx`** — client component, matching `EditorPreferencesSettings.tsx`'s pattern (settings-card content, calls a Server Action, shows a sonner toast, redirects on success):

- Shows current plan (Free / Pro monthly / Pro yearly) + renewal date from `getBillingInfo`
- Free users: "Upgrade to Pro" button (plan picker or two buttons for monthly/yearly) → `createCheckoutSession`
- Pro users: "Manage subscription" button → `createPortalSession` → Billing Portal

**`src/app/(app)/settings/page.tsx`** — add a third `Card` ("Billing") alongside the existing "Editor preferences"/"Account actions" cards, fetching `getBillingInfo(session.user.id)` server-side and passing it down as a prop (same pattern as `getUserProfile`).

## Feature Gating

Close the gap where `SidebarContent.tsx`'s `proTypeSlugs` Files/Images "PRO" badge is cosmetic only — nothing today actually blocks a free user from creating file/image items or exceeding the item/collection caps.

- **`src/actions/items.ts`** — `createItem`: after the existing auth/Zod checks, look up the caller's `isPro` + current item count (extend/reuse `getItemStats`) and reject over the limit:
  `{success:false, error:"Free plan limit reached (50 items). Upgrade to Pro for unlimited items."}`.
  Extend the file/image `.refine()` in `createItemSchema` to also require `isPro`.
- **`src/actions/collections.ts`** — `createCollection`: same shape, checked against `FREE_TIER_LIMITS.collections` (reuse/extend `getCollectionStats`).
- **`src/app/api/upload/route.ts`** — add an `isPro` check alongside the existing auth/rate-limit checks.

Per `context/project-overview.md`'s dev-mode note ("leave all features unlocked for all users during development"), ship this gating soft/disabled (e.g. behind an easily-flippable check or left commented with a clear TODO) until the team is ready to actually enforce limits — confirm the intended posture before merging.

## Stripe Dashboard Setup (Phase 2 portion)

1. **Webhook endpoint**: for local dev, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — it prints a signing secret for `STRIPE_WEBHOOK_SECRET`. For a deployed environment, add a real endpoint in Dashboard → Developers → Webhooks pointing at `https://<domain>/api/webhooks/stripe`, subscribed to at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
2. **Customer Portal**: enable it (Dashboard → Settings → Billing → Customer portal) and configure which actions customers can take (cancel, switch plan, update payment method) — required for `createPortalSession` to work.
3. **Success/cancel URLs**: confirm `NEXT_PUBLIC_APP_URL` is set correctly per environment, since Checkout's `success_url`/`cancel_url` are built from it.

## Unit Testing

Per `context/ai-interaction.md`'s Vitest scope (server actions + `src/lib/**` excluding `src/lib/db/**`):

- [ ] `src/actions/billing.test.ts` — no-session case for both actions; `createPortalSession` with no `stripeCustomerId` returns an error; happy-path delegation to a mocked Stripe client (mock `@/lib/stripe`, not real Stripe — same spirit as mocking `@/lib/prisma`/`@/auth` elsewhere in this codebase).
- [ ] Extend `src/actions/items.test.ts`/`collections.test.ts` with the new limit-check branches (mock the count query to return 50/3, assert the error path; assert a Pro user bypasses it).

The webhook route itself, and any `src/lib/db/billing.ts` changes, stay out of Vitest scope (same bucket as `POST /api/upload` and `src/lib/db/**` today) — verified manually via the Stripe CLI checklist below instead.

## Testing Checklist (Stripe CLI required)

- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running locally; trigger `stripe trigger checkout.session.completed` and confirm the DB row updates (`isPro: true`, `stripeCustomerId`/`stripeSubscriptionId` populated).
- [ ] Full checkout flow with Stripe's test card `4242 4242 4242 4242`: click Upgrade → redirected to Checkout → complete → redirected back to `/settings` → after a reload, `isPro` is `true` and the Files/Images "PRO" badge disappears.
- [ ] Cancel via the Billing Portal → `customer.subscription.deleted` fires → `isPro` flips back to `false` on next session refresh (relies on Phase 1's JWT fix).
- [ ] Free-tier gating: create 50 items as a free user, confirm the 51st is rejected with the limit error; confirm a Pro user is never blocked. Same for the 3-collection cap.
- [ ] File/image upload blocked for a free user, allowed for a Pro user.
- [ ] Invalid/missing Stripe webhook signature → route returns 400, no DB write.
- [ ] Webhook replay/idempotency: re-deliver the same `checkout.session.completed` event (Stripe Dashboard "resend" button) and confirm it doesn't double-charge or corrupt state.
- [ ] `getBillingInfo` + settings page render correctly with `STRIPE_SECRET_KEY` unset (should not crash the page).
- [ ] `npm run build`, `npm run lint`, `npm test` all pass.

## Implementation Order

1. Webhook route + `upsertSubscriptionFromWebhook` wiring — get webhook → DB write working and manually verified via `stripe trigger` before building UI on top of it.
2. `createCheckoutSession`/`createPortalSession` + `BillingSettings.tsx` + settings page wiring — the upgrade/manage UX.
3. Gating in `createItem`/`createCollection`/`POST /api/upload` — last, shipped soft/disabled per the dev-mode note.
4. Tests alongside steps 2–3, not bolted on at the end.

## References

- `docs/stripe-integration-plan.md` — full research/analysis this spec is derived from
- `context/features/stripe-phase-1-spec.md` — prerequisite phase (schema, client, JWT fix, plan-limits utility)
- Stripe Checkout: https://docs.stripe.com/checkout
- Stripe Billing Portal: https://docs.stripe.com/customer-management
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signatures
- Stripe CLI: https://docs.stripe.com/stripe-cli
