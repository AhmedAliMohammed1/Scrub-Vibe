# Test report

## Foundation checkpoint — 2026-08-29

- Unit: PASS — 2 files, 4 tests
- Integration: NOT_RUN
- E2E: NOT_RUN
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build
- Visual QA: PASS — 375, 390, 768, 1024, 1440; English LTR; Arabic RTL; quick-add/cart/product navigation
- Browser console: PASS in clean in-app browser; no errors or warnings
- Known issues: integration and E2E suites begin with their dependent backend phases.

## Database/auth implementation checkpoint — 2026-08-29

- Unit: PASS — 3 files, 6 tests
- Integration: PASS — static migration security, 3 tests
- RLS against PostgreSQL: BLOCKED — Docker unavailable and no hosted project connected
- Lint: PASS
- Typecheck: PASS
- Build: PASS — Proxy and all application routes compiled
- SQL invariants: PASS — 13 created public tables, 13 with RLS; global client grants revoked; deprecated `auth.role()` absent

## Hosted Supabase verification — 2026-08-29

- Migrations: PASS — `foundation_identity_catalogue` and `optimize_inventory_select_policy` recorded remotely
- Schema: PASS — 13/13 application tables present with RLS enabled
- Policies: PASS — 21 policies; anonymous and authenticated inventory reads are role-disjoint
- Grants: PASS — explicit least-privilege `anon` and `authenticated` Data API grants
- Private RBAC: PASS — `anon` has no private-schema/function access; `authenticated` can execute the role helper
- Auth trigger: PASS — `on_auth_user_created` exists
- Data API: PASS — publishable-key product read returned an RLS-filtered empty result
- Security advisor: PASS — zero findings
- Performance advisor: PASS — zero warnings after policy optimization; informational unused-index notices expected on empty tables

## Database checkpoint recovery verification — 2026-09-05

- Unit: PASS — 3 files, 6 tests
- Integration: PASS — 1 file, 4 migration-security tests
- Total: PASS — 4 files, 10 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build with Proxy and all application routes

## Production catalogue checkpoint — 2026-09-05

- Migration: PASS — `seed_initial_catalogue` recorded remotely
- Live data: PASS — 4 active products, 8 translations, 15 active variants and 15 inventory rows visible to `anon` through RLS
- Unit: PASS — 4 files, 8 tests including normalized Supabase-row mapping
- Integration: PASS — 1 file, 5 migration-security/seed tests
- Total: PASS — 5 files, 13 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript with generated database types wired into every Supabase client
- Build: PASS — Next.js 16.3.3 production build
- Local browser: PASS — Supabase-backed home and product detail routes; correct localized title, prices, sizes, sale/low-stock badges; no fresh console errors
- Security advisor: PASS — zero findings
- Performance advisor: PASS — zero warnings; informational unused-index notices expected on the new low-traffic schema

## Customer authentication checkpoint — 2026-09-06

- Unit: PASS — 5 files, 16 tests including auth input and callback redirect safety
- Integration: PASS — 1 file, 5 migration-security/seed tests
- Total: PASS — 6 files, 21 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript after Next.js route type generation
- Build: PASS — Next.js 16.3.3 production build with all sign-in, sign-up, recovery, account and confirmation routes
- Local browser: PASS — English and Arabic auth screens, empty-form server validation, signup password confirmation and invalid callback recovery
- Browser console: PASS — no application warnings, errors or framework overlays
- Production deployment: PASS — auth UI from commit `4a84dac` is live on the Vercel production alias
- Supabase callback configuration: PASS — production Site URL and `https://scrub-vibe-tau.vercel.app/**` redirect allow-list verified in the dashboard
- External email flow: NOT_RUN — no customer address was used and no account/recovery email was sent

## Catalogue search and filtering checkpoint — 2026-09-06

- Unit: PASS — 6 files, 21 tests including URL normalization, localized search, combined filters and immutable sorting
- Integration: PASS — 1 file, 5 migration-security/seed tests
- Total: PASS — 7 files, 26 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript after Next.js route type generation
- Build: PASS — Next.js 16.3.3 production build
- Local browser: PASS — Supabase-backed base catalogue, combined audience/size/sale/price filter, GET form navigation, Arabic search, invalid-parameter normalization and empty state
- Responsive QA: PASS — full filter form and product results at 375px with no horizontal overflow
- Browser console: PASS — fresh final session has no warnings, errors or framework overlays
- Production deployment: PASS — commit `b716a52` serves the combined audience/size/sale filter correctly on the Vercel production alias

## Scrub Vibe rebrand checkpoint — 2026-09-06

- Source audit: PASS — supplied Scrub Vibe store and Instagram profile inspected for catalogue structure, brand positioning, imagery and public pricing
- Media: PASS — approved Scrub Vibe assets copied into the application; no production hotlinks
- Migration: PASS — `rebrand_scrub_vibe_catalogue` recorded remotely
- Live data: PASS — 9 active Scrub Vibe products, 53 active size variants, local image paths and inventory visible through the existing RLS-backed repository
- Pricing: PASS — scrub sets at EGP 850 with source compare-at prices; lab coat at EGP 550
- Total: PASS — 7 files, 27 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build
- Production browser: PASS — English and Arabic home, catalogue and product-detail content render from Supabase with real product photography
- Responsive QA: PASS after correcting the tablet navigation/logo collision with a functional dropdown menu
- Security advisor: one existing Auth warning — leaked-password protection is disabled; no catalogue/RLS regression found
- Performance advisor: informational unused-index notices only on the low-traffic schema

## Egypt checkout, payments and order tracking checkpoint — 2026-09-06

- Database: PASS — order, item, payment-proof, OTP-verification and status-history migrations recorded remotely with RLS and private proof storage
- Transactional checkout: PASS — a live order/inventory-reservation scenario completed inside a database transaction and was rolled back, leaving no test order
- Unit/integration: PASS — 8 files, 51 tests including enabled/disabled OTP modes, both manual payment methods, Egyptian phone normalization, checkout validation, catalogue variant mapping and migration security invariants
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build including checkout, OTP, Paymob webhook, order tracking and admin fulfilment routes
- Local browser: PASS — live Supabase product, exact Burgundy/XS variant handoff, all Egyptian governorates, OTP gate, COD, Vodafone Cash and InstaPay checkout options
- External providers: NOT_RUN — production Twilio Verify and Paymob credentials are not configured; no SMS or real payment was attempted
- OTP flag browser/API: PASS — `false` hides OTP controls, removes the checkout gate, keeps Egyptian phone validation and rejects direct OTP requests without contacting Twilio

## Per-product COD deposit checkpoint — 2026-09-07

- Database: PASS — live products, orders, order items and payment proofs have deposit fields; the production order transaction was replaced and its definition verified
- Deposit safety: PASS — COD is rejected server-side unless every ordered product has a positive configured deposit not exceeding its current price
- Payment proof: PASS — COD requires a Vodafone Cash or InstaPay channel and a private receipt; the order stores the paid deposit and remaining balance separately
- Admin: PASS — new products require a deposit and existing product deposits can be edited without changing catalogue pricing
- Checkout UI: PASS — custom Vodafone Cash/InstaPay icons, deposit/balance summary, disabled unconfigured COD option and bilingual field/server errors are implemented
- Unit/integration: PASS — 8 files, 52 tests
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build
- Local browser: PASS — live Supabase product selection/cart handoff, branded payment icons, disabled unconfigured COD state, receipt upload and actionable invalid-phone feedback; no new application errors or framework overlay
- Production rollout check: PASS — commit `6a9a753` is live; all 9 active products have positive deposits. A stale-cart display mismatch was found and corrected by loading current deposit values on the checkout server component.

## Payment hardening checkpoint — 2026-09-08

- Paymob hold: PASS — `PAYMOB_ENABLED` defaults off and checkout requires the switch plus all keys, valid integration IDs, HMAC secret and HTTPS app URL before exposing Paymob
- Webhook security: PASS — SHA-512 HMAC, configured integration ID, positive amount, EGP currency and external/internal order correlation are enforced
- Idempotency: PASS — provider event IDs are unique; duplicates cannot create repeated transitions and failed/additional callbacks cannot downgrade a paid order
- Audit privacy: PASS — the staff-only RLS table stores identifiers, outcomes and SHA-256 payload digests without raw callback/card data
- Manual proof workflow: PASS — live production data contains approved COD and Vodafone Cash proofs with consistent `cod_due`/`paid` states
- Receipt security: PASS — JPEG, PNG and WebP MIME declarations must match their magic bytes and the existing private 5 MB bucket restrictions
- Database: PASS — `harden_payment_processing` applied to project `iqufqtjotgpmhhtvlxwf`; event table, JSON callback function and service-role-only execution verified
- Unit/integration: PASS — 10 files, 61 tests

## Persistent cart and wishlist synchronization checkpoint — 2026-09-08

- Database: PASS — `cart_items` and `wishlist_items` tables created with owner-scoped RLS, least-privilege grants and transactional `sync_customer_cart_and_wishlist` function verified on project `iqufqtjotgpmhhtvlxwf`
- Client integration: PASS — `ShopProvider` wired to Supabase auth events; optimistic UI updates with automatic guest cart/wishlist merge upon customer login
- UI updates: PASS — cart line item quantity increment/decrement controls with 1–10 boundary limits; rich wishlist gallery view rendering product cards, pricing, and direct add-to-bag actions
- Unit/integration tests: PASS — 12 files, 72 tests including cart line merge, quantity summation and clamping, wishlist deduplication, and static migration security invariants
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`) with live-generated database types
- Build: PASS — Next.js 16.3.3 production build (`npm run build`)

## Transactional email notifications checkpoint — 2026-09-08

- Email module: PASS — `src/features/notifications/email.ts` wraps Resend SDK; dev-preview fallback logs to console when `RESEND_API_KEY` is absent or `[SENSITIVE]`
- Templates: PASS — 5 bilingual (EN/AR) HTML templates verified: `renderOrderPlaced`, `renderPaymentApproved`, `renderOrderShipped`, `renderStaffNewOrder`, `renderStaffProofSubmitted`
- Triggers: PASS — Order Placed + New Order staff alert fire non-blocking after `create_verified_order` RPC in `src/app/api/checkout/orders/route.ts`; Payment Approved + Order Shipped fire non-blocking after `admin_update_order` RPC in `src/features/orders/admin-actions.ts`
- Unit tests: PASS — 37 new tests in `tests/unit/email-notifications.test.ts` covering subject/body content for EN and AR variants, RTL flag, conditional courier/tracking sections, `formatPriceMajor`, and both `sendEmail` and `sendStaffEmail` dev-preview fallback behaviour
- Total: PASS — 13 files, 109 tests
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 production build (`npm run build`)
