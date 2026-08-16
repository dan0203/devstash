# AI Interaction Guidelines

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Workflow

This is the common workflow that we will use for every single feature/fix:

1. **Document** - Document the feature in @context/current-feature.md.
2. **Branch** - Create new branch for feature, fix, etc
3. **Implement** - Implement the feature/fix that I create in @context/current-feature.md
4. **Test** - Verify it works in the browser. Add/update Vitest unit tests for any server actions or utilities touched (see Unit Testing below). Run `npm run build` and fix any errors
5. **Iterate** - Iterate and change things if needed
6. **Commit** - Only after build passes and everything works
7. **Merge** - Merge to main
8. **Delete Branch** - Delete branch after merge
9. **Review** - Review AI-generated code periodically and on demand.
10. Mark as completed in @context/current-feature.md and add to history

Do NOT commit without permission and until the build passes. If build fails, fix the issues first.

## Branching

We will create a new branch for every feature/fix. Name branch **feature/[feature]** or **fix[fix]**, etc. Ask to delete the branch once merged.

## Commits

- Ask before committing (don't auto-commit)
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Never put "Generated With Claude" in the commit messages

## Unit Testing

Unit tests use **Vitest** (`npm test` to run once, `npm run test:watch` for watch mode). Scope is intentionally narrow:

- **In scope:** server actions (`src/actions/**`) and pure utilities (`src/lib/**`, excluding `src/lib/db/**` which talks to Prisma/Neon directly and isn't unit-tested).
- **Out of scope:** components — no jsdom/Testing Library is configured. Don't add component tests unless the user explicitly asks and expands this scope.
- Co-locate tests next to the file under test as `<name>.test.ts` (never `.test.tsx`, which keeps components excluded by the config's `include` glob in `vitest.config.mts`).
- Mock dependencies (`@/auth`, `@/lib/prisma`, `next-auth`) rather than hitting a real database or NextAuth — see `src/actions/auth.test.ts` for the pattern, including why `next-auth` itself must be mocked (it eagerly imports `next/server`, which Next's package.json doesn't expose to Vitest's strict module resolution).
- Add/update tests for any server action or utility touched by a feature/fix as part of the **Test** step; don't treat it as optional cleanup.

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase

## Code Review

Review AI-generated code periodically, especially for:

- Security (auth checks, input validation)
- Performance (unnecessary re-renders, N+1 queries)
- Logic errors (edge cases)
- Patterns (matches existing codebase?)
- Code structure — run a `code-scanner` pass specifically for oversized files/components and duplicated logic that should be extracted into a function, component, or utility
