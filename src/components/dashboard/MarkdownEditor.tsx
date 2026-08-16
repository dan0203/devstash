"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const tabTriggerClassName =
  "h-auto rounded-none border-none px-0 py-0 text-[10px] font-medium tracking-wide text-neutral-400 uppercase data-active:bg-transparent data-active:text-neutral-100 hover:text-neutral-200";

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-[#1e1e1e]",
        className
      )}
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <div className="flex items-center justify-between border-b border-white/10 bg-[#2d2d2d] px-3 py-2">
          {readOnly ? (
            <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
              Preview
            </span>
          ) : (
            <TabsList variant="line" className="h-auto gap-3 bg-transparent p-0">
              <TabsTrigger value="write" className={tabTriggerClassName}>
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className={tabTriggerClassName}>
                Preview
              </TabsTrigger>
            </TabsList>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Copy markdown"
            className="text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
            onClick={handleCopy}
          >
            {copied ? <Check className="text-green-400" /> : <Copy />}
          </Button>
        </div>

        {!readOnly && (
          <TabsContent value="write" className="m-0">
            <textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Write markdown..."
              className="themed-scrollbar field-sizing-content max-h-[400px] min-h-[200px] w-full resize-none overflow-y-auto bg-transparent p-3 font-mono text-xs text-neutral-100 outline-none placeholder:text-neutral-500"
            />
          </TabsContent>
        )}

        <TabsContent value="preview" className="m-0">
          <div className="markdown-preview themed-scrollbar max-h-[400px] min-h-[200px] overflow-y-auto p-3">
            {value.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-xs text-neutral-500">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
