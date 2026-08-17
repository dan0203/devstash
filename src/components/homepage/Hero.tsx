import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChaosField } from "@/components/homepage/ChaosField";
import { ScrollFadeIn } from "@/components/homepage/ScrollFadeIn";
import { HOMEPAGE_ITEM_TYPES } from "@/lib/homepage-data";

const SIDEBAR_ITEMS = HOMEPAGE_ITEM_TYPES;
const COLLECTION_CARD_COLORS = HOMEPAGE_ITEM_TYPES.slice(0, 4).map((t) => t.color);
const RECENT_ITEM_CARD_COLORS = [
  HOMEPAGE_ITEM_TYPES[5].color,
  HOMEPAGE_ITEM_TYPES[6].color,
  HOMEPAGE_ITEM_TYPES[4].color,
  HOMEPAGE_ITEM_TYPES[0].color,
];

export function Hero() {
  return (
    <header className="mx-auto flex max-w-[1160px] flex-col items-center gap-18 px-6 pt-[130px] pb-24 sm:pt-40 sm:pb-[100px]">
      <ScrollFadeIn className="max-w-[720px] text-center">
        <h1 className="mb-5 text-[2.2rem] font-extrabold tracking-tight sm:text-[3.4rem] sm:leading-[1.1]">
          Stop Losing Your <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
            Developer Knowledge
          </span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Snippets, prompts, commands, and notes end up scattered across a dozen tools. DevStash
          brings all of it into one fast, searchable, AI-enhanced hub.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/register" />}
            className="bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:brightness-110"
          >
            Get Started
          </Button>
          <Button variant="outline" size="lg" nativeButton={false} render={<a href="#features" />}>
            See Features
          </Button>
        </div>
      </ScrollFadeIn>

      <ScrollFadeIn className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex h-[280px] flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:h-[340px]">
          <p className="shrink-0 px-4 pt-3.5 pb-2.5 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
            Your knowledge today...
          </p>
          <ChaosField />
        </div>

        <div className="flex justify-center rotate-90 lg:rotate-0">
          <div className="animate-[pulse-arrow_1.8s_ease-in-out_infinite] text-indigo-400">
            <svg viewBox="0 0 60 24" className="h-6 w-14" aria-hidden="true">
              <line x1="2" y1="12" x2="48" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path
                d="M38 2 L54 12 L38 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex h-[280px] flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] sm:h-[340px]">
          <p className="shrink-0 px-4 pt-3.5 pb-2.5 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
            ...with DevStash
          </p>
          <div className="mx-3 mb-3 flex flex-1 gap-2.5">
            <div className="flex w-27 shrink-0 flex-col gap-0.5 rounded-md border border-border bg-background/60 p-2">
              {SIDEBAR_ITEMS.map((item, i) => (
                <div
                  key={item.name}
                  className={
                    "flex items-center gap-1.5 rounded px-1.5 py-1 text-[0.62rem] font-semibold whitespace-nowrap text-muted-foreground/70" +
                    (i === 0 ? " bg-indigo-500/15 text-foreground" : "")
                  }
                >
                  <span
                    className="size-[7px] shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-center text-[0.6rem] font-bold tracking-wider text-muted-foreground/70">
                COLLECTIONS
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {COLLECTION_CARD_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-md border border-border bg-background/60"
                    style={{ borderLeft: `3px solid ${color}` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-[0.6rem] font-bold tracking-wider text-muted-foreground/70">
                RECENT ITEMS
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {RECENT_ITEM_CARD_COLORS.map((color, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-md border border-border bg-background/60"
                    style={{ borderLeft: `3px solid ${color}` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollFadeIn>
    </header>
  );
}
