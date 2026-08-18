import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { upsertSubscriptionFromWebhook } from "@/lib/db/billing";

function isActiveSubscription(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

function toDate(unixSeconds: number | null | undefined): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

async function syncFromSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
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
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncFromSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.updated": {
      await syncFromSubscription(event.data.object);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await upsertSubscriptionFromWebhook({
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
        stripePriceId: null,
        isPro: false,
        currentPeriodEnd: null,
      });
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

  return NextResponse.json({ received: true });
}