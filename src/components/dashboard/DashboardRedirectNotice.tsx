"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function DashboardRedirectNotice() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast.info("Plan change cancelled");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
