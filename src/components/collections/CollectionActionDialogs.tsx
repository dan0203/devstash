"use client";

import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";

interface CollectionActionDialogsProps {
  collection: { id: string; name: string; description: string | null };
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

/**
 * Bundles the Edit/Delete collection dialogs, shared by the collection detail
 * page's action bar and the collection card's 3-dots menu.
 */
export function CollectionActionDialogs({
  collection,
  editOpen,
  onEditOpenChange,
  deleteOpen,
  onDeleteOpenChange,
  onDeleted,
}: CollectionActionDialogsProps) {
  return (
    <>
      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={onEditOpenChange} />
      <DeleteCollectionDialog
        collectionId={collection.id}
        collectionName={collection.name}
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        onDeleted={onDeleted}
      />
    </>
  );
}