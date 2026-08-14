"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ItemDrawerContextValue {
  openItemId: string | null;
  openDrawer: (itemId: string) => void;
  closeDrawer: () => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  return (
    <ItemDrawerContext.Provider
      value={{
        openItemId,
        openDrawer: (itemId: string) => setOpenItemId(itemId),
        closeDrawer: () => setOpenItemId(null),
      }}
    >
      {children}
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer() {
  const context = useContext(ItemDrawerContext);
  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider");
  }
  return context;
}
