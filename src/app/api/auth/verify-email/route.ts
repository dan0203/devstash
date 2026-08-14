import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  const signInUrl = new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? origin);

  if (!token) {
    signInUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(signInUrl);
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    if (verificationToken) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    signInUrl.searchParams.set("verified", "0");
    return NextResponse.redirect(signInUrl);
  }

  await prisma.user.updateMany({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  signInUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(signInUrl);
}
