"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { OptimizePromptTrigger } from "@/components/ai/OptimizePromptTrigger";
import { useOptimizePrompt } from "@/components/ai/hooks/use-optimize-prompt";

interface MarkdownEditorOptimizeOptions {
  isPro: boolean;
}

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  /** Enables the "Optimize" trigger + accept/reject proposal — prompt-type editing only. */
  optimize?: MarkdownEditorOptimizeOptions;
}

const tabTriggerClassName =
  "h-auto rounded-none border-none px-0 py-0 text-[10px] font-medium tracking-wide text-neutral-400 uppercase data-active:bg-transparent data-active:text-neutral-100 hover:text-neutral-200";

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className,
  optimize,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState(readOnly ? "preview" : "write");
  const [copied, setCopied] = useState(false);

  const optimizeState = useOptimizePrompt({ content: value });

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAcceptOptimized = () => {
    if (!optimizeState.optimized) return;
    onChange?.(optimizeState.optimized);
    optimizeState.reset();
    toast.success("Prompt updated");
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
          <div className="flex items-center gap-2">
            {optimize && !optimizeState.optimized && (
              <OptimizePromptTrigger
                isPro={optimize.isPro}
                loading={optimizeState.loading}
                onClick={optimizeState.handleOptimize}
              />
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

      {optimize && optimizeState.optimized && (
        <div className="flex flex-col gap-2 border-t border-white/10 bg-[#242424] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
              Optimized suggestion
            </span>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleAcceptOptimized}>
                Use this prompt
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
                onClick={optimizeState.reset}
              >
                Discard
              </Button>
            </div>
          </div>
          <div className="markdown-preview themed-scrollbar max-h-[300px] overflow-y-auto rounded-md border border-white/10 bg-[#1e1e1e] p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{optimizeState.optimized}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
