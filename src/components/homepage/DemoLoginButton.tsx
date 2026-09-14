"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { signInAsDemoUser } from "@/actions/demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoLoginButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await signInAsDemoUser();
      if (!result.code) {
        router.push("/dashboard");
        return;
      }
      toast.error("Couldn't sign in to the demo account. Please try again in a moment.");
    });
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleClick}
      disabled={isPending}
      className={cn("cursor-pointer", className)}
    >
      {isPending ? "Signing in..." : "Try the Live Demo"}
    </Button>
  );
}
