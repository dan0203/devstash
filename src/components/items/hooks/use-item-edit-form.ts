"use client";

import { useState } from "react";

import { type UpdateItemInput } from "@/actions/items";
import { type ItemDetail } from "@/lib/db/items";

/**
 * Holds the item drawer's edit-mode form fields, separate from the drawer's
 * own view/loading state, mirroring use-item-drawer-data.ts's split.
 */
export function useItemEditForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [tagsInput, setTagsInput] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  function loadFrom(item: ItemDetail) {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setContent(item.content ?? "");
    setUrl(item.url ?? "");
    setLanguage(item.language ?? "plaintext");
    setTagsInput(item.tags.join(", "));
    setCollectionIds(item.collections.map((collection) => collection.id));
  }

  function toUpdateInput(): UpdateItemInput {
    return {
      title,
      description: description.trim() ? description : null,
      content: content.trim() ? content : null,
      url: url.trim() ? url : null,
      language: language.trim() ? language : null,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      collectionIds,
    };
  }

  return {
    title,
    setTitle,
    description,
    setDescription,
    content,
    setContent,
    url,
    setUrl,
    language,
    setLanguage,
    tagsInput,
    setTagsInput,
    collectionIds,
    setCollectionIds,
    loadFrom,
    toUpdateInput,
  };
}
