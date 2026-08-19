"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteCollection } from "@/actions/collections";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteCollectionDialogProps {
  collectionId: string;
  collectionName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteCollectionDialog({
  collectionId,
  collectionName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCollectionDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const result = await deleteCollection(collectionId);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete collection");
        return;
      }

      toast.success("Collection deleted");
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Something went wrong — check your connection and try again");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete collection?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes &quot;{collectionName}&quot;. Items in this collection are not deleted — they
            will just no longer be part of this collection.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
