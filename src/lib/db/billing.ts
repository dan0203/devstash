import { prisma } from "@/lib/prisma";

export interface BillingInfo {
  isPro: boolean;
  stripePriceId: string | null;
  currentPeriodEnd: Date | null;
  hasStripeCustomer: boolean;
}

export async function getBillingInfo(userId: string): Promise<BillingInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isPro: true,
      stripePriceId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  return {
    isPro: user?.isPro ?? false,
    stripePriceId: user?.stripePriceId ?? null,
    currentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
    hasStripeCustomer: user?.stripeCustomerId !== null && user?.stripeCustomerId !== undefined,
  };
}

// Called only from the Phase 2 webhook handler — service-role writes, no ownership
// check needed since the webhook payload's customer/subscription IDs are the source of truth.
export async function upsertSubscriptionFromWebhook(params: {
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  isPro: boolean;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  await prisma.user.update({
    where: { stripeCustomerId: params.stripeCustomerId },
    data: {
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      isPro: params.isPro,
      stripeCurrentPeriodEnd: params.currentPeriodEnd,
    },
  });
}

export interface StripeCustomerContext {
  stripeCustomerId: string | null;
  email: string | null;
  name: string | null;
}

export async function getStripeCustomerContext(userId: string): Promise<StripeCustomerContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (!user) return null;

  return { stripeCustomerId: user.stripeCustomerId, email: user.email, name: user.name };
}

export async function setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId },
  });
}
