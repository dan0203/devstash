import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const ITEM_TYPE_DISPLAY_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "link",
  "file",
  "image",
];

export const getSystemItemTypesOrdered = cache(async () => {
  const itemTypes = await prisma.itemType.findMany({ where: { isSystem: true } });
  itemTypes.sort(
    (a, b) => ITEM_TYPE_DISPLAY_ORDER.indexOf(a.name) - ITEM_TYPE_DISPLAY_ORDER.indexOf(b.name)
  );
  return itemTypes;
});

export async function getItemTypeBySlug(slug: string) {
  const itemTypes = await getSystemItemTypesOrdered();
  return itemTypes.find((itemType) => pluralize(itemType.name) === slug) ?? null;
}

// Simple English pluralization covering the current system type names
// (snippet, prompt, command, note, link, file, image) and common custom-type
// shapes; not exhaustive, but safer than blind string concatenation.
export function pluralize(word: string): string {
  if (/[sxz]$|[sc]h$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

export function formatItemTypeName(name: string): string {
  const plural = pluralize(name);
  return plural.charAt(0).toUpperCase() + plural.slice(1);
}
