"use client";

import { useRef, useState } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";

import { FILE_CONSTRAINTS, formatFileSize, type UploadItemType } from "@/lib/file-constraints";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  url: string;
  fileName: string;
  fileSize: number;
}

interface FileUploadProps {
  itemType: UploadItemType;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  className?: string;
}

export function FileUpload({ itemType, value, onChange, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const constraints = FILE_CONSTRAINTS[itemType];

  function upload(file: File) {
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("itemType", itemType);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setProgress(null);
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body.success) {
          onChange(body.data);
        } else {
          setError(body.error ?? "Upload failed");
        }
      } catch {
        setError("Upload failed");
      }
    };

    xhr.onerror = () => {
      setProgress(null);
      setError("Upload failed — check your connection and try again");
    };

    xhr.send(formData);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    upload(file);
  }

  const isImage = itemType === "image";

  if (value) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt={value.fileName}
            className="max-h-48 w-full rounded-md border object-contain"
          />
        ) : (
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value.fileName}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {formatFileSize(value.fileSize)}
            </span>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange(null)}
        >
          <X className="size-3.5" />
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground transition-colors cursor-pointer",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
        )}
      >
        <Upload className="size-5" />
        <span>
          Drag &amp; drop or <span className="text-primary">browse</span>
        </span>
        <span className="text-xs">
          {constraints.extensions.join(", ")} — up to {constraints.maxSize / (1024 * 1024)}MB
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={constraints.extensions.join(",")}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {progress !== null && <Progress value={progress} className="h-1.5" />}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
