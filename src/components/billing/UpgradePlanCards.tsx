"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

import { createCheckoutSession } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FREE_PLAN_FEATURES, PRO_PLAN_FEATURES } from "@/lib/homepage-data";

export function UpgradePlanCards() {
  const [isYearly, setIsYearly] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleUpgrade() {
    setPending(true);
    try {
      const result = await createCheckoutSession(isYearly ? "yearly" : "monthly");
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.error ?? "Something went wrong");
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3.5">
        <span className="text-sm text-muted-foreground">Monthly</span>
        <Switch
          checked={isYearly}
          onCheckedChange={setIsYearly}
          aria-label="Toggle yearly billing"
        />
        <span className="text-sm text-muted-foreground">
          Yearly
          <Badge className="ml-1.5 bg-green-500 text-neutral-800" variant="secondary">
            Save 25%
          </Badge>
        </span>
      </div>

      <div className="mx-auto grid max-w-[720px] grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-border bg-card p-9 px-7">
          <h3 className="mb-3 text-lg font-semibold">Free</h3>
          <div className="mb-1.5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">Your current plan</p>
          <ul className="flex flex-1 flex-col gap-2.5">
            {FREE_PLAN_FEATURES.map((feature) => (
              <PlanFeature key={feature}>{feature}</PlanFeature>
            ))}
          </ul>
          <Button variant="outline" className="mt-6 w-full" disabled>
            Current plan
          </Button>
        </div>

        <div className="relative flex flex-col rounded-xl border border-blue-500 bg-card p-9 px-7 ring-1 ring-blue-500">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-sky-400 to-blue-600 text-white">
            Most Popular
          </Badge>
          <h3 className="mb-3 text-lg font-semibold">Pro</h3>
          <div className="mb-1.5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">{isYearly ? "$6" : "$8"}</span>
            <span className="text-sm text-muted-foreground">
              /month{isYearly ? " (billed $72/year)" : ""}
            </span>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">For serious developers</p>
          <ul className="flex flex-1 flex-col gap-2.5">
            {PRO_PLAN_FEATURES.map((feature) => (
              <PlanFeature key={feature}>{feature}</PlanFeature>
            ))}
          </ul>
          <Button
            className="mt-6 w-full bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:brightness-110"
            onClick={handleUpgrade}
            disabled={pending}
          >
            {pending ? "Redirecting..." : `Upgrade $${isYearly ? "72/yr" : "8/mo"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ children }: { children: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <Check className="mt-0.5 size-3.5 shrink-0 text-green-400" />
      {children}
    </li>
  );
}
