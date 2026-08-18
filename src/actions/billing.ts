"use server";

import { auth } from "@/auth";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { getStripeCustomerContext, setStripeCustomerId } from "@/lib/db/billing";

export interface CheckoutSessionState {
  success: boolean;
  url?: string;
  error?: string;
}

export async function createCheckoutSession(plan: "monthly" | "yearly"): Promise<CheckoutSessionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const context = await getStripeCustomerContext(session.user.id);
  if (!context) {
    return { success: false, error: "User not found" };
  }

  let customerId = context.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.email ?? undefined,
      name: context.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await setStripeCustomerId(session.user.id, customerId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICE_IDS[plan], quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success`,
    cancel_url: `${appUrl}/settings`,
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
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }

  const context = await getStripeCustomerContext(session.user.id);
  if (!context?.stripeCustomerId) {
    return { success: false, error: "No billing account found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: context.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  });

  return { success: true, url: portalSession.url };
}
