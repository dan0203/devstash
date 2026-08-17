import { Suspense } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";

import { SignInForm } from "@/components/auth/SignInForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Layers className="size-5 text-blue-500" />
        DevStash
      </Link>

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
  );
}
