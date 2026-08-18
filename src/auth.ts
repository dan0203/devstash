import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { isEmailVerificationEnabled } from "@/lib/verification-email";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const {
  handlers,
  auth: baseAuth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && user.id) {
        await prisma.user.updateMany({
          where: { id: user.id, emailVerified: null },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = user as { isPro?: boolean; passwordChangedAt?: Date | null };
        token.sub = user.id;
        token.isPro = dbUser.isPro ?? false;
        token.pwChangedAt = dbUser.passwordChangedAt?.getTime() ?? null;
        return token;
      }

      // On every subsequent request, confirm the password hasn't changed since
      // this token was issued — otherwise a stale JWT would stay valid even
      // after the user changed/reset their password on another device.
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { passwordChangedAt: true, isPro: true },
        });
        token.isPro = dbUser?.isPro ?? false;
        const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
        const tokenChangedAt = typeof token.pwChangedAt === "number" ? token.pwChangedAt : null;
        if (dbChangedAt !== null && dbChangedAt !== tokenChangedAt) {
          return null;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.isPro = typeof token.isPro === "boolean" ? token.isPro : false;
      return session;
    },
  },
  ...authConfig,
  providers: [
    GitHub,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const ip = getClientIp(request);
        const rateLimit = await checkRateLimit(rateLimiters.login, `${ip}:${email}`);
        if (!rateLimit.success) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        if (isEmailVerificationEnabled() && !user.emailVerified) {
          throw new EmailNotVerifiedError();
        }

        return user;
      },
    }),
  ],
});

// The jwt callback above does a DB lookup on every call to confirm the
// password hasn't changed; auth() is typically called multiple times per
// request (layout + page), so dedupe with React's cache() the same way
// getDemoUserId()/getCollectionsWithStats() do in src/lib/db.
export const auth = cache(baseAuth);
export { handlers, signIn, signOut };
