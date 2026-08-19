"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function UpgradeRedirectNotice() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("from") === "upgrade") {
      toast.info("You're already on Pro — manage your subscription below");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}