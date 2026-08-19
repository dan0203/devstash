"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { type ItemTypeWithCount } from "@/lib/db/items";
import { type CollectionOption } from "@/lib/db/collections";
import { useNewItemForm, FILE_TYPES } from "@/components/items/hooks/use-new-item-form";
import { NewItemTypeSelector } from "@/components/items/NewItemTypeSelector";
import { ItemContentFields } from "@/components/items/ItemContentFields";
import { FileUpload } from "@/components/items/FileUpload";
import { CollectionSelect } from "@/components/items/CollectionSelect";
import { SuggestTagsTrigger } from "@/components/ai/SuggestTagsTrigger";
import { SuggestedTagsList } from "@/components/ai/SuggestedTagsList";
import { SuggestDescriptionTrigger } from "@/components/ai/SuggestDescriptionTrigger";
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

interface NewItemDialogProps {
  itemTypes: ItemTypeWithCount[];
  collections: CollectionOption[];
  isPro: boolean;
}

export function NewItemDialog({ itemTypes, collections, isPro }: NewItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const newItemForm = useNewItemForm(itemTypes);
  const { form, setForm, activeType, error, submitting, suggestTags, suggestDescription } = newItemForm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await newItemForm.submit();
    if (success) {
      toast.success("Item created");
      setOpen(false);
      newItemForm.reset();
      router.refresh();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) newItemForm.reset();
      }}
    >
      <DialogTrigger render={<Button aria-label="New item" />}>
        <Plus />
        <span className="hidden md:inline">New item</span>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Add a new item to your stash.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <NewItemTypeSelector
            itemTypes={itemTypes}
            selectedType={newItemForm.selectedType}
            onSelect={newItemForm.setSelectedType}
          />

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
            <div className="flex items-center justify-between">
              <Label htmlFor="new-item-description">Description</Label>
              {isPro && (
                <SuggestDescriptionTrigger
                  loading={suggestDescription.loading}
                  onClick={suggestDescription.handleSuggest}
                />
              )}
            </div>
            <Textarea
              id="new-item-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          {activeType && (
            <ItemContentFields
              itemTypeName={activeType.value}
              idPrefix="new-item"
              fieldClassName="flex flex-col gap-1.5"
              content={form.content}
              onContentChange={(content) => setForm((f) => ({ ...f, content }))}
              url={form.url}
              onUrlChange={(url) => setForm((f) => ({ ...f, url }))}
              language={form.language}
              onLanguageChange={(language) => setForm((f) => ({ ...f, language }))}
              urlRequired
              isPro={isPro}
            />
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

          <div className="flex flex-col gap-1.5">
            <Label>Collections</Label>
            <CollectionSelect
              collections={collections}
              selectedIds={form.collectionIds}
              onChange={(collectionIds) => setForm((f) => ({ ...f, collectionIds }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-item-tags">Tags</Label>
              {isPro && (
                <SuggestTagsTrigger loading={suggestTags.loading} onClick={suggestTags.handleSuggest} />
              )}
            </div>
            <Input
              id="new-item-tags"
              value={form.tagsInput}
              onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
              placeholder="react, hooks, performance"
            />
            <SuggestedTagsList
              tags={suggestTags.suggestions}
              onAccept={suggestTags.handleAccept}
              onReject={suggestTags.handleReject}
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