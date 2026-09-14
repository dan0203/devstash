import type { PrismaClient } from "@/generated/prisma/client";

// System item types actually used by the seed content below. Shared by
// prisma/seed.ts (initial seeding) and src/lib/db/demo-account.ts (the daily
// reset — src/app/api/cron/reset-demo/route.ts) so the public guest demo
// account's sample data isn't duplicated between the two.
export type DemoSeedItemType = "snippet" | "prompt" | "command";

export interface DemoSeedItem {
  itemType: DemoSeedItemType;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  language?: string;
}

export interface DemoSeedCollection {
  name: string;
  description: string;
  items: DemoSeedItem[];
}

export const DEMO_SEED_COLLECTIONS: DemoSeedCollection[] = [
  {
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    items: [
      {
        itemType: "snippet",
        title: "useDebounce hook",
        description: "Debounce a fast-changing value with a configurable delay.",
        language: "typescript",
        content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
      },
      {
        itemType: "snippet",
        title: "Compound component context provider",
        description: "Typed context + provider pattern for compound components.",
        language: "typescript",
        content: `import { createContext, useContext, type ReactNode } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabsContext must be used within <Tabs>");
  return ctx;
}

export function TabsProvider({
  value,
  children,
}: {
  value: TabsContextValue;
  children: ReactNode;
}) {
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}`,
      },
      {
        itemType: "snippet",
        title: "cn() classname utility",
        description: "Merge conditional class names with tailwind-merge + clsx.",
        language: "typescript",
        content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      },
    ],
  },
  {
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    items: [
      {
        itemType: "prompt",
        title: "Strict code review prompt",
        description: "Baseline system prompt for thorough code review sessions.",
        content:
          "You are a senior engineer performing a thorough code review. Focus on correctness, security, and simplicity. Flag anything that would fail in production, and explain the risk in one sentence per finding.",
      },
      {
        itemType: "prompt",
        title: "Generate README from codebase",
        description: "Prompt for producing developer-facing documentation.",
        content:
          "Read the provided source files and produce a concise README section covering: what this module does, its public API, and one usage example. Avoid restating obvious code; focus on intent and non-obvious behavior.",
      },
      {
        itemType: "prompt",
        title: "Refactor for readability",
        description: "Prompt for a conservative, behavior-preserving refactor pass.",
        content:
          "Refactor the following code for readability without changing its behavior. Keep the diff minimal, preserve existing naming conventions, and explain each non-trivial change in one line.",
      },
    ],
  },
  {
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    items: [
      {
        itemType: "command",
        title: "Delete merged git branches",
        description: "Clean up local branches already merged into main.",
        language: "bash",
        content: `git branch --merged main | grep -v '\\* main' | xargs -n 1 git branch -d`,
      },
      {
        itemType: "command",
        title: "Docker full prune",
        description: "Reclaim disk space by removing unused Docker data.",
        language: "bash",
        content: `docker system prune -a --volumes`,
      },
      {
        itemType: "command",
        title: "Find process on a port",
        description: "Locate and inspect the process bound to a given TCP port.",
        language: "bash",
        content: `lsof -i :3000`,
      },
      {
        itemType: "command",
        title: "Clean npm cache and reinstall",
        description: "Nuke node_modules and lockfile artifacts, then reinstall.",
        language: "bash",
        content: `rm -rf node_modules package-lock.json && npm cache clean --force && npm install`,
      },
    ],
  },
];

/**
 * Creates DEMO_SEED_COLLECTIONS' collections/items for the given user. Takes
 * a PrismaClient instance rather than importing the app's singleton so it can
 * be called from both the standalone seed script (its own client/adapter)
 * and the app runtime (src/lib/db/demo-account.ts).
 */
export async function applyDemoSeedData(db: PrismaClient, userId: string, itemTypeIdByName: Record<string, string>) {
  for (const collectionSeed of DEMO_SEED_COLLECTIONS) {
    const collection = await db.collection.create({
      data: { name: collectionSeed.name, description: collectionSeed.description, userId },
    });

    for (const itemSeed of collectionSeed.items) {
      const itemTypeId = itemTypeIdByName[itemSeed.itemType];
      const item = await db.item.create({
        data: {
          title: itemSeed.title,
          description: itemSeed.description,
          contentType: itemSeed.url ? "url" : "text",
          content: itemSeed.content,
          url: itemSeed.url,
          language: itemSeed.language,
          userId,
          itemTypeId,
        },
      });
      await db.itemCollection.create({ data: { itemId: item.id, collectionId: collection.id } });
    }
  }
}
