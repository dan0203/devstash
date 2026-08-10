# Current Feature

<!-- Feature Name And Short Description -->

## Status

<!-- Not Started|In Progress|Completed -->

## Goals

<!-- Goals & Requirements -->

## Notes

<!-- Any Extra Notes -->

## History

<!-- Keep This Updated. Earliest To Latest -->

- **2026-08-10** — Dashboard UI Phase 2 (Sidebar & Navigation) completed on `feature/dashboard-phase-2`. Collapsible desktop sidebar (icon-rail toggle) plus an always-on mobile drawer; TYPES section links to `/items/[type]` with per-type item counts and a Pro badge on Files/Images (hidden when the user is Pro); COLLECTIONS section is collapsible with Favorites/Recent links, favorited collections (starred) shown separately from the rest, each with item counts and slight indentation. Fixed a flexbox `min-height: auto` bug so the sidebar always fills the viewport height with the user footer pinned to the bottom and only the nav scrolling.
- **2026-08-10** — Dashboard UI Phase 1 (Layout & Setup) completed on `feature/dashboard-phase-1`. ShadCN UI initialized; `/dashboard` route added with a full-width top bar (logo, centered search, "New Collection"/"New item" buttons), dark mode by default, and placeholder Sidebar/Main sections. Switched app font to Libre Franklin and dark background to an anthracite gray.
- **2026-08-10** — Initial Next.js 16 (App Router) project setup via `create-next-app`, with TypeScript and Tailwind CSS v4. Placeholder home page (`src/app/page.tsx`), no backend/database/tests configured yet.
