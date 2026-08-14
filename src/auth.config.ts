import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      // Overridden in auth.ts with real bcrypt validation — this file must
      // stay edge-compatible, and Prisma can't run in the edge runtime.
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
