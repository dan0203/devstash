"use client";

import {
  Download,
  File,
  FileCode,
  FileCog,
  FileJson,
  FileSpreadsheet,
  FileText,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";

import { type ItemWithType } from "@/lib/db/items";
import { formatFileSize } from "@/lib/file-constraints";
import { formatRelativeTime } from "@/lib/format";
import { useDrawerCardProps } from "@/components/shared/hooks/use-drawer-card-props";
import { Button } from "@/components/ui/button";

const EXTENSION_ICONS: Record<string, LucideIcon> = {
  default: File,
  pdf: FileText,
  txt: FileText,
  md: FileCode,
  json: FileJson,
  yaml: FileCode,
  yml: FileCode,
  xml: FileCode,
  csv: FileSpreadsheet,
  toml: FileCog,
  ini: FileCog,
};

function extensionIconKey(fileName: string | null): string {
  const extension = fileName?.split(".").pop()?.toLowerCase();
  return extension && extension in EXTENSION_ICONS ? extension : "default";
}

export function FileListRow({ item }: { item: ItemWithType }) {
  const drawerCardProps = useDrawerCardProps(item.id);
  const Icon = EXTENSION_ICONS[extensionIconKey(item.fileName)];

  return (
    <div
      {...drawerCardProps}
      className="flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${item.itemType.color}26` }}
        >
          <Icon className="size-4" style={{ color: item.itemType.color }} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.fileName && (
            <p className="truncate text-xs text-muted-foreground">{item.fileName}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4 pl-12 text-xs text-muted-foreground sm:pl-0">
        <div className="flex items-center gap-1.5">
          {item.isPinned && <Pin className="size-3.5" />}
          {item.isFavorite && <Star className="size-3.5 fill-yellow-400 text-yellow-400" />}
        </div>
        {item.fileSize !== null && <span className="w-14 shrink-0">{formatFileSize(item.fileSize)}</span>}
        <span className="w-16 shrink-0">{formatRelativeTime(item.createdAt)}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Download"
          nativeButton={false}
          render={<a href={`/api/items/${item.id}/download`} />}
          onClick={(e) => e.stopPropagation()}
        >
          <Download />
        </Button>
      </div>
    </div>
  );
}
