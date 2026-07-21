# GradProcess AI — Production-Readiness Audit Report

**Date:** 21 July 2026
**Scope:** Full repository, all routes, all API endpoints, environment config, database schema, Stripe integration, production deployment.
**Method:** Evidence-based — every claim below is backed by an executed command, HTTP request, build, or test run. Nothing was marked "working" from code reading alone.

---

## 1. Architecture (verified)

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) | ✅ builds clean |
| Language | TypeScript 5, strict | ✅ 0 errors |
| Styling | Tailwind CSS 4 + framer-motion | ✅ |
| Auth/DB/Storage | Supabase (`@supabase/ssr`) | ⛔ **project deleted** (see Blockers) |
| AI | Anthropic Claude (claude-sonnet-4-6) via 13 server-only API routes | ✅ live-verified |
| Payments | Stripe v22 (checkout, portal, signature-verified webhook) | ⚠️ keys unset |
| News | Live RSS aggregation (`rss-parser`) | ✅ live-verified |
| CV parsing | pdf-parse / mammoth / plain text | ✅ live-verified |
| Hosting | Vercel — `https://grad-process-ai-app-two.vercel.app` | ✅ live (stale deploy) |

**Pages (23):** all return HTTP 200 locally. Marketing (7), auth (5), app (11).
**API routes (20):** 13 AI + parse-cv + news + audit + account/export + 3 Stripe.

## 2. Baseline vs. after

| Check | Before | After |
|---|---|---|
| `tsc --noEmit` | 1 error (dead code in proxy.ts) | **0 errors** |
| Production build | passes only because `typescript.ignoreBuildErrors: true` | **passes with enforcement re-enabled** |
| ESLint | 103 errors / 45 warnings (quality: `any`, unused vars, unescaped entities) | unchanged — documented, non-blocking |
| Automated tests | **none existed** | **28 tests, 3 suites, all passing** (`npm test`) |
| `npm audit` | 3 vulns (2 moderate, 1 high) — all transitive via `next`'s bundled postcss; only "fix" is downgrading Next to 9.x | unchanged — wait for Next patch release |

## 3. Defects found & fixed (with evidence)

### D1 — CRITICAL: `/api/debug` leaked secrets metadata in production
`curl https://grad-process-ai-app-two.vercel.app/api/debug` returned the first 15 chars of the Anthropic API key, env-var names, and NODE_ENV — publicly, unauthenticated.
**Fix:** route deleted. Verified 404 locally. ⚠️ **Redeploy required to remove it from production, and rotate the Anthropic key** (prefix exposure + key present in a synced Downloads folder).

### D2 — Stripe webhook wrote columns/values that don't exist in the schema
The webhook wrote `stripe_subscription_id`, `cancel_at_period_end`, `plan: "student_pro"`, and updated a `profiles` table. The schema defined `stripe_sub_id`, no `cancel_at_period_end`, `plan CHECK IN ('free','pro','team')`, and the table is `user_profiles` (with no `plan` column). **Every webhook DB write would have failed** — payments taken, Pro never activated.
**Fix:** schema.sql updated (renamed column, added `cancel_at_period_end`, widened status CHECK to include Stripe's raw statuses, added `user_profiles.plan`); webhook now writes `plan: "pro"`, targets `user_profiles`, and logs upsert errors instead of swallowing them.
**Regression guard:** `tests/webhook-schema-consistency.test.ts` statically asserts webhook writes ⊆ schema columns, plan values ⊆ CHECK constraint, targeted tables exist, and signature verification precedes DB writes.

### D3 — Checkout upsert silently blocked by RLS
`subscriptions` had only a SELECT policy; the checkout route's user-scoped upsert of `stripe_customer_id` would be rejected by RLS and the error was ignored → duplicate Stripe customers on every checkout.
**Fix:** added `subs_insert_own` / `subs_update_own` policies (own-row only); checkout now logs upsert failures.

### D4 — Stripe redirect URLs built from unset env var
`success_url`/`cancel_url`/`return_url` used `NEXT_PUBLIC_APP_URL`, which is set nowhere → literal `undefined/dashboard?...` URLs.
**Fix:** both routes fall back to the request origin. `.env.example` also gained the missing `STRIPE_STUDENT_PRO_PRICE_ID` entry.

### D5 — TypeScript build enforcement disabled
`typescript: { ignoreBuildErrors: true }` (commit 0beedd4) let type errors ship to production.
**Fix:** removed the dead code causing the sole error (unreachable duplicate dev-check in proxy.ts), re-enabled enforcement, verified clean production build.

### D6 — Debug leftovers
`TEST_VAR=hello123` removed from `.env.local` (only consumer was the deleted debug route).

## 4. Verified working (evidence)

- **AI pipeline (live Claude calls):** STAR generation via browser E2E (scored 62/100), psychometric quiz generation (real numerical questions with worked explanations), Ava chat (correct ATS answer). All via `GRADPROCESS_AI_KEY`, confirmed server-side only in all 14 usages.
- **CV parsing:** `.txt` round-trip exact; `.exe` upload rejected ("Unsupported file type").
- **Input validation:** analyse-cv rejects empty payloads; auth guards return 401 on export/checkout without session.
- **News API:** returns live Economist/FT-sourced items dated April 2026.
- **Security headers/CSP:** configured in next.config.ts for every route.
- **Password policy:** 5-requirement scoring enforced at signup (now unit-tested).
- **Webhook security:** Stripe signature verified before any DB write (now regression-tested).

## 5. Blockers requiring your action (cannot be fixed from code)

1. **Supabase project is gone.** `xpmwsqhebzeavzkbfpeh.supabase.co` → DNS NXDOMAIN (deleted/expired). All auth + persistence is dead in every environment; the app currently survives on localStorage + dev-mode auth bypass.
   → Create a new Supabase project, run the (now-corrected) `supabase/schema.sql`, update `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` locally and in Vercel.
2. **Production deploy is stale and ungated.** Prod `/dashboard` serves without auth (200, no redirect) and still exposes `/api/debug`. → Redeploy from current code after step 1.
3. **Rotate the Anthropic API key** (prefix publicly exposed via D1).
4. **Stripe not configured:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STUDENT_PRO_PRICE_ID`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` all empty. Billing UI renders but checkout will 500 until set.
5. **Data-layer migration (design gap, not a bug):** scores/tracker/sessions persist to localStorage, not Supabase — schema tables exist for them but app code doesn't write to them yet. Largest remaining engineering task before real multi-device accounts.

## 6. Residual known issues (documented, not fixed)

- 103 ESLint errors — code quality (`no-explicit-any` ×57, unused vars ×43, unescaped entities ×19). No functional impact; recommend incremental cleanup.
- `npm audit`: 3 transitive vulns inside `next`'s bundled postcss — no safe fix until a patched Next release; not exploitable via app usage patterns (build-time tooling).
- Recharts container-size warnings in dev logs — cosmetic.
- Full Process Exam stage scores are hard-coded demo values (intentional demo mode, but should be wired to live AI before selling Premium).

## 7. Test & check commands

```bash
npm run typecheck   # tsc --noEmit        → 0 errors
npm test            # vitest, 28 tests    → all pass
npm run lint        # eslint              → 103 legacy quality errors
npm run build       # next build          → clean, TS enforced
```
