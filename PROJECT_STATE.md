# Project state

- **Current phase:** Phase 7 — Payments and fulfilment
- **Current task:** Paymob is intentionally held pending merchant credentials; activate it using `PAYMOB_ACTIVATION.md` when the account is ready
- **Last successful task:** Hardened dormant Paymob processing and completed authoritative Vodafone Cash/InstaPay/COD proof review
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory/order schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS; private RBAC helper; auth-user profile/customer-role trigger; generated live database types; typed public Supabase catalogue repository; nine localized Scrub Vibe products with real brand photography and colour/size inventory; localized catalogue filters and sorting; bilingual customer authentication/account pages; admin commerce and marketing dashboard; transactional Egypt-only checkout with server-priced variant snapshots and inventory reservations; Egyptian phone OTP; per-product COD deposits paid through Vodafone Cash or InstaPay with private proof review; full Vodafone Cash/InstaPay transfer options; Paymob Unified Checkout/webhook integration; customer order timeline and shipment tracking; admin fulfilment workflow; migration, auth, catalogue and checkout tests.
- **Remaining:** persistent database-backed cart/wishlist merge, production Twilio and Paymob credential validation, shipping-zone pricing, transactional email/WhatsApp notifications, automated abandoned-cart recovery, Paymob sandbox/live acceptance and reconciliation operations, CMS-backed merchandising and final production monitoring/security validation.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Live OTP and automated payment validation require Twilio Verify and Paymob merchant credentials. Email delivery requires Resend credentials.
- **Required inputs:** Supabase server secret (`SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`); Twilio Verify credentials; Paymob public/secret/HMAC/integration credentials when onboarding completes; Vodafone Cash destination; InstaPay address; Resend key/sender domain; shipping-zone prices.
- **Latest tests:** PASS — 10 files, 61 tests, including Paymob readiness/HMAC, payment-proof signatures, webhook idempotency invariants, COD deposit channels, OTP modes, authentication and catalogue behavior
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — hydrated product selection/cart handoff, checkout payment icons, disabled unconfigured COD state, receipt upload and actionable phone validation all render and behave correctly with live Supabase data
- **Latest deployment:** Checkout/payment implementation is committed on `main`; production activation awaits Vercel provider environment variables and a fresh deployment.
- **Exact next action:** continue with shipping-zone pricing or notifications. Keep `PAYMOB_ENABLED=false`; follow `PAYMOB_ACTIVATION.md` only after Paymob supplies the merchant credentials.

## Latest visual QA

PASS for the rebranded English LTR and Arabic RTL home/catalogue/product flows. Real Scrub Vibe photography, Supabase prices, product descriptions and size options render on production. A tablet-width header collision found during live QA was corrected with a functional responsive menu.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
