import { type Dispatch, type SetStateAction } from "react";

import { ItemContentFields } from "@/components/dashboard/ItemContentFields";
import { CollectionSelect } from "@/components/dashboard/CollectionSelect";
import { SuggestTagsTrigger } from "@/components/dashboard/SuggestTagsTrigger";
import { SuggestedTagsList } from "@/components/dashboard/SuggestedTagsList";
import { useSuggestTags } from "@/components/dashboard/use-suggest-tags";
import { SuggestDescriptionTrigger } from "@/components/dashboard/SuggestDescriptionTrigger";
import { useSuggestDescription } from "@/components/dashboard/use-suggest-description";
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
  isPro: boolean;
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
  isPro,
}: ItemDrawerEditFormProps) {
  const existingTags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const suggestTags = useSuggestTags({
    title,
    content,
    existingTags,
    onAcceptTag: (tag) =>
      setTagsInput((current) => {
        const existing = current
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        if (existing.some((t) => t.toLowerCase() === tag.toLowerCase())) return current;
        return [...existing, tag].join(", ");
      }),
  });
  const suggestDescription = useSuggestDescription({
    title,
    content,
    url,
    language,
    itemType: itemTypeName,
    onGenerated: setDescription,
  });

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="item-edit-title">Title</Label>
        <Input id="item-edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-edit-description">Description</Label>
          {isPro && (
            <SuggestDescriptionTrigger
              loading={suggestDescription.loading}
              onClick={suggestDescription.handleSuggest}
            />
          )}
        </div>
        <Textarea
          id="item-edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>
      <ItemContentFields
        itemTypeName={itemTypeName}
        idPrefix="item-edit"
        content={content}
        onContentChange={setContent}
        url={url}
        onUrlChange={setUrl}
        language={language}
        onLanguageChange={setLanguage}
      />
      <div className="flex flex-col gap-2">
        <Label>Collections</Label>
        <CollectionSelect
          collections={collections}
          selectedIds={collectionIds}
          onChange={setCollectionIds}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-edit-tags">Tags</Label>
          {isPro && (
            <SuggestTagsTrigger loading={suggestTags.loading} onClick={suggestTags.handleSuggest} />
          )}
        </div>
        <Input
          id="item-edit-tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="react, hooks, performance"
        />
        <SuggestedTagsList
          tags={suggestTags.suggestions}
          onAccept={suggestTags.handleAccept}
          onReject={suggestTags.handleReject}
        />
      </div>
    </>
  );
}
