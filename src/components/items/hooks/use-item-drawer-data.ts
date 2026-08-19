"use client";

import { useEffect, useState } from "react";

import { type ItemDetail } from "@/lib/db/items";

/**
 * Fetches item detail whenever the drawer opens on a new item id. Loading
 * state is derived (item?.id !== openItemId) rather than tracked separately,
 * so TypeScript can narrow `item` correctly at call sites.
 */
export function useItemDrawerData(openItemId: string | null) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const failed = openItemId !== null && failedId === openItemId && item?.id !== openItemId;

  useEffect(() => {
    if (!openItemId) return;

    let cancelled = false;

    fetch(`/api/items/${openItemId}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body.success) {
          setItem(body.data);
        } else {
          setFailedId(openItemId);
        }
      })
      .catch(() => {
        if (!cancelled) setFailedId(openItemId);
      });

    return () => {
      cancelled = true;
    };
  }, [openItemId]);

  return { item, setItem, failed };
}
