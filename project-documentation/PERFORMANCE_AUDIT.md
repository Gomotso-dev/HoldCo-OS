# Performance Audit

Scope: static review only (no profiling/runtime measurement). Findings are based on query patterns, component structure, and bundle composition observed in source.

## 1. Database query patterns

- **No N+1 query patterns found** in the major list pages — Compliance.tsx, Companies.tsx, etc. use single `.select('*, companies!company_id(name)')`-style joins rather than per-row follow-up queries.
- **Duplicate/competing queries in `complianceScore.ts`**: the primary query (camelCase columns) effectively does nothing useful (BUG-01), but the code still pays for a full round trip plus a second `company_tax_profiles` query before discovering (only on error) it needs a third, fallback query. In the common case (no error, just wrong/empty results), this is "1.5 wasted queries" run on every Dashboard load via `ComplianceScoreCard`.
- Several pages re-fetch the same `companies` list independently (Dashboard, Companies, Compliance, Header for search, Sidebar potentially) — each via its own `useEffect` + `supabase.from('companies').select(...)`. There's no shared cache/query layer (no React Query/SWR), so navigating between pages re-issues these queries every time. For a small per-user dataset (a handful of companies) this is not a real performance problem today, but it's worth flagging as the dataset grows or if API latency increases.

## 2. Large page components

- `CompanyProfile.tsx` (~1960 lines) and `Compliance.tsx` (~1230 lines) are monolithic — they combine data fetching for multiple unrelated concerns (company details, shareholders, directors, beneficial owners, documents, finance, activity, compliance) in one component tree, all fetched on mount regardless of which tab is active.
  - **Impact**: `CompanyProfile.tsx` likely issues 6-7 queries on every visit to a company profile, even if the user only ever looks at the "Overview" tab. This is wasted work and increases time-to-interactive.
  - **Recommendation**: lazy-fetch per-tab data only when that tab is first activated (the tab structure already exists — this is a data-fetching change, not a UI restructure).

## 3. Charts (`recharts` + `SafeChart`)

- `SafeChart.tsx` is a well-engineered `ResizeObserver`-based wrapper that avoids Recharts' well-known zero-dimension console warnings/render thrash — this is a **positive** finding, not a problem. No action needed.

## 4. Client-side "automation" overhead

- `NotificationService` triggers (`sendDailySummary`, `processTriggers`) run on every Dashboard mount (gated by localStorage/sessionStorage flags so at most once/day and once/session respectively) — each potentially issues `getTodaysActions()` (a compliance query) plus an Edge Function invocation. This is bounded and not a performance concern, but it does mean Dashboard's mount effect does meaningfully more work than a typical "load some KPI cards" page — worth being aware of when reasoning about Dashboard load time.

## 5. Bundle size considerations

- Unused dependencies (`express`, `resend`, `dotenv`, `@google/genai`, `react-markdown`, `@types/express`) — of these, only packages actually `import`ed affect the client bundle. Since grep confirms **zero imports** of any of these in `src/`, they likely contribute **nothing** to the production bundle via tree-shaking/no-import — their cost is `node_modules` size and `npm install` time, not runtime bundle size. Still worth removing for hygiene (TECH_STACK.md/REFACTOR_PLAN.md), but this is **not** a runtime performance issue.
- `motion` (Framer Motion successor) and `recharts` are both moderately large libraries; both are used for real features (page transitions, charts) so no removal is suggested — just noting they're the largest "real" dependencies in the bundle.

## 6. Image/asset handling

- No evidence of large unoptimized images or asset-loading issues was found in the files read (the app is primarily data/forms/charts, not media-heavy).

## 7. Print/export path

- `ComplianceReport.tsx`'s print-based export relies on the browser's native print rendering — no performance concern, but for very large compliance registers, a print-to-PDF of an unpaginated long list could be slow/unwieldy in the browser. Low priority given current likely data volumes (SMB holding company group, dozens not thousands of compliance items).

## Summary

No significant runtime performance issues were identified — this is a small-to-medium CRUD/dashboard app with modest per-user data volumes, and the main "waste" identified (CompanyProfile fetching all tabs' data eagerly, ComplianceScoreCard's redundant query path) is more about **correctness** (BUG-01) than raw performance. The highest-value performance-adjacent change is lazy-loading CompanyProfile's tab data, but this should be sequenced **after** the correctness fixes in BUG_REPORT.md, since several of those fixes touch the same queries.
