import { type Dispatch, type SetStateAction } from "react";

import { CONTENT_TYPES, LANGUAGE_TYPES, URL_TYPES } from "@/components/dashboard/item-content-types";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { CollectionSelect } from "@/components/dashboard/CollectionSelect";
import { type CollectionOption } from "@/lib/db/collections";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ItemDrawerEditFormProps {
  itemTypeName: string;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  url: string;
  setUrl: Dispatch<SetStateAction<string>>;
  language: string;
  setLanguage: Dispatch<SetStateAction<string>>;
  tagsInput: string;
  setTagsInput: Dispatch<SetStateAction<string>>;
  collections: CollectionOption[];
  collectionIds: string[];
  setCollectionIds: Dispatch<SetStateAction<string[]>>;
}

export function ItemDrawerEditForm({
  itemTypeName,
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
  collections,
  collectionIds,
  setCollectionIds,
}: ItemDrawerEditFormProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="item-edit-title">Title</Label>
        <Input id="item-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
      {CONTENT_TYPES.has(itemTypeName) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-edit-content">Content</Label>
          {LANGUAGE_TYPES.has(itemTypeName) ? (
            <CodeEditor value={content} onChange={setContent} language={language} />
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}
        </div>
      )}
      {LANGUAGE_TYPES.has(itemTypeName) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-edit-language">Language</Label>
          <Input id="item-edit-language" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </div>
      )}
      {URL_TYPES.has(itemTypeName) && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="item-edit-url">URL</Label>
          <Input id="item-edit-url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>Collections</Label>
        <CollectionSelect
          collections={collections}
          selectedIds={collectionIds}
          onChange={setCollectionIds}
        />
      </div>
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
  );
}
