import "dotenv/config";
import bcrypt from "bcryptjs";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";
import { applyDemoSeedData } from "../src/lib/demo-seed-data";

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

async function seedAccount(
  email: string,
  name: string,
  passwordHash: string,
  itemTypeIdByName: Record<string, string>,
) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      password: passwordHash,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  const existingCollections = await prisma.collection.count({ where: { userId: user.id } });
  if (existingCollections > 0) {
    console.log(`User ${user.email} already has collections, skipping collection/item seed.`);
    return;
  }

  await applyDemoSeedData(prisma, user.id, itemTypeIdByName);
  console.log(`Seed complete for user ${user.email}`);
}

async function main() {
  const itemTypeIdByName: Record<string, string> = {};
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
    itemTypeIdByName[type.name] = itemType.id;
  }

  // Public guest demo account — visitors auto-sign into this one from the
  // homepage's "Try the Live Demo" button (src/actions/demo.ts). Deliberately
  // free-tier and reset daily (src/app/api/cron/reset-demo) so plan limits
  // stay visible and visitor edits don't accumulate. Skipped if the env vars
  // aren't configured, so `npm run db:seed` still works without them.
  const guestEmail = process.env.DEMO_ACCOUNT_EMAIL;
  const guestPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (guestEmail && guestPassword) {
    const guestPasswordHash = await bcrypt.hash(guestPassword, 12);
    await seedAccount(guestEmail, "Guest", guestPasswordHash, itemTypeIdByName);
  } else {
    console.log("DEMO_ACCOUNT_EMAIL/DEMO_ACCOUNT_PASSWORD not set, skipping public guest demo account seed.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
