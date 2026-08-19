"use client";

import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * Makes a card/row element keyboard-activatable and click-activatable to
 * navigate to the given href. Spread the result onto the root element.
 */
export function useNavigateCardProps(href: string) {
  const router = useRouter();

  return {
    role: "link" as const,
    tabIndex: 0,
    onClick: () => router.push(href),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(href);
      }
    },
  };
}