import { Suspense } from "react";

import { Navbar } from "@/components/homepage/Navbar";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 pt-24 sm:pt-28">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Reset password</CardTitle>
            <CardDescription>Choose a new password for your account</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
