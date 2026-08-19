import Link from "next/link";

import { Navbar } from "@/components/homepage/Navbar";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 pt-24 sm:pt-28">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Forgot password</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ForgotPasswordForm />
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/sign-in" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
