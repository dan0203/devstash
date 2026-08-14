import "dotenv/config";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;

const DEMO_EMAIL = "demo@devstash.io";

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const force = process.argv.includes("--force");

  try {
    const usersToDelete = await prisma.user.findMany({
      where: { email: { not: DEMO_EMAIL } },
      select: { id: true, email: true, name: true },
    });

    if (usersToDelete.length === 0) {
      console.log("No non-demo users found. Nothing to delete.");
      return;
    }

    console.log(`Users to delete (${usersToDelete.length}):`);
    for (const user of usersToDelete) {
      console.log(`  - ${user.email ?? "(no email)"} (${user.name ?? "no name"})`);
    }

    if (!force) {
      console.log("\nDry run only — re-run with --force to actually delete.");
      return;
    }

    // Items/Collections/ItemTypes/Tags/Accounts/Sessions all cascade via
    // onDelete: Cascade on their userId relation — see prisma/schema.prisma.
    const { count } = await prisma.user.deleteMany({
      where: { email: { not: DEMO_EMAIL } },
    });

    // VerificationToken isn't linked by a userId FK (identifier is the raw
    // email), so it doesn't cascade and has to be cleaned up separately.
    const deletedEmails = usersToDelete
      .map((user) => user.email)
      .filter((email): email is string => email !== null);
    await prisma.verificationToken.deleteMany({
      where: { identifier: { in: deletedEmails } },
    });

    console.log(`\nDeleted ${count} user(s) and all of their content.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to delete non-demo users:", error);
  process.exit(1);
});
