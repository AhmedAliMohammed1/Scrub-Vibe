# Project state

- **Current phase:** Phase 7 — Payments, fulfilment and customer communications
- **Current task:** Transactional email notifications completed; Paymob is intentionally held pending merchant credentials (activate it using `PAYMOB_ACTIVATION.md` when ready)
- **Last successful task:** Implemented full lifecycle status transition emails (processing, ready to ship, shipped, out for delivery, delivered, cancelled, and customer notes) triggering real-time bilingual emails on every admin status change
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; normalized identity/catalogue/variant/inventory/order schema live on project `iqufqtjotgpmhhtvlxwf`; least-privilege grants and RLS; private RBAC helper; auth-user profile/customer-role trigger; generated live database types; typed public Supabase catalogue repository; nine localized Scrub Vibe products with real brand photography and colour/size inventory; localized catalogue filters and sorting; bilingual customer authentication/account pages; admin commerce and marketing dashboard; transactional Egypt-only checkout with server-priced variant snapshots and inventory reservations; Egyptian phone OTP; per-product COD deposits paid through Vodafone Cash or InstaPay with private proof review; full Vodafone Cash/InstaPay transfer options; Paymob Unified Checkout/webhook integration; customer order timeline and shipment tracking; admin fulfilment workflow; shipping-zone pricing and admin management; persistent database-backed cart and wishlist sync with owner-scoped RLS, automatic login merge, optimistic UI, cart quantity controls, and rich wishlist gallery view; **transactional email notifications (Order Placed, Payment Approved, Processing, Shipped, Out for Delivery, Delivered, Cancelled) via Resend with bilingual EN/AR HTML templates and staff alert emails**; migration, auth, catalogue, shipping, cart and email tests.
- **Remaining:** production Twilio and Paymob credential validation; WhatsApp notifications; automated abandoned-cart recovery; Paymob sandbox/live acceptance and reconciliation operations; CMS-backed merchandising; final production monitoring/security validation.
- **Known bugs:** none confirmed in the implemented scope.
- **Blocked tasks:** Live OTP and automated payment validation require Twilio Verify and Paymob merchant credentials. Custom sender domain for emails requires a verified Resend domain (free tier uses `onboarding@resend.dev`).
- **Required inputs:** Supabase server secret (`SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`); Twilio Verify credentials; Paymob public/secret/HMAC/integration credentials when onboarding completes; Vodafone Cash destination; InstaPay address; `STAFF_EMAIL` for alert routing; `RESEND_FROM_EMAIL` once domain is verified.
- **Latest tests:** PASS — 13 files, 124 tests, including full status lifecycle email templates (EN/AR), sender domain fallback, cart/wishlist sync, shipping quotes, Paymob readiness/HMAC, payment-proof signatures, webhook idempotency invariants, COD deposit channels, OTP modes, authentication and catalogue behavior
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest local browser verification:** PASS — hydrated product selection/cart handoff, checkout payment icons, disabled unconfigured COD state, receipt upload, actionable phone validation, cart quantity modifiers, and rich wishlist cards render and behave correctly with live Supabase data
- **Latest deployment:** Workspace is linked to Vercel `scrub-vibe` and Supabase `iqufqtjotgpmhhtvlxwf`.
- **Exact next action:** Add Paymob merchant credentials or configure Twilio for live OTP; alternatively implement WhatsApp notifications or abandoned-cart recovery.

## Latest visual QA

PASS for the rebranded English LTR and Arabic RTL home/catalogue/product flows. Real Scrub Vibe photography, Supabase prices, product descriptions and size options render on production. A tablet-width header collision found during live QA was corrected with a functional responsive menu.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
