import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollFadeIn } from "@/components/homepage/ScrollFadeIn";

export function CTA() {
  return (
    <section className="px-6 py-24">
      <ScrollFadeIn
        className="mx-auto max-w-[1160px] rounded-[20px] border border-border bg-gradient-to-br from-indigo-500/12 to-blue-500/8 px-6 py-15 text-center"
      >
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Ready to Organize Your Knowledge?
        </h2>
        <p className="mb-7 text-muted-foreground">
          Join developers who stopped losing their best snippets, prompts, and notes.
        </p>
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/register" />}
          className="bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:brightness-110"
        >
          Get Started
        </Button>
      </ScrollFadeIn>
    </section>
  );
}
