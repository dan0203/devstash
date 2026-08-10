// Mock data for the dashboard UI. Single source of truth until a real database is wired up.

export interface User {
    id: string;
    name: string;
    email: string;
    isPro: boolean;
}

export interface ItemType {
    id: string;
    name: string;
    slug: string;
    icon: string; // lucide icon name
    color: string; // hex
    isSystem: boolean;
}

export interface Item {
    id: string;
    title: string;
    description: string;
    content: string;
    language?: string;
    url?: string;
    tags: string[];
    isFavorite: boolean;
    isPinned: boolean;
    itemTypeId: string;
    collectionIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Collection {
    id: string;
    name: string;
    description: string;
    isFavorite: boolean;
    color: string;
}

export const currentUser: User = {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'demo@devstash.io',
    isPro: true,
};

export const itemTypes: ItemType[] = [
    { id: 'type-snippet', name: 'Snippets', slug: 'snippets', icon: 'Code', color: '#3b82f6', isSystem: true },
    { id: 'type-prompt', name: 'Prompts', slug: 'prompts', icon: 'Sparkles', color: '#8b5cf6', isSystem: true },
    { id: 'type-command', name: 'Commands', slug: 'commands', icon: 'Terminal', color: '#f97316', isSystem: true },
    { id: 'type-note', name: 'Notes', slug: 'notes', icon: 'StickyNote', color: '#fde047', isSystem: true },
    { id: 'type-link', name: 'Links', slug: 'links', icon: 'Link', color: '#10b981', isSystem: true },
    { id: 'type-file', name: 'Files', slug: 'files', icon: 'File', color: '#6b7280', isSystem: true },
    { id: 'type-image', name: 'Images', slug: 'images', icon: 'Image', color: '#ec4899', isSystem: true },
];

export const collections: Collection[] = [
    { id: 'col-react-patterns', name: 'React Patterns', description: 'Reusable hooks, components and conventions.', isFavorite: true, color: '#3b82f6' },
    { id: 'col-ai-prompts', name: 'AI Prompts', description: 'System prompts and prompt-engineering wins.', isFavorite: true, color: '#8b5cf6' },
    { id: 'col-cli-toolbox', name: 'CLI Toolbox', description: 'Commands I always forget under pressure.', isFavorite: false, color: '#f97316' },
    { id: 'col-interview-prep', name: 'Interview Prep', description: 'Notes, snippets and links for the job hunt.', isFavorite: false, color: '#fde047' },
    { id: 'col-context-files', name: 'Context Files', description: 'Reference files for AI-assisted projects.', isFavorite: false, color: '#6b7280' },
    { id: 'col-useful-links', name: 'Useful Links', description: 'Docs and articles worth revisiting.', isFavorite: false, color: '#10b981' },
];

export const items: Item[] = [
    {
        id: 'item-use-debounce',
        title: 'useDebounce hook',
        description: 'Debounce any fast-changing value with a configurable delay.',
        content: `import { useEffect, useState } from "react"

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}`,
        language: 'typescript',
        tags: ['react', 'hooks', 'performance'],
        isFavorite: true,
        isPinned: true,
        itemTypeId: 'type-snippet',
        collectionIds: ['col-react-patterns', 'col-interview-prep'],
        createdAt: '2026-08-08T10:00:00.000Z',
        updatedAt: '2026-08-10T06:00:00.000Z',
    },
    {
        id: 'item-swr-fetcher',
        title: 'SWR fetcher pattern',
        description: 'Typed fetcher + hook wrapper for SWR.',
        content: `export const fetcher = (url: string) => fetch(url).then((res) => res.json())`,
        language: 'typescript',
        tags: ['swr', 'data-fetching', 'react'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-snippet',
        collectionIds: ['col-react-patterns'],
        createdAt: '2026-08-03T10:00:00.000Z',
        updatedAt: '2026-08-03T10:00:00.000Z',
    },
    {
        id: 'item-zod-schema',
        title: 'Zod schema — user profile',
        description: 'Validation schema with refinements for profile edits.',
        content: `export const userProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})`,
        language: 'typescript',
        tags: ['zod', 'validation', 'typescript'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-snippet',
        collectionIds: ['col-react-patterns'],
        createdAt: '2026-08-06T10:00:00.000Z',
        updatedAt: '2026-08-06T10:00:00.000Z',
    },
    {
        id: 'item-tailwind-theme',
        title: 'Tailwind v4 theme setup',
        description: 'Reminders for the @theme inline token workflow.',
        content: `@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}`,
        language: 'css',
        tags: ['tailwind', 'css', 'setup'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-note',
        collectionIds: ['col-react-patterns'],
        createdAt: '2026-08-09T10:00:00.000Z',
        updatedAt: '2026-08-09T10:00:00.000Z',
    },
    {
        id: 'item-system-prompt',
        title: 'Code review system prompt',
        description: 'Baseline system prompt for strict code review sessions.',
        content: 'You are a senior engineer performing a thorough code review. Focus on correctness, security, and simplicity.',
        tags: ['prompt-engineering', 'review'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-prompt',
        collectionIds: ['col-ai-prompts'],
        createdAt: '2026-08-07T10:00:00.000Z',
        updatedAt: '2026-08-07T10:00:00.000Z',
    },
    {
        id: 'item-prompt-optimizer',
        title: 'Prompt tightening checklist',
        description: 'Steps for trimming a verbose prompt without losing intent.',
        content: '1. Remove redundant instructions\n2. Merge overlapping constraints\n3. Front-load the most important rule',
        tags: ['prompt-engineering'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-prompt',
        collectionIds: ['col-ai-prompts'],
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
        id: 'item-git-cleanup',
        title: 'Git branch cleanup',
        description: 'Delete local branches already merged into main.',
        content: "git branch --merged main | grep -v '\\* main' | xargs -n 1 git branch -d",
        language: 'bash',
        tags: ['git', 'cleanup'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-command',
        collectionIds: ['col-cli-toolbox'],
        createdAt: '2026-08-02T10:00:00.000Z',
        updatedAt: '2026-08-02T10:00:00.000Z',
    },
    {
        id: 'item-docker-prune',
        title: 'Docker full prune',
        description: 'Reclaim disk space by removing unused Docker data.',
        content: 'docker system prune -a --volumes',
        language: 'bash',
        tags: ['docker'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-command',
        collectionIds: ['col-cli-toolbox'],
        createdAt: '2026-07-28T10:00:00.000Z',
        updatedAt: '2026-07-28T10:00:00.000Z',
    },
    {
        id: 'item-find-large-files',
        title: 'Find large files in repo',
        description: 'List the biggest files tracked by git history.',
        content: "git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -n -r | head -20",
        language: 'bash',
        tags: ['git', 'cleanup'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-command',
        collectionIds: ['col-cli-toolbox'],
        createdAt: '2026-07-20T10:00:00.000Z',
        updatedAt: '2026-07-20T10:00:00.000Z',
    },
    {
        id: 'item-big-o-cheatsheet',
        title: 'Big-O cheat sheet',
        description: 'Quick reference for common data structure complexities.',
        content: 'Array access: O(1)\nHash map lookup: O(1) avg\nBinary search: O(log n)\nSorting: O(n log n)',
        tags: ['algorithms', 'interview'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-note',
        collectionIds: ['col-interview-prep'],
        createdAt: '2026-07-15T10:00:00.000Z',
        updatedAt: '2026-07-15T10:00:00.000Z',
    },
    {
        id: 'item-two-sum',
        title: 'Two Sum',
        description: 'Classic hash-map approach to the two sum problem.',
        content: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (seen.has(complement)) return [seen.get(complement)!, i]
    seen.set(nums[i], i)
  }
  return []
}`,
        language: 'typescript',
        tags: ['algorithms', 'interview'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-snippet',
        collectionIds: ['col-interview-prep'],
        createdAt: '2026-07-10T10:00:00.000Z',
        updatedAt: '2026-07-10T10:00:00.000Z',
    },
    {
        id: 'item-leetcode-link',
        title: 'NeetCode 150',
        description: 'Curated list of interview practice problems.',
        content: '',
        url: 'https://neetcode.io/practice',
        tags: ['interview', 'practice'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-link',
        collectionIds: ['col-interview-prep', 'col-useful-links'],
        createdAt: '2026-07-05T10:00:00.000Z',
        updatedAt: '2026-07-05T10:00:00.000Z',
    },
    {
        id: 'item-nextjs-docs',
        title: 'Next.js App Router docs',
        description: 'Official routing and rendering reference.',
        content: '',
        url: 'https://nextjs.org/docs/app',
        tags: ['nextjs', 'docs'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-link',
        collectionIds: ['col-useful-links'],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z',
    },
    {
        id: 'item-project-context',
        title: 'DevStash project overview',
        description: 'Reference context file describing the product spec.',
        content: 'See context/project-overview.md',
        tags: ['context', 'devstash'],
        isFavorite: false,
        isPinned: false,
        itemTypeId: 'type-note',
        collectionIds: ['col-context-files'],
        createdAt: '2026-06-28T10:00:00.000Z',
        updatedAt: '2026-06-28T10:00:00.000Z',
    },
];
