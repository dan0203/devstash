import { CONTENT_TYPES, LANGUAGE_TYPES, URL_TYPES } from "@/components/dashboard/item-content-types";
import { CodeEditor } from "@/components/dashboard/CodeEditor";
import { MarkdownEditor } from "@/components/dashboard/MarkdownEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ItemContentFieldsProps {
  itemTypeName: string;
  idPrefix: string;
  content: string;
  onContentChange: (content: string) => void;
  url: string;
  onUrlChange: (url: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  fieldClassName?: string;
  urlRequired?: boolean;
}

/**
 * Content/Language/URL fields, shown per item type — shared by the item
 * drawer's edit form and the new-item dialog so the type-branching logic
 * (which fields a type gets, and whether Content is code vs. markdown)
 * lives in one place.
 */
export function ItemContentFields({
  itemTypeName,
  idPrefix,
  content,
  onContentChange,
  url,
  onUrlChange,
  language,
  onLanguageChange,
  fieldClassName = "flex flex-col gap-2",
  urlRequired,
}: ItemContentFieldsProps) {
  return (
    <>
      {CONTENT_TYPES.has(itemTypeName) && (
        <div className={fieldClassName}>
          <Label htmlFor={`${idPrefix}-content`}>Content</Label>
          {LANGUAGE_TYPES.has(itemTypeName) ? (
            <CodeEditor value={content} onChange={onContentChange} language={language} />
          ) : (
            <MarkdownEditor value={content} onChange={onContentChange} />
          )}
        </div>
      )}
      {LANGUAGE_TYPES.has(itemTypeName) && (
        <div className={fieldClassName}>
          <Label htmlFor={`${idPrefix}-language`}>Language</Label>
          <Input
            id={`${idPrefix}-language`}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
          />
        </div>
      )}
      {URL_TYPES.has(itemTypeName) && (
        <div className={fieldClassName}>
          <Label htmlFor={`${idPrefix}-url`}>URL</Label>
          <Input
            id={`${idPrefix}-url`}
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={urlRequired ? "https://" : undefined}
            required={urlRequired}
          />
        </div>
      )}
    </>
  );
}
