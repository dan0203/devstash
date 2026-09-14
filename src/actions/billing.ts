"use server";

import {
  stripe,
  stripeTest,
  STRIPE_PRICE_IDS,
  STRIPE_TEST_PRICE_IDS,
  isStripeTestModeConfigured,
} from "@/lib/stripe";
import { getStripeCustomerContext, setStripeCustomerId } from "@/lib/db/billing";
import { requireSession } from "@/lib/auth-utils";
import { isDemoAccountEmail } from "@/lib/demo-account";

const DEMO_ACCOUNT_BILLING_UNAVAILABLE_ERROR =
  "Demo checkout isn't configured right now. Please try again later.";

export interface CheckoutSessionState {
  success: boolean;
  url?: string;
  error?: string;
}

export async function createCheckoutSession(plan: "monthly" | "yearly"): Promise<CheckoutSessionState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const context = await getStripeCustomerContext(auth.userId);
  if (!context) {
    return { success: false, error: "User not found" };
  }

  // The public guest demo account goes through a separate Stripe *test-mode*
  // client/price set (src/lib/stripe.ts) instead of the real one — a visitor
  // sees a genuine, fully-functional Checkout flow (test cards only, e.g.
  // 4242 4242 4242 4242), with zero chance of a real charge. See
  // src/lib/db/demo-account.ts's daily reset for how the resulting test
  // subscription/isPro state gets cleared so the demo account can't get
  // stuck "Pro" forever.
  const isDemo = isDemoAccountEmail(context.email);
  if (isDemo && !isStripeTestModeConfigured()) {
    return { success: false, error: DEMO_ACCOUNT_BILLING_UNAVAILABLE_ERROR };
  }
  const client = isDemo ? stripeTest : stripe;
  const priceIds = isDemo ? STRIPE_TEST_PRICE_IDS : STRIPE_PRICE_IDS;

  let customerId = context.stripeCustomerId;
  if (!customerId) {
    const customer = await client.customers.create({
      email: context.email ?? undefined,
      name: context.name ?? undefined,
      metadata: { userId: auth.userId },
    });
    customerId = customer.id;
    await setStripeCustomerId(auth.userId, customerId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const checkoutSession = await client.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceIds[plan], quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled`,
  });

  if (!checkoutSession.url) {
    return { success: false, error: "Failed to create checkout session" };
  }

  return { success: true, url: checkoutSession.url };
}

export interface PortalSessionState {
  success: boolean;
  url?: string;
  error?: string;
}

export async function createPortalSession(): Promise<PortalSessionState> {
  const auth = await requireSession();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const context = await getStripeCustomerContext(auth.userId);
  if (!context?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const isDemo = isDemoAccountEmail(context.email);
  const client = isDemo ? stripeTest : stripe;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalSession = await client.billingPortal.sessions.create({
    customer: context.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  });

  return { success: true, url: portalSession.url };
}
