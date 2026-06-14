# Database

Postgres via Supabase. Schema assembled from 8 migration files (no single canonical schema dump exists). This document reconstructs the **effective** schema as of the last migration and highlights the dual-naming-convention problem that dominates this audit's findings.

## The core problem: dual camelCase/snake_case columns

The schema evolved in (at least) two passes:

1. An original snake_case schema (`legal_entity_type`, `company_id`, `due_date`, `ownership_percentage`, etc.) — this matches `src/types.ts` and most service/page code.
2. A later set of migrations (`20240502_final_camelcase_alignment.sql`, `20240502_create_company_relationships.sql`, `20240502_fix_ownership_schema.sql`) added **parallel camelCase columns** (`legalEntityType`, `companyId`, `dueDate`, `ownershipPercentage`, etc.) to the same tables — apparently to satisfy code (notably `ComplianceEngine` and `ComplianceScoreService`) that was written against camelCase.

The result: most core tables now have **two columns storing conceptually the same value**, only one of which any given write path populates. Read paths are split roughly 70/30 between snake_case and camelCase, causing the cross-cutting bugs catalogued in BUG_REPORT.md.

## Table-by-table

### `companies`
- Core (snake_case, populated by `Companies.tsx` inserts and `CompanyProfile.tsx` edits): `id`, `name`, `trading_name`, `legal_entity_type`, `group_role`, `registration_number`, `incorporation_date`, `tax_number`, `vat_number`, `paye_number`, `uif_number`, `industry`, `financial_year_end`, `status`, `notes`, `owner_id`, `created_at`, `updated_at`.
- Compat camelCase columns added by `20240502_final_camelcase_alignment.sql`: `legalEntityType`, `groupRole`, `registrationNumber`, `incorporationDate`, `financialYearEnd`, `createdAt`, `updatedAt`. A **one-time backfill `UPDATE ... WHERE "legalEntityType" IS NULL`** populated these for rows that existed at migration time only — no trigger, so every company created afterward has these columns **permanently NULL** unless the app explicitly writes them (it doesn't, except transiently inside `ComplianceSetupWizard`'s in-memory object — never persisted back to `companies`).
- RLS: `FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)` (re-applied by `20240502_harden_rls_all.sql`).

### `compliance`
- Core (snake_case, used by `Compliance.tsx`, `complianceActions.ts`, `CompanyProfile.tsx`, `ComplianceReport.tsx`): `id`, `company_id`, `category`, `type`, `title`, `due_date`, `reminder_date`, `priority`, `status`, `required_documents`, `linked_document_id`, `notes`, `owner_id`, `created_at`, `updated_at`.
- Compat camelCase columns (from `20240502_compliance_engine.sql` / alignment migration): `companyId`, `dueDate`, `linkedDocumentId`, plus likely `createdAt`/`updatedAt`.
- **`ComplianceEngine.generateComplianceForCompany()`** (the auto-generation service) writes ONLY the camelCase shape: `{ companyId, dueDate, ... }` — these rows are invisible to every snake_case `.eq('company_id', ...)` / `.order('due_date')` query used elsewhere in the app.
- **`ComplianceScoreService`** reads `dueDate, companyId` (camelCase) as its primary query — for normally-created (snake_case) rows these are NULL, causing the score calculation to silently process zero items (see BUG_REPORT.md #1).
- RLS hardened via the same `FOR ALL USING/WITH CHECK (auth.uid()=owner_id)` pattern.

### `company_tax_profiles`
- Created by `20240502_compliance_engine.sql` with columns `is_vat_registered`, `is_paye_registered`, `is_uif_registered`, `has_employees`, plus `company_id`, `owner_id`.
- **App code (`Companies.tsx` insert, `ComplianceSetupWizard.tsx` read/write, `ComplianceEngine` flag checks) uses `vat_registered`, `paye_registered`, `uif_registered`** — i.e. WITHOUT the `is_` prefix. **CONFIRMED via grep**: the migration only ever defines `is_vat_registered`/`is_paye_registered`/`is_uif_registered`; no migration adds bare `vat_registered`/`paye_registered`/`uif_registered`. Either:
  - these inserts/selects fail outright (Postgres error: column does not exist) — caught by try/catch and silently swallowed in most call sites, or
  - (less likely) Supabase's PostgREST silently drops unknown keys on insert (it does not — unknown columns in an insert payload cause an error).
  This is a **separate, additional confirmed naming mismatch** beyond the camelCase/snake_case issue — see BUG_REPORT.md.

### `shareholders`, `directors`, `beneficial_owners`
- snake_case core columns matching `src/types.ts` (`company_id`, `ownership_percentage`, `share_class`, `issue_date`, `full_name`, `role_title`, `appointment_date`, `control_type`, `effective_date`, `status`).
- `20240502_fix_ownership_schema.sql` added `created_at`/`updated_at`/`createdAt`/`updatedAt` and altered some camelCase compat column types (`ownershipPercentage`, `shareClass`, `issueDate`).
- `CompanyProfile.tsx`'s shareholder/director/beneficial-owner CRUD reads/writes the snake_case columns consistently — **this is the one ownership-data path that appears to function correctly end-to-end**.
- RLS: `FOR ALL USING (...) WITH CHECK (...)` per-table.

### `company_relationships`
- Added by `20240502_create_company_relationships.sql`. Both snake_case (`parent_company_id`, `child_company_id`, `ownership_percentage`, `relationship_type`, `effective_date`) and camelCase compat (`parentCompanyId`, `childCompanyId`, `ownershipPercentage`, `relationshipType`, `effectiveDate`, `createdAt`, `updatedAt`).
- `Structure.tsx` (per prior-session findings) binds its create form to `relForm.parentCompanyId`/`childCompanyId` (camelCase) — same categorical bug as `Compliance.tsx`'s `formData.companyId`.
- RLS: `FOR ALL USING (auth.uid()=owner_id) WITH CHECK (...)`. Indexes on parent/child/owner FK columns.

### `documents`
- snake_case core (`company_id`, `category`, `title`, `file_url`, `file_type`, `version_number`, `issue_date`, `expiry_date`, `uploaded_by`, `notes`, `created_at`) matches `src/types.ts` `Document` interface and `Documents.tsx`'s insert payloads.
- Compat camelCase columns (`fileUrl`, `fileType`, `companyId`, `linkedDocumentId`-style references from other tables) exist but are never populated by `Documents.tsx` — they are read by `Compliance.tsx`'s document-link preview (`linkedDoc.fileType`/`linkedDoc.fileUrl`) and Header.tsx's search results, both of which therefore always fail to render the linked file info (see BUG_REPORT.md).

### `finance` (financial transactions)
- snake_case columns matching `FinanceTransaction` type (`company_id`, `related_company_id`, `intercompany`, `compliance`, `date`, `type`, `category`, `amount`, `description`, `payment_method`, `counterparty`, `reference_number`, `linked_document_id`, `notes`, `owner_id`, `created_at`).
- RLS hardened by `20240502_harden_rls_all.sql`.

### `activity_log`
- Columns per `src/types.ts`/`activityLogService.ts`: `id`, `owner_id`, `company_id`, `compliance_id`, `document_id`, `action_type` (NOT NULL), `description`, `metadata`, `created_at`. Joined to `companies` via `companies!company_id`.
- **`action_type` is NOT NULL** — any insert where the caller passes `actionType` (camelCase) instead of `action_type` results in `params.action_type === undefined`, and the resulting Postgres insert error is caught and logged via `console.error` only (silent failure from the user's perspective). This affects: `ComplianceEngine.generateComplianceForCompany()` (`actionType: 'compliance_generated'`), `ComplianceScoreService.calculateFromItems()` (`actionType: 'score_calculated'`), and (per prior session) `Finance.tsx`'s calls via `src/lib/activity.ts`'s mismatched signature.

### `company_bank_details`
- Referenced only inside `20240502_harden_rls_all.sql`'s RLS-hardening loop (which checks `information_schema.tables` before applying policy, so it degrades gracefully if absent). **No `CREATE TABLE company_bank_details` migration exists in the repo.** Either the table was created manually/out-of-band in the live Supabase project, or this is a dead reference that will simply no-op. No application code references `company_bank_details` at all.

## Row-Level Security summary

Every core table (`companies`, `compliance`, `documents`, `finance`, `company_tax_profiles`, `company_bank_details`, `shareholders`, `directors`, `beneficial_owners`, `company_relationships`, `activity_log`) follows the same pattern:

```sql
CREATE POLICY ... ON <table>
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

This is a sound, simple multi-tenant isolation model — every row is scoped to its creating user via `owner_id`, and policies were defensively re-applied multiple times (`20240502_harden_rls_all.sql` loops over tables checking `information_schema.tables` first). No table-level RLS gaps were found. See SECURITY_AUDIT.md for row-level vs. column-level considerations.

## Net effect / recommendation preview

The dual-column approach was clearly an attempt to "fix" PostgREST/column-name errors without picking one convention and migrating all call sites. It has not solved the underlying inconsistency — it has doubled the schema surface area and created multiple silent-failure paths. REFACTOR_PLAN.md proposes a single-convention consolidation (standardize on snake_case, since it's the majority convention and matches `src/types.ts`) with a real backfill + drop of the unused compat columns.
