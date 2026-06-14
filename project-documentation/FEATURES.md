# Features — As Built vs. As Intended

Each feature is rated: ✅ Works as intended, ⚠️ Partially works / works with caveats, ❌ Broken / non-functional, 🎨 Cosmetic only (UI present, no real logic behind it).

## 1. Authentication
- ✅ Email/password login via Supabase Auth (`Login.tsx`, `App.tsx` session gate).
- Single role concept (`User.role`) exists in `types.ts` but is not used for any access control — all authenticated users have identical capabilities, scoped only by `owner_id` row ownership.

## 2. Company Management (`/companies`, `/companies/:id`)
- ✅ Create / list / edit / delete companies — core CRUD against `companies` table works (snake_case throughout).
- ⚠️ "Filter" button and "All Statuses" dropdown on the company list are present but **non-functional** (no `onClick`/`onChange`) — 🎨 cosmetic. Dropdown also omits the "Closed" status option despite it being a valid `CompanyStatus`.
- ⚠️ "+ Show advanced details" uses direct DOM manipulation instead of React state — functional but anti-pattern.
- ❌ Company creation **silently fails to generate any compliance items** (see Compliance Automation below) unless the user immediately completes the setup wizard — and even then, the items are invisible to the rest of the app.
- ❌ Delete-company activity log entry is mislabeled `action_type: 'company_updated'` instead of a delete-specific type.

## 3. Compliance Setup Wizard (`ComplianceSetupWizard.tsx`)
- ⚠️ 4-step wizard (Basic Details → Tax Questions → Preview Roadmap → Success) is fully built and navigable.
- ⚠️ Step 3 "Preview Roadmap" can show a **different result** than what `handleFinish()` actually generates, due to an inconsistency in which fields are spread into the `company` object passed to `ComplianceEngine` (see ARCHITECTURE.md).
- ❌ On finish, generated compliance items are written with camelCase `companyId`/`dueDate` — invisible everywhere else in the app (Dashboard, Compliance register, CompanyProfile compliance tab, "Today's Actions").
- ❌ The "Generated N compliance items" activity-log entry fails silently (camelCase `actionType`/`companyId` params vs. NOT NULL `action_type` column).

## 4. Compliance Automation Engine (`complianceEngine.ts`)
- 🎯 **Intended**: based on company legal type + tax registrations, auto-generate a roadmap of SA regulatory deadlines (CIPC Annual Return, Provisional Tax, ITR14, EMP201, UIF Declaration) with due dates calculated from incorporation date / financial year end.
- ❌ **As built**: never produces items visible in the UI through any normal user flow (see ARCHITECTURE.md for the full trace).
- ❌ VAT-registered companies get **no VAT-specific compliance item** — `vat_registered` flag is collected in the wizard but `template.name.includes('VAT')` never matches any of the 5 templates (none mention "VAT") — so the flag is dead code, and there's no VAT201 template at all.
- ❌ Possible additional failure: `company_tax_profiles` columns are `is_vat_registered`/`is_paye_registered`/`is_uif_registered` per migration, but all read/write code uses `vat_registered`/`paye_registered`/`uif_registered` — if this causes a DB error, `taxProfile` would never load correctly either.

## 5. Compliance Register (`/compliance`)
- ✅ Register table (desktop + mobile), category tabs (SARS/CIPC/Labour/POPIA), calendar view — well-built and functional for items that exist with snake_case `due_date`/`company_id`.
- ✅ Edit and delete of existing items work correctly (snake_case payloads).
- ❌ **"New Compliance Entry" creation is fundamentally broken**: the "Selected Entity" `<select>` is bound to `formData.companyId` (a property that doesn't exist on `initialFormState`, which defines `company_id`). The dropdown is always blank/unselectable. If the page is in "All Entities" view, `formData.company_id` defaults to `''`, and submitting inserts `company_id: ''` into a UUID FK column — almost certainly a Postgres error surfaced via `setError(err.message)`. If in "Single Entity" view, the pre-filled `company_id` is used (works) but the user cannot change which company the item belongs to.
- ⚠️ Overview tab's "Urgent Compliance Items" list always shows due date "N/A" (`item.dueDate` is read but the data has `due_date`). Register tab is unaffected (uses `item.due_date` correctly).
- ⚠️ Document-link preview in the modal references `linkedDoc.fileType`/`linkedDoc.fileUrl` (camelCase, never populated) — always shows generic "FILE" label, view/download button never renders.
- ❌ Delete confirmation logs `action_type: 'compliance_updated'` for a delete — mislabeled (recurring pattern).

## 6. Compliance Health Score (`ComplianceScoreCard`, `complianceScore.ts`)
- 🎯 **Intended**: 0–100 score with label (Healthy/Needs Attention/At Risk/Critical) based on overdue/due-soon/missing-document counts.
- ❌ **As built**: the primary query selects `dueDate, companyId` (camelCase, always NULL for normally-created items) and never selects `due_date`/`company_id` in that same query — every item's `dueDateStr` resolves to `undefined`, so the per-item scoring loop's early-return (`if (!dueDateStr) return;`) skips **every item**. With `items.length > 0` but the loop doing nothing, the score stays at the initial 100 and the label is always **"Healthy"**, regardless of actual overdue/at-risk state.
- ❌ The score-calculated activity log entry also fails silently (`actionType` vs `action_type`).
- This is one of the most consequential bugs in the app: the headline "compliance health" indicator on the dashboard is **always green**, even when items are overdue.

## 7. Today's Actions widget (`TodaysActionPanel`, `complianceActions.ts`)
- ✅ Queries snake_case `compliance` table correctly; computes urgency/document-readiness.
- ✅ "Mark Complete" updates status and logs activity correctly (proper snake_case `action_type`).
- ⚠️ Will never show items generated via the wizard's camelCase write path (same root cause as #4/#5).

## 8. Document Vault (`/documents`)
- ✅ Upload to Supabase Storage `documents` bucket, list, download via signed URL — snake_case throughout, appears functionally correct (per prior session's read).
- ⚠️ Documents linked from Compliance items can't show file-type/URL preview due to camelCase compat-column mismatch (see #5).

## 9. Group Structure (`/structure`)
- ❌ Per prior-session findings: the relationship-creation form binds to `relForm.parentCompanyId`/`childCompanyId` (camelCase) while the table/insert expects `parent_company_id`/`child_company_id` — same categorical broken-form pattern as Compliance's "New Compliance Entry".

## 10. Finance Tracker (`/finance`, Finance tab in CompanyProfile)
- ✅ CompanyProfile's finance tab (income/expense/net-flow summary cards, transaction list) renders correctly from `financeTransactions` (snake_case `type`/`amount`/`payment_method`/`date`).
- ❌ Per prior-session findings, `Finance.tsx`'s activity-logging calls go through `src/lib/activity.ts` with a parameter shape (`action_type`/`description`/`company_id`, values like `'finance_created'`) that doesn't match that file's actual `logActivity({eventType, entityType, entityId, ...})` signature or its `ActivityType` union — likely a type error and a silent runtime no-op/failure for all finance create/update/delete logging.

## 11. Activity Log (`/activity`, Activity tab in CompanyProfile)
- ✅ Displays `activity_log` entries correctly where they exist, with per-`entity_type` icons.
- ⚠️ Dashboard's recent-activity icon mapping only covers 5 of ~17 `ActionType` values; everything else gets a generic gray icon — minor, cosmetic.
- ⚠️ Many activity entries that *should* exist are missing or mislabeled due to the issues above (compliance_generated, score_calculated, finance_*, deletions logged as `*_updated`).

## 12. Notifications / Email Reminders (`NotificationService`, `EmailService`, edge function)
- ✅ Code path is complete: Dashboard trigger → `NotificationService` → `EmailService.sendEmail` → `send-email` edge function → Resend (or dev-mode console log if `RESEND_API_KEY` unset).
- ⚠️ **Architectural limitation, not a bug**: entirely client-triggered (see ARCHITECTURE.md) — no guaranteed daily delivery if the user doesn't visit the Dashboard.
- ⚠️ `processTriggers` only checks `days_until_due === 1` and `=== -1` exactly — an item that's 2+ days overdue when first seen never triggers an "overdue" email (only items that were "due tomorrow" yesterday and are now exactly 1-day overdue get one cycle of alert).

## 13. Reports (`/compliance-report`)
- ✅ Reachable via Dashboard's "Export Report" link (functional) despite not being in Sidebar nav.
- Relies on browser print-to-PDF (print-specific Tailwind classes present).

## 14. Settings (`/settings`)
- 🎨 Per prior session: "Operational Readiness" section is decorative/fake (matches the Header's "System Status" button — always green, no real check).

## 15. Global Search & Notifications Bell (Header.tsx)
- ❌ Notification bell's "Missing Documents" check (`!item.linkedDocumentId`) is always true for normally-created items (camelCase column never populated) — over-triggers false "missing document" alerts.
- ❌ Global search for companies by registration number always returns nothing (`registrationNumber` camelCase column always NULL).
- ⚠️ Compliance/document search results use `companies!companyId` join (camelCase FK) — returns NULL company names for normally-created compliance rows.

## Summary table

| # | Feature | Status |
|---|---|---|
| 1 | Authentication | ✅ |
| 2 | Company CRUD | ⚠️ (filters cosmetic, activity mislabels) |
| 3 | Compliance Setup Wizard | ❌ (generation invisible) |
| 4 | Compliance Automation Engine | ❌ (never produces visible output; VAT dead) |
| 5 | Compliance Register | ⚠️/❌ (create broken, overview N/A dates) |
| 6 | Compliance Health Score | ❌ (always "Healthy") |
| 7 | Today's Actions | ✅ (for snake_case items only) |
| 8 | Document Vault | ✅ |
| 9 | Group Structure | ❌ (create form broken) |
| 10 | Finance Tracker | ⚠️ (display ok, activity logging broken) |
| 11 | Activity Log | ⚠️ (incomplete due to upstream failures) |
| 12 | Email Notifications | ⚠️ (works, but client-triggered only) |
| 13 | Compliance Report export | ✅ |
| 14 | Settings | 🎨 (partially decorative) |
| 15 | Global Search / Notification Bell | ❌ |
