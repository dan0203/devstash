import { Code, Sparkles, Command, Terminal, File, FolderOpen, type LucideIcon } from "lucide-react";

export interface HomepageItemType {
  name: string;
  color: string;
}

export const HOMEPAGE_ITEM_TYPES: HomepageItemType[] = [
  { name: "Snippets", color: "#3b82f6" },
  { name: "Prompts", color: "#8b5cf6" },
  { name: "Commands", color: "#f97316" },
  { name: "Notes", color: "#fde047" },
  { name: "Files", color: "#6b7280" },
  { name: "Images", color: "#ec4899" },
  { name: "Links", color: "#10b981" },
];

export interface HomepageFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export const HOMEPAGE_FEATURES: HomepageFeature[] = [
  {
    icon: Code,
    title: "Code Snippets",
    description: "Save and organize reusable code with syntax highlighting for any language.",
    color: "#3b82f6",
  },
  {
    icon: Sparkles,
    title: "AI Prompts",
    description: "Keep your best prompts, contexts, and system messages ready to reuse.",
    color: "#8b5cf6",
  },
  {
    icon: Command,
    title: "Instant Search",
    description: "Find anything in milliseconds — content, tags, titles, and types.",
    color: "#fde047",
  },
  {
    icon: Terminal,
    title: "Commands",
    description: "Never re-Google that flag combination again.",
    color: "#f97316",
  },
  {
    icon: File,
    title: "Files & Docs",
    description: "Attach files, images, and reference docs alongside your notes.",
    color: "#6b7280",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Group anything, of any type, into collections that make sense to you.",
    color: "#10b981",
  },
];

export const AI_CHECKLIST = [
  "AI auto-tag suggestions",
  "AI summaries of long snippets and notes",
  '"Explain this code" on demand',
  "AI prompt optimizer",
];

export const AI_DEMO_TAGS = ["javascript", "performance", "utility", "closures"];

export const FREE_PLAN_FEATURES = [
  "50 items total",
  "3 collections",
  "All system types except Files/Images",
  "Basic search",
];

export const FREE_PLAN_UNAVAILABLE_FEATURES = ["File & Image uploads", "AI features"];

export const PRO_PLAN_FEATURES = [
  "Unlimited items",
  "Unlimited collections",
  "Files & image uploads",
  "AI auto-tagging, summaries & explain",
  "AI prompt optimizer",
  "Data export",
  "Priority support",
];

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];
