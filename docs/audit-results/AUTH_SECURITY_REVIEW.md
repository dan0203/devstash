# Auth Security Review

**Last audited:** 2026-08-14

## Findings

### 🟠 High

#### 1. No rate limiting / brute-force protection on any auth endpoint

No rate limiting, throttling, or lockout mechanism exists anywhere in the codebase (confirmed via repo-wide search — no rate-limiting library, in-memory throttle, or middleware logic present). This affects:

- `src/auth.ts` — Credentials `authorize()` (`POST /api/auth/signin/credentials` via NextAuth). NextAuth v5 does **not** provide brute-force protection out of the box; this is application responsibility. An attacker can attempt unlimited password guesses against any known email address.
- `src/app/api/auth/register/route.ts` — unlimited account-creation attempts (can be used to spam the `resend`/email-sending quota or enumerate emails via the 409 duplicate response, see Low finding below).
- `src/app/api/auth/forgot-password/route.ts` and `src/app/api/auth/resend-verification/route.ts` — unlimited requests let an attacker mass-trigger emails to arbitrary addresses (email-bombing/spam vector), and also let an attacker brute-force-probe timing differences between existing/non-existing accounts (the DB lookup + token creation only happens when the account exists, creating a small but real timing side-channel on top of the missing rate limit).
- `src/app/api/auth/change-password/route.ts` — an authenticated attacker (e.g. from a stolen session cookie or an XSS-based fetch) can brute-force the current-password check with unlimited attempts since there's no lockout after repeated `bcrypt.compare` failures.

**Fix:** add IP- and/or account-based rate limiting (e.g. Upstash `@upstash/ratelimit` + Redis, already noted as a "maybe" in the tech stack, or a simple Postgres-backed counter) in front of all five endpoints above. At minimum, throttle by IP+email combination on sign-in and change-password, and by IP alone on register/forgot-password/resend-verification.

### 🟡 Medium

#### 2. `src/app/api/auth/register/route.ts` reveals account existence via HTTP status

Lines 37-43: when the submitted email already has an account, the endpoint returns `409 { error: "A user with this email already exists" }`. This lets an attacker enumerate registered email addresses by trying them against `/api/auth/register`, which is inconsistent with the anti-enumeration design deliberately used in `forgot-password` and `resend-verification` (both always return generic `200 { success: true }`).

This is a common, often-accepted UX tradeoff for registration forms (most products do reveal "email already registered" so users don't create duplicate accounts), so it is flagged as medium rather than high — but it is worth a deliberate decision rather than an inconsistency with the rest of the auth surface.

**Fix:** either accept this tradeoff explicitly (document it), or switch to a generic response ("If this email isn't already registered, check your inbox to finish sign-up") and send a "you already have an account" email instead of an inline error, matching the pattern used elsewhere in this codebase.

## Passed Checks

- **Password hashing:** bcrypt with a cost factor of 12 is used consistently everywhere a password is set or changed — `src/app/api/auth/register/route.ts:45`, `src/app/api/auth/reset-password/route.ts:51`, `src/app/api/auth/change-password/route.ts:52`, and the original seed script. No weaker/faster hashing path exists.
- **Email verification tokens** (`src/lib/verification-email.ts`): generated with `crypto.randomBytes(32).toString("hex")` (256 bits of entropy, cryptographically random, not guessable). 24h expiry enforced in `src/app/api/auth/verify-email/route.ts`. Single-use: the token row is deleted on successful consumption, and also deleted if found-but-expired, so a stale or reused link cannot succeed twice. `createVerificationToken` also deletes any prior pending token for the same identifier before issuing a new one, so only one valid token can exist per email at a time.
- **Password reset tokens** (`src/lib/password-reset.ts`): same 256-bit entropy and 24h TTL as verification tokens. Namespaced identifier (`password-reset:${email}`) prevents collision with — and prevents a reset request from wiping — a pending email-verification token for the same address (both reuse the single `VerificationToken` table keyed by `identifier`). `consumePasswordResetToken` deletes the token row on every consumption path (success or expired), confirmed single-use. `consumePasswordResetToken` also validates the `password-reset:` prefix before accepting a token, so a verification token can't be replayed against the reset endpoint or vice versa.
- **OAuth-only accounts handled safely:** both `reset-password` (`src/app/api/auth/reset-password/route.ts:41-49`) and `change-password` (`src/app/api/auth/change-password/route.ts:37-42`) explicitly check `user.password === null` and reject with a clear error ("signs in with GitHub and doesn't have a password") rather than silently creating/overwriting a password on an OAuth-only account. `forgot-password` similarly only creates/sends a reset token when `user.password` is set (`src/app/api/auth/forgot-password/route.ts:26`), so OAuth-only users never receive a reset email that would let them add a password out-of-band.
- **Anti-enumeration:** `forgot-password` and `resend-verification` both always return a generic `{ success: true }` regardless of whether the account exists, already has a password, or is already verified (`src/app/api/auth/forgot-password/route.ts:34-36`, `src/app/api/auth/resend-verification/route.ts:42-44`).
- **Profile page and account actions are correctly session-scoped:** `src/app/(app)/profile/page.tsx` calls `auth()` server-side and redirects unauthenticated users; both `getUserProfile` and `getProfileStats` are called with `session.user.id`, never a client-supplied id. `POST /api/auth/change-password` and `POST /api/auth/delete-account` both independently call `auth()` and return `401` if there's no session, and scope their Prisma queries/mutations to `session.user.id` — a user cannot change or delete another account by tampering with client input, since no id is ever accepted from the request body.
- **Change-password verifies current password** before accepting a new one (`bcrypt.compare` check at `src/app/api/auth/change-password/route.ts:44-50`) prior to hashing and storing the new password.
- **Delete-account requires explicit confirmation:** the client-side `DeleteAccountDialog` requires typing the literal string `DELETE` before the destructive action is enabled; the actual authorization boundary (session-scoped delete) is enforced server-side regardless, so this is a UX safeguard layered on top of a correctly-scoped mutation, not the sole protection.
- **Route protection middleware** (`src/proxy.ts`): `/dashboard` and `/profile` are gated behind `auth()`, redirecting unauthenticated users to `/sign-in` with a `callbackUrl`. No bypass paths found under those prefixes.
- **Session/JWT callback hygiene** (`src/auth.ts:28-35`): the `jwt` callback only copies `user.id` onto `token.sub`; it does not spread the full Prisma `user` object (which includes the bcrypt password hash) into the token, so the password hash is not persisted into the session JWT despite `authorize()` returning the full user record.
- Items explicitly out of scope per audit instructions (CSRF, session cookie flags, OAuth state/PKCE) were not evaluated, per NextAuth v5 handling them natively.
