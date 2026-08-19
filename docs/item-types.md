# Item Types

> **Status: partially outdated.** Written on 2026-08-14, before item CRUD, file/image upload, and the type-specific list views (`ImageThumbnailCard`, `FileListRow`) existed. The "7 types" table, content-kind classification, and shared-properties sections below are still accurate; the "Display differences" section's `ItemCard` description and the note about `file`/`image` having zero seeded rows are stale — see the corrections inline below.

DevStash items are the atomic unit of the app. Every item has a **type** (`ItemType`), which determines its color/icon and how its content is stored and rendered. There are 7 **system types** (`isSystem: true`, `userId: null`, shared across all users, seeded once); custom user-defined types are a post-MVP Pro feature and not yet implemented.

> **Note on sources:** the research prompt names `@src/lib/constants.tsx` as a source, but that file does not exist in the codebase. The equivalent logic is split across two files instead:
> - `src/lib/icon-map.ts` — maps `ItemType.icon` string values to Lucide icon components
> - `src/lib/db/item-types.ts` — `ITEM_TYPE_DISPLAY_ORDER`, `pluralize()`, `formatItemTypeName()`, `getSystemItemTypesOrdered()`
>
> Colors/icons are otherwise stored per-row on `ItemType` in the database (seeded by `prisma/seed.ts`), not hardcoded in a constants file.

## The 7 types

| Type | Icon (lucide) | Hex color | Content kind | Purpose |
| --- | --- | --- | --- | --- |
| `snippet` | `Code` | `#3b82f6` (blue) | text | Reusable code snippets (has a `language` for syntax highlighting) |
| `prompt` | `Sparkles` | `#8b5cf6` (purple) | text | AI prompts / system messages |
| `command` | `Terminal` | `#f97316` (orange) | text | Shell/CLI commands (also uses `language`, e.g. `bash`) |
| `note` | `StickyNote` | `#fde047` (yellow) | text | Free-form notes |
| `link` | `Link` | `#10b981` (emerald) | url | Bookmarked URLs |
| `file` | `File` | `#6b7280` (gray) | file | Uploaded file (Pro only) |
| `image` | `Image` | `#ec4899` (pink) | file | Uploaded image (Pro only) |

Display order (sidebar, type breakdowns) is fixed by `ITEM_TYPE_DISPLAY_ORDER` in `src/lib/db/item-types.ts`: snippet → prompt → command → note → link → file → image (not DB insertion order, and not alphabetical).

Route/slug convention: `/items/[type]`, where the slug is the pluralized, lowercased type name (`formatItemTypeName`/`pluralize` in `src/lib/db/item-types.ts`), e.g. `snippet` → `/items/snippets`.

## Content-kind classification

Every `Item.contentType` is one of three kinds, which determines which `Item` fields are populated:

| Content kind | Types | Populated fields | Null/unused fields |
| --- | --- | --- | --- |
| `text` | snippet, prompt, command, note | `content` (required), `language` (optional, snippet/command only) | `url`, `fileUrl`, `fileName`, `fileSize` |
| `url` | link | `url` (required) | `content`, `language`, `fileUrl`, `fileName`, `fileSize` |
| `file` | file, image | `fileUrl`, `fileName`, `fileSize` | `content`, `language`, `url` |

`prisma/seed.ts` sets `contentType` per item as `data.url ? "url" : "text"` and never seeds `file`/`image` items, so those two types have zero *seeded* rows — but the upload flow itself (`feature/file-image-upload`) is implemented, and users can create real `file`/`image` items via upload.

## Shared properties

All `Item` rows share the same base fields regardless of type: `id`, `title`, `description`, `isFavorite`, `isPinned`, `userId`, `itemTypeId`, `tags` (many-to-many via `Tag`), `collections` (many-to-many via `ItemCollection`), `createdAt`/`updatedAt`.

All `ItemType` rows share: `id`, `name`, `icon` (Lucide icon name, resolved via `itemTypeIcons` in `icon-map.ts`), `color` (hex), `isSystem`, `userId` (null for system types).

## Display differences

- **`ItemCard`** (`src/components/items/ItemCard.tsx`): renders `snippet`/`prompt`/`command`/`note`/`link` uniformly — an icon swatch tinted with `itemType.color` (icon resolved via `itemTypeIcons[item.itemType.icon]`), title, optional description, up to 3 tags, relative-time stamp, with a colored border when `isPinned`. `image` and `file` types get dedicated list views instead of `ItemCard`: `ImageThumbnailCard` (16:9 thumbnail grid, `feature/image-gallery-view`) and `FileListRow` (single-column rows with per-extension icons and a direct-download button, `feature/file-list-view`) — `src/app/(app)/items/[type]/page.tsx` branches on `itemType.name` to pick which one renders.
- **`CollectionCard`** (`src/components/collections/CollectionCard.tsx`): since a collection holds mixed types, it shows a single dot colored by the *dominant* item type in the collection, plus a small row of icons (one per distinct type present, deduped) — not per-item colors.
- **Sidebar** (`SidebarContent.tsx`, via `getItemTypesWithCounts`): lists all 7 system types in fixed display order with per-user item counts; `file`/`image` show a "Pro" badge when the signed-in user's `isPro` is false.
- **Pro gating**: `file` and `image` are the only types restricted to Pro users (per `project-overview.md`'s monetization table); the other 5 are free-tier.
