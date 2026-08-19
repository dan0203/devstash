"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from "@/actions/items";
import { type ItemDetail } from "@/lib/db/items";
import { type useItemEditForm } from "@/components/items/hooks/use-item-edit-form";
import { useToggleFavorite } from "@/components/shared/hooks/use-toggle-favorite";

interface UseItemDrawerActionsArgs {
  item: ItemDetail | null;
  setItem: Dispatch<SetStateAction<ItemDetail | null>>;
  editForm: ReturnType<typeof useItemEditForm>;
  closeDrawer: () => void;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
}

/**
 * Bundles the item drawer's mutation handlers (copy/edit/cancel/save/
 * favorite/pin/delete), separate from the drawer's own view/edit-mode state.
 */
export function useItemDrawerActions({
  item,
  setItem,
  editForm,
  closeDrawer,
  setIsEditing,
}: UseItemDrawerActionsArgs) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toggleFavorite = useToggleFavorite(toggleItemFavorite, (isFavorite) =>
    setItem((current) => (current ? { ...current, isFavorite } : current))
  );

  const handleCopy = () => {
    if (!item) return;
    const text = item.content ?? item.url ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (!item) return;
    editForm.loadFrom(item);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!item || !editForm.title.trim()) return;

    setSaving(true);
    const result = await updateItem(item.id, editForm.toUpdateInput());
    setSaving(false);

    if (result.success && result.data) {
      setItem(result.data);
      setIsEditing(false);
      toast.success("Item updated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update item");
    }
  };

  const handleToggleFavorite = () => {
    if (!item) return;
    toggleFavorite(item.id);
  };

  const handleTogglePin = async () => {
    if (!item) return;

    const previousIsPinned = item.isPinned;
    setItem({ ...item, isPinned: !previousIsPinned });

    const result = await toggleItemPin(item.id);
    if (result.success && result.isPinned !== undefined) {
      toast.success(result.isPinned ? "Item pinned" : "Item unpinned");
      router.refresh();
    } else {
      setItem((current) => (current ? { ...current, isPinned: previousIsPinned } : current));
      toast.error(result.error ?? "Failed to update pin");
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    setDeleting(true);
    const result = await deleteItem(item.id);
    setDeleting(false);

    if (result.success) {
      toast.success("Item deleted");
      closeDrawer();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete item");
    }
  };

  return {
    saving,
    deleting,
    handleCopy,
    handleEdit,
    handleCancel,
    handleSave,
    handleToggleFavorite,
    handleTogglePin,
    handleDelete,
  };
}