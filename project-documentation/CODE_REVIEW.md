# Code Review

General quality assessment of the codebase, independent of the specific bugs catalogued in BUG_REPORT.md (though many bugs stem from the patterns described here).

## Positives

- **Consistent visual/component vocabulary**: `StatusBadge`, `EmptyState`, `SafeChart` are clean, generic, reusable, and genuinely well-implemented (especially `SafeChart`'s `ResizeObserver` handling of Recharts' zero-dimension issue).
- **`src/types.ts`** is a clear, well-organized snake_case domain model that — if it were actually enforced — would prevent most of the bugs found in this audit.
- **RLS-first security model** is correctly and consistently applied across all tables (SECURITY_AUDIT.md).
- **`src/lib/utils.ts`** formatting helpers (`formatCurrency`, `formatDate`, `formatRelativeTime`) are small, focused, and reused appropriately.
- The compliance template catalogue (`SouthAfricanComplianceTemplates`) and due-date calculation logic in `complianceEngine.ts` show real domain knowledge (SA tax/CIPC deadlines) — the *content* is good, only the *wiring* is broken.
- Error handling is present almost everywhere (try/catch around Supabase calls) — the problem is that it's often **too** forgiving (silent `console.error`/`console.warn` swallows real failures, see below).

## Recurring anti-patterns

### 1. Naming-convention drift (the dominant issue)
The single biggest code-quality issue in this codebase is the lack of an enforced column-naming convention between the database, `src/types.ts`, and individual call sites. This single root cause produces:
- 4 confirmed broken-form bugs (BUG-02/03/04, plus Structure.tsx from prior session)
- 2 confirmed silent activity-log failures (BUG-06)
- 5+ display/search bugs (BUG-09 through BUG-13)
- The headline health-score bug (BUG-01)

This isn't a "one bad developer" problem — it's spread across nearly every page and service, suggesting it accumulated over time as different parts were written/patched independently without a shared contract or type-checked Supabase client (Supabase can generate typed clients from the schema via `supabase gen types typescript` — **this project does not use generated types**, relying instead on hand-written `types.ts` plus ad-hoc `any`/`as any` casts).

### 2. `as any` casts at activity-log call sites
Nearly every `ActivityLogService.logActivity(...)` call casts its `action_type`/`actionType` value `as any`. This is a strong signal: the cast exists specifically because the value being passed **doesn't actually satisfy the `ActionType` union or the expected param shape** — i.e., developers were silencing a type error that was correctly flagging BUG-06/07/08. If `tsc --noEmit` were run as a CI gate without these casts, several of these bugs would have been caught at compile time.

### 3. Duplicated logic across files
- `getStoragePath()` duplicated in `Documents.tsx` and `CompanyProfile.tsx` (3rd occurrence per prior session notes).
- Two incompatible activity-logging implementations (`activityLogService.ts` vs `lib/activity.ts`) — BUG-07.
- `logCompanyActivity` in `CompanyProfile.tsx` is itself a third partial wrapper around `ActivityLogService`, with its own mapping bug (BUG-08).

### 4. Monolithic page components
`CompanyProfile.tsx` (~1960 lines) and `Compliance.tsx` (~1230 lines) mix data-fetching, form state for multiple entities, modal management, and rendering for 5-7 tabs/views in a single file each. This makes the camelCase/snake_case bugs harder to spot (the "wrong" field is often 800+ lines away from the table's canonical shape) and makes future changes riskier (large diffs, hard to review).

### 5. Decorative/dead UI left in place
Multiple "looks functional but isn't" elements (BUG-15): non-functional filter dropdowns, a permanently-green "System Status" indicator, a fake "Operational Readiness" panel, a hardcoded tax-deadline note with a now-past date. These create a misleading impression of feature completeness — both to users and to anyone reviewing the app's surface area without reading the code.

### 6. Debug logging left in committed code
`console.log`/`console.warn` calls in `ComplianceScoreCard.tsx` and `TodaysActionPanel.tsx` — low severity, but indicates these components were debugged and not cleaned up before being considered "done."

### 7. Inconsistent activity-log "action_type" vocabulary
`ActivityLogService`'s `ActionType` union has 17 values, several pages need values not in that union (`'finance_created'`, deletion-specific types), and the workaround is always `as any` rather than extending the union — leading to the silent failures above. A central, exhaustive `ActionType` enum that's actually enforced (no `as any`) would surface these gaps at compile time.

## What's NOT a problem (avoid over-engineering in the fix)

- The overall architecture (SPA + Supabase, RLS-based multi-tenancy, services layer for business logic) is appropriate for this product's size and stage — **no need for a backend rewrite, microservices, or a different framework**.
- `recharts`/`SafeChart`, `date-fns` usage, `motion` for transitions — all fine, keep as-is.
- The compliance template *content* (SA regulatory deadlines) is solid domain modeling — preserve it when fixing the wiring.

## Overall code quality rating: **C+ / Needs Stabilization**

The codebase is not poorly *designed* — the architecture, type definitions, and component patterns are reasonable for the product's scope. It is, however, in a **partially-migrated, internally-inconsistent state**: a snake_case schema was extended with camelCase compat columns to paper over mismatches rather than fixing call sites, `as any` was used to silence type errors that were correctly identifying real bugs, and several "automation" features (the namesake compliance engine, health score) are wired end-to-end but produce no visible output due to these mismatches. The path forward is consolidation, not redesign — see REFACTOR_PLAN.md.
