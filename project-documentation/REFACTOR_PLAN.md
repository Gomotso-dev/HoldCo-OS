# Refactor Plan

This is a **planning document only** — per the audit's constraints, no code has been changed, deleted, or refactored. Each item below specifies exact files/lines to touch and the recommended direction, so implementation can proceed directly from this plan.

## Guiding principle: pick ONE naming convention and enforce it

**Recommendation: snake_case**, because:
- `src/types.ts` (the existing, otherwise-correct domain model) is snake_case.
- The majority of pages/services (Compliance.tsx register/edit, complianceActions.ts, CompanyProfile.tsx ownership CRUD, activityLogService.ts) already use snake_case correctly.
- The camelCase columns were added *later* as compat shims — they are the anomaly, not the norm.

Every fix below follows from this: **camelCase reads/writes get changed to snake_case; camelCase compat columns get dropped (Phase 4) once nothing references them.**

## 1. `complianceScore.ts` (BUG-01)

```ts
// Current primary query:
.select('title, dueDate, status, priority, risk_level, required_documents, companyId')

// Change to:
.select('title, due_date, status, priority, risk_level, required_documents, company_id')
```
Remove the now-redundant fallback branch (the "fallback" query is what the primary query should have been all along) — OR keep both selects identical and remove the dead `try/fallback` structure entirely. Update `calculateFromItems` to read `item.due_date`/`item.company_id` directly (drop the `||` coalescing once only one casing exists).

## 2. `complianceEngine.ts` (BUG-02, BUG-05)

- `generateComplianceForCompany(company, taxProfile)` and `getPreview(company, taxProfile)`:
  - Change `template.applies_to_company_types.includes(company.legalEntityType)` → `company.legal_entity_type`.
  - Change `calculateDueDate(template, { registrationDate: company.incorporationDate, financialYearEnd: company.financialYearEnd })` → `company.incorporation_date`/`company.financial_year_end`.
  - Change the insert payload from `{ companyId, ..., dueDate, ... }` → `{ company_id, ..., due_date, ... }`.
  - Change the existing-items dedup query from `.select('title, dueDate').eq('companyId', company.id)` → `.select('title, due_date').eq('company_id', company.id)`.
  - Fix `ActivityLogService.logActivity({ actionType: 'compliance_generated' as any, ..., companyId: company.id, ... })` → `{ action_type: 'compliance_generated', ..., company_id: company.id, ... }` (drop `as any` once `ActionType` already includes `'compliance_generated'` — it does).
  - For `taxProfile` flag checks: align with whichever resolution is chosen for item 4 below (`is_vat_registered` etc. vs `vat_registered`).
  - Add a VAT201-equivalent template to `SouthAfricanComplianceTemplates` so `template.name.includes('VAT')` has a match.

- `Companies.tsx` (`handleSubmit`): the call `ComplianceEngine.generateComplianceForCompany({...company, ...basicDetails, legal_entity_type: ..., ...} as any, taxProfile)` pattern from `ComplianceSetupWizard` should be the model — but simplify: since `complianceEngine.ts` will now expect `legal_entity_type`/`incorporation_date`/`financial_year_end` (which `Companies.tsx`'s insert payload already has natively, snake_case), the `...basicDetails` spread workaround becomes unnecessary — just pass `data` (the insert result) directly, no `as any`.

- `ComplianceSetupWizard.tsx`:
  - `getPreview()` call (step 3 useEffect) and `handleFinish()`'s `generateComplianceForCompany()` call should both pass the **same** normalized object — extract a small local helper `buildCompanyPayload()` that merges `company` + `basicDetails` into one snake_case shape, used by both.

## 3. `company_tax_profiles` naming (BUG-05, BUG-14)

Two options — **recommend Option A** (smaller diff, DB already has `is_` prefix per migration):

**Option A** — update app code to use `is_vat_registered`/`is_paye_registered`/`is_uif_registered`:
- `Companies.tsx` insert payload for `company_tax_profiles`.
- `ComplianceSetupWizard.tsx` read (`data.vat_registered` → `data.is_vat_registered`, etc.) and write (update payload).
- `complianceEngine.ts` flag checks (`taxProfile.vat_registered` → `taxProfile.is_vat_registered`, etc.)

**Option B** — new migration renaming DB columns to drop `is_` prefix (touches live schema, requires a migration + redeploy, higher risk). Only choose this if there's a strong external reason (e.g., another system already depends on the `is_`-prefixed names — unlikely given the app is the only consumer found).

## 4. `Compliance.tsx` create/edit modal (BUG-03, BUG-09, BUG-13)

- "Selected Entity" `<select>`: change `value={formData.companyId}` → `value={formData.company_id}`, and `onChange={e => setFormData({...formData, companyId: e.target.value})}` → `company_id: e.target.value`.
- Overview tab "Urgent Compliance Items": `formatDate(item.dueDate)` → `formatDate(item.due_date)`.
- Document-link preview: `linkedDoc.fileType`/`linkedDoc.fileUrl` → `linkedDoc.file_type`/`linkedDoc.file_url`.
- `confirmDelete()`: `action_type: 'compliance_updated'` → new `'compliance_deleted'` (add to `ActionType` union first, item 7 below).

## 5. `Structure.tsx` relationship form (BUG-04)

- `relForm.parentCompanyId`/`childCompanyId` → `relForm.parent_company_id`/`child_company_id`, matching `company_relationships`' snake_case columns, throughout the form state, `<select>` bindings, and insert payload.

## 6. `Header.tsx` (BUG-10, BUG-11, BUG-12)

- Notification fetch: `companies!companyId` → `companies!company_id`; `isMissingDocs` check `!item.linkedDocumentId` → `!item.linked_document_id`.
- Global search: `.or('name.ilike...,registrationNumber.ilike...')` → `.or('name.ilike...,registration_number.ilike...')`; result rendering `c.registrationNumber` → `c.registration_number`.
- Search joins: `companies!companyId` → `companies!company_id` (compliance/document search).

## 7. Activity log consolidation (BUG-06, BUG-07, BUG-08)

- `src/services/activityLogService.ts`: extend `ActionType` union with:
  ```ts
  | 'finance_created' | 'finance_updated' | 'finance_deleted'
  | 'company_deleted' | 'compliance_deleted'
  | 'shareholder_removed' | 'director_removed' | 'beneficial_owner_removed'
  ```
- Delete `src/lib/activity.ts` entirely.
- `Finance.tsx`: replace its `lib/activity.ts`-based `logActivity({action_type, description, company_id})` calls with `ActivityLogService.logActivity({ action_type: 'finance_created'|'finance_updated'|'finance_deleted', description, company_id })` (no `as any` needed once the union includes these).
- `CompanyProfile.tsx`'s `logCompanyActivity` helper: change its 2-way `eventType === 'create' ? 'company_created' : 'company_updated'` to a 3-way switch handling `'delete'` → `'company_deleted'` (or the entity-specific `*_removed` types for shareholder/director/beneficial-owner deletes — pass an explicit `actionType` override param to `logCompanyActivity` for these three call sites rather than relying on the generic mapping).
- `Companies.tsx`'s `confirmDelete()`: `'company_updated' as any` → `'company_deleted'`.
- `complianceScore.ts`: `actionType: 'score_calculated' as any` → `action_type: 'score_calculated'` (already in `ActionType`).
- After all of the above, grep for `as any` near `logActivity` calls — any remaining instance indicates a still-unmapped case that needs a union addition, not a cast.

## 8. Dead code / dependency removal (Phase 5 items)

- `package.json`: remove `express`, `resend`, `dotenv`, `@google/genai`, `react-markdown` (deps) and `@types/express` (devDep). Run `npm install` after to regenerate lockfile.
- `.env.example`: remove `GEMINI_API_KEY`/`APP_URL` block.
- `vite.config.ts`: remove the `define: { 'process.env.GEMINI_API_KEY': ... }` block.
- `firebase-blueprint.json`: confirm with user whether Firebase is a real deployment target; if not, remove.
- Debug logging: remove `console.log`/`console.warn` from `ComplianceScoreCard.tsx` (lines 19, 21, 24, 31, 43) and `TodaysActionPanel.tsx` (lines 28, 32).

## 9. Duplicated helper extraction

- `getStoragePath()` (duplicated in `Documents.tsx` and `CompanyProfile.tsx`) → move to `src/lib/storage.ts`, import in both.

## 10. Schema migration (Phase 4 — after all above verified in production)

New migration `supabase/migrations/<date>_drop_camelcase_compat_columns.sql`:
```sql
-- Run only after grep confirms zero references to these columns in src/
ALTER TABLE companies DROP COLUMN IF EXISTS "legalEntityType", DROP COLUMN IF EXISTS "groupRole",
  DROP COLUMN IF EXISTS "registrationNumber", DROP COLUMN IF EXISTS "incorporationDate",
  DROP COLUMN IF EXISTS "financialYearEnd", DROP COLUMN IF EXISTS "createdAt", DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE compliance DROP COLUMN IF EXISTS "companyId", DROP COLUMN IF EXISTS "dueDate",
  DROP COLUMN IF EXISTS "linkedDocumentId", DROP COLUMN IF EXISTS "createdAt", DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE company_relationships DROP COLUMN IF EXISTS "parentCompanyId", DROP COLUMN IF EXISTS "childCompanyId",
  DROP COLUMN IF EXISTS "ownershipPercentage", DROP COLUMN IF EXISTS "relationshipType",
  DROP COLUMN IF EXISTS "effectiveDate", DROP COLUMN IF EXISTS "createdAt", DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE shareholders DROP COLUMN IF EXISTS "ownershipPercentage", DROP COLUMN IF EXISTS "shareClass",
  DROP COLUMN IF EXISTS "issueDate", DROP COLUMN IF EXISTS "createdAt", DROP COLUMN IF EXISTS "updatedAt";

-- directors/beneficial_owners: similar, per actual compat columns present (verify against live schema first)
```
Resolve `company_bank_details` (BUG-21) before/alongside this migration — either document its CREATE TABLE (if it exists live) or remove the dead RLS-hardening reference.

## Explicitly out of scope for this refactor plan

- No framework changes (React/Vite/Supabase stack stays).
- No new abstractions (no ORM, no new state-management library) — the existing services-layer pattern is adequate once the naming issues are fixed.
- No landing-page work (LANDING_PAGE_STRATEGY.md is separate).
- No new features — this plan is entirely about making existing, already-built features actually work and produce accurate data.
