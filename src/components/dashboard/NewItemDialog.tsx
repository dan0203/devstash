"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createItem, type CreateItemInput } from "@/actions/items";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { FileUpload, type UploadedFile } from "@/components/dashboard/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = new Set(["snippet", "prompt", "command", "note"]);
const LANGUAGE_TYPES = new Set(["snippet", "command"]);
const FILE_TYPES = new Set(["file", "image"]);

interface NewItemDialogProps {
  itemTypes: ItemTypeWithCount[];
}

const emptyForm = {
  title: "",
  description: "",
  content: "",
  language: "",
  url: "",
  tagsInput: "",
  file: null as UploadedFile | null,
};

export function NewItemDialog({ itemTypes }: NewItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(itemTypes[0]?.value ?? "");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeType = itemTypes.find((type) => type.value === selectedType) ?? itemTypes[0];

  function reset() {
    setSelectedType(itemTypes[0]?.value ?? "");
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeType) return;
    setError(null);
    setSubmitting(true);

    const input: CreateItemInput = {
      itemType: activeType.value as CreateItemInput["itemType"],
      title: form.title,
      description: form.description,
      content: form.content,
      language: form.language,
      url: form.url,
      fileUrl: form.file?.url ?? "",
      fileName: form.file?.fileName ?? "",
      fileSize: form.file?.fileSize ?? null,
      tags: form.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const result = await createItem(input);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return;
      }

      toast.success("Item created");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("Something went wrong — check your connection and try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        New item
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Add a new item to your stash.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {itemTypes.map((type) => {
                const Icon = itemTypeIcons[type.icon];
                const active = type.value === selectedType;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                    )}
                  >
                    {Icon && <Icon className="size-4" style={{ color: type.color }} />}
                    {type.name.replace(/s$/, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-title">Title</Label>
            <Input
              id="new-item-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-description">Description</Label>
            <Textarea
              id="new-item-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          {activeType && CONTENT_TYPES.has(activeType.value) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-content">Content</Label>
              {LANGUAGE_TYPES.has(activeType.value) ? (
                <CodeEditor
                  value={form.content}
                  onChange={(content) => setForm((f) => ({ ...f, content }))}
                  language={form.language}
                />
              ) : (
                <MarkdownEditor
                  value={form.content}
                  onChange={(content) => setForm((f) => ({ ...f, content }))}
                />
              )}
            </div>
          )}

          {activeType && FILE_TYPES.has(activeType.value) && (
            <div className="flex flex-col gap-1.5">
              <Label>File</Label>
              <FileUpload
                itemType={activeType.value as "file" | "image"}
                value={form.file}
                onChange={(file) => setForm((f) => ({ ...f, file }))}
              />
            </div>
          )}

          {activeType && LANGUAGE_TYPES.has(activeType.value) && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-language">Language</Label>
              <Input
                id="new-item-language"
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
              />
            </div>
          )}

          {activeType?.value === "link" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-item-url">URL</Label>
              <Input
                id="new-item-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-item-tags">Tags</Label>
            <Input
              id="new-item-tags"
              value={form.tagsInput}
              onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
              placeholder="react, hooks, performance"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                submitting ||
                !form.title.trim() ||
                (activeType && FILE_TYPES.has(activeType.value) && !form.file)
              }
            >
              {submitting ? "Creating..." : "Create item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
