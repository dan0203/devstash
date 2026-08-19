"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ToggleFavoriteResult {
  success: boolean;
  isFavorite?: boolean;
  error?: string;
}

/**
 * Wraps a toggleFavorite server action with the shared success/error handling
 * (router.refresh() on success, error toast on failure). Pass onSuccess to
 * also sync local component state with the server's resulting isFavorite value.
 */
export function useToggleFavorite(
  toggleFn: (id: string) => Promise<ToggleFavoriteResult>,
  onSuccess?: (isFavorite: boolean) => void
) {
  const router = useRouter();

  return async (id: string) => {
    const result = await toggleFn(id);
    if (result.success && result.isFavorite !== undefined) {
      onSuccess?.(result.isFavorite);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update favorite");
    }
  };
}