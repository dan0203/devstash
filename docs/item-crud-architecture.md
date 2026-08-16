# Item CRUD Architecture

> **Status: superseded by implementation.** This was a design proposal written on 2026-08-14 when `/items/[type]` and item mutations didn't exist yet. The unified approach it proposes was built out across `feature/items-list-view`, `feature/item-drawer`, `feature/item-drawer-edit-mode`, `feature/delete-item`, `feature/item-create`, and `feature/file-image-upload` (see `context/current-feature.md`'s History for details) — kept here as historical context for the reasoning behind the design, not as a spec of current behavior. The actual implementation diverges from this proposal in a few notable ways: mutations live directly in `src/actions/items.ts` as five separate Zod-validated schemas (not one discriminated union), there's no `ItemForm`/`TextContentField`/`UrlField`/`FileUploadField` component split (the drawer and `NewItemDialog` branch on type inline instead), file uploads go through `POST /api/upload` (not `/api/items/upload`), and `image`/`file` types got dedicated `ImageThumbnailCard`/`FileListRow` list views instead of sharing `ItemCard`.

This is a design document, not a description of existing code — `/items/[type]` and item mutations are not implemented yet (as of 2026-08-14, only read-path dashboard queries exist). It proposes a unified CRUD system covering all 7 item types (`snippet`, `prompt`, `command`, `note`, `link`, `file`, `image`) using the conventions already established by the auth/profile features (`src/actions/auth.ts`, `src/lib/db/*.ts`) and mandated by `context/coding-standards.md`.

> **Note on sources:** the prompt names `@docs/content-types.md` and `@src/lib/constants.tsx`; neither exists. The equivalent, current docs/files are `docs/item-types.md` (written by a prior `/research` run) and `src/lib/icon-map.ts` + `src/lib/db/item-types.ts`, respectively — this document is based on those.

## Guiding principle: one system, type-agnostic core

All 7 types share one `Item` table (`prisma/schema.prisma`) differing only by `contentType` (`text` | `url` | `file`) and which fields are populated (see `docs/item-types.md`). CRUD should mirror that: **one mutation file, one query module, one dynamic route, one set of components that branch on `itemType`/`contentType` at the leaves** — not seven parallel type-specific stacks. This matches `coding-standards.md`'s Server Actions guidance and the pattern already used for auth (`src/actions/auth.ts` handles credentials + GitHub + delete-account in one file, not one file per provider).

## File structure

```
src/
  actions/
    items.ts              # createItem, updateItem, deleteItem, toggleFavorite, togglePinned
  lib/
    db/
      items.ts             # existing: getPinnedItems, getRecentItems, getItemStats, getItemTypesWithCounts
                            # + new: getItemsByType(userId, typeSlug, opts), getItemById(userId, id)
      item-types.ts         # existing: ITEM_TYPE_DISPLAY_ORDER, pluralize, formatItemTypeName,
                            #           getSystemItemTypesOrdered
                            # + new: getItemTypeBySlug(slug) — resolves route param -> ItemType row
  types/
    item.ts                 # new: CreateItemInput / UpdateItemInput Zod schemas + inferred types
  app/
    (app)/
      items/
        [type]/
          page.tsx           # the one dynamic route for all 7 types
  components/
    items/
      ItemList.tsx           # grid/list of ItemCard, adapts columns/empty-state copy by type
      ItemDrawer.tsx         # quick-view/edit drawer (per project-overview.md: items open in a
                              # drawer, not a full page)
      ItemForm.tsx            # create/edit form; renders a type-specific field group internally
      fields/
        TextContentField.tsx  # snippet/prompt/command/note: textarea (+ language select for
                               # snippet/command)
        UrlField.tsx           # link: single URL input
        FileUploadField.tsx    # file/image: upload control (Pro-gated)
    dashboard/
      ItemCard.tsx            # existing, reused as-is inside ItemList
```

This slots directly into the file-organization rules in `coding-standards.md` (`src/actions/[feature].ts`, `src/lib/db/[utility].ts`, `src/types/[feature].ts`) — nothing new is invented, `items.ts` is just added at each existing layer.

## Mutations: `src/actions/items.ts`

One file, five Server Actions, all following the existing `{ success, data?, error? }` / `try-catch` convention from `coding-standards.md`'s Error Handling section and `src/actions/auth.ts`'s session-first pattern:

```ts
"use server";

export async function createItem(input: CreateItemInput): Promise<ActionResult<Item>>
export async function updateItem(id: string, input: UpdateItemInput): Promise<ActionResult<Item>>
export async function deleteItem(id: string): Promise<ActionResult<void>>
export async function toggleFavorite(id: string): Promise<ActionResult<{ isFavorite: boolean }>>
export async function togglePinned(id: string): Promise<ActionResult<{ isPinned: boolean }>>
```

- Every action starts by resolving `session.user.id` via `auth()` (same guard as `deleteAccount()`), then re-checks `item.userId === session.user.id` before mutating/deleting — items are never trusted to belong to the caller just because an id was posted.
- `createItem`/`updateItem` validate with a **single shared Zod schema** discriminated on `contentType`, not seven type-specific schemas — e.g. `z.discriminatedUnion("contentType", [textItemSchema, urlItemSchema, fileItemSchema])` in `src/types/item.ts`. This keeps validation in one place and mirrors "one system" rather than reintroducing type-by-type branching at the mutation layer.
- `itemTypeId` is resolved server-side from the type slug (or accepted directly if the client already has it from the current route), never trusted blindly from the client without confirming it maps to one of the 7 system types (or a future custom type owned by the user).
- No file-upload bytes flow through these actions directly — per `coding-standards.md`, "file uploads with progress tracking" is an explicit case for API routes, not Server Actions. `file`/`image` items get their `fileUrl`/`fileName`/`fileSize` from a separate `POST /api/items/upload` route (R2 storage) first; `createItem`/`updateItem` then just persist the resulting URL/metadata like any other field. This is the one deliberate split from "everything is a Server Action" and matches the same reasoning `current-feature.md` already used to keep `register`/`change-password`/etc. as API routes instead of actions (needing response headers/behavior a Server Action can't express).
- Tag handling (create-or-connect against the user-scoped `Tag` model) and `ItemCollection` membership updates happen inside the same action as `createItem`/`updateItem`, in one Prisma transaction, rather than as separate calls — keeps item creation atomic.

## Data fetching: `src/lib/db/items.ts`

Extends the existing file rather than creating a parallel module, consistent with `getPinnedItems`/`getRecentItems`/`getItemStats` already living there:

- `getItemsByType(userId, typeSlug, { search?, tag?, collectionId?, sort? })` — powers `/items/[type]`. Resolves `typeSlug` → `ItemType` via a new `getItemTypeBySlug()` in `item-types.ts` (inverse of the existing `pluralize()`/`formatItemTypeName()`), 404s (via `notFound()`) if the slug doesn't match any of the user's system or custom types.
- `getItemById(userId, id)` — powers the item drawer's detail/edit view.
- All fetching stays server-component-direct-to-Prisma per `coding-standards.md` ("Server components fetch directly with Prisma... Client components use Server Actions") — no fetching happens inside client components or via internal API calls.

## `/items/[type]` routing

Single dynamic segment route: `src/app/(app)/items/[type]/page.tsx`, inside the existing `(app)` route group so it inherits the authenticated shell (sidebar/top bar) already set up in `(app)/layout.tsx`.

1. Server component reads the `type` param (Next.js 16: typed via the generated `PageProps<"/items/[type]">` helper per `CLAUDE.md`'s Next.js 16 note, not a hand-written prop type).
2. Resolves session via `auth()` (same guard as `dashboard/page.tsx`), redirects to `/sign-in` if absent.
3. Calls `getItemTypeBySlug(type)` — if it doesn't resolve to a real type owned by the user (system or custom), render Next.js's `notFound()`.
4. Calls `getItemsByType(userId, type, searchParams)` and renders `<ItemList items={...} itemType={...} />`.
5. Query-string params (`?search=`, `?tag=`, `?collection=`) drive filtering server-side — no client-side fetch layer needed for the base list view.

This single route replaces what would otherwise be 7 near-identical route files (`/items/snippets`, `/items/prompts`, ...) — the type segment is data, not a set of distinct pages. Creating/editing/deleting happens without leaving the route: the sidebar's "New item" button and each `ItemCard` open `ItemDrawer` (per `project-overview.md`: "Individual items open in a quick-access drawer rather than a new page"), which calls the `src/actions/items.ts` Server Actions and revalidates via `revalidatePath` (or client-side `router.refresh()`) rather than navigating.

## Where type-specific logic lives

Deliberately **not** in `src/actions/items.ts` or `src/lib/db/items.ts` — both stay type-agnostic (they operate on whatever `contentType`/fields are present). Type-specific behavior is pushed to the edges:

| Concern | Lives in |
| --- | --- |
| Which fields to show/require on create/edit | `ItemForm.tsx`, branching on `itemType.name`/`contentType` to pick `TextContentField` / `UrlField` / `FileUploadField` |
| Syntax highlighting, `language` selector | `TextContentField.tsx`, only rendered for `snippet`/`command` |
| Icon/color per type | Already centralized in `icon-map.ts` (`itemTypeIcons`) + `ItemType.color` from the DB — consumed as-is by `ItemCard`, no duplication needed |
| Pro gating (file/image) | `ItemForm.tsx` / `FileUploadField.tsx` check `session.user.isPro` before allowing the file/image type to be selected at all; `src/actions/items.ts`'s `createItem` also re-checks server-side (never trust a client-side gate alone) and returns `{ success: false, error: "Pro required" }` if violated |
| Card/list rendering differences | `ItemCard.tsx` (already exists, already type-agnostic via `itemType.icon`/`itemType.color`) — extending it later for e.g. an image thumbnail or a link favicon would be an additive branch inside this one component, not a new component per type |
| Empty-state copy ("No snippets yet") | `ItemList.tsx`, driven by `itemType.name`, not hardcoded per type |

## Component responsibilities

- **`ItemList`** — server-renderable grid; pure presentation over `getItemsByType`'s result, no data fetching of its own beyond what's passed in as props. Owns empty-state and count display.
- **`ItemCard`** (existing, reused) — a single item's summary card; already type-agnostic (icon/color from `itemType`, tags, pin/favorite state, relative time). No changes needed to support the 7 types as they exist today; would only grow a conditional block if a type ever needs a materially different preview (e.g. thumbnail for `image`).
- **`ItemDrawer`** — client component (needs open/close state); fetches nothing itself, receives an `ItemWithType`-shaped item (or `null` for "create new"), renders `ItemForm` inside a drawer/sheet primitive, and calls the appropriate `src/actions/items.ts` action on submit.
- **`ItemForm`** — client component owning the create/edit form state; the only place that branches on type to decide which field subcomponent to render and which Zod schema variant applies client-side (mirroring the server schema for immediate validation feedback) before calling the Server Action.
- **`TextContentField` / `UrlField` / `FileUploadField`** — dumb, controlled field groups; each owns only its own inputs, no submit logic.

## Summary of the "unified" design

- **1** mutations file (`actions/items.ts`) for all 7 types, guarded by ownership checks and a discriminated-union Zod schema.
- **1** query module (`lib/db/items.ts`, extending the existing file) for all read paths, server-component-direct per `coding-standards.md`.
- **1** dynamic route (`items/[type]/page.tsx`) instead of 7 static routes, using Next.js 16's generated `PageProps` typing.
- Type-specific behavior is isolated to the component leaves (`ItemForm` and its field subcomponents) and to `icon-map.ts`/DB-stored `ItemType.color`/`icon` — never duplicated into the action or query layers.
- File uploads (`file`/`image`) are the one deliberate exception routed through an API route rather than a Server Action, consistent with `coding-standards.md`'s explicit carve-out for upload-with-progress endpoints.
