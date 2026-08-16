"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { editor as MonacoEditorNS } from "monaco-editor";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

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
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2a2a2a] px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {WINDOW_DOT_COLORS.map((color) => (
            <span
              key={color}
              className="size-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-[10px] tracking-wide text-neutral-400 uppercase">
              {language}
            </span>
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
      <MonacoEditor
        value={value}
        language={mapMonacoLanguage(language)}
        theme="vs-dark"
        height={height}
        onChange={(newValue) => onChange?.(newValue ?? "")}
        onMount={handleMount}
        options={{
          readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          folding: false,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          renderLineHighlight: readOnly ? "none" : "line",
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
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
