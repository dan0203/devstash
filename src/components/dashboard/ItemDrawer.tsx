"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { toast } from "sonner";

import { updateItem, deleteItem } from "@/actions/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { useItemDrawerData } from "@/components/dashboard/use-item-drawer-data";
import { ItemDrawerView } from "@/components/dashboard/ItemDrawerView";
import { ItemDrawerEditForm } from "@/components/dashboard/ItemDrawerEditForm";
import { ItemDrawerActions } from "@/components/dashboard/ItemDrawerActions";
import { SectionLabel } from "@/components/dashboard/SectionLabel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ItemDrawer() {
  const router = useRouter();
  const { openItemId, closeDrawer } = useItemDrawer();
  const { item, setItem, failed } = useItemDrawerData(openItemId);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleCopy = () => {
    if (!item) return;
    const text = item.content ?? item.url ?? "";
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleEdit = () => {
    if (!item) return;
    setTitle(item.title);
    setDescription(item.description ?? "");
    setContent(item.content ?? "");
    setUrl(item.url ?? "");
    setLanguage(item.language ?? "");
    setTagsInput(item.tags.join(", "));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!item || !title.trim()) return;

    setSaving(true);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const result = await updateItem(item.id, {
      title,
      description: description.trim() ? description : null,
      content: content.trim() ? content : null,
      url: url.trim() ? url : null,
      language: language.trim() ? language : null,
      tags,
    });
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
            <SheetHeader className="pt-6">
              <div className="mb-3 flex items-start justify-between gap-2 pr-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}26` }}
                  >
                    {(() => {
                      const Icon = itemTypeIcons[item.itemType.icon];
                      return Icon ? <Icon className="size-5" style={{ color: item.itemType.color }} /> : null;
                    })()}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: item.itemType.color }}
                      >
                        {item.itemType.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {formatRelativeTime(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <SheetTitle className="text-lg">{isEditing ? "Edit Item" : item.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4">
              {isEditing ? (
                <ItemDrawerEditForm
                  itemTypeName={item.itemType.name}
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  content={content}
                  setContent={setContent}
                  url={url}
                  setUrl={setUrl}
                  language={language}
                  setLanguage={setLanguage}
                  tagsInput={tagsInput}
                  setTagsInput={setTagsInput}
                />
              ) : (
                <ItemDrawerView item={item} />
              )}

              {item.collections.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionLabel icon={Folder}>Collections</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {item.collections.map((collection) => (
                      <Badge key={collection.id} variant="secondary" className="text-[10px]">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionLabel>Details</SectionLabel>
                <div className="flex flex-col gap-1.5 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                  {item.language && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Language</span>
                      <span>{item.language}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mt-auto" />
            {isEditing ? (
              <SheetFooter className="flex-row items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </SheetFooter>
            ) : (
              <ItemDrawerActions
                item={item}
                onCopy={handleCopy}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deleting={deleting}
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
