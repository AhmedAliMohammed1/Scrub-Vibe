# Project state

- **Current phase:** Phase 5 — Customer state
- **Current task:** Persistent customer cart and wishlist with anonymous-to-account merge
- **Last successful task:** Implemented and locally browser-verified localized catalogue search, URL filters and sorting
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; optimized role-disjoint inventory read policies; generated live database types; typed public Supabase catalogue repository; four localized seeded products with 15 variants/inventory rows; localized URL-addressable catalogue search, audience/size/colour/price/sale/stock filters, sorting and empty states; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; bilingual customer sign-in, sign-up, sign-out, password recovery/update and account pages; PKCE/OTP confirmation callback with safe redirect validation; migration, auth and catalogue-filter tests.
- **Remaining:** persistent customer cart/wishlist, checkout and orders, CMS-backed merchandising, admin, payments, email delivery, analytics, risk and the remaining production validation phases.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Paymob and Resend validation require credentials/connections; a Supabase secret key is only needed when a future trusted server operation requires RLS bypass.
- **Required inputs:** final brand name/logo if NOVA is temporary; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — 7 files, 26 tests, including catalogue URL parsing, combined filtering and immutable sorting
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — Supabase-backed search, combined filters, form navigation, sorting state, localized Arabic results, empty state and 375px no-overflow; no fresh console errors
- **Latest deployment:** PASS — catalogue search checkpoint `b716a52` is live at https://scrub-vibe-tau.vercel.app/en/shop
- **Exact next action:** implement database-backed customer cart and wishlist persistence with safe anonymous-to-authenticated merge behavior.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart, product navigation resolves correctly, and the full filter panel remains usable at 375px.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
