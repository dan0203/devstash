# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Project state

This is a Next.js 16 (App Router) project scaffolded with `create-next-app` and not yet built out — `src/app/page.tsx` is still the placeholder home page. There is no test suite, backend, or database configured yet.

## Context Files

Read the following to get the full context of the project :

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config via `eslint.config.mjs`, using `eslint-config-next`'s `core-web-vitals` + `typescript` rule sets)

There is no test runner configured in `package.json`.

## Neon MCP

When using Neon MCP tools (listing/querying databases, branches, running SQL, migrations, etc.), always target:

- **Project:** `devstash`
- **Branch:** `development`

Never select or run operations against the `production` branch (or any branch other than `development`) unless the user explicitly names it in their request. If a Neon MCP tool call requires picking a project or branch and it isn't obvious which one is meant, default to `devstash` / `development` rather than asking — but if `devstash` has no branch literally named `development`, stop and ask which branch to use instead of guessing.

## Next.js 16 specifics

Next.js 16 has breaking API/convention changes versus older versions that may be baked into training data (e.g. route props are now typed with generated helpers like `LayoutProps<"/">` / `PageProps<...>` instead of hand-written prop types — see `src/app/layout.tsx`). Before implementing routing, data fetching, or other framework-level features, consult the version-matched docs in `node_modules/next/dist/docs/` (resolve the path relative to this file, since in monorepos `next` may not be hoisted to the repo root) rather than relying on prior knowledge, and follow any deprecation notices found there.
