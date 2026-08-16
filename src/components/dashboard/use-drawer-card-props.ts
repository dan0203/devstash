"use client";

import type { KeyboardEvent } from "react";

import { useItemDrawer } from "@/components/dashboard/item-drawer-context";

/**
 * Makes a card/row element keyboard-activatable and click-activatable to
 * open the given item's drawer. Spread the result onto the root element.
 */
export function useDrawerCardProps(itemId: string) {
  const { openDrawer } = useItemDrawer();

  return {
    role: "button" as const,
    tabIndex: 0,
    onClick: () => openDrawer(itemId),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDrawer(itemId);
      }
    },
  };
}
