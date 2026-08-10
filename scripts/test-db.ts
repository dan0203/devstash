import "dotenv/config";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    console.log("Connected to database. Server time:", result[0].now);

    const userCount = await prisma.user.count();
    console.log("User count:", userCount);

    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@devstash.io" },
      include: {
        collections: {
          include: {
            items: {
              include: { item: { include: { itemType: true } } },
            },
          },
        },
      },
    });

    if (!demoUser) {
      console.log("\nDemo user not found. Run `npm run db:seed` first.");
      return;
    }

    console.log(`\nDemo user: ${demoUser.name} <${demoUser.email}> (isPro: ${demoUser.isPro})`);
    console.log(`Collections: ${demoUser.collections.length}`);

    for (const collection of demoUser.collections) {
      console.log(`\n- ${collection.name} — ${collection.description ?? "no description"}`);
      for (const { item } of collection.items) {
        console.log(`    [${item.itemType.name}] ${item.title}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Database connection test failed:", error);
  process.exit(1);
});
