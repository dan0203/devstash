# Current Feature

Prisma + Neon PostgreSQL Setup — see @context/features/database-spec.md

## Status

Completed

## Goals

- Use Neon PostgreSQL (serverless)
- Create initial schema based on data models in project-overview.md (this will evolve)
- Include NextAuth models (Account, Session, VerificationToken)
- Add appropriate indexes and cascade deletes

## Notes

- We will have a development branch that we work on that will be in DATABASE_URL and then we will have a production branch. So we ALWAYS create migrations and never push directly unless specified.
- IMPORTANT! Use Prisma 7, which has some breaking changes. Read the entire upgrade guide at https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7 to get a good idea of the changes.
- Setup guide: https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres
- References: @context/project-overview.md (initial data models), Prisma docs at https://prisma.io/docs (fetch latest, Prisma 7 has breaking changes)

## History

<!-- Keep This Updated. Earliest To Latest -->

- **2026-08-10** — Prisma 7 + Neon PostgreSQL setup completed on `feature/prisma-neon-setup`. Added `prisma.config.ts` (Prisma 7 moves datasource URL config out of `schema.prisma` into this file) and `prisma/schema.prisma` with the `prisma-client` generator (replaces `prisma-client-js`, outputs to `src/generated/prisma`, gitignored, generated via `postinstall`). Schema covers NextAuth's `Account`/`Session`/`VerificationToken`/`User`, plus `ItemType`, `Item`, `Collection`, `ItemCollection` (join table), and `Tag`. Resolved the three open questions from `project-overview.md`: `Tag` is scoped per-user (`@@unique([userId, name])`, not global), `ItemType.color` stays required with no schema-level fallback, and `Collection.defaultTypeId` uses an explicit `"CollectionDefaultType"` relation name to avoid colliding with `Item.itemTypeId`. Client is instantiated via the Neon serverless driver adapter (`@prisma/adapter-neon` + `@neondatabase/serverless` + `ws`) in `src/lib/prisma.ts` — Prisma 7 requires an explicit driver adapter, there's no more implicit query engine connection. Ran `prisma migrate dev --name init` against the Neon dev branch; `npm run build` and `npm run lint` both pass. NextAuth itself (the `next-auth`/`@auth/prisma-adapter` packages, sign-in flows) is not wired up yet — only the DB models it needs are in place.
- **2026-08-10** — Dashboard UI Phase 3 (Main Area) completed on `feature/dashboard-phase-3`. Main content area with a 4-card stats row (items, collections, favorite items, favorite collections), a "Recent Collections" grid (top 4 collections ranked by most recently updated item, since `Collection` has no timestamp field), a "Pinned Items" grid, and a "Recent Items" grid (last 10 items by `updatedAt`). Added a compact relative-time formatter (`lib/format.ts`) and reusable `ItemCard`/`CollectionCard`/`StatsRow` components; all server components (no client interactivity needed).
- **2026-08-10** — Dashboard UI Phase 2 (Sidebar & Navigation) completed on `feature/dashboard-phase-2`. Collapsible desktop sidebar (icon-rail toggle) plus an always-on mobile drawer; TYPES section links to `/items/[type]` with per-type item counts and a Pro badge on Files/Images (hidden when the user is Pro); COLLECTIONS section is collapsible with Favorites/Recent links, favorited collections (starred) shown separately from the rest, each with item counts and slight indentation. Fixed a flexbox `min-height: auto` bug so the sidebar always fills the viewport height with the user footer pinned to the bottom and only the nav scrolling.
- **2026-08-10** — Dashboard UI Phase 1 (Layout & Setup) completed on `feature/dashboard-phase-1`. ShadCN UI initialized; `/dashboard` route added with a full-width top bar (logo, centered search, "New Collection"/"New item" buttons), dark mode by default, and placeholder Sidebar/Main sections. Switched app font to Libre Franklin and dark background to an anthracite gray.
- **2026-08-10** — Initial Next.js 16 (App Router) project setup via `create-next-app`, with TypeScript and Tailwind CSS v4. Placeholder home page (`src/app/page.tsx`), no backend/database/tests configured yet.
