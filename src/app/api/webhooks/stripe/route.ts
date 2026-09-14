import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe, stripeTest } from "@/lib/stripe";
import { upsertSubscriptionFromWebhook } from "@/lib/db/billing";
import { Prisma } from "@/generated/prisma/client";

// Two webhook secrets are accepted: the live-mode endpoint (real users) and,
// if configured, a test-mode endpoint (the public guest demo account's
// Checkout flow — src/lib/stripe.ts). Both post to this same URL; Stripe
// signs each with its own secret, so try each in turn to see which applies.
function constructEvent(body: string, signature: string): Stripe.Event {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_TEST].filter(
    (secret): secret is string => !!secret
  );

  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      continue;
    }
  }
  throw new Error("Invalid signature");
}

function isActiveSubscription(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

// "canceled"/"incomplete_expired" are terminal — the subscription is gone for good,
// unlike "past_due"/"unpaid" which can still recover. Stripe doesn't reliably send a
// separate customer.subscription.deleted event for every cancellation path (e.g. an
// immediate cancel via the Customer Portal only sent .updated in testing), so this
// terminal check runs inside the shared sync path rather than only in the .deleted
// handler, to avoid leaving a stale stripeSubscriptionId/stripePriceId/currentPeriodEnd
// behind when only .updated fires.
function isTerminalSubscription(status: Stripe.Subscription.Status): boolean {
  return status === "canceled" || status === "incomplete_expired";
}

function toDate(unixSeconds: number | null | undefined): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

async function syncFromSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (isTerminalSubscription(subscription.status)) {
    await upsertSubscriptionFromWebhook({
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      stripePriceId: null,
      isPro: false,
      currentPeriodEnd: null,
    });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id ?? null;

  await upsertSubscriptionFromWebhook({
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    isPro: isActiveSubscription(subscription.status),
    currentPeriodEnd: toDate(subscription.items.data[0]?.current_period_end),
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = constructEvent(body, signature ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Test-mode objects (the demo account's Checkout flow) can only be read back
  // with a test-mode API key — a live-mode key gets "No such subscription".
  const client = event.livemode ? stripe : stripeTest;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const subscription = await client.subscriptions.retrieve(subscriptionId);
          await syncFromSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.updated": {
        await syncFromSubscription(event.data.object);
        break;
      }
      case "customer.subscription.deleted": {
        // The subscription object's own status is normally already "canceled" here,
        // so syncFromSubscription's terminal-status check clears the linked fields
        // the same way — but route it through the same function rather than
        // hardcoding that assumption, in case Stripe ever sends this event with a
        // different status.
        await syncFromSubscription(event.data.object);
        break;
      }
      case "invoice.payment_failed": {
        // Left to customer.subscription.updated (status -> past_due/canceled) once
        // Stripe's own retry/dunning schedule exhausts, per the spec's stated tradeoff.
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // A missing customer (P2025 — no User row matches stripeCustomerId) can't be
    // fixed by Stripe retrying, so acknowledge it to stop the retry loop. Any other
    // error might be transient (DB hiccup, etc.), so surface a 500 and let Stripe retry.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      console.error(`Stripe webhook: no user found for event ${event.type} (${event.id})`, error);
      return NextResponse.json({ received: true, warning: "No matching user" }, { status: 200 });
    }

    console.error(`Stripe webhook handler failed for event ${event.type} (${event.id})`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}