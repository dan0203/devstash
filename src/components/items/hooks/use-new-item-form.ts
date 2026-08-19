"use client";

import { useState } from "react";

import { createItem, type CreateItemInput } from "@/actions/items";
import { type ItemTypeWithCount } from "@/lib/db/items";
import { type UploadedFile } from "@/components/items/FileUpload";
import { useSuggestTags } from "@/components/ai/hooks/use-suggest-tags";
import { useSuggestDescription } from "@/components/ai/hooks/use-suggest-description";
import { CONTENT_TYPES, URL_TYPES, LANGUAGE_TYPES } from "@/lib/content-types";

export const FILE_TYPES = new Set(["file", "image"]);

const emptyForm = {
  title: "",
  description: "",
  content: "",
  language: "plaintext",
  url: "",
  tagsInput: "",
  file: null as UploadedFile | null,
  collectionIds: [] as string[],
};

/**
 * Holds the New Item dialog's form state, AI suggestion hooks, and submit
 * logic, separate from the dialog's own open/type-picker UI.
 */
export function useNewItemForm(itemTypes: ItemTypeWithCount[]) {
  const [selectedType, setSelectedType] = useState(itemTypes[0]?.value ?? "");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeType = itemTypes.find((type) => type.value === selectedType) ?? itemTypes[0];

  const existingTags = form.tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const suggestTags = useSuggestTags({
    title: form.title,
    content: form.content,
    existingTags,
    onAcceptTag: (tag) =>
      setForm((f) => {
        const existing = f.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (existing.some((t) => t.toLowerCase() === tag.toLowerCase())) return f;
        return { ...f, tagsInput: [...existing, tag].join(", ") };
      }),
  });
  const suggestDescription = useSuggestDescription({
    title: form.title,
    content: activeType && CONTENT_TYPES.has(activeType.value) ? form.content : "",
    url: activeType && URL_TYPES.has(activeType.value) ? form.url : "",
    language: activeType && LANGUAGE_TYPES.has(activeType.value) ? form.language : "",
    itemType: activeType?.value ?? "",
    onGenerated: (description) => setForm((f) => ({ ...f, description })),
  });

  function reset() {
    setSelectedType(itemTypes[0]?.value ?? "");
    setForm(emptyForm);
    setError(null);
    suggestTags.reset();
  }

  async function submit(): Promise<boolean> {
    if (!activeType) return false;
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
      collectionIds: form.collectionIds,
    };

    try {
      const result = await createItem(input);
      if (!result.success) {
        setError(result.error ?? "Something went wrong");
        return false;
      }
      return true;
    } catch {
      setError("Something went wrong — check your connection and try again");
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    selectedType,
    setSelectedType,
    form,
    setForm,
    error,
    submitting,
    activeType,
    suggestTags,
    suggestDescription,
    reset,
    submit,
  };
}