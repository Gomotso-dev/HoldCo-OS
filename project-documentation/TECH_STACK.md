# Tech Stack

## Application (`/`, the audited app)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | React | 19.x | Latest major; uses `createRoot` + `StrictMode` |
| Build tool | Vite | ^6.2.0 | `@vitejs/plugin-react`, `@tailwindcss/vite` |
| Language | TypeScript | ~5.8.2 | `noEmit: true` — `npm run lint` = `tsc --noEmit` only, no separate linter (no ESLint config present in app) |
| Styling | Tailwind CSS | via `@tailwindcss/vite` v4 | utility-first, `cn()` helper (clsx + tailwind-merge) |
| Routing | `react-router-dom` | ^7.14.0 | `BrowserRouter`, route-based code in `App.tsx` |
| Backend / DB | Supabase (Postgres + Auth + Storage + Edge Functions) | `@supabase/supabase-js` ^2.101.1 | Single managed backend — no custom Node server |
| Charts | `recharts` | ^3.8.1 | Wrapped in custom `SafeChart` to avoid zero-dimension warnings |
| Icons | `lucide-react` | ^0.546.0 | |
| Dates | `date-fns` | ^4.1.0 | `formatDate`, `formatRelativeTime`, score/due-date calculations |
| Animation | `motion` (Framer Motion successor) | ^12.23.24 | Page transitions in CompanyProfile etc. |
| Email | Resend (via Supabase Edge Function) | `resend` ^6.12.2 (in `package.json`, **not used in `src/`** — only relevant inside the Deno edge function which has its own runtime imports) | |

## Build/dev scripts (`package.json`)

```json
"scripts": {
  "dev": "vite --port=3000 --host=0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
}
```

- `name: "react-example"` — never renamed from the template/scaffold it was generated from.
- No test runner, no test files anywhere in `src/`.
- No ESLint/Prettier config for the main app (the `landing-page/` sub-project has its own `eslint.config.js`/`.prettierrc`, but that project's files are currently deleted in the working tree).

## Confirmed-unused dependencies (grep verified — zero imports in `src/`)

| Package | Where it would matter |
|---|---|
| `express` | No custom server exists; app is pure SPA served by Vite/static hosting |
| `resend` | Only the Deno edge function talks to Resend, via raw `fetch`, not this npm package |
| `dotenv` | Vite handles `.env` via `import.meta.env`; this package is never imported |
| `@google/genai` | No Gemini/AI calls anywhere in `src/` |
| `@types/express` | Dev-dep for the unused `express` |
| `react-markdown` | No markdown rendering anywhere in `src/` |

These are leftovers from the AI Studio / scaffold template (`vite.config.ts` still defines `process.env.GEMINI_API_KEY` and `.env.example` documents `GEMINI_API_KEY`/`APP_URL` — both unused by the app's actual code paths). See REFACTOR_PLAN.md for removal recommendation.

## Backend: Supabase

- **Auth**: Supabase Auth (`supabase.auth.getSession()`, `onAuthStateChange`), email/password (via `Login.tsx`).
- **Database**: Postgres, accessed exclusively via `@supabase/supabase-js` `.from()` queries — no ORM, no generated types beyond the hand-written `src/types.ts`.
- **Row-Level Security**: enabled on all core tables, policy pattern `auth.uid() = owner_id` (see DATABASE.md, SECURITY_AUDIT.md).
- **Storage**: a `documents` bucket, accessed via `supabase.storage.from('documents')` for upload/signed-URL download.
- **Edge Functions**: one function, `send-email` (Deno, `supabase/functions/send-email/index.ts`), proxies to Resend's REST API. Requires `RESEND_API_KEY` secret; falls back to a "dev mode" no-op log if unset.

## Environment configuration

`.env.example`:
```
GEMINI_API_KEY="MY_GEMINI_API_KEY"   # unused by app code — AI Studio scaffold leftover
APP_URL="MY_APP_URL"                 # unused by app code — AI Studio scaffold leftover
VITE_SUPABASE_URL=""
VITE_SUPABASE_ANON_KEY=""
```

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are actually consumed (`src/lib/supabase.ts`, `App.tsx`'s `configError` check). `vite.config.ts` also injects `process.env.GEMINI_API_KEY` via `define`, but nothing reads `process.env.GEMINI_API_KEY` in `src/`.

## TypeScript configuration highlights (`tsconfig.json`)

- `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`
- `jsx: react-jsx` (no need to import React)
- `noEmit: true` — type-checking only, build is done by Vite/esbuild (so type errors do **not** fail `vite build` unless `lint` is run as a separate CI step — and there is no CI config in the repo to confirm this is enforced)
- `exclude: ["supabase"]` — the Deno edge function is excluded from the app's TS project (correct, since it uses Deno's `https://deno.land/...` import scheme)
- Path alias `@/*` → project root

## Deployment

No CI/CD config (no `.github/workflows`, no `vercel.json`/`netlify.toml`) was found in the repo. `firebase-blueprint.json` exists at the root, suggesting Firebase Hosting was considered/used at some point, but no other Firebase config or SDK usage was found in `src/`. Deployment target is currently **undetermined from the repo alone**.
