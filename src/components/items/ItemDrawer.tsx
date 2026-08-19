"use client";

import { useState } from "react";

import { useItemDrawer } from "@/components/items/hooks/item-drawer-context";
import { useItemDrawerData } from "@/components/items/hooks/use-item-drawer-data";
import { useItemEditForm } from "@/components/items/hooks/use-item-edit-form";
import { useItemDrawerActions } from "@/components/items/hooks/use-item-drawer-actions";
import { ItemDrawerHeader } from "@/components/items/ItemDrawerHeader";
import { ItemDrawerView, ItemDrawerMetaSections } from "@/components/items/ItemDrawerView";
import { ItemDrawerEditForm } from "@/components/items/ItemDrawerEditForm";
import { ItemDrawerActions } from "@/components/items/ItemDrawerActions";
import { type CollectionOption } from "@/lib/db/collections";
import { Sheet, SheetContent, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface ItemDrawerProps {
  collections: CollectionOption[];
  isPro: boolean;
}

export function ItemDrawer({ collections, isPro }: ItemDrawerProps) {
  const { openItemId, closeDrawer } = useItemDrawer();
  const { item, setItem, failed } = useItemDrawerData(openItemId);

  const [isEditing, setIsEditing] = useState(false);
  const editForm = useItemEditForm();
  const actions = useItemDrawerActions({ item, setItem, editForm, closeDrawer, setIsEditing });

  return (
    <Sheet
      open={openItemId !== null}
      onOpenChange={(open) => {
        if (!open) {
          closeDrawer();
          setIsEditing(false);
        }
      }}
    >
      <SheetContent className="flex w-full flex-col overflow-y-auto data-[side=right]:sm:max-w-lg">
        {failed ? (
          <p className="p-4 text-sm text-muted-foreground">Couldn&apos;t load this item.</p>
        ) : !item || item.id !== openItemId ? (
          <ItemDrawerSkeleton />
        ) : (
          <>
            <ItemDrawerHeader item={item} isEditing={isEditing} />

            <div className="flex flex-col gap-6 px-4">
              {isEditing ? (
                <ItemDrawerEditForm
                  itemTypeName={item.itemType.name}
                  collections={collections}
                  isPro={isPro}
                  {...editForm}
                />
              ) : (
                <ItemDrawerView item={item} isPro={isPro} />
              )}

              <ItemDrawerMetaSections item={item} />
            </div>

            <Separator className="mt-auto" />
            {isEditing ? (
              <SheetFooter className="flex-row items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={actions.handleCancel} disabled={actions.saving}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={actions.handleSave}
                  disabled={actions.saving || !editForm.title.trim()}
                >
                  {actions.saving ? "Saving..." : "Save"}
                </Button>
              </SheetFooter>
            ) : (
              <ItemDrawerActions
                item={item}
                onCopy={actions.handleCopy}
                onEdit={actions.handleEdit}
                onDelete={actions.handleDelete}
                onToggleFavorite={actions.handleToggleFavorite}
                onTogglePin={actions.handleTogglePin}
                deleting={actions.deleting}
              />
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}