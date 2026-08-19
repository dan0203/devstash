"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { toggleCollectionFavorite } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/collections/DeleteCollectionDialog";

interface CollectionDetailActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean };
}

export function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);

  const handleToggleFavorite = async () => {
    const result = await toggleCollectionFavorite(collection.id);
    if (result.success && result.isFavorite !== undefined) {
      setIsFavorite(result.isFavorite);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update favorite");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className={isFavorite ? "text-yellow-400" : undefined}
        onClick={handleToggleFavorite}
      >
        <Star className={isFavorite ? "fill-yellow-400 text-yellow-400" : undefined} />
        Favorite
      </Button>
      <Button variant="outline" size="icon-sm" aria-label="Edit" onClick={() => setEditOpen(true)}>
        <Pencil />
      </Button>
      <Button
        variant="destructive"
        size="icon-sm"
        aria-label="Delete"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collectionId={collection.id}
        collectionName={collection.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/collections")}
      />
    </div>
  );
}
