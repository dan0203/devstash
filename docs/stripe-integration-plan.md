# Stripe Integration Plan — DevStash Pro

> Research doc, produced by `/research stripe-integration-research.md`. Describes a plan only — nothing in this doc has been implemented. Before building, this needs to go through the normal workflow (`context/current-feature.md`, a feature branch, etc. per `context/ai-interaction.md`).

## 1. Current State Analysis

### User model

`prisma/schema.prisma`'s `User` model already has the three fields this integration needs, unused so far:

```prisma
isPro                Boolean @default(false)
stripeCustomerId     String? @unique
stripeSubscriptionId String? @unique
```

No migration needed for these three. One gap: there's no column for **which plan** (monthly vs. yearly) or **current period end** — see §2 (schema additions).

`.env.example` already has placeholders for all the Stripe env vars this needs (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`) — nobody has filled them in or written any Stripe code yet (confirmed: no `stripe` package in `package.json`, no `src/lib/stripe*`, no `/api/stripe/*` or `/api/webhooks/*` routes).

### NextAuth session / isPro sync

`src/auth.ts`'s `jwt` callback already has the exact mechanism the research prompt's "Notes" section is worried about, just applied to `passwordChangedAt` instead of `isPro`:

```ts
async jwt({ token, user }) {
  if (user) {
    token.sub = user.id;
    token.isPro = dbUser.isPro ?? false;       // only set at sign-in
    token.pwChangedAt = ...;
    return token;
  }
  // On every subsequent request, re-check passwordChangedAt against the DB
  // and invalidate the token (return null) if it's moved.
  if (token.sub) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { passwordChangedAt: true },
    });
    ...
  }
  return token;
},
```

Today `isPro` is only ever set **once**, at initial sign-in (inside the `if (user)` branch) — it is never refreshed on later requests. This is precisely the staleness bug the research prompt describes: a Stripe webhook flips `isPro` in the DB, but the signed-in user's JWT (and therefore `session.user.isPro`) won't reflect it until they sign out and back in.

**Recommended fix — extend the existing DB read, don't add a second one.** The `jwt` callback already runs a `prisma.user.findUnique` on every non-initial call (for `passwordChangedAt`), and `auth()` is already wrapped in React's `cache()` (`export const auth = cache(baseAuth)`) specifically so this per-request DB check is deduped across `layout.tsx` + `page.tsx` calls (see `fix/code-scanner-findings`'s history entry). The right move is to add `isPro` to that **same** `select`, not to bolt on a second query as the research prompt's proposed workaround does:

```ts
if (token.sub) {
  const dbUser = await prisma.user.findUnique({
    where: { id: token.sub },
    select: { passwordChangedAt: true, isPro: true },   // + isPro
  });
  token.isPro = dbUser?.isPro ?? false;                  // always resync
  const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
  ...
}
```

This gets "session picks up webhook changes automatically" for free, with **zero additional queries** versus today (same query, one more column) — better than the research prompt's proposed workaround, which would add a brand-new query. A page reload/navigation after checkout is still sufficient to pick up Pro status (any Server Component page re-invokes `auth()` → re-runs the `jwt` callback), no extra polling or `update()` trigger needed.

### How user data is accessed

Every server action and server component follows the same pattern: `const session = await auth(); if (!session?.user?.id) return {success:false, error:"Not signed in"}`. `session.user.isPro` is already typed and available everywhere via `src/types/next-auth.d.ts`'s `Session.user` augmentation — gating checks can read it directly off the session with no extra DB call, e.g. in `SidebarContent.tsx`: `{!user.isPro && proTypeSlugs.has(type.slug) && <Badge>PRO</Badge>}`.

### Existing subscription/payment code

None. `isPro`/`stripeCustomerId`/`stripeSubscriptionId` are unused dead columns today.

## 2. Feature Gating Analysis

### Free tier limits (from `context/project-overview.md` §6)

| Limit | Free | Pro |
| --- | --- | --- |
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| File/image uploads | ❌ | ✅ |
| AI features | ❌ | ✅ |
| Custom types | ❌ | ✅ (not yet built) |
| Export | ❌ | ✅ (not yet built) |

Per `project-overview.md`: *"Dev-mode note: Build the Pro/Free gating foundation now, but leave all features unlocked for all users during development."* This plan follows that — it adds the gating **checks** but they should ship soft/permissive (or behind a flag) until the team is ready to actually enforce limits, matching the project's stated dev-mode posture.

### Where counts are/could be checked

- **Items**: `createItem` (`src/actions/items.ts:65`) is the single choke point for item creation — no count check exists today. A gate would call a new `getItemCount(userId)` before `createItemRecord(...)`.
- **Collections**: `createCollection` (`src/actions/collections.ts:27`) is the equivalent choke point. No count check exists today.
- Both `src/lib/db/items.ts` and `src/lib/db/collections.ts` already have per-user `count`-shaped queries in spirit (`getItemStats`, `getCollectionStats` compute totals for the dashboard stat cards) — the gating check can reuse/extend those rather than adding new count queries from scratch.

### Pro-only features already gated (or partially gated) in the UI

- **File/image types**: `SidebarContent.tsx`'s `proTypeSlugs = new Set(["files", "images"])` shows a "PRO" badge next to Files/Images when `!user.isPro`, but this is **cosmetic only** — nothing in `createItem`/`POST /api/upload` actually blocks a free user from creating file/image items today. A real gate belongs in `createItemSchema`'s `.refine()` chain in `src/actions/items.ts` and in `POST /api/upload` (`src/app/api/upload/route.ts`), checked alongside the existing rate-limit check.
- **AI features, custom types, export**: not implemented at all yet — out of scope for this plan, but the `isPro` check pattern below applies identically when they're built.

### Settings page structure

`src/app/(app)/settings/page.tsx` is a simple stacked-`Card` layout (already has "Editor preferences" and "Account actions" cards, each a thin server page rendering a client component per card). A **"Billing"** card fits this pattern directly — added as a third `Card`, server-rendered with the user's current plan/status, delegating interactive bits (upgrade/manage buttons) to a new client component. `getUserProfile`/`getProfileStats` (`src/lib/db/user.ts`, `src/lib/db/profile.ts`) are the existing precedent for a settings-scoped `src/lib/db` query function — a new `getBillingInfo(userId)` should follow the same shape.

## 3. API & Webhook Patterns

### API route structure

Two existing API routes establish the pattern to follow:

- `POST /api/upload` (`src/app/api/upload/route.ts`): auth check → rate-limit check → `formData`/body validation → business logic → `NextResponse.json({success, data|error}, {status})`.
- `GET /api/auth/verify-email`, `POST /api/auth/register`, etc.: same `{success, data?, error?}` JSON shape, explicit status codes (400/401/409/429/502).

A Stripe **webhook** route is a structural exception to this — no `auth()` session (Stripe calls it server-to-server), and it must read the **raw** request body (not `request.json()`) to verify the signature. This is a genuinely new pattern for the codebase, not a variation of an existing one.

### Server action error handling

Every action (`src/actions/items.ts`, `collections.ts`, `editor-preferences.ts`, `auth.ts`) follows: `auth()` check → Zod `safeParse` → delegate to a `src/lib/db/*` query fn → `{success, data?, error?}` return. Checkout/portal session creation should be a **Server Action** (not an API route) since neither needs a specific HTTP status/header — matching `coding-standards.md`'s explicit guidance to prefer Server Actions and reserve API routes for things like "Webhooks (Stripe, GitHub, etc.)" (the doc already names Stripe webhooks specifically as the API-route case).

### Environment variables

Pattern from `src/lib/rate-limit.ts` and `src/lib/r2.ts`: read `process.env.X` at module scope, construct the client conditionally/lazily, and fail gracefully (rate-limit "fails open") rather than throwing at import time when unconfigured. `.env.example` already documents each var with a comment above it. The Stripe client should follow the same "don't crash the whole app if unconfigured" posture as `rate-limit.ts`, since local dev without Stripe keys is a real scenario here (mirrors the existing Upstash-optional pattern).

## 4. Implementation Plan

### 4.1 Schema changes

One migration, adding two columns beyond the three that already exist:

```prisma
model User {
  ...
  isPro                Boolean   @default(false)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?   @unique
  stripePriceId        String?   // which price (monthly/yearly) — lets billing UI show "You're on the annual plan"
  stripeCurrentPeriodEnd DateTime? // renewal/expiry date, shown in settings; also lets isPro be safely flipped false past this date if a cancellation webhook is ever missed
  ...
}
```

Run via `prisma migrate dev --name add_stripe_billing_fields` (never `db push`, per `coding-standards.md`/`CLAUDE.md`).

### 4.2 Files to create

**`src/lib/stripe.ts`** — Stripe client singleton, mirroring `src/lib/r2.ts`'s client-construction style:

```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-XX-XX", // pin to whatever apiVersion the installed `stripe` package's types expect
});

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY ?? "",
} as const;
```

**`src/lib/db/billing.ts`** — Prisma query layer, following `src/lib/db/user.ts`'s pattern:

```ts
import { prisma } from "@/lib/prisma";

export interface BillingInfo {
  isPro: boolean;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
}

export async function getBillingInfo(userId: string): Promise<BillingInfo> { ... }

// Called only from the webhook handler — service-role writes, no ownership check needed
// since the webhook payload's customer/subscription IDs are the source of truth.
export async function upsertSubscriptionFromWebhook(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  isPro: boolean;
  currentPeriodEnd: Date | null;
}): Promise<void> { ... }

export async function getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> { ... }
```

**`src/actions/billing.ts`** — Server Actions, following `src/actions/collections.ts`'s `{success, data?, error?}` shape:

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
  // auth() check, require existing stripeCustomerId, create a Billing Portal session,
  // return its url — client redirects via window.location.href (Stripe-hosted, not embeddable)
}
```

**`src/app/api/webhooks/stripe/route.ts`** — the one legitimate API route:

```ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upsertSubscriptionFromWebhook, getUserIdByStripeCustomerId } from "@/lib/db/billing";

export async function POST(request: Request) {
  const body = await request.text(); // raw body — required for signature verification
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

**`src/components/settings/BillingSettings.tsx`** — client component, matching `EditorPreferencesSettings.tsx`'s pattern (settings-card content, calls a Server Action, shows a sonner toast, `router.refresh()`/redirect on success): shows current plan (Free / Pro monthly / Pro yearly) + renewal date, an "Upgrade to Pro" button (opens a small plan picker or two buttons for monthly/yearly) for free users, or a "Manage subscription" button (→ Billing Portal) for Pro users.

**`src/lib/plan-limits.ts`** — small shared constants + a checker, so gating logic isn't duplicated inline in actions:

```ts
export const FREE_TIER_LIMITS = { items: 50, collections: 3 } as const;

export function isOverItemLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.items;
}
export function isOverCollectionLimit(isPro: boolean, currentCount: number): boolean {
  return !isPro && currentCount >= FREE_TIER_LIMITS.collections;
}
```

### 4.3 Files to modify

- **`prisma/schema.prisma`** — add `stripePriceId`/`stripeCurrentPeriodEnd` (§4.1), new migration.
- **`src/auth.ts`** — extend the existing `jwt` callback's `passwordChangedAt` DB read to also select+resync `isPro` (§1, "Recommended fix"). This is the one change every other piece of the integration depends on — without it, `session.user.isPro` never reflects a webhook update.
- **`package.json`** — add `stripe` (server SDK). A client-side `@stripe/stripe-js` is only needed if embedding Stripe Elements directly; since this plan uses **Stripe Checkout** (hosted page, redirect via `window.location.href = url`) rather than embedded Elements, the client package can likely be skipped entirely — simpler and matches this app's existing "redirect to provider" pattern for GitHub OAuth.
- **`src/actions/items.ts`** — `createItem`: after the existing auth/Zod checks, look up the caller's `isPro` + current item count and reject (`{success:false, error:"Free plan limit reached (50 items). Upgrade to Pro for unlimited items."}`) if over limit; extend the file/image `.refine()` to also require `isPro` (closing the cosmetic-only gate noted in §2).
- **`src/actions/collections.ts`** — `createCollection`: same shape, checked against `FREE_TIER_LIMITS.collections`.
- **`src/app/api/upload/route.ts`** — add an `isPro` check alongside the existing auth/rate-limit checks (file/image upload is Pro-only per spec; today nothing blocks it).
- **`src/app/(app)/settings/page.tsx`** — add a third `Card` ("Billing") rendering `<BillingSettings />`, fetching `getBillingInfo(session.user.id)` server-side and passing it down as a prop (matching how `getUserProfile` is fetched and passed today).
- **`.env.example`** — already has all 5 Stripe vars; no change needed, just fill in `.env` with real test-mode keys.
- **`context/coding-standards.md`** — optionally add "Stripe webhook signature verification requires the raw request body — don't call `request.json()` in that route" as a one-line gotcha, mirroring how the file already documents the R2/`next/image` gotcha.

## 5. Stripe Dashboard Setup Steps

1. Create a Stripe account (or use existing) in **test mode**.
2. **Products & Prices**: create one Product ("DevStash Pro") with two recurring Prices — $8.00/month and $72.00/year. Copy both Price IDs into `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_YEARLY`.
3. **API keys**: copy the test-mode Secret key → `STRIPE_SECRET_KEY`, Publishable key → `STRIPE_PUBLISHABLE_KEY` (only needed if Elements is added later).
4. **Webhook endpoint**: for local dev, use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) — it prints a webhook signing secret for `STRIPE_WEBHOOK_SECRET`. For a deployed environment, add a real endpoint in Dashboard → Developers → Webhooks pointing at `https://<domain>/api/webhooks/stripe`, subscribed to at minimum: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
5. **Customer Portal**: enable it (Dashboard → Settings → Billing → Customer portal) and configure which actions customers can take (cancel, switch plan, update payment method) — needed for `createPortalSession` to work.
6. **Success/cancel URLs**: confirm `NEXT_PUBLIC_APP_URL` (already in `.env.example`) is set correctly per environment, since Checkout's `success_url`/`cancel_url` should be built from it.

## 6. Testing Checklist

Per this project's Vitest scope (`context/ai-interaction.md`: server actions + `src/lib/**` excluding `src/lib/db/**`), unit-testable pieces are `src/actions/billing.ts` and `src/lib/plan-limits.ts`:

- [ ] `src/lib/plan-limits.test.ts` — `isOverItemLimit`/`isOverCollectionLimit` boundary cases (49/50/51 items, `isPro: true` always false regardless of count).
- [ ] `src/actions/billing.test.ts` — no-session case for both actions; `createPortalSession` with no `stripeCustomerId` returns an error; happy-path delegation to a mocked Stripe client (mock `@/lib/stripe`, not real Stripe — same spirit as mocking `@/lib/prisma`/`@/auth` elsewhere in this codebase).
- [ ] Extend `src/actions/items.test.ts`/`collections.test.ts` with the new limit-check branches (mock the count query to return 50/3, assert the error path; assert a Pro user bypasses it).

The webhook route, `src/lib/stripe.ts`, and `src/lib/db/billing.ts` fall into the same out-of-scope buckets as `POST /api/upload` and `src/lib/db/**` today — verify manually instead:

- [ ] `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running locally; trigger `stripe trigger checkout.session.completed` and confirm the DB row updates (`isPro: true`, `stripeCustomerId`/`stripeSubscriptionId` populated).
- [ ] Full checkout flow with Stripe's test card `4242 4242 4242 4242`: click Upgrade → redirected to Checkout → complete → redirected back to `/settings` → after a reload, `isPro` is `true` and the Files/Images "PRO" badge disappears.
- [ ] Cancel via the Billing Portal → `customer.subscription.deleted` fires → `isPro` flips back to `false` on next session refresh.
- [ ] Free-tier gating: create 50 items as a free user, confirm the 51st is rejected with the limit error; confirm a Pro user is never blocked.
- [ ] Invalid/missing Stripe webhook signature → route returns 400, no DB write.
- [ ] Webhook replay/idempotency: re-deliver the same `checkout.session.completed` event (Stripe Dashboard has a "resend" button) and confirm it doesn't double-charge or corrupt state (upsert, not insert).
- [ ] Confirm `getBillingInfo` + settings page render correctly with `STRIPE_SECRET_KEY` unset (should not crash the page, matching the "fail open/gracefully when unconfigured" posture used elsewhere).

## 7. Implementation Order

1. Schema migration (`stripePriceId`, `stripeCurrentPeriodEnd`) — foundational, everything else depends on it.
2. `src/lib/stripe.ts` + `stripe` package install + Dashboard setup (§5) so there's something real to test against.
3. `src/auth.ts` JWT fix (extend the existing `passwordChangedAt` resync to include `isPro`) — do this early since every other verification step in the checklist depends on the session actually reflecting DB state.
4. `src/lib/db/billing.ts` + `src/app/api/webhooks/stripe/route.ts` — get the webhook → DB write path working and manually verified via `stripe trigger` before building any UI on top of it.
5. `src/actions/billing.ts` (`createCheckoutSession`/`createPortalSession`) + `BillingSettings.tsx` + settings page wiring — the actual upgrade/manage UX.
6. `src/lib/plan-limits.ts` + gating in `createItem`/`createCollection`/`POST /api/upload` — do this last and consider shipping it soft/disabled initially, per `project-overview.md`'s explicit "leave all features unlocked during development" dev-mode note.
7. Tests (§6) alongside steps 5–6, per this project's normal "Test" workflow step — not bolted on at the end.
