"use client";

import { useEffect, useRef, useState } from "react";

import { type SearchItem } from "@/lib/db/items";
import { type SearchCollection } from "@/components/command-palette/CommandPalette";

/**
 * Fetches search data lazily on first open, rather than shipping every item
 * on every page load. Loading state is derived (open && !loaded) rather than
 * tracked separately, matching use-item-drawer-data.ts's pattern — a ref
 * (not state) guards against re-fetching on subsequent opens.
 */
export function useCommandPaletteData(open: boolean) {
  const [items, setItems] = useState<SearchItem[]>([]);
  const [collections, setCollections] = useState<SearchCollection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fetchStarted = useRef(false);

  useEffect(() => {
    if (!open || fetchStarted.current) return;
    fetchStarted.current = true;

    let cancelled = false;

    fetch("/api/search")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body.success) {
          setItems(body.data.items);
          setCollections(body.data.collections);
          setLoaded(true);
        }
      })
      .catch(() => {
        fetchStarted.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return { items, collections, loading: open && !loaded };
}
