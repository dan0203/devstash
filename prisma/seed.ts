import "dotenv/config";
import bcrypt from "bcryptjs";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ITEM_TYPES = [
  { name: "snippet", icon: "Code", color: "#3b82f6" },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6" },
  { name: "command", icon: "Terminal", color: "#f97316" },
  { name: "note", icon: "StickyNote", color: "#fde047" },
  { name: "file", icon: "File", color: "#6b7280" },
  { name: "image", icon: "Image", color: "#ec4899" },
  { name: "link", icon: "Link", color: "#10b981" },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash("12345678", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  const itemTypes = new Map<string, string>();
  for (const type of SYSTEM_ITEM_TYPES) {
    let itemType = await prisma.itemType.findFirst({
      where: { userId: null, name: type.name },
    });
    if (!itemType) {
      itemType = await prisma.itemType.create({
        data: {
          name: type.name,
          icon: type.icon,
          color: type.color,
          isSystem: true,
          userId: null,
        },
      });
    }
    itemTypes.set(type.name, itemType.id);
  }

  const existingCollections = await prisma.collection.count({
    where: { userId: user.id },
  });
  if (existingCollections > 0) {
    console.log(`User ${user.email} already has collections, skipping collection/item seed.`);
    return;
  }

  const snippetTypeId = itemTypes.get("snippet")!;
  const promptTypeId = itemTypes.get("prompt")!;
  const commandTypeId = itemTypes.get("command")!;
  const linkTypeId = itemTypes.get("link")!;

  async function createCollection(name: string, description: string) {
    return prisma.collection.create({
      data: { name, description, userId: user.id },
    });
  }

  async function createItem(
    collectionId: string,
    itemTypeId: string,
    data: {
      title: string;
      description?: string;
      content?: string;
      url?: string;
      language?: string;
    },
  ) {
    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        contentType: data.url ? "url" : "text",
        content: data.content,
        url: data.url,
        language: data.language,
        userId: user.id,
        itemTypeId,
      },
    });
    await prisma.itemCollection.create({
      data: { itemId: item.id, collectionId },
    });
    return item;
  }

  // ── React Patterns ────────────────────────────────────
  const reactPatterns = await createCollection(
    "React Patterns",
    "Reusable React patterns and hooks",
  );

  await createItem(reactPatterns.id, snippetTypeId, {
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
  });

  await createItem(reactPatterns.id, snippetTypeId, {
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
  });

  await createItem(reactPatterns.id, snippetTypeId, {
    title: "cn() classname utility",
    description: "Merge conditional class names with tailwind-merge + clsx.",
    language: "typescript",
    content: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
  });

  // ── AI Workflows ──────────────────────────────────────
  const aiWorkflows = await createCollection(
    "AI Workflows",
    "AI prompts and workflow automations",
  );

  await createItem(aiWorkflows.id, promptTypeId, {
    title: "Strict code review prompt",
    description: "Baseline system prompt for thorough code review sessions.",
    content:
      "You are a senior engineer performing a thorough code review. Focus on correctness, security, and simplicity. Flag anything that would fail in production, and explain the risk in one sentence per finding.",
  });

  await createItem(aiWorkflows.id, promptTypeId, {
    title: "Generate README from codebase",
    description: "Prompt for producing developer-facing documentation.",
    content:
      "Read the provided source files and produce a concise README section covering: what this module does, its public API, and one usage example. Avoid restating obvious code; focus on intent and non-obvious behavior.",
  });

  await createItem(aiWorkflows.id, promptTypeId, {
    title: "Refactor for readability",
    description: "Prompt for a conservative, behavior-preserving refactor pass.",
    content:
      "Refactor the following code for readability without changing its behavior. Keep the diff minimal, preserve existing naming conventions, and explain each non-trivial change in one line.",
  });

  // ── DevOps ────────────────────────────────────────────
  const devOps = await createCollection(
    "DevOps",
    "Infrastructure and deployment resources",
  );

  await createItem(devOps.id, snippetTypeId, {
    title: "Node.js production Dockerfile",
    description: "Multi-stage Dockerfile for a Next.js production build.",
    language: "dockerfile",
    content: `FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]`,
  });

  await createItem(devOps.id, commandTypeId, {
    title: "Deploy to production",
    description: "Build, run migrations, and restart the app service.",
    language: "bash",
    content: `npm run build && npx prisma migrate deploy && pm2 restart app`,
  });

  await createItem(devOps.id, linkTypeId, {
    title: "Docker Compose documentation",
    url: "https://docs.docker.com/compose/",
  });

  await createItem(devOps.id, linkTypeId, {
    title: "GitHub Actions documentation",
    url: "https://docs.github.com/en/actions",
  });

  // ── Terminal Commands ─────────────────────────────────
  const terminalCommands = await createCollection(
    "Terminal Commands",
    "Useful shell commands for everyday development",
  );

  await createItem(terminalCommands.id, commandTypeId, {
    title: "Delete merged git branches",
    description: "Clean up local branches already merged into main.",
    language: "bash",
    content: `git branch --merged main | grep -v '\\* main' | xargs -n 1 git branch -d`,
  });

  await createItem(terminalCommands.id, commandTypeId, {
    title: "Docker full prune",
    description: "Reclaim disk space by removing unused Docker data.",
    language: "bash",
    content: `docker system prune -a --volumes`,
  });

  await createItem(terminalCommands.id, commandTypeId, {
    title: "Find process on a port",
    description: "Locate and inspect the process bound to a given TCP port.",
    language: "bash",
    content: `lsof -i :3000`,
  });

  await createItem(terminalCommands.id, commandTypeId, {
    title: "Clean npm cache and reinstall",
    description: "Nuke node_modules and lockfile artifacts, then reinstall.",
    language: "bash",
    content: `rm -rf node_modules package-lock.json && npm cache clean --force && npm install`,
  });

  // ── Design Resources ──────────────────────────────────
  const designResources = await createCollection(
    "Design Resources",
    "UI/UX resources and references",
  );

  await createItem(designResources.id, linkTypeId, {
    title: "Tailwind CSS documentation",
    url: "https://tailwindcss.com/docs",
  });

  await createItem(designResources.id, linkTypeId, {
    title: "shadcn/ui components",
    url: "https://ui.shadcn.com",
  });

  await createItem(designResources.id, linkTypeId, {
    title: "Radix UI primitives",
    url: "https://www.radix-ui.com/primitives",
  });

  await createItem(designResources.id, linkTypeId, {
    title: "Lucide icon library",
    url: "https://lucide.dev/icons",
  });

  console.log(`Seed complete for user ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
