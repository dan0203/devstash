"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    try {
      setIsSubmitting(true);

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === "email_not_verified") {
          setIsUnverified(true);
          setError("Please verify your email before signing in");
        } else if (result.code === "rate_limited") {
          setError("Too many attempts. Please try again in a few minutes.");
        } else {
          setError("Invalid email or password");
        }
        return;
      }

      router.push(callbackUrl);
    } catch {
      setError("Something went wrong — check your connection and try again");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();

      if (!body.success) {
        toast.error(body.error ?? "Something went wrong");
        return;
      }

      toast.success("If that account exists, a new verification email is on its way");
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setIsResending(false);
    }
  }

  async function handleGithubSignIn() {
    setIsGithubSubmitting(true);
    try {
      await signIn("github", { redirectTo: callbackUrl });
    } catch {
      toast.error("Something went wrong — check your connection and try again");
      setIsGithubSubmitting(false);
    }
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
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
