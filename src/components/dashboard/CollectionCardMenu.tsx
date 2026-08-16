"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EditCollectionDialog } from "@/components/dashboard/EditCollectionDialog";
import { DeleteCollectionDialog } from "@/components/dashboard/DeleteCollectionDialog";

interface CollectionCardMenuProps {
  collection: { id: string; name: string; description: string | null };
}

export function CollectionCardMenu({ collection }: CollectionCardMenuProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className="shrink-0"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Collection actions" />}
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Star />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCollectionDialog collection={collection} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCollectionDialog
        collectionId={collection.id}
        collectionName={collection.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => router.refresh()}
      />
    </div>
  );
}
