# Project state

- **Current phase:** Phase 3 — Customer identity and catalogue discovery
- **Current task:** Production customer authentication UI
- **Last successful task:** Implemented and browser-verified localized Supabase email/password authentication flows
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; optimized role-disjoint inventory read policies; generated live database types; typed public Supabase catalogue repository; four localized seeded products with 15 variants/inventory rows; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; bilingual customer sign-in, sign-up, sign-out, password recovery/update and account pages; PKCE/OTP confirmation callback with safe redirect validation; migration and auth validation tests.
- **Remaining:** catalogue search/filtering, persistent customer cart/wishlist, checkout and orders, admin, payments, email delivery, analytics, risk and the remaining production validation phases.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Paymob and Resend validation require credentials/connections; a Supabase secret key is only needed when a future trusted server operation requires RLS bypass.
- **Required inputs:** final brand name/logo if NOVA is temporary; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — 6 files, 21 tests, including auth validation and callback redirect safety
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — English/Arabic auth routes, server validation, account creation UI and rejected unsafe/invalid callback; no fresh console errors
- **Latest deployment:** PASS for the catalogue checkpoint — https://scrub-vibe-tau.vercel.app/en; the auth change awaits commit/push/deploy
- **Exact next action:** save the production callback redirect allow-list, push and production-verify the auth checkpoint, then implement catalogue search and richer filtering.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart and product navigation resolves correctly.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
