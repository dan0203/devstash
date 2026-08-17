"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  FREE_PLAN_FEATURES,
  FREE_PLAN_UNAVAILABLE_FEATURES,
  PRO_PLAN_FEATURES,
} from "@/lib/homepage-data";
import { cn } from "@/lib/utils";

export function PricingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div>
      <div className="mb-12 flex items-center justify-center gap-3.5">
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
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-6 flex flex-1 flex-col gap-2.5">
            {FREE_PLAN_FEATURES.map((feature) => (
              <PlanFeature key={feature}>{feature}</PlanFeature>
            ))}
            {FREE_PLAN_UNAVAILABLE_FEATURES.map((feature) => (
              <PlanFeature key={feature} available={false}>
                {feature}
              </PlanFeature>
            ))}
          </ul>
          <Button
            variant="outline"
            className="mt-6 w-full"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Get Started
          </Button>
        </div>

        <div className="relative flex flex-col rounded-xl border border-blue-500 bg-card p-9 px-7 ring-1 ring-blue-500">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-br from-sky-400 to-blue-600 text-white">
            Most Popular
          </Badge>
          <h3 className="mb-3 text-lg font-semibold">Pro</h3>
          <div className={cn("flex items-baseline gap-1", isYearly ? "mb-1.5" : "mb-6")}>
            <span className="text-4xl font-extrabold">{isYearly ? "$72" : "$8"}</span>
            <span className="text-sm text-muted-foreground">{isYearly ? "/yr" : "/mo"}</span>
          </div>
          {isYearly && (
            <p className="mb-6 text-sm text-green-400">billed annually — that&apos;s $6/month</p>
          )}
          <ul className="mt-6 flex flex-1 flex-col gap-2.5">
            {PRO_PLAN_FEATURES.map((feature) => (
              <PlanFeature key={feature}>{feature}</PlanFeature>
            ))}
          </ul>
          <Button
            className="mt-6 w-full bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:brightness-110"
            nativeButton={false}
            render={<Link href="/register" />}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanFeature({
  children,
  available = true,
}: {
  children: string;
  available?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-2 text-sm",
        available ? "text-muted-foreground" : "text-muted-foreground/50"
      )}
    >
      {available ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-green-400" />
      ) : (
        <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
      )}
      {children}
    </li>
  );
}
