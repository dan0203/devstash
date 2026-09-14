"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SettingsRedirectNotice() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("from") === "upgrade") {
      toast.info("You're already on Pro — manage your subscription below");
    }
    if (searchParams.get("checkout") === "success") {
      toast.success("Payment successful — welcome to Pro! 🎉");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
