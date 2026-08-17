import { ScrollFadeIn } from "@/components/homepage/ScrollFadeIn";
import { SectionHeading } from "@/components/homepage/SectionHeading";
import { PricingToggle } from "@/components/homepage/PricingToggle";

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-[1160px] px-6">
        <ScrollFadeIn>
          <SectionHeading title="Simple pricing" subtitle="Start free. Upgrade when you need more." />
        </ScrollFadeIn>

        <ScrollFadeIn>
          <PricingToggle />
        </ScrollFadeIn>
      </div>
    </section>
  );
}
