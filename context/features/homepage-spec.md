# Homepage Spec

## Overview

Build the real marketing homepage at `src/app/page.tsx` (replacing the current placeholder) from the static HTML/CSS/JS prototype in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). Port the layout, copy, and interactions into the Next.js app using Tailwind v4 + shadcn/ui, matching the rest of the codebase's conventions instead of copying the prototype's raw CSS.

This route is public (not covered by `src/proxy.ts`'s matcher), so no auth guard is needed.

## Requirements

- Recreate all sections from the prototype, in order: Navbar, Hero (chaos → arrow → dashboard preview), Features grid, AI section, Pricing, CTA, Footer
- Same copy, layout, and visual structure as the prototype — reimplemented with Tailwind utility classes instead of the prototype's `styles.css`
- Dark theme, consistent with the rest of the app (reuse existing color tokens from `globals.css` where they fit; introduce new ones only where the marketing page needs something the app doesn't have yet, e.g. the hero gradient)
- Item-type accent colors must match the real app palette from `context/project-overview.md`'s Type Colors & Icons table (Snippet blue `#3b82f6`, Prompt purple `#8b5cf6`, Command orange `#f97316`, Note yellow `#fde047`, File gray `#6b7280`, Image pink `#ec4899`, Link emerald `#10b981`) — this is marketing content, so hardcode these rather than querying the database
- Use lucide-react for icons (already a dependency via shadcn) instead of the prototype's inline SVGs/emoji, except the four brand logos (Notion, GitHub, Slack, VS Code) in the hero's chaos animation, which stay as inline SVGs since they aren't in lucide
- Responsive behavior matches the prototype: hero visual stacks vertically on mobile with the arrow rotated 90°, grids collapse to fewer columns

## Server vs. Client Components

Default to server components; extract client components only where interactivity requires it:

- **Server (static):** Navbar links/logo, Hero text, Features grid, AI section, Pricing cards' static content, CTA, Footer
- **Client components:**
  - `ChaosField` — the floating/bouncing/mouse-repelling icon animation (`requestAnimationFrame` loop, mirrors `prototypes/homepage/script.js`'s chaos logic)
  - `ScrollFadeIn` (or a `useInView`-style wrapper) — replaces the prototype's `IntersectionObserver` fade-in-on-scroll; wrap each section/card that should animate in
  - `Navbar` — needs a scroll listener to toggle its opacity/background past a scroll threshold
  - `PricingToggle` — monthly/yearly billing switch (use shadcn `Switch`), toggles displayed Pro price and the "billed annually" note
- Footer's copyright year can be computed server-side (`new Date().getFullYear()`) — no client component needed there, unlike the prototype's JS-computed version

## Buttons & Links

- Navbar "Sign In" → `/sign-in`
- Navbar "Get Started" and all hero/pricing/CTA "Get Started" / "Get Started Free" / "Upgrade to Pro" buttons → `/register`
- Navbar "Features" / "Pricing" and Hero "See Features" → anchor links to the in-page `#features` / `#pricing` sections
- Pricing "Free" card's "Get Started" → `/register`
- Footer "Features" / "Pricing" → same in-page anchors; "About" / "Blog" / "Privacy" / "Terms" have no pages yet — leave as `#` or omit rather than linking to non-existent routes (don't invent placeholder pages)
- Logo (navbar + footer) → `/` (or omit the link on the homepage itself, since it's already home)

## Code Quality

- Keep it DRY: the six feature cards, two pricing cards, and footer link columns should each be driven by a small local data array mapped to a single card/row component, not six/two/N hand-copied JSX blocks
- Extract a shared `SectionHeading` (title + subtitle) component used by Features/AI/Pricing instead of repeating markup
- Use shadcn `Button` for all CTAs (`variant="default"` / `variant="outline"` for primary/ghost), shadcn `Badge` for "Pro Feature" and "Most Popular", shadcn `Switch` for the pricing toggle
- No inline `style="--accent:..."` hacks like the prototype — pass Tailwind classes or a typed color prop per card instead

## Out of Scope

- No new routes for About/Blog/Privacy/Terms
- No real Stripe/billing wiring — pricing toggle only changes displayed copy, same as the prototype
- No changes to `prototypes/homepage/` itself; it's reference only

## Reference

- @prototypes/homepage/index.html
- @prototypes/homepage/styles.css
- @prototypes/homepage/script.js
- @context/project-overview.md
- @context/coding-standards.md
