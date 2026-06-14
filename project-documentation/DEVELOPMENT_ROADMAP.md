# Development Roadmap

This roadmap sequences the findings from BUG_REPORT.md, REFACTOR_PLAN.md, and FEATURES.md into phases. Each phase is scoped to be independently shippable/testable.

## Phase 0 — Pre-flight (before any code changes)
- [ ] Resolve the `landing-page/` deletion question with the user (LANDING_PAGE_STRATEGY.md) — does not block app fixes, but should be decided early so it doesn't surface mid-stream.
- [ ] Verify live Supabase schema against migrations — specifically confirm whether `company_tax_profiles` actually has `is_vat_registered`/`is_paye_registered`/`is_uif_registered` (BUG-05) and whether `company_bank_details` exists (BUG-21). This determines whether Phase 1 fixes touch the DB or only the app.
- [ ] Confirm `RESEND_API_KEY` / `FROM_EMAIL` secrets status for the `send-email` Edge Function (affects whether Phase 2 notification fixes are even testable end-to-end).

## Phase 1 — Critical correctness fixes (the "trust" issues)
Goal: every number/status shown in the UI reflects real data; core creation forms work.

1. **BUG-01**: Fix `complianceScore.ts` to select/use `due_date`/`company_id`. This alone makes the dashboard's health score meaningful.
2. **BUG-03**: Fix Compliance.tsx "New Compliance Entry" company-select binding (`formData.company_id`).
3. **BUG-04**: Fix Structure.tsx relationship-creation form binding (`parent_company_id`/`child_company_id`).
4. **BUG-05 + BUG-14**: Resolve `company_tax_profiles` column naming (decide: rename DB columns to drop `is_` prefix, or update the ~3 app call sites to use `is_`-prefixed names — recommend the latter, see REFACTOR_PLAN.md).
5. **BUG-02**: Fix `ComplianceEngine.generateComplianceForCompany`/`getPreview` to use `company_id`/`due_date` and a normalized snake_case company input (fix at both call sites: Companies.tsx initial creation, ComplianceSetupWizard.handleFinish).
6. **VAT template**: add a VAT201-equivalent template to `SouthAfricanComplianceTemplates` so the `vat_registered` flag (collected but currently dead) does something.

**Acceptance criteria for Phase 1**: create a new company end-to-end (creation form → tax profile → wizard) and confirm compliance items appear in the Compliance register, Today's Actions, CompanyProfile's compliance tab, and the health score reflects them.

## Phase 2 — Audit trail integrity
Goal: activity log accurately reflects what happens, with no silent insert failures.

1. **BUG-06**: Fix `complianceEngine.ts`/`complianceScore.ts` `actionType`/`companyId` → `action_type`/`company_id`.
2. **BUG-07**: Remove `src/lib/activity.ts`; migrate `Finance.tsx` to `ActivityLogService`, extending `ActionType` with `finance_created`/`finance_updated`/`finance_deleted`.
3. **BUG-08**: Add delete-specific `ActionType` values (`company_deleted`, `compliance_deleted`, `shareholder_removed`, `director_removed`, `beneficial_owner_removed`) and fix `Companies.tsx`/`Compliance.tsx`/`CompanyProfile.tsx`'s `logCompanyActivity` to use them.
4. Remove all `as any` casts on `logActivity` calls once `ActionType` covers every real usage — let `tsc --noEmit` (the existing `npm run lint`) catch any remaining mismatches.

**Acceptance criteria**: perform a full CRUD cycle (create/update/delete) on a company, compliance item, shareholder, and finance transaction; confirm each operation produces a correctly-labeled activity log entry.

## Phase 3 — Display/search consistency cleanup
Goal: every camelCase-compat-column read is replaced with the correct snake_case field.

1. **BUG-09**: Compliance Overview tab due-date display.
2. **BUG-10**: Header notification "Missing Documents" check.
3. **BUG-11**: Header global search registration-number field.
4. **BUG-12**: Header `companies!companyId` → `companies!company_id` joins.
5. **BUG-13**: Compliance modal document-link preview (`file_type`/`file_url`).

This phase is largely mechanical (search-and-replace of camelCase compat fields with snake_case equivalents) and can be done as one batch PR with a checklist derived from BUG_REPORT.md.

## Phase 4 — Schema consolidation (DB migration)
Goal: drop the dual-column schema once Phases 1-3 confirm no code paths rely on the camelCase compat columns.

1. Grep the entire `src/` for any remaining references to camelCase compat columns (`companyId`, `dueDate`, `legalEntityType`, `registrationNumber`, `linkedDocumentId`, `fileType`, `fileUrl`, `ownershipPercentage`, `parentCompanyId`, `childCompanyId`, `relationshipType`, `effectiveDate`, `createdAt`/`updatedAt` where a snake_case sibling exists).
2. Write a new migration dropping the now-unused camelCase columns from `companies`, `compliance`, `company_relationships`, `shareholders`/`directors`/`beneficial_owners`.
3. Confirm `company_bank_details` (BUG-21) — either add its CREATE TABLE migration (if it exists live) or remove the RLS-hardening reference (if it doesn't).

**This phase should be done last and only after Phases 1-3 are deployed and verified** — dropping columns is hard to reverse, and Phase 1-3 fixes are exactly what determines which columns are truly dead.

## Phase 5 — Polish / nice-to-haves
1. **BUG-15**: Remove or implement decorative UI (filter dropdown, "System Status", "Operational Readiness", hardcoded tax note).
2. **BUG-16**: Remove leftover `console.log`/`console.warn`.
3. **BUG-17/18**: Sidebar nav entries for `/structure`, `/finance`, `/activity`, `/compliance-report`, `/docs`; complete `pageTitles` map.
4. **BUG-19**: Rename/recompute Dashboard "Missing Documents" card (or add a second card for the actually-missing-required-documents metric from `complianceActions.ts`).
5. Remove unused dependencies (`express`, `resend`, `dotenv`, `@google/genai`, `@types/express`, `react-markdown`) and the dead `GEMINI_API_KEY`/`APP_URL` config from `.env.example`/`vite.config.ts`.
6. Extract duplicated `getStoragePath()` to `src/lib/`.

## Phase 6 — Architectural improvements (longer-term, optional)
1. Adopt Supabase generated types (`supabase gen types typescript`) as the canonical schema contract, replacing/augmenting hand-written `src/types.ts` — would have caught most Phase 1-3 issues at compile time.
2. Lazy-load `CompanyProfile.tsx` tab data (PERFORMANCE_AUDIT.md).
3. Consider a real scheduled job (Supabase Cron / pg_cron) for `NotificationService.sendDailySummary`/`processTriggers` instead of client-triggered (ARCHITECTURE.md).
4. Edge Function hardening for `send-email` (SECURITY_AUDIT.md).
5. Decide and execute landing-page strategy (LANDING_PAGE_STRATEGY.md).

## Suggested sequencing rationale

Phases 1-3 fix the product's **credibility** (numbers and forms that lie or fail). Phase 4 is a **cleanup** that's only safe once 1-3 prove what's actually dead. Phase 5 is **low-risk polish** that can be interleaved with 1-3 by a second contributor in parallel. Phase 6 is **investment** for future velocity and should be scheduled once the product is stable, not before.
