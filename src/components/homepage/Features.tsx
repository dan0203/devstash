import { ScrollFadeIn } from "@/components/homepage/ScrollFadeIn";
import { SectionHeading } from "@/components/homepage/SectionHeading";
import { HOMEPAGE_FEATURES } from "@/lib/homepage-data";

export function Features() {
  return (
    <section id="features" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-[1160px] px-6">
        <ScrollFadeIn>
          <SectionHeading title="Everything, one place" subtitle="Purpose-built for how developers actually work." />
        </ScrollFadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {HOMEPAGE_FEATURES.map((feature) => (
            <ScrollFadeIn key={feature.title}>
              <div
                className="h-full rounded-[14px] border border-border bg-card p-6.5 transition-transform hover:-translate-y-1"
                style={{ borderLeft: `3px solid ${feature.color}` }}
              >
                <div
                  className="mb-4 flex size-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: `${feature.color}2e`, color: feature.color }}
                >
                  <feature.icon className="size-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
