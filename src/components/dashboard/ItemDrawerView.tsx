import Image from "next/image";
import { File as FileIcon } from "lucide-react";

import { type ItemDetail } from "@/lib/db/items";
import { formatFileSize } from "@/lib/file-constraints";
import { LANGUAGE_TYPES } from "@/components/dashboard/item-content-types";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { SectionLabel } from "@/components/dashboard/SectionLabel";
import { Badge } from "@/components/ui/badge";

export function ItemDrawerView({ item }: { item: ItemDetail }) {
  return (
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
            <CodeEditor value={item.content} language={item.language} readOnly />
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
            <div className="relative h-64 w-full overflow-hidden rounded-md border">
              <Image
                src={item.fileUrl}
                alt={item.fileName}
                fill
                sizes="(min-width: 640px) 32rem, 100vw"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <FileIcon className="size-4 shrink-0" />
              <span className="truncate">{item.fileName}</span>
            </div>
          )}
          {item.fileSize !== null && (
            <span className="text-xs text-muted-foreground">{formatFileSize(item.fileSize)}</span>
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
  );
}
