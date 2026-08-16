"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { createCollection, type CreateCollectionInput } from "@/actions/collections";
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

const emptyForm = {
  name: "",
  description: "",
};

export function NewCollectionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const input: CreateCollectionInput = {
      name: form.name,
      description: form.description,
    };

    try {
      const result = await createCollection(input);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        toast.error(result.error ?? "Failed to create collection");
        return;
      }

      toast.success("Collection created");
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("Something went wrong — check your connection and try again");
      toast.error("Something went wrong — check your connection and try again");
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
      <DialogTrigger render={<Button variant="secondary" />}>
        <FolderPlus />
        New Collection
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>Create a new collection to group your items.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-collection-name">Name</Label>
            <Input
              id="new-collection-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-collection-description">Description</Label>
            <Textarea
              id="new-collection-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? "Creating..." : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
