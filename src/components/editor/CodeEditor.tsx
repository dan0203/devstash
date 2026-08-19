"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { editor as MonacoEditorNS } from "monaco-editor";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEditorPreferences } from "@/components/editor/hooks/editor-preferences-context";
import { defineCustomMonacoThemes } from "@/lib/monaco-themes";
import { ExplainCodeTrigger } from "@/components/ai/ExplainCodeTrigger";
import { useExplainCode } from "@/components/ai/hooks/use-explain-code";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-32 items-center justify-center text-xs text-neutral-400">
      Loading editor...
    </div>
  ),
});

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 400;

const WINDOW_DOT_COLORS = ["#ff5f56", "#ffbd2e", "#27c93f"];

const tabTriggerClassName =
  "h-auto rounded-none border-none px-0 py-0 text-[10px] font-medium tracking-wide text-neutral-400 uppercase data-active:bg-transparent data-active:text-neutral-100 hover:text-neutral-200";

interface CodeEditorExplainOptions {
  itemTypeName: string;
  isPro: boolean;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  className?: string;
  /** Enables the "Explain" trigger + Code/Explain tabs — item drawer read view only. */
  explain?: CodeEditorExplainOptions;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
  explain,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"code" | "explain">("code");
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

  const explainState = useExplainCode({
    content: value,
    language: language ?? null,
    itemType: explain?.itemTypeName ?? "",
  });

  const handleExplainClick = async () => {
    const success = await explainState.handleExplain();
    if (success) setTab("explain");
  };

  const handleMount = (editorInstance: MonacoEditorNS.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    const updateHeight = () => {
      const contentHeight = editorInstance.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };

    editorInstance.onDidContentSizeChange(updateHeight);
    updateHeight();
  };

  const handleCopy = async () => {
    const copyValue = tab === "explain" && explainState.explanation ? explainState.explanation : value;
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const showTabs = Boolean(explain && explainState.explanation);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-[#1e1e1e]",
        className
      )}
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as "code" | "explain")}>
        <div className="flex items-center justify-between border-b border-white/10 bg-[#2a2a2a] px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {WINDOW_DOT_COLORS.map((color) => (
                <span
                  key={color}
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {showTabs && (
              <TabsList variant="line" className="h-auto gap-3 bg-transparent p-0">
                <TabsTrigger value="code" className={tabTriggerClassName}>
                  Code
                </TabsTrigger>
                <TabsTrigger value="explain" className={tabTriggerClassName}>
                  Explain
                </TabsTrigger>
              </TabsList>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!showTabs && language && (
              <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
                {language}
              </span>
            )}
            {explain && !explainState.explanation && (
              <ExplainCodeTrigger
                isPro={explain.isPro}
                loading={explainState.loading}
                onClick={handleExplainClick}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Copy code"
              className="text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
              onClick={handleCopy}
            >
              {copied ? <Check className="text-green-400" /> : <Copy />}
            </Button>
          </div>
        </div>

        <TabsContent value="code" className="m-0">
          <MonacoEditor
            value={value}
            language={mapMonacoLanguage(language)}
            theme={preferences.theme}
            height={height}
            onChange={(newValue) => onChange?.(newValue ?? "")}
            beforeMount={defineCustomMonacoThemes}
            onMount={handleMount}
            options={{
              readOnly,
              domReadOnly: readOnly,
              minimap: { enabled: preferences.minimap },
              fontSize: preferences.fontSize,
              tabSize: preferences.tabSize,
              lineNumbers: "on",
              folding: false,
              wordWrap: preferences.wordWrap ? "on" : "off",
              scrollBeyondLastLine: false,
              renderLineHighlight: readOnly ? "none" : "line",
              padding: { top: 12, bottom: 12 },
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
            }}
          />
        </TabsContent>

        {explain && (
          <TabsContent value="explain" className="m-0">
            <div className="markdown-preview themed-scrollbar max-h-[400px] min-h-[200px] overflow-y-auto p-3">
              {explainState.explanation ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{explainState.explanation}</ReactMarkdown>
              ) : (
                <p className="text-xs text-neutral-500">Nothing to show yet.</p>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function mapMonacoLanguage(language?: string | null) {
  if (!language) return "plaintext";

  const normalized = language.trim().toLowerCase();
  const aliases: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    yml: "yaml",
    md: "markdown",
    "c++": "cpp",
    "c#": "csharp",
  };

  return aliases[normalized] ?? normalized;
}