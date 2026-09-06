# Project state

- **Current phase:** Phase 5 — Customer state
- **Current task:** Persistent customer cart and wishlist with anonymous-to-account merge
- **Last successful task:** Rebranded the live storefront and production catalogue to Scrub Vibe using the supplied store and Instagram material
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; optimized role-disjoint inventory read policies; generated live database types; typed public Supabase catalogue repository; nine localized Scrub Vibe products with real brand photography, 53 active size variants and inventory rows; female, male and lab-coat catalogue structure with source pricing; localized URL-addressable catalogue search, audience/size/colour/price/sale/stock filters, sorting and empty states; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; bilingual customer sign-in, sign-up, sign-out, password recovery/update and account pages; PKCE/OTP confirmation callback with safe redirect validation; migration, auth and catalogue-filter tests.
- **Remaining:** persistent customer cart/wishlist, checkout and orders, CMS-backed merchandising, admin, payments, email delivery, analytics, risk and the remaining production validation phases.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Paymob and Resend validation require credentials/connections; a Supabase secret key is only needed when a future trusted server operation requires RLS bypass.
- **Required inputs:** Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — 7 files, 27 tests, including Scrub Vibe catalogue migration, URL parsing, combined filtering and immutable sorting
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — real product imagery, product-detail content, prices, English/Arabic catalogue rendering and responsive header behavior
- **Latest deployment:** PASS — Scrub Vibe rebrand commit `90a01e5` is live at https://scrub-vibe-tau.vercel.app/en
- **Exact next action:** implement database-backed customer cart and wishlist persistence with safe anonymous-to-authenticated merge behavior.

## Latest visual QA

PASS for the rebranded English LTR and Arabic RTL home/catalogue/product flows. Real Scrub Vibe photography, Supabase prices, product descriptions and size options render on production. A tablet-width header collision found during live QA was corrected with a functional responsive menu.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
