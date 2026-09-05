# Project state

- **Current phase:** Phase 3 — Catalogue and inventory reads
- **Current task:** Production Supabase catalogue repository and initial localized catalogue
- **Last successful task:** Seeded and browser-verified the production Supabase catalogue through the typed storefront adapter
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; optimized role-disjoint inventory read policies; generated live database types; typed public Supabase catalogue repository; four localized seeded products with 15 variants/inventory rows; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; migration security tests.
- **Remaining:** catalogue search/filtering, authentication UI, transactional commerce, admin, payments, analytics, risk and the remaining test/deployment phases.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** pushing to `origin/main` requires GitHub write access for the currently authenticated `aarwa5665-oss` account; Paymob and Resend validation require credentials/connections; a Supabase secret key is only needed when a future trusted server operation requires RLS bypass.
- **Required inputs:** final brand name/logo if NOVA is temporary; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — live database/RLS verification; 5 repository files, 13 tests
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — Supabase-backed home and product detail routes, four products, correct prices/sizes/badges, no fresh console errors
- **Latest deployment:** PASS for the prior commit — https://scrub-vibe-tau.vercel.app/en; the catalogue adapter change awaits commit/push/deploy
- **Exact next action:** restore GitHub write access, push the two local commits so Vercel deploys them, verify production, then implement customer authentication UI.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart and product navigation resolves correctly.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
