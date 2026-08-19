import Link from "next/link";

import { Navbar } from "@/components/homepage/Navbar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 pt-24 sm:pt-28">
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
    </>
  );
}
