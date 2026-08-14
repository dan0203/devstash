"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Copy, Folder, Pencil, Pin, Star, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { type ItemDetail } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { useItemDrawer } from "@/components/dashboard/item-drawer-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function ItemDrawer() {
  const { openItemId, closeDrawer } = useItemDrawer();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

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

  return (
    <Sheet open={openItemId !== null} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
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
              <SheetTitle className="text-lg">{item.title}</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-6 px-4">
              {item.description && (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Description</SectionLabel>
                  <p className="text-sm text-foreground">{item.description}</p>
                </div>
              )}

              {item.contentType === "text" && item.content && (
                <div className="flex flex-col gap-2">
                  <SectionLabel>Content</SectionLabel>
                  <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                    {item.content}
                  </pre>
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
                  <SectionLabel>File</SectionLabel>
                  <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                    {item.fileName}
                  </div>
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
                <Button variant="outline" size="icon-sm" aria-label="Copy" onClick={handleCopy}>
                  <Copy />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Edit">
                  <Pencil />
                </Button>
              </div>
              <Button variant="destructive" size="icon-sm" aria-label="Delete">
                <Trash2 />
              </Button>
            </SheetFooter>
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
