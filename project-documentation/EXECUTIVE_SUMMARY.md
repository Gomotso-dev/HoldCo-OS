# Executive Summary — HoldCo OS Audit

## What HoldCo OS is

A React 19 + Supabase single-page application for South African holding-company groups to manage: company records, group ownership structure (shareholders/directors/beneficial owners/intercompany relationships), regulatory compliance tracking with automated SA-specific deadline generation (CIPC, SARS, UIF), document vault, multi-entity finance tracking, an audit/activity log, and email-based reminders.

The architecture is appropriate for the product's scope (ARCHITECTURE.md), the security model (per-owner RLS) is sound (SECURITY_AUDIT.md), and the domain modeling (compliance templates, SA regulatory deadlines) shows real expertise. The codebase's central, pervasive problem is a **schema-naming inconsistency** (snake_case vs. camelCase) that was never fully resolved, leaving several flagship features wired end-to-end but producing **no visible or correct output**.

## Project Health Score: 52 / 100

| Dimension | Score | Rationale |
|---|---|---|
| Architecture & tech choices | 8/10 | Right-sized stack, no over-engineering, good RLS model |
| Database design | 4/10 | Sound table design undermined by dual-column camelCase/snake_case mess |
| Feature completeness (working) | 4/10 | Several core flows (compliance creation, score, structure creation) are broken end-to-end |
| Code quality | 5/10 | Reasonable patterns, but pervasive `as any` masking real bugs, large monolithic pages, duplicated logic |
| Security | 7/10 | RLS solid; one edge-function exposure question |
| Audit trail / compliance integrity | 3/10 | Core to the product's value prop, but silently drops/mislabels entries |
| Tooling/hygiene | 6/10 | No tests, no CI, several unused deps, but type-checking exists and would catch most issues if `as any` were removed |

**52/100 reflects**: a product that is architecturally close to "done" but functionally about half-working on its most distinctive features. This is **not** a "rebuild" situation — it's a "stabilization sprint" situation. Most fixes are small, mechanical, and well-isolated (see REFACTOR_PLAN.md).

## The 5 most critical issues

1. **Compliance Health Score always shows "Healthy"** (BUG-01) — the headline dashboard metric is meaningless due to a column-name mismatch in one query. One-line-class fix, highest visibility.
2. **Compliance auto-generation produces zero visible output** (BUG-02) — the namesake "automation engine" feature doesn't work through any user flow, due to camelCase/snake_case mismatches at 3 points in the pipeline.
3. **"New Compliance Entry" creation is broken** (BUG-03) and **Group Structure relationship creation is broken** (BUG-04) — both are the same class of bug (form bound to a nonexistent camelCase field), found in 2 separate core pages, suggesting more instances may exist elsewhere undetected.
4. **`company_tax_profiles` column-name mismatch** (BUG-05) — `is_vat_registered`/etc. in the DB vs. `vat_registered`/etc. in code — likely compounds issue #2.
5. **Activity/audit log silently drops or mislabels entries** (BUG-06/07/08) — for a product whose pitch includes governance/compliance audit trails, this undermines the product's core promise in a way that's invisible until someone audits the log itself (as this report did).

## Why these went undetected

- `noEmit: true` + pervasive `as any` casts on the exact lines where bugs exist means `tsc --noEmit` (the only "lint" step) does not catch them.
- No automated tests exist anywhere in the repo.
- The dual-column schema means most of these failures are **silent** — no error is thrown to the user; data is just missing, wrong, or defaults to a "good" value (BUG-01's "Healthy").
- Several pages have decorative UI (BUG-15) that makes the app *look* more complete/polished than its data layer actually is — a surface-level review would not surface these issues.

## Recommended next steps (in order)

1. **Phase 1 (1-2 days of focused work)**: fix BUG-01 through BUG-05 + the VAT template gap — these are the "does the product do what it claims" fixes, all mechanical, all in `complianceScore.ts`, `complianceEngine.ts`, `Compliance.tsx`, `Structure.tsx`, `Companies.tsx`/`ComplianceSetupWizard.tsx`. REFACTOR_PLAN.md has exact diffs-by-description for each.
2. **Phase 2 (0.5-1 day)**: activity-log consolidation (BUG-06/07/08) — extend the `ActionType` union, delete `src/lib/activity.ts`, fix ~6 call sites. Can run in parallel with Phase 1 by a second person since it touches mostly different files.
3. **Phase 3 (0.5 day)**: the 5 display/search bugs (BUG-09 through BUG-13) — batch mechanical fix.
4. **Resolve `landing-page/` deletion question** with the user (separate decision, doesn't block 1-3).
5. **Phase 4**: schema cleanup migration dropping camelCase compat columns — only after 1-3 are deployed and a grep confirms nothing references them.
6. **Phase 5/6**: polish (dead deps, debug logs, sidebar nav, decorative UI) and longer-term investments (generated Supabase types, lazy tab-loading, real scheduled notifications) — can be ongoing background work.

## Effort estimate

- **Phases 1-3 (the "make it actually work" work)**: roughly **3-4 developer-days** for someone familiar with the codebase — the fixes are individually small (mostly find-and-replace of a field name, plus a handful of `ActionType` union additions), but there are ~20 of them spread across ~10 files, and each should be manually verified against a real Supabase instance since the bugs are exactly the kind that pass type-checking due to `as any`.
- **Phase 4 (schema migration)**: **0.5-1 day**, but should not be scheduled until Phases 1-3 have been live for at least a few days (to be confident nothing else depends on the compat columns).
- **Phase 5 (polish)**: **1-2 days**, can be spread out / done opportunistically.
- **Phase 6 (architectural investments)**: ongoing, not urgent — schedule after the product is stable and the team has bandwidth to invest in tooling.

**Total to "the product reliably does what its UI claims"**: approximately **1 focused week** for a single developer, or **2-3 days** with two developers working Phases 1 and 2 in parallel.

## Closing note

This audit found no evidence of a flawed product concept or architecture — the issues are consistent with a project that had a working schema, then underwent a rename/refactor (snake_case → attempted camelCase alignment, or vice versa) that was applied to the database via compat columns but never fully propagated through the application code. The fix is consolidation, not redesign, and the existing domain logic (SA compliance templates, RLS security model, component library) is worth preserving as-is.
