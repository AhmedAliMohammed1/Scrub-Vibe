# Project state

- **Current phase:** Phase 2 — Database and authentication
- **Current task:** Create the Supabase foundation migration, grants, RLS and SSR auth clients
- **Last successful task:** Phase 1 foundation verified across code, build and responsive browser QA
- **Current branch:** `main`
- **Latest relevant commit:** foundation checkpoint commit created at end of this session (see `git log -1`)
- **Implemented:** Next.js App Router structure; `/en` and `/ar` direction-aware shells; responsive header/home/shop/product/cart/wishlist/account routes; typed catalogue repository boundary with development adapter; localized pricing; client session cart/wishlist; product JSON-LD; sitemap/robots; original generated editorial hero; Vitest baseline; CI workflow; environment template.
- **Remaining:** Supabase production repository, migration/RLS/auth/RBAC, transactional commerce, admin, payments, analytics, risk, full test pyramid and deployment.
- **Known bugs:** none confirmed in the implemented scope. Live integrations are not implemented.
- **Blocked tasks:** live Supabase, Paymob, Resend and Vercel validation require project credentials/connections.
- **Required inputs:** final brand name/logo if NOVA is temporary; Supabase URL/publishable/secret keys; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — 2 files, 4 tests
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest deployment:** NOT_DEPLOYED
- **Exact next action:** create a Supabase CLI migration for normalized identity/catalogue tables, add least-privilege grants and RLS policies, then add local RLS/security tests.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart and product navigation resolves correctly.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
