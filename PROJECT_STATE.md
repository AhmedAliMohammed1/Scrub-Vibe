# Project state

- **Current phase:** Phase 2 — Database and authentication
- **Current task:** Begin the production Supabase catalogue repository and replace the development adapter
- **Last successful task:** Applied and live-verified the Supabase foundation and inventory-policy optimization migrations
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; optimized role-disjoint inventory read policies; generated live database types; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; migration security tests.
- **Remaining:** production catalogue repository, authentication UI, transactional commerce, admin, payments, analytics, risk and the remaining test/deployment phases.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Paymob and Resend validation require credentials/connections; a Supabase secret key is only needed when a future trusted server operation requires RLS bypass.
- **Required inputs:** final brand name/logo if NOVA is temporary; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — live database migration/RLS/grants/Data API verification; 4 repository files, 10 tests
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest deployment:** PASS — https://scrub-vibe-tau.vercel.app/en (Next.js production output, no browser console errors)
- **Exact next action:** implement the typed Supabase catalogue repository, seed an initial localized catalogue and switch the storefront from the development adapter.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart and product navigation resolves correctly.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
