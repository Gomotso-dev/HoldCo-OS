# Architecture

## High-level shape

HoldCo OS is a **single-page React application** talking directly to **Supabase** (Postgres + Auth + Storage + one Edge Function). There is no custom backend server — `express`/`dotenv` in `package.json` are vestigial and unused.

```
┌─────────────────────────────────────────────┐
│  Browser (React 19 SPA, Vite build)          │
│  ┌───────────────┐   ┌──────────────────┐   │
│  │ Pages (routes) │──▶│ Services layer    │   │
│  │ (src/pages)    │   │ (src/services)    │   │
│  └───────────────┘   └─────────┬─────────┘   │
│                                  │ supabase-js │
└──────────────────────────────────┼────────────┘
                                    ▼
                    ┌───────────────────────────────┐
                    │ Supabase (managed)             │
                    │  • Postgres (RLS per-owner)    │
                    │  • Auth (email/password)       │
                    │  • Storage (`documents` bucket)│
                    │  • Edge Function: send-email   │
                    └───────────┬─────────────────────┘
                                 ▼
                          Resend (email API)
```

## Authentication & routing gate (`App.tsx`)

- `App.tsx` is the root. On mount it checks `VITE_SUPABASE_URL` validity (`configError` state) — if unset/placeholder, renders a "Configuration Required" screen instead of the app.
- Otherwise it calls `supabase.auth.getSession()` and subscribes to `onAuthStateChange`.
- **No session** → only `/` (LandingPage) and `/login` are routable; everything else redirects to `/`.
- **Session present** → full app inside `Layout` (Sidebar + Header + routed page), 12 routes total (see FOLDER_STRUCTURE.md).
- This is a simple but effective gate — there's no route-level permission/role system beyond "logged in or not" (the `User.role` field — Owner/Admin/Accountant/Manager — exists in `types.ts` but is **not used anywhere** for access control; it's purely a label, e.g. Sidebar hardcodes "Founder").

## Data-access pattern

There is **no repository/ORM abstraction**. Every page and service calls `supabase.from('table').select/insert/update/delete(...)` directly. This is consistent with a small Supabase-first app, but means:

- Column-name conventions (snake_case vs camelCase) are decided **per call site**, with no central source of truth — this is the root architectural cause of the bugs catalogued throughout this audit.
- `src/types.ts` exists as the "intended" snake_case contract but is not enforced — most `.select()`/`.insert()` calls use `any`-typed or loosely-typed payloads (`as any` casts are common, especially around `ActivityLogService.logActivity`).

## Layered structure (as implemented, not as intended)

1. **Pages** (`src/pages/*.tsx`) — own their own data fetching (`useEffect` + `supabase.from(...)`), local form state, and mutation handlers. Pages are large (Compliance.tsx ~1230 lines, CompanyProfile.tsx ~1960 lines) because they combine data-fetching, multiple modals/forms, and presentation in one file.
2. **Services** (`src/services/*.ts`) — partially extracted business logic:
   - `complianceEngine.ts` — template catalogue + generation/preview logic.
   - `complianceActions.ts` — "today's actions" aggregation (used by Dashboard widget).
   - `complianceScore.ts` — group health score.
   - `activityLogService.ts` — canonical audit log (snake_case contract).
   - `emailService.ts` / `notificationService.ts` — email-based reminders.
   - These services are inconsistently used: some pages call services, others duplicate logic inline or use the parallel `src/lib/activity.ts` logger.
3. **Lib** (`src/lib/*.ts`) — `supabase.ts` (client singleton), `utils.ts` (formatting helpers), and `activity.ts` (a **second**, incompatible activity-logging implementation — architectural duplication, see CODE_REVIEW.md).
4. **Components** (`src/components/*`) — `Layout`/`Sidebar`/`Header` (app shell), `SafeChart`/`StatusBadge`/`EmptyState` (generic UI), `companies/ComplianceSetupWizard` and `dashboard/*` (feature-specific composites).

## Client-side "automation" model

There is no server-side cron/scheduler. All "automated" behavior is **triggered by user page-loads**:

- `Dashboard.tsx` on mount: checks `localStorage['last_summary_'+userId]` — if not today, calls `NotificationService.sendDailySummary(userId)` (sends one email via the edge function if there are urgent items).
- Same mount: checks `sessionStorage['session_triggered_'+userId]` — if not yet this session, calls `NotificationService.processTriggers(userId)` (per-item "due tomorrow"/"overdue" emails).
- **Implication**: if a user doesn't open the Dashboard on a given day, no reminder emails go out that day — there is no guarantee of timely delivery. This is a structural limitation, not a bug, but should be called out clearly in FEATURES.md/DEVELOPMENT_ROADMAP.md as a candidate for a real scheduled job (Supabase Cron / pg_cron / external scheduler hitting the edge function).

## Compliance generation flow (as actually implemented)

```
Companies.tsx "Create Company"
  → INSERT companies (snake_case)
  → INSERT company_tax_profiles (snake_case names that may not match the
     is_vat_registered/is_paye_registered/is_uif_registered DB columns)
  → ComplianceEngine.generateComplianceForCompany(data, taxProfile)
       data.legalEntityType is undefined (insert was snake_case only)
       → typeMatch always false → 0 items generated, silently

  → opens ComplianceSetupWizard(newCompanyForWizard = data)
       IF user completes wizard:
         → ComplianceEngine.generateComplianceForCompany({...company, ...basicDetails, ...}, taxProfile)
              basicDetails has legalEntityType/incorporationDate/financialYearEnd (camelCase)
              → typeMatch now succeeds → items generated
              → BUT written with { companyId, dueDate, ... } (camelCase)
              → invisible to Dashboard/Compliance.tsx/complianceActions.ts/CompanyProfile.tsx
                 (all query company_id/due_date)
              → ActivityLogService.logActivity({ actionType: 'compliance_generated', ... })
                 actionType (camelCase) ≠ action_type (NOT NULL column) → insert fails silently
```

Net effect: the compliance-engine feature, as currently wired, **never produces compliance items that are visible anywhere in the UI** — regardless of which path the user takes. See BUG_REPORT.md for severity ranking and FEATURES.md for what this means for the "Compliance Automation" feature as documented vs. delivered.

## Print/export architecture

`ComplianceReport.tsx` and `Layout.tsx` both contain `print:` Tailwind classes (`print:h-auto`, `print:overflow-visible`, `print:p-0`), indicating the "Export Report" feature relies on the browser's native print-to-PDF rather than a server-side PDF generation step — consistent with there being no backend service to do this.
