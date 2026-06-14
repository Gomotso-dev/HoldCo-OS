# API Documentation

HoldCo OS has **no custom REST/GraphQL API**. All data access goes through the Supabase auto-generated PostgREST API via `@supabase/supabase-js`, governed by RLS policies (see DATABASE.md). The only custom server-side code is a single Edge Function.

## Edge Function: `send-email`

**Path**: `supabase/functions/send-email/index.ts` (Deno runtime, deployed as a Supabase Edge Function)

**Invocation**: `supabase.functions.invoke('send-email', { body: payload })` from `EmailService.sendEmail()`.

### Request body
```ts
{
  to: string;       // recipient email
  subject: string;
  html: string;
  text?: string;
}
```

### Behavior
1. Handles CORS preflight (`OPTIONS`) with permissive `Access-Control-Allow-Origin: *`.
2. Validates `to`, `subject`, and (`html` or `text`) are present — 400 if missing.
3. If `RESEND_API_KEY` env/secret is **not set**: logs to console and returns `{ success: true, message: 'Dev mode: Email logged to console' }` (200) — no email actually sent.
4. Otherwise POSTs to `https://api.resend.com/emails` with `Authorization: Bearer ${RESEND_API_KEY}`, `from: FROM_EMAIL` (default `onboarding@resend.dev`), `to: [to]`, `subject`, `html` (or `text` as fallback), `text` (or `subject` as fallback).
5. Returns Resend's response on success (200) or its error (status passthrough) or a 500 with `error.message` on exception.

### Callers
- `EmailService.sendEmail()` (`src/services/emailService.ts`) — thin wrapper, falls back to `console.group`-based "mock" logging if `isSupabaseConfigured` is false or the invoke throws.
- `NotificationService.sendDailySummary()` / `processTriggers()` / `sendUrgentAlert()` — build subject/html/text and call `EmailService.sendEmail()`.

### Operational notes
- Requires `RESEND_API_KEY` (and optionally `FROM_EMAIL`) to be set as **Supabase secrets** for real delivery — cannot be confirmed from the repo whether this has been configured in the live project.
- CORS is wide open (`*`) — acceptable for a function only invoked by the app's own Supabase client with the anon key, but note this function performs **no authentication check** of its own (anyone with the function URL + anon key, or even without, depending on Edge Function auth settings, could trigger an email send if reachable directly). See SECURITY_AUDIT.md.

## Supabase REST (PostgREST) — tables accessed from the client

All access is via `supabase.from('<table>').select/insert/update/delete()`. There is no OpenAPI spec generated/checked into the repo. Below is the de-facto contract per table as exercised by the app (column-naming caveats per DATABASE.md apply):

| Table | Read by | Written by | Key columns used |
|---|---|---|---|
| `companies` | Companies.tsx, CompanyProfile.tsx, Dashboard.tsx, Header.tsx search | Companies.tsx (insert/update/delete), CompanyProfile.tsx (update) | `id, name, trading_name, legal_entity_type, group_role, registration_number, incorporation_date, tax_number, vat_number, paye_number, uif_number, industry, financial_year_end, status, notes, owner_id` |
| `company_tax_profiles` | ComplianceSetupWizard.tsx | Companies.tsx (insert), ComplianceSetupWizard.tsx (update) | `company_id, owner_id, vat_registered*, paye_registered*, uif_registered*, has_employees` (*column-name mismatch, see DATABASE.md) |
| `compliance` | Compliance.tsx, complianceActions.ts, complianceScore.ts, CompanyProfile.tsx, Header.tsx, Dashboard.tsx, ComplianceReport.tsx | Compliance.tsx (insert/update/delete), ComplianceEngine (insert), TodaysActionPanel (update status) | `id, company_id, category, type, title, due_date, reminder_date, priority, status, required_documents, linked_document_id, notes, owner_id` |
| `company_relationships` | Structure.tsx | Structure.tsx | `id, parent_company_id, child_company_id, ownership_percentage, relationship_type, effective_date, notes, owner_id` |
| `shareholders` / `directors` / `beneficial_owners` | CompanyProfile.tsx | CompanyProfile.tsx | per `src/types.ts` (`Shareholder`, `Director`, `BeneficialOwner`) |
| `documents` | Documents.tsx, CompanyProfile.tsx, Compliance.tsx (link preview), Header.tsx (search) | Documents.tsx (insert) | `id, company_id, category, title, file_url, file_type, version_number, issue_date, expiry_date, uploaded_by, notes, created_at` |
| `finance` | Finance.tsx, CompanyProfile.tsx, Dashboard.tsx (chart) | Finance.tsx | per `src/types.ts` `FinanceTransaction` |
| `activity_log` | Activity.tsx, CompanyProfile.tsx, Dashboard.tsx, activityLogService.ts | activityLogService.ts (`logActivity`), various pages | `id, owner_id, company_id, compliance_id, document_id, action_type (NOT NULL), description, metadata, created_at` |

## Storage

- **Bucket**: `documents`
- `supabase.storage.from('documents').upload(...)` (Documents.tsx)
- `supabase.storage.from('documents').createSignedUrl(path, 60)` (Documents.tsx, CompanyProfile.tsx `handleDownload`) — 60-second signed URLs, opened in a new tab.
- `getStoragePath()` helper is duplicated in both `Documents.tsx` and `CompanyProfile.tsx` (handles both full Supabase storage URLs and relative `documents/...` paths) — candidate for extraction to `src/lib/`.

## Auth

- `supabase.auth.getSession()`, `supabase.auth.onAuthStateChange()`, `supabase.auth.getUser()` — standard Supabase JS Auth, email/password only (no OAuth providers configured in code).
