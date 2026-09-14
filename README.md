<div align="center">

# DevStash

**A fast, searchable, AI-enhanced hub for your snippets, prompts, commands, notes, files, images and links.**

[![CI](https://github.com/dan0203/devstash/actions/workflows/ci.yml/badge.svg)](https://github.com/dan0203/devstash/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

🇬🇧 English&nbsp;&nbsp;·&nbsp;&nbsp;🇫🇷 [Français](./README.fr.md)

**[Try the live demo →](https://devstash.danzerbib.me)**

</div>

---

## Live demo

The deployed app has a **"Try the Live Demo" button** on the homepage that signs you straight into a public guest account — no sign-up, no credentials to type.

A few deliberate design choices behind that button:

- **Credentials never reach the browser.** The button calls a server action that signs in with env-sourced credentials server-side, not a login form pre-filled with a visible password.
- **The demo account is deliberately free-tier**, not Pro, so the app's plan limits (50 items / 3 collections, file & image uploads gated) are actually visible rather than hidden behind an unlocked account.
- **Upgrading "for real" is safe to try.** The demo account's Stripe Checkout runs against a separate **test-mode** Stripe configuration (its own keys, prices and webhook secret), so a visitor can walk through a genuine Checkout page with a test card and see the account flip to Pro — with zero chance of a real charge.
- **A daily cron job resets the account.** A Vercel Cron (`vercel.json` → `GET /api/cron/reset-demo`) wipes the guest account's items/collections and clears any test billing state back to baseline every day, so visitor edits or test payments never accumulate or leave the account permanently stuck "Pro". The endpoint verifies a bearer secret (`CRON_SECRET`) before doing anything and fails closed (`401`) if it's missing or wrong.

New account sign-up is closed on this instance (see [Security](#security) below) — this is a solo portfolio/demo project, not a multi-tenant product, so the guest account above is the intended way to try it.

## Screenshots

<p align="center">
  <img src="context/screenshots/dashboard-ui.png" alt="DevStash dashboard — collections view" width="49%" />
  <img src="context/screenshots/dashboard-ui-drawer.png" alt="DevStash item detail drawer" width="49%" />
</p>

## About this project

DevStash started from Brad Traversy's _Coding With AI_ course as a way to practice a **structured, human-reviewed AI-assisted development workflow** rather than an unstructured "prompt and hope" approach. Concretely, every feature follows the same cycle, backed by files in the repo rather than an ephemeral chat history:

1. **Spec** — the feature is written down in `context/current-feature.md` (goals, constraints, notes) before any code is touched.
2. **Build** — implementation happens on its own feature branch, in small, reviewable steps.
3. **Prove** — `npm run build`, `npm run lint` and the relevant Vitest suite all have to pass; non-trivial flows are also verified manually (often via Playwright) against a running dev server before merging.
4. **Land** — the feature is merged, its branch deleted, and a dated entry is appended to `context/current-feature.md`'s History section — a running, readable log of ~280 commits' worth of decisions, dead ends and fixes.

The `.claude/` directory documents this further: `.claude/skills/feature/` implements the workflow above as a repeatable command, and `.claude/agents/` defines four dedicated review sub-agents (`auth-auditor`, `code-scanner`, `refactor-scanner`, `ui-reviewer`) used to audit the code independently of the implementation step — `docs/audit-results/AUTH_SECURITY_REVIEW.md` is a real output of the `auth-auditor` agent, not hand-written marketing copy.

This is presented plainly rather than hidden: the point isn't that an AI wrote the code, it's the ability to **direct and review AI-assisted development with the same rigor as any other engineering work** — specs before code, tests before merge, and a written audit trail instead of "trust me."

## Features

- **Items & item types** — snippets, prompts, notes, commands, links (free tier) and files/images (Pro), each with type-appropriate rendering (a Monaco-based code editor for snippets, a markdown editor for text types, etc.)
- **Collections** — user-defined, many-to-many groupings across mixed item types
- **Unified search** — across titles, content, tags and types, plus a command palette (⌘K)
- **Favorites & pinning**, a recently-used view
- **Authentication** — email/password (bcrypt, email verification, password reset) and GitHub OAuth, via NextAuth v5
- **AI features (Pro)** — auto-tag suggestions, item summaries, "explain this code", and a prompt optimizer, all backed by Mistral with strict JSON-schema-constrained responses
- **Billing** — Stripe subscriptions (monthly/yearly), a customer portal, and webhook-driven plan sync
- **Freemium plan limits** — enforced in production (50 items / 3 collections on the free tier; file/image uploads and AI features are Pro-only)
- **Dark mode** by default

## Tech stack

| Layer               | Choice                                                          |
| ------------------- | --------------------------------------------------------------- |
| Framework           | Next.js 16 (App Router, TypeScript, Turbopack)                  |
| Database            | Neon (serverless Postgres) + Prisma 7                           |
| Auth                | NextAuth v5 — credentials (bcrypt) + GitHub OAuth               |
| File storage        | Cloudflare R2 (S3-compatible)                                   |
| Payments            | Stripe (subscriptions + webhooks)                               |
| AI                  | Mistral AI, strict JSON-schema responses                        |
| Transactional email | Resend                                                          |
| Rate limiting       | Upstash Redis (sliding window)                                  |
| Testing             | Vitest — 139 tests across 16 files (server actions & utilities) |
| Lint / format       | ESLint (flat config) + Prettier                                 |
| CI                  | GitHub Actions — lint, test, build on every push/PR             |
| Hosting             | Vercel (app + daily Cron job)                                   |

## Security

DevStash uses Prisma + Postgres rather than a service with built-in row-level security (Supabase, Firebase), so data isolation is enforced entirely in application code rather than declared as a database policy:

- **Every item/collection query is scoped by `userId`** at the Prisma query level itself — reads, writes, deletes and even file downloads (which re-verify session and ownership before fetching the object from R2) all go through this pattern. No user can reach another user's data by guessing an id.
- **Rate limiting runs before any database or password work.** The login rate limiter is checked inside `authorize()` before the user lookup or `bcrypt.compare()` call, so a rate-limited request never leaks a timing or account-existence signal.
- **Passwords are bcrypt-hashed at 12 rounds**; email verification and password-reset tokens are 256-bit, single-use, and 24h-expiring; a password change invalidates existing JWT sessions on other devices.
- **New account sign-up is closed by default** (`REGISTRATION_ENABLED=false`), and — independent of that flag — the GitHub OAuth callback only signs in **existing** accounts, so it can never silently auto-provision a new user. To let someone new in via GitHub without opening public registration, create a `User` row for their email directly (e.g. via the seed script or a one-off DB write); to reopen self-service sign-up entirely, set `REGISTRATION_ENABLED=true`.
- **The public demo account is fully isolated**: its own Stripe test-mode configuration (so a visitor can't trigger a real charge or get the shared account permanently stuck "Pro"), and a daily cron reset (`CRON_SECRET`-guarded, fails closed) so visitor activity never accumulates.
- **A dedicated internal audit exists**: `docs/audit-results/AUTH_SECURITY_REVIEW.md`, produced by a purpose-built review sub-agent (`.claude/agents/auth-auditor.md`) scoped to exactly the auth concerns NextAuth doesn't handle automatically (rate limiting, password hashing, token security, enumeration). Its one open (low-severity) finding — trusting the `X-Forwarded-For` header for per-IP rate limiting — is a documented, accepted trade-off specific to running behind Vercel's edge, which overwrites that header before it reaches the app.
- **Fail-open-at-import consistency for third-party clients.** `stripe.ts`, `mistral.ts` and `r2.ts` are each written so importing them never throws just because an API key is unset (a placeholder value is used instead) — this matters because Next.js collects page data at build time by importing every route, so a missing key elsewhere shouldn't be able to break the production build. `resend.ts` had been missed from this pattern during an earlier round of work and _did_ throw on import with no key set, breaking a real production build; it now follows the same convention as the others.

### Email deliverability (Resend)

A few real-world operational details worth documenting rather than hiding:

- Transactional email is sent from `no-reply@devstash.danzerbib.me`, a **dedicated subdomain** (verified via DKIM/SPF) rather than the root domain — this isolates sending reputation and avoids clashing with any existing DNS records on the root domain.
- `RESEND_API_KEY` should be a **"Sending access" key scoped to that one domain**, not a full-access key.
- A gotcha hit in practice: editing an existing key's permissions/domain scope in the Resend dashboard appears to silently invalidate the old secret. A `401 API key is invalid` right after a scope change means regenerating a fresh key rather than reusing the old value.
- `EMAIL_VERIFICATION_ENABLED` lets verification be switched off entirely for an environment without a verified sending domain (new users are auto-verified instead).
- DMARC (`_dmarc.devstash` TXT record, `p=none` to start) hasn't been added yet — a reasonable next step for full deliverability hygiene.
- Inbound email is intentionally disabled (no MX record on the subdomain) — nothing in the app processes incoming mail, so there's no reason to accept it.

## Getting started

**Prerequisites:** Node 20+, a Postgres database (a free [Neon](https://neon.tech) project works well).

```bash
git clone https://github.com/dan0203/devstash.git
cd devstash
cp .env.example .env   # fill in at least DATABASE_URL and AUTH_SECRET — see below
npm install             # also runs `prisma generate`
npm run db:seed         # optional: seeds system item types + a demo dataset
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](./.env.example) for the full list — every variable is documented inline with what it does and what happens if it's left unset. At minimum, `DATABASE_URL` and `AUTH_SECRET` are required to run at all; everything else (GitHub OAuth, Resend, Upstash, R2, Stripe, Mistral, the demo account, the cron secret) degrades gracefully when unset rather than crashing, so you can run a useful local instance with just a database.

### Testing

```bash
npm test          # Vitest, run once — 139 tests across 16 files
npm run test:watch
```

Tests cover server actions and pure utilities (`src/actions/**`, `src/lib/**` excluding `src/lib/db/**`), all against mocked dependencies — no real database or external service is touched. Components aren't unit-tested; non-trivial UI flows are instead verified manually against a running dev server as part of each feature's workflow (see [About this project](#about-this-project)).

### CI

Every push and pull request to `main` runs lint, the full test suite and a production build via GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

## Known limitations

- **Custom item types** (beyond the seven built-in system types) are designed for but not yet implemented.
- **Plan-limit enforcement** is a single global flag (`ENFORCE_PLAN_LIMITS`) rather than per-user overrides — fine for a two-tier freemium model, would need revisiting for anything more granular.
- **AI model choice was constrained by real account limits, not just capability**: `mistral-large-latest` isn't available on the account's tier, and `mistral-small-latest` hit sustained rate limits under normal usage, so AI features run on `ministral-14b-latest` with a dedicated 429 handler and a user-facing "try again in a moment" message rather than a generic error.
- **DMARC isn't configured yet** for the sending subdomain (see [Email deliverability](#email-deliverability-resend) above).

## License

MIT — see [LICENSE](./LICENSE).
