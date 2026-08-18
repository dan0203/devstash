# AI Integration Plan — OpenAI `gpt-5-nano`

Research for wiring up DevStash's four Pro AI features (auto-tagging, summaries, code
explanation, prompt optimization) per `context/project-overview.md` §3.F. This is a
plan, not an implementation — no source files were changed.

> Note on sources: the research prompt referenced `@src/lib/usage-limits.ts` for gating
> patterns; that file doesn't exist in the current codebase. The equivalent is
> `src/lib/plan-limits.ts` (`isPlanLimitsEnforced`, `isOverItemLimit`/`isOverCollectionLimit`),
> referenced throughout below.

---

## 1. SDK setup

Not yet installed — `openai` is absent from `package.json`, but `OPENAI_API_KEY=""` is
already reserved in `.env.example`.

```bash
npm install openai
```

Add a singleton client following the exact fail-open-at-import posture already
established by `src/lib/stripe.ts`/`src/lib/r2.ts`/`src/lib/rate-limit.ts` — importing
the module must never throw at build time (Next's page-data collection runs against
`.env.production`, which may have an empty key):

```ts
// src/lib/openai.ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder",
  timeout: 20_000, // default is 10 minutes — far too long for a request/response action
  maxRetries: 2,   // SDK default; retries connection errors + 408/409/429/5xx with backoff
});

export const AI_MODEL = "gpt-5-nano";

export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
```

Calls only ever need to actually hit the network from server-side code (Server Actions
here — see §2), so the key never reaches the client bundle as long as `openai.ts` is
never imported from a `"use client"` file.

## 2. Server action patterns for AI calls

Use Server Actions, not API routes — every existing mutation in this codebase
(`src/actions/items.ts`, `collections.ts`, `billing.ts`) follows the Server Action +
`{ success, data, error }` pattern per `coding-standards.md`, and none of
`coding-standards.md`'s stated reasons for preferring an API route (webhooks, upload
progress, long-running work, custom status codes, non-web clients) apply to a
single-shot AI completion. `feature/delete-account-server-action`'s history entry
explicitly reasoned through this same API-route-vs-action tradeoff and reached the same
conclusion for a comparable case.

Proposed shape, mirroring `createItem`'s existing structure (session → Pro gate → Zod
validate → call → return):

```ts
// src/actions/ai.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { openai, AI_MODEL, isAiEnabled } from "@/lib/openai";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { rateLimitErrorMessage } from "@/lib/rate-limit";

const suggestTagsSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1).max(8000), // cap input — see §6
});

export interface SuggestTagsState {
  success: boolean;
  tags?: string[];
  error?: string;
}

export async function suggestTags(input: z.infer<typeof suggestTagsSchema>): Promise<SuggestTagsState> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not signed in" };
  if (!session.user.isPro) return { success: false, error: "AI features require a Pro plan" };
  if (!isAiEnabled()) return { success: false, error: "AI features are not configured" };

  const parsed = suggestTagsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const rl = await checkRateLimit(rateLimiters.aiSuggestTags, session.user.id);
  if (!rl.success) return { success: false, error: rateLimitErrorMessage(rl.reset) };

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "Suggest up to 5 short, lowercase, kebab-case tags for this item. Return only the tags." },
        { role: "user", content: `Title: ${parsed.data.title}\n\nContent:\n${parsed.data.content}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tag_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: { tags: { type: "array", items: { type: "string" }, maxItems: 5 } },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
    });
    const parsed_ = JSON.parse(completion.choices[0].message.content ?? "{}");
    return { success: true, tags: parsed_.tags ?? [] };
  } catch (error) {
    console.error("suggestTags failed", error);
    return { success: false, error: "Couldn't generate tag suggestions. Try again." };
  }
}
```

The same shape applies to the other three features — `summarizeItem`, `explainCode`,
`optimizePrompt` — each a small dedicated action in `src/actions/ai.ts`, each with its
own Zod input schema and its own named rate limiter (see §4).

## 3. Streaming vs non-streaming

Recommendation: **non-streaming for all four MVP features.**

- Auto-tagging and summaries return small, structured JSON (tag lists, a paragraph) —
  nothing worth streaming token-by-token, and `response_format: json_schema` (strict
  mode) composes far more simply with a single awaited call than with a stream you'd
  have to buffer and parse anyway.
- Server Actions returning a single `{ success, data, error }` value match this
  codebase's existing convention exactly (`useActionState` is already used for
  multi-step, non-streaming flows in `SignInForm.tsx`).
- Code explanation and prompt optimization *could* benefit from streaming (longer,
  free-text output where perceived latency matters), but streaming a Server Action's
  result to a client component needs either a Vercel AI SDK-style `readStreamableValue`
  wrapper or a Route Handler + `ReadableStream` — a real architectural addition, not a
  drop-in. Defer it: ship non-streaming first, revisit only if generation latency (in
  practice, gpt-5-nano completions for these prompt sizes are well under 2s) proves to
  be a real UX problem.
- If streaming is added later, it should go through a dedicated `POST /api/ai/[feature]`
  Route Handler (not a Server Action) — `coding-standards.md`'s own list of reasons to
  prefer API routes includes exactly this kind of long-running/streamed response.

## 4. Error handling and rate limiting

**Error handling** — wrap every OpenAI call in `try/catch` (coding-standards.md's
existing Server Action rule) and map failure modes to user-facing messages, mirroring
`billing.ts`'s pattern of catching Stripe errors and returning a generic message rather
than leaking SDK internals:

| Failure | Handling |
|---|---|
| `openai.APIConnectionError` | "Couldn't reach the AI service. Try again." |
| `openai.RateLimitError` (OpenAI's own 429, not ours) | Same generic retry message — don't leak that it's OpenAI's limit vs. ours |
| `response.status === "incomplete"` (truncated by `max_output_tokens`) | Treat as a soft failure — return what was generated if usable (e.g. partial tag list), else the generic error |
| Refusal (`message.refusal` / structured-output refusal object) | Generic "Couldn't generate a suggestion for this content." — never surface the raw refusal text, it can quote back user content |
| JSON parse failure on a `json_schema` response | Should not happen with `strict: true`, but catch and treat as the generic error anyway — never trust it blindly |

The SDK's own default retry (`max_retries: 2`, exponential backoff on connection
errors/408/409/429/5xx) covers transient failures automatically; don't hand-roll a
second retry loop around it.

**Rate limiting** — extend the existing `src/lib/rate-limit.ts` (Upstash, fails open if
unconfigured, exactly as documented in that file) with per-feature limiters, keyed by
`session.user.id` rather than IP (all four features are session-gated, matching the
precedent set by `changePassword`'s limiter — see `current-feature.md`'s
`fix/change-password-rate-limit` entry for the reasoning):

```ts
export const rateLimiters = {
  // ...existing...
  aiSuggestTags: createLimiter("ai-suggest-tags", 20, "1 h"),
  aiSummarize: createLimiter("ai-summarize", 20, "1 h"),
  aiExplainCode: createLimiter("ai-explain-code", 20, "1 h"),
  aiOptimizePrompt: createLimiter("ai-optimize-prompt", 20, "1 h"),
};
```

Numbers are a starting point (loose enough not to bother a real user, tight enough to
bound worst-case cost per account) — tune after real usage data. Unlike the auth
limiters, these don't need anti-enumeration generic-response tricks (no account
existence to leak), so a normal `{ success: false, error }` with the retry message is
fine.

## 5. Pro user gating

Follow the exact pattern already live in `createItem` (`src/actions/items.ts:79`) and
the file/image upload gate in `POST /api/upload`: check `session.user.isPro` (populated
by `src/auth.ts`'s `jwt` callback, refreshed per-request since `auth()` is wrapped in
`cache()`) before doing any paid work, and return a clear upgrade-prompt error rather
than a generic 403.

```ts
if (!session.user.isPro) {
  return { success: false, error: "AI features require a Pro plan" };
}
```

Two things to decide before implementation, both already precedented elsewhere in the
codebase:

- **Dev-mode unlock.** `project-overview.md` §6 says to build the gate now but leave
  features unlocked in dev. The codebase's existing pattern for this is an env toggle
  defaulting appropriately per feature (`ENFORCE_PLAN_LIMITS` defaults **off**,
  `EMAIL_VERIFICATION_ENABLED` defaults **on**). AI calls cost real money per request
  (unlike the item/collection count gates), so default the equivalent toggle **on**
  (enforced) even in dev, and let a developer explicitly opt out locally:
  `ENFORCE_AI_PRO_GATE` (default `true`, matching the cost-sensitive posture) —
  otherwise every local dev session with a valid `OPENAI_API_KEY` would silently rack up
  real API spend.
- **UI-side gating**, mirroring `/items/files`'s pattern (`feature/upgrade-page`'s
  history entry: free users get redirected to `/upgrade`, not shown a broken control) —
  AI-triggering buttons (auto-tag suggestion, summarize, explain, optimize) should
  render as an upgrade prompt/disabled state for free users client-side too, so the
  Server Action's rejection is a defense-in-depth backstop, not the only signal a free
  user sees.

## 6. Cost optimization strategies

`gpt-5-nano` is already the cheapest current-generation OpenAI model (per the August
2026 web research below, high-throughput simple-task pricing in the sub-$0.50/M-token
range) — the main cost levers are usage shape, not model choice:

- **Cap input size.** Truncate `content` before sending (e.g. 8,000 chars for
  summarize/explain, less for tag suggestions) — a pasted 200KB snippet shouldn't become
  a 50K-token request. Validate this in the same Zod schema as everything else
  (`z.string().max(N)`), consistent with how `createItem`'s schema already bounds other
  fields.
- **Cap output size.** Set `max_output_tokens` per feature — tags and summaries need
  very little (~100–300 tokens); code explanation/prompt optimization can go higher but
  should still have a ceiling, both for cost and to avoid a truncated/`incomplete`
  response (§4).
- **Structured outputs over free text where possible** (tags, and optionally a
  short-summary-with-title shape) — `strict: true` JSON schemas produce smaller, exactly
  parseable output vs. asking for prose and regex-parsing it, and avoid retry-inducing
  malformed output.
- **Rate limits double as cost caps** (§4) — the per-feature Upstash limiters are the
  real backstop against runaway spend from a compromised session or bug, not just an
  abuse-prevention measure.
- **No caching layer for MVP.** AI outputs here are per-item and cheap enough at
  gpt-5-nano pricing that a Redis/DB cache of past completions adds real complexity
  (invalidate on content edit, storage schema) for a marginal saving. Skip it initially;
  revisit only if usage data shows repeated identical requests (e.g. a user re-running
  "suggest tags" on the same unedited item).
- **`reasoning_effort` parameter** (seen in the Context7 chat-completions examples) —
  if `gpt-5-nano` supports it, set it to the lowest viable tier (`"minimal"`/`"low"`)
  for these tasks, none of which need deep multi-step reasoning; confirm the exact
  accepted values against the model's own docs page before implementation, since the
  fetched examples show `"medium"` for a different, more complex model.

## 7. UI patterns for AI features

Follow the async-mutation UX already established across the codebase (`NewItemDialog`,
`ChangePasswordDialog`, `ItemDrawerActions`'s favorite/pin toggles):

- **Loading state.** A per-action pending flag (already the norm: `useActionState`'s
  third return value, or local `useState` + try/finally as in the six auth/profile
  forms) disables the trigger button and swaps its label/icon for a spinner — no global
  loading overlay.
- **Accept/reject suggestions**, not silent auto-apply:
  - *Auto-tag*: show suggested tags as removable chips/badges alongside (not replacing)
    the existing tag input — user clicks to add individually, or "Add all." Never
    silently overwrite the tag field.
  - *Summary*: populate the (already-existing) Description field as a proposed value
    the user must explicitly save — reuse the Item Drawer's existing edit-mode Save/
    Cancel affordance rather than inventing a new confirm step, since summaries are
    natural fits for the Description field already in edit mode.
  - *Explain code*: read-only output in a dedicated panel/section (e.g. a collapsible
    block below the `CodeEditor`, following `MarkdownEditor`'s existing
    header-bar-plus-content visual convention) — nothing to accept/reject, it's
    informational only.
  - *Optimize prompt*: show the optimized version side-by-side or as a diff-like
    before/after, with explicit "Use this version" / "Keep original" actions — never
    overwrite the prompt content field automatically.
- **Errors** surface via sonner toast (the established pattern for every mutation in
  this app — `router.refresh()` + toast on item/collection actions, inline errors only
  for form-field-level validation).
- **Entry points** should sit near the content they act on: a "Suggest tags" button next
  to the Tags input in `NewItemDialog`/`ItemDrawerEditForm`, a "Summarize" action near
  Description, "Explain" as a `CodeEditor` header-bar icon button (next to the existing
  copy button) gated to `LANGUAGE_TYPES` items, and "Optimize" as a `MarkdownEditor`/
  content-field affordance gated to `prompt`-type items specifically (not notes).

## 8. Security considerations

- **API key handling.** `OPENAI_API_KEY` stays server-only (`src/lib/openai.ts`, never
  imported by a `"use client"` file) — identical posture to `STRIPE_SECRET_KEY`/R2
  credentials already in this codebase. Never pass the key or raw OpenAI request/
  response objects to the client; Server Actions return only the parsed, minimal shape
  the UI needs (`{ tags }`, `{ summary }`, etc.), not the full SDK response.
- **Input sanitization / prompt-injection awareness.** User content (snippet code, note
  text, prompts) is untrusted input to an LLM call, not to a shell or SQL query, so
  "sanitization" here means: keep system/user roles separated (never concatenate
  instructions and user content into one blob), don't let AI output drive further
  unreviewed actions (§7's accept/reject requirement is itself a security boundary, not
  just UX polish — an auto-tag suggestion that got prompt-injected into suggesting a
  weird tag is contained by requiring explicit user acceptance), and don't feed AI
  output back into a second AI call unsanitized (none of the four planned features chain
  calls, so this isn't currently a risk — flag it if that ever changes).
- **Ownership scoping.** Every action must re-derive its input from a
  session-owned item (fetch via the existing `getItemDetail(userId, itemId)` /
  equivalent ownership-checked query, not by trusting client-submitted content wholesale)
  wherever the action operates on an existing item rather than free-form input the user
  is actively typing — consistent with every other mutation in `src/lib/db/items.ts`
  using `findFirst({ id, userId })`.
- **Cost-as-a-security-concern.** Because these are real-money API calls gated only by
  a session check, the rate limiting in §4 is a security control (denial-of-wallet
  prevention), not just an abuse nicety — treat a missing rate limiter on any new AI
  action as equivalent in severity to the missing-rate-limiting findings the
  `auth-auditor` agent has flagged historically for auth endpoints (see
  `current-feature.md`'s `feature/rate-limiting-auth`/`fix/change-password-rate-limit`
  entries).
- **No secrets/PII in logs.** `console.error` calls in the `catch` blocks (§4) should
  log the error object, not the full request payload (which may contain a user's
  private snippet/note content).

## 9. Suggested file layout

```
src/lib/openai.ts              — client singleton, AI_MODEL, isAiEnabled()
src/actions/ai.ts              — suggestTags, summarizeItem, explainCode, optimizePrompt
src/lib/rate-limit.ts          — extend with 4 new named limiters (§4)
src/actions/ai.test.ts         — Vitest, mocking @/lib/openai + @/auth, matching
                                  items.test.ts's structure (no-session / not-Pro /
                                  validation / happy-path per action)
```

`src/lib/openai.ts` itself is a thin client wrapper with no independent logic worth unit
testing (same reasoning as `src/lib/stripe.ts`/`r2.ts` staying untested) — the
Zod-validated, gating-heavy logic lives in `src/actions/ai.ts`, which **is** in Vitest's
existing `src/actions/**` scope and should get full coverage per
`context/ai-interaction.md`'s Unit Testing section.

---

## Sources

- [Build an AI-Powered SaaS with Next.js + OpenAI (Complete Guide 2026)](https://medium.com/@chiragmehta900/build-an-ai-powered-saas-with-next-js-openai-complete-guide-2026-87a5ee4150be)
- [GPT-5 Integration in Next.js: Complete Guide](https://vladimirsiedykh.com/blog/gpt-5-integration-nextjs-saas-features)
- [Mastering GPT-5.4-mini and GPT-5.4-nano: API Integration Guide](https://help.apiyi.com/en/gpt-5-4-mini-nano-lightweight-cost-effective-api-openclaw-guide-en.html)
- OpenAI API docs via Context7 (`/websites/developers_openai_api`): structured outputs
  (JSON schema, strict mode), streaming with the Node SDK, retry/timeout configuration,
  error handling
- Codebase: `src/actions/items.ts`, `src/actions/billing.ts`, `src/lib/rate-limit.ts`,
  `src/lib/plan-limits.ts`, `src/lib/stripe.ts`, `src/lib/r2.ts`, `src/auth.ts`,
  `context/coding-standards.md`, `context/ai-interaction.md`, `context/current-feature.md`
