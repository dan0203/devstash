"use client";

import { useState } from "react";
import { toast } from "sonner";

import { createCheckoutSession, createPortalSession } from "@/actions/billing";
import type { BillingInfo } from "@/lib/db/billing";
import { FREE_TIER_LIMITS } from "@/lib/plan-limits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BillingSettingsProps {
  billingInfo: BillingInfo;
  planLabel: string;
  itemCount: number;
  collectionCount: number;
}

export function BillingSettings({
  billingInfo,
  planLabel,
  itemCount,
  collectionCount,
}: BillingSettingsProps) {
  const [pendingPlan, setPendingPlan] = useState<"monthly" | "yearly" | "portal" | null>(null);

  async function handleUpgrade(plan: "monthly" | "yearly") {
    setPendingPlan(plan);
    try {
      const result = await createCheckoutSession(plan);
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.error ?? "Something went wrong");
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setPendingPlan(null);
    }
  }

  async function handleManage() {
    setPendingPlan("portal");
    try {
      const result = await createPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.error ?? "Something went wrong");
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 py-2">
          <span className="text-sm text-muted-foreground">Current plan</span>
          <Badge variant={billingInfo.isPro ? "default" : "secondary"}>{planLabel}</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">
            {itemCount}/{billingInfo.isPro ? "unlimited" : FREE_TIER_LIMITS.items}{" "}
            <span className="text-sm text-muted-foreground">Items</span>
          </span>
          <span className="font-medium">
            {collectionCount}/{billingInfo.isPro ? "unlimited" : FREE_TIER_LIMITS.collections}{" "}
            <span className="text-sm text-muted-foreground">Collections</span>
          </span>
        </div>
      </div>

      {billingInfo.isPro && billingInfo.currentPeriodEnd && (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-muted-foreground">Renews on</span>
          <span className="font-medium">
            {billingInfo.currentPeriodEnd.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      )}

      {billingInfo.isPro ? (
        <Button onClick={handleManage} disabled={pendingPlan !== null} className="w-fit">
          {pendingPlan === "portal" ? "Opening..." : "Manage subscription"}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleUpgrade("monthly")}
            disabled={pendingPlan !== null}
          >
            {pendingPlan === "monthly" ? "Redirecting..." : "Upgrade $8/mo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleUpgrade("yearly")}
            disabled={pendingPlan !== null}
          >
            {pendingPlan === "yearly" ? "Redirecting..." : "Upgrade $72/yr (save 25%)"}
          </Button>
        </div>
      )}
    </div>
  );
}