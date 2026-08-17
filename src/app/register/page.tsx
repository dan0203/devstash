import Link from "next/link";
import { Layers } from "lucide-react";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Layers className="size-5 text-blue-500" />
        DevStash
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Create an account</CardTitle>
          <CardDescription>Start stashing your dev knowledge</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
