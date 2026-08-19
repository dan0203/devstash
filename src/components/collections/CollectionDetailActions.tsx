"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Star, Trash2 } from "lucide-react";

import { toggleCollectionFavorite } from "@/actions/collections";
import { Button } from "@/components/ui/button";
import { CollectionActionDialogs } from "@/components/collections/CollectionActionDialogs";
import { useToggleFavorite } from "@/components/shared/hooks/use-toggle-favorite";

interface CollectionDetailActionsProps {
  collection: { id: string; name: string; description: string | null; isFavorite: boolean };
}

export function CollectionDetailActions({ collection }: CollectionDetailActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const toggleFavorite = useToggleFavorite(toggleCollectionFavorite, setIsFavorite);

  const handleToggleFavorite = () => toggleFavorite(collection.id);

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

      <CollectionActionDialogs
        collection={collection}
        editOpen={editOpen}
        onEditOpenChange={setEditOpen}
        deleteOpen={deleteOpen}
        onDeleteOpenChange={setDeleteOpen}
        onDeleted={() => router.push("/collections")}
      />
    </div>
  );
}
