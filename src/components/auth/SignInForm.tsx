"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGithubSubmitting, setIsGithubSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      toast.success("Email verified — you can now sign in");
    } else if (verified === "0") {
      toast.error("That verification link is invalid or expired");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      if (result.code === "email_not_verified") {
        setIsUnverified(true);
        setError("Please verify your email before signing in");
      } else {
        setError("Invalid email or password");
      }
      return;
    }

    router.push(callbackUrl);
  }

  async function handleResendVerification() {
    setIsResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsResending(false);
    toast.success("If that account exists, a new verification email is on its way");
  }

  async function handleGithubSignIn() {
    setIsGithubSubmitting(true);
    await signIn("github", { redirectTo: callbackUrl });
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {isUnverified && (
          <Button
            type="button"
            variant="link"
            className="h-auto justify-start p-0 text-sm"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGithubSignIn}
        disabled={isGithubSubmitting}
      >
        {isGithubSubmitting ? "Redirecting..." : "Sign in with GitHub"}
      </Button>
    </div>
  );
}
