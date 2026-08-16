"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, File as FileIcon, Folder, Pencil, Pin, Star, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { type ItemDetail } from "@/lib/db/items";
import { updateItem, deleteItem } from "@/actions/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { formatFileSize } from "@/lib/file-constraints";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const URL_TYPES = new Set(["link"]);

export function ItemDrawer() {
  const router = useRouter();
  const { openItemId, closeDrawer } = useItemDrawer();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Derived rather than tracked with its own setState-in-effect call: whether
  // the drawer is still loading for the current id is inferred inline below
  // (item?.id !== openItemId) so TypeScript can narrow `item` in the JSX.
  const failed = openItemId !== null && failedId === openItemId && item?.id !== openItemId;

  useEffect(() => {
    if (!openItemId) return;

    let cancelled = false;

    fetch(`/api/items/${openItemId}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (body.success) {
          setItem(body.data);
        } else {
          setFailedId(openItemId);
        }
      })
      .catch(() => {
        if (!cancelled) setFailedId(openItemId);
      });

    return () => {
      cancelled = true;
    };
  }, [openItemId]);

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
                      return Icon ? (
                        <Icon className="size-5" style={{ color: item.itemType.color }} />
                      ) : null;
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
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="item-edit-title">Title</Label>
                    <Input
                      id="item-edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="item-edit-description">Description</Label>
                    <Textarea
                      id="item-edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  {CONTENT_TYPES.has(item.itemType.name) && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="item-edit-content">Content</Label>
                      {LANGUAGE_TYPES.has(item.itemType.name) ? (
                        <CodeEditor
                          value={content}
                          onChange={setContent}
                          language={language}
                        />
                      ) : (
                        <MarkdownEditor value={content} onChange={setContent} />
                      )}
                    </div>
                  )}
                  {LANGUAGE_TYPES.has(item.itemType.name) && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="item-edit-language">Language</Label>
                      <Input
                        id="item-edit-language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      />
                    </div>
                  )}
                  {URL_TYPES.has(item.itemType.name) && (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="item-edit-url">URL</Label>
                      <Input id="item-edit-url" value={url} onChange={(e) => setUrl(e.target.value)} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="item-edit-tags">Tags</Label>
                    <Input
                      id="item-edit-tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="react, hooks, performance"
                    />
                  </div>
                </>
              ) : (
                <>
                  {item.description && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>Description</SectionLabel>
                      <p className="text-sm text-foreground">{item.description}</p>
                    </div>
                  )}

                  {item.contentType === "text" && item.content && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>Content</SectionLabel>
                      {LANGUAGE_TYPES.has(item.itemType.name) ? (
                        <CodeEditor
                          value={item.content}
                          language={item.language}
                          readOnly
                        />
                      ) : (
                        <MarkdownEditor value={item.content} readOnly />
                      )}
                    </div>
                  )}
                  {item.contentType === "url" && item.url && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>URL</SectionLabel>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate rounded-md border bg-muted/40 p-3 text-xs text-primary underline"
                      >
                        {item.url}
                      </a>
                    </div>
                  )}
                  {item.contentType === "file" && item.fileName && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>{item.itemType.name === "image" ? "Image" : "File"}</SectionLabel>
                      {item.itemType.name === "image" && item.fileUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.fileUrl}
                          alt={item.fileName}
                          className="max-h-64 w-full rounded-md border object-contain"
                        />
                      ) : (
                        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                          <FileIcon className="size-4 shrink-0" />
                          <span className="truncate">{item.fileName}</span>
                        </div>
                      )}
                      {item.fileSize !== null && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.fileSize)}
                        </span>
                      )}
                    </div>
                  )}

                  {item.tags.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <SectionLabel>Tags</SectionLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
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
              <SheetFooter className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className={item.isFavorite ? "text-yellow-400" : undefined}>
                    <Star className={item.isFavorite ? "fill-yellow-400 text-yellow-400" : undefined} />
                    Favorite
                  </Button>
                  <Button
                    variant={item.isPinned ? "secondary" : "outline"}
                    size="icon-sm"
                    aria-label="Pin"
                  >
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
                    <Button variant="outline" size="icon-sm" aria-label="Copy" onClick={handleCopy}>
                      <Copy />
                    </Button>
                  )}
                  <Button variant="outline" size="icon-sm" aria-label="Edit" onClick={handleEdit}>
                    <Pencil />
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="destructive" size="icon-sm" aria-label="Delete" />}
                  >
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
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
      {Icon && <Icon className="size-3.5" />}
      {children}
    </h3>
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
