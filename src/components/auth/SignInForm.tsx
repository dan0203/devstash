"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { postJson } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { signInWithCredentials, signInWithGithub, type SignInActionState } from "@/actions/auth";

const initialActionState: SignInActionState = { code: null };

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const [credentialsState, credentialsAction, isCredentialsPending] = useActionState(
    signInWithCredentials,
    initialActionState
  );
  const [githubState, githubAction, isGithubPending] = useActionState(
    signInWithGithub.bind(null, callbackUrl),
    initialActionState
  );

  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "1") {
      toast.success("Email verified — you can now sign in");
    } else if (verified === "0") {
      toast.error("That verification link is invalid or expired");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUnverified = credentialsState.code === "email_not_verified";
  const errorMessage =
    credentialsState.code === "email_not_verified"
      ? "Please verify your email before signing in"
      : credentialsState.code === "rate_limited"
        ? "Too many attempts. Please try again in a few minutes."
        : credentialsState.code
          ? "Invalid email or password"
          : null;

  async function handleResendVerification() {
    setIsResending(true);
    try {
      const body = await postJson<{ success: boolean; error?: string }>(
        "/api/auth/resend-verification",
        { email }
      );

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

  return (
    <div className="flex flex-col gap-4">
      <form action={credentialsAction} className="flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
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
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
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

        <Button type="submit" className="w-full" disabled={isCredentialsPending}>
          {isCredentialsPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <form action={githubAction}>
        <Button type="submit" variant="outline" className="w-full" disabled={isGithubPending}>
          {isGithubPending ? "Redirecting..." : "Sign in with GitHub"}
        </Button>
      </form>
      {githubState.code && (
        <p className="text-sm text-destructive">
          Something went wrong — check your connection and try again
        </p>
      )}
    </div>
  );
}
