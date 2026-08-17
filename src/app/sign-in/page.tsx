import { Suspense } from "react";
import Link from "next/link";

import { Navbar } from "@/components/homepage/Navbar";
import { SignInForm } from "@/components/auth/SignInForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 pt-24 sm:pt-28">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sign in</CardTitle>
            <CardDescription>Sign in to access your DevStash</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Suspense>
              <SignInForm />
            </Suspense>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
