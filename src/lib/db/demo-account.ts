import { prisma } from "@/lib/prisma";
import { stripeTest } from "@/lib/stripe";
import { getSystemItemTypesOrdered } from "@/lib/db/item-types";
import { applyDemoSeedData } from "@/lib/demo-seed-data";

/**
 * Wipes and re-seeds the public guest demo account's collections/items back
 * to their baseline, and clears any test-mode Stripe subscription a visitor
 * completed via the demo Checkout flow (src/actions/billing.ts) — otherwise
 * the account could get stuck "Pro" forever and stop demonstrating free-tier
 * limits. Called daily by GET /api/cron/reset-demo.
 */
export async function resetDemoAccountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });

  if (user?.stripeSubscriptionId) {
    try {
      await stripeTest.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (error) {
      // Best-effort tidiness (keeps the Stripe test dashboard clean) — the
      // billing fields get cleared below regardless, so a failure here
      // (e.g. already canceled) doesn't block the reset.
      console.error("Failed to cancel demo account's test-mode Stripe subscription", error);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isPro: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
    },
  });

  // Item delete cascades ItemCollection and clears the Item<->Tag M2M;
  // Collection delete cascades any remaining ItemCollection rows.
  await prisma.item.deleteMany({ where: { userId } });
  await prisma.collection.deleteMany({ where: { userId } });
  await prisma.tag.deleteMany({ where: { userId } });

  const itemTypes = await getSystemItemTypesOrdered();
  const itemTypeIdByName = Object.fromEntries(itemTypes.map((type) => [type.name, type.id]));

  await applyDemoSeedData(prisma, userId, itemTypeIdByName);
}
