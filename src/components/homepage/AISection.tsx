import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollFadeIn } from "@/components/homepage/ScrollFadeIn";
import { AI_CHECKLIST, AI_DEMO_TAGS } from "@/lib/homepage-data";

export function AISection() {
  return (
    <section className="bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent py-24">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <ScrollFadeIn className="text-center lg:text-left">
          <Badge className="mb-3.5 border border-blue-500/35 bg-blue-500/15 text-blue-300" variant="outline">
            Pro Feature
          </Badge>
          <h2 className="mb-2.5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Let AI do the busywork
          </h2>
          <p className="mb-7 text-muted-foreground">Spend less time organizing and more time building.</p>
          <ul className="flex flex-col items-center gap-3.5 lg:items-start">
            {AI_CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                  <Check className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </ScrollFadeIn>

        <ScrollFadeIn>
          <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3.5 py-2.5">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="size-2.5 rounded-full bg-green-500" />
              <span className="ml-2.5 font-mono text-xs text-muted-foreground/70">debounce.ts</span>
            </div>
            <pre className="overflow-x-auto px-4 py-4.5 font-mono text-[0.82rem] leading-relaxed">
              <code>
                <span className="text-purple-400">function</span> <span className="text-blue-400">debounce</span>
                {"(fn, delay) {\n  "}
                <span className="text-purple-400">let</span>
                {" timer;\n  "}
                <span className="text-purple-400">return</span>
                {" (...args) => {\n    "}
                <span className="text-blue-400">clearTimeout</span>
                {"(timer);\n    timer = "}
                <span className="text-blue-400">setTimeout</span>
                {"(() => fn(...args), delay);\n  };\n}"}
              </code>
            </pre>
            <div className="border-t border-border p-4">
              <span className="mb-2.5 flex items-center gap-1 text-xs font-bold text-blue-300">
                <Sparkles className="size-3.5" /> AI Generated Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {AI_DEMO_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
