# Security Audit

Scope: static review of application code, Supabase migrations (RLS policies), and the one Edge Function. No dynamic/penetration testing performed (no running instance available).

## 1. Row-Level Security (RLS) — ✅ Generally sound

Every core table (`companies`, `compliance`, `documents`, `finance`, `company_tax_profiles`, `company_bank_details`, `shareholders`, `directors`, `beneficial_owners`, `company_relationships`, `activity_log`) has:

```sql
FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id)
```

- Policies were defensively re-applied (`20240502_harden_rls_all.sql` loops with `information_schema.tables` existence checks) — good practice for idempotent migrations.
- The pattern correctly scopes both reads and writes to the authenticated user's own rows via a single, consistent column (`owner_id`).
- **No table was found without RLS** in the migrations read.

### Caveats
- This is a **single-tenant-per-user** model (`owner_id`). There is no concept of shared/team access — `User.role` (Owner/Admin/Accountant/Manager) exists in `types.ts` but RLS does not reference it, and no app code grants cross-user access. If multi-user collaboration on the same company group is a planned feature, the current RLS model would need a `company_members`/team table and updated policies — a schema-level change, not a quick fix.
- RLS policies use `FOR ALL` (covers SELECT/INSERT/UPDATE/DELETE with one rule). This is simple but means there's no finer-grained control (e.g., an "Accountant" role being read-only) — consistent with the role field being currently unused.

## 2. Edge Function (`send-email`) — ⚠️ Open CORS, no explicit auth check

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

- `Access-Control-Allow-Origin: *` permits any origin to call this function (subject to Supabase's own Edge Function invocation auth settings — by default Supabase Edge Functions require a valid `apikey`/JWT header unless deployed with `--no-verify-jwt`).
- The function itself performs **no additional authorization** — it does not check who the caller is, does not rate-limit, and will send an email to **any `to` address** supplied in the request body, using the project's Resend credentials.
- **Risk**: if the function is deployed with JWT verification disabled, or if the anon key is exposed (it always is, client-side, by design for Supabase), this function could be used as an open email-relay/spam vector — send arbitrary subject/html/text to arbitrary recipients, billed to the project's Resend account.
- **Recommendation**: ensure JWT verification is enabled for this function (Supabase default), and consider adding a server-side check that `to` matches the authenticated user's own email (the only legitimate current use case — `NotificationService` always sends to `user.email`), or restrict the function to only be callable with a service-role-validated internal call.

## 3. Secrets management — ✅ Mostly fine, one dead-config note

- `.env.example` correctly excludes real secrets; `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are anon/public keys by design (safe to ship to the browser).
- `RESEND_API_KEY` is correctly kept server-side (Edge Function `Deno.env.get`), never referenced in `src/`.
- `vite.config.ts` injects `process.env.GEMINI_API_KEY` via `define` — this is dead config (unused in `src/`), but worth removing so a future contributor doesn't assume Gemini calls are made client-side with this key (which **would** be a secret-exposure risk if ever wired up, since `define` bakes the value into the client bundle at build time).

## 4. Input validation / injection

- All DB access is via Supabase's parameterized PostgREST client (`.eq()`, `.insert()`, etc.) — no raw SQL string concatenation found anywhere in `src/`. **No SQL injection risk** from application code.
- `.or('name.ilike...,registrationNumber.ilike...')` (Header.tsx search) — the search term is interpolated into the `.or()` filter string. Supabase-js's `.or()` builds a PostgREST filter string from the argument; if the search term contains characters with special meaning in PostgREST filter syntax (commas, periods, parentheses), this could cause a malformed-filter error or, in principle, allow a user to inject additional filter clauses (e.g., `,owner_id.eq.<other-uuid>` style attempts) — though RLS would still prevent cross-tenant data access regardless. **Recommendation**: sanitize/escape search input before interpolating into `.or()` strings, or use `.textSearch()`/parameterized alternatives.

## 5. File uploads / Storage

- `documents` bucket access via signed URLs (60-second expiry) — reasonable, time-limited.
- No file-type/size validation visible in the portion of `Documents.tsx` read in prior sessions was flagged as "appears correct" — recommend a follow-up check of upload validation (MIME type allowlist, max size) as Storage bucket policies may allow arbitrary file types by default.

## 6. Client-side authorization

- The app correctly relies on RLS as the authoritative access-control layer (client-side checks are UX-only) — this is the right model for a Supabase app. No instance found of the client trusting its own checks for security-sensitive decisions.

## 7. Activity log as an audit trail

- Per BUG_REPORT.md (BUG-06/07/08), the activity log has multiple silent-failure and mislabeling issues. From a security/compliance standpoint, an **audit trail that silently drops "compliance_generated"/"score_calculated" events and mislabels deletions as updates** is itself a finding: for a product whose value proposition includes governance/audit trails (POPIA category exists in compliance types), the audit log's integrity should be treated as a security requirement, not just a UX nicety.

## 8. Dependency surface

- `express`, `resend`, `dotenv`, `@google/genai`, `react-markdown` are unused but present in `package.json` (TECH_STACK.md) — unused dependencies increase supply-chain attack surface (more packages to keep patched) without benefit. Recommend removal (REFACTOR_PLAN.md).

## Summary

| Area | Rating |
|---|---|
| RLS / multi-tenant isolation | ✅ Good |
| Edge function exposure | ⚠️ Needs review (open CORS + email-relay risk) |
| Secrets handling | ✅ Good (one dead-config cleanup) |
| Injection risk | ✅ Low (parameterized client), ⚠️ one `.or()` search-string concern |
| File storage | ✅ Reasonable (signed URLs) — upload validation unverified |
| Audit trail integrity | ⚠️ Functional issues undermine its value as a compliance control |
| Dependency hygiene | ⚠️ Unused packages should be removed |

No critical, immediately-exploitable vulnerabilities were found in the application code itself. The most actionable items are: (1) confirm/restrict the `send-email` Edge Function's exposure, and (2) fix the audit-trail bugs given the product's compliance positioning.
