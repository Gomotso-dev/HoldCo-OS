# Folder Structure

## Top-level layout

```
HoldCo-OS/
├── src/                          # React application source
│   ├── components/               # Shared/reusable UI
│   │   ├── companies/            # Company-specific composite components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── ui/                   # (deleted in working tree — see note below)
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── SafeChart.tsx
│   │   ├── StatusBadge.tsx
│   │   └── EmptyState.tsx
│   ├── pages/                    # Route-level page components (one per route)
│   ├── services/                 # Data-access / business-logic layer (Supabase calls)
│   ├── lib/                      # Low-level utilities (supabase client, cn/formatters, legacy activity logger)
│   ├── types.ts                  # Shared TypeScript domain types
│   ├── App.tsx                   # Router + auth gate
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind entry
├── supabase/
│   ├── migrations/                # SQL migration history (8 files, all dated 2024-04/05)
│   └── functions/send-email/      # Deno edge function (Resend integration)
├── landing-page/                 # SEPARATE Vite/React project (marketing site) — currently deleted in working tree
├── Doc/                           # Pre-existing hand-written docs (DOCUMENTATION.md, TECHNICAL_SPEC.md, etc.)
├── project-documentation/        # THIS audit's output (new)
├── .env.example
├── package.json
├── vite.config.ts
├── tsconfig.json
└── firebase-blueprint.json       # Leftover from a different deployment target (unused)
```

## Note on `landing-page/` and `src/components/ui/*`

The git status at the start of this audit shows the entire `landing-page/` project and `src/components/ui/*` (shadcn/ui primitives — accordion, dialog, dropdown-menu, etc.) as **deleted** in the working tree (not yet committed). This audit treats the **main app (`src/`)** as the subject of review. If `src/components/ui/*` was deleted, any remaining imports from those paths in `src/components` or `src/pages` would currently break the build — this should be checked before any further work (see BUG_REPORT.md).

## `src/pages/` — one file per route

| File | Route | Purpose |
|---|---|---|
| `LandingPage.tsx` | `/` (unauthenticated) | Marketing/landing screen shown when no session |
| `Login.tsx` | `/login` | Supabase auth |
| `Dashboard.tsx` | `/` (authenticated) | KPI cards, charts, recent activity, today's actions |
| `Companies.tsx` | `/companies` | Company list, create/edit/delete, launches setup wizard |
| `CompanyProfile.tsx` | `/companies/:id` | Tabbed company detail (Overview, Documents, Finance, Activity, Ownership, Compliance, Legal & Tax) |
| `Structure.tsx` | `/structure` | Group ownership structure / relationships |
| `Documents.tsx` | `/documents` | Document vault (upload/list/download via Supabase Storage) |
| `Compliance.tsx` | `/compliance` | Compliance register, calendar, category tabs |
| `Finance.tsx` | `/finance` | Financial transactions across companies |
| `Activity.tsx` | `/activity` | Full audit trail |
| `Settings.tsx` | `/settings` | User/account settings |
| `Documentation.tsx` | `/docs` | In-app docs/help |
| `ComplianceReport.tsx` | `/compliance-report` | Printable/exportable compliance report |

**Not in `Sidebar.tsx` nav** (reachable only by direct URL or in-page link): `/structure`, `/finance`, `/activity`, `/compliance-report`, `/docs`.

## `src/services/` — data-access layer

| File | Responsibility |
|---|---|
| `complianceEngine.ts` | South African compliance template catalogue + auto-generation of compliance items per company |
| `complianceActions.ts` | "Today's actions" aggregation for dashboard widget |
| `complianceScore.ts` | Group-wide compliance health score (0–100) |
| `activityLogService.ts` | Canonical audit-log writer/reader (snake_case `action_type`/`company_id` contract) |
| `emailService.ts` | Wrapper around the `send-email` Supabase Edge Function |
| `notificationService.ts` | Client-triggered daily summary + urgent-deadline email alerts |

## `src/lib/`

| File | Responsibility |
|---|---|
| `supabase.ts` | Supabase client singleton + `isSupabaseConfigured` flag |
| `utils.ts` | `cn()`, `formatCurrency()`, `formatDate()`, `formatRelativeTime()` |
| `activity.ts` | **Second, parallel** activity-logging implementation (`logActivity({eventType, entityType, entityId, ...})`) — see CODE_REVIEW.md / BUG_REPORT.md for the duplication issue |

## `supabase/migrations/`

8 files, all applied 2024-04 to 2024-05, in this order:

1. `20240422_schema_standardization.sql`
2. `20240422_security_hardening.sql`
3. `20240502_compliance_engine.sql`
4. `20240502_create_company_relationships.sql`
5. `20240502_final_camelcase_alignment.sql`
6. `20240502_fix_companies_columns.sql`
7. `20240502_fix_ownership_schema.sql`
8. `20240502_harden_rls_all.sql`

The naming and content of the last 5 migrations (all "fix"/"final"/"harden") show a project that was iteratively patched to reconcile a camelCase-vs-snake_case schema conflict — see DATABASE.md for the full story.
