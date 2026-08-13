import { cache } from "react";
import { prisma } from "@/lib/prisma";

// TODO: replace with the authenticated user's id once NextAuth is wired up.
const DEMO_USER_EMAIL = "demo@devstash.io";

export const getDemoUserId = cache(async (): Promise<string> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });
  return user.id;
});
