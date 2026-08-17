import { Copy, Download, Pencil, Pin, Star, Trash2 } from "lucide-react";

import { type ItemDetail } from "@/lib/db/items";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ItemDrawerActionsProps {
  item: ItemDetail;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  deleting: boolean;
}

export function ItemDrawerActions({
  item,
  onCopy,
  onEdit,
  onDelete,
  onToggleFavorite,
  deleting,
}: ItemDrawerActionsProps) {
  return (
    <SheetFooter className="flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className={item.isFavorite ? "text-yellow-400" : undefined}
          onClick={onToggleFavorite}
        >
          <Star className={item.isFavorite ? "fill-yellow-400 text-yellow-400" : undefined} />
          Favorite
        </Button>
        <Button variant={item.isPinned ? "secondary" : "outline"} size="icon-sm" aria-label="Pin">
          <Pin className={item.isPinned ? "fill-current" : undefined} />
        </Button>
        {item.contentType === "file" ? (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Download"
            nativeButton={false}
            render={<a href={`/api/items/${item.id}/download`} />}
          >
            <Download />
          </Button>
        ) : (
          <Button variant="outline" size="icon-sm" aria-label="Copy" onClick={onCopy}>
            <Copy />
          </Button>
        )}
        <Button variant="outline" size="icon-sm" aria-label="Edit" onClick={onEdit}>
          <Pencil />
        </Button>
      </div>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="icon-sm" aria-label="Delete" />}>
          <Trash2 />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes &quot;{item.title}&quot;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SheetFooter>
  );
}
