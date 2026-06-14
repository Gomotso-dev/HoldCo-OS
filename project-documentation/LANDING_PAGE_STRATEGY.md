# Landing Page Strategy

**Per explicit instructions for this audit: no landing-page implementation work has been done.** This document is strategic/planning only.

## Current state

- `landing-page/` is a **separate Vite/React project** (its own `package.json`, `eslint.config.js`, `.prettierrc`, `components.json`, `bun.lock`) containing a marketing site built with shadcn/ui components (`src/components/ui/*` — accordion, dialog, carousel, chart, etc.) and site-specific components (`DashboardMockup.tsx`, `Footer.tsx`, `Navbar.tsx`, `Reveal.tsx`).
- The git status at the start of this audit shows the **entire `landing-page/` directory as deleted** (uncommitted working-tree change) — ~50 files.
- Separately, the main app (`src/`) has its own `LandingPage.tsx` (`/` route, shown when unauthenticated) — a single, presumably simpler in-app landing screen.

## Decision needed before any landing-page work

This audit cannot determine *why* `landing-page/` shows as deleted: it could be (a) an intentional removal in progress (e.g., consolidating to the in-app `LandingPage.tsx` only), (b) an accidental local deletion, or (c) a sync/checkout artifact. **This should be resolved with the user before any landing-page work begins** — restoring 50 deleted files vs. building a new landing page from scratch are very different scopes.

## Strategic considerations (for whichever direction is chosen)

### If consolidating to `src/pages/LandingPage.tsx` (single in-app landing page)
- Pro: one less project to build/deploy/maintain; landing page can share the main app's Tailwind config, fonts, and component primitives (`StatusBadge`, `EmptyState`, `SafeChart` could all be reused for a "product preview" section).
- Con: a marketing site typically wants different SEO/meta-tag handling, possibly static generation for performance — a SPA route inside an auth-gated app is not ideal for public marketing pages (no SSR/SSG, slower first paint, weaker SEO).
- The `DashboardMockup.tsx` component from `landing-page/` (if restored) would be a strong asset — a realistic mockup of the actual product is more credible marketing than generic stock illustrations, **especially once** the BUG_REPORT.md issues are fixed (a mockup showing a "Healthy" score that's actually meaningful, working compliance generation, etc.)

### If restoring/keeping `landing-page/` as a separate marketing site
- Pro: can be statically generated/deployed independently (Vercel/Netlify/Cloudflare Pages), better SEO, can iterate on marketing copy without touching the app's build.
- Con: two codebases to keep visually consistent (the audit found the main app uses Tailwind v4 + custom components; `landing-page/` uses shadcn/ui — these have different design systems and would need active effort to keep "on brand").

## Messaging recommendations (once a platform is chosen)

Based on FEATURES.md, the product's *real* current strengths (once BUG_REPORT.md's critical items are fixed) are:
1. **South African regulatory compliance automation** — CIPC, SARS (Provisional Tax, ITR14, EMP201), UIF, with a domain-specific template catalogue already encoded (`complianceEngine.ts`). This is a genuine differentiator for a SA-focused holding-company product and should be the headline.
2. **Group structure / ownership tracking** (shareholders, directors, beneficial owners, intercompany relationships) — addresses POPIA/beneficial-ownership-register requirements increasingly relevant in SA.
3. **Centralized document vault + financial tracking across multiple entities** — the "single pane of glass" pitch for holding company groups.
4. **Compliance health score** — a strong at-a-glance value prop *once BUG-01 is fixed* (do not market this feature until it actually reflects real data).

## Recommendation: do not finalize landing-page strategy until BUG_REPORT.md critical items are resolved

Marketing a "Compliance Health Score" or "Automated Compliance Roadmap" feature that currently produces no visible output (BUG-01, BUG-02) would create a credibility gap between the marketing site and the product on first login. Sequence: (1) fix BUG-01/02/03/04 in DEVELOPMENT_ROADMAP.md's Phase 1, (2) resolve the `landing-page/` deletion question with the user, (3) then scope landing-page content/build work as a separate task.
