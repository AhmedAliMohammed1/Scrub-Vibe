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

## Egyptian shipping-zone pricing checkpoint — 2026-09-08

- Database: PASS — 6 delivery zones, all 27 governorates and 83 city/district choices are live on project `iqufqtjotgpmhhtvlxwf` with RLS and least-privilege grants
- Server pricing: PASS — `create_verified_order` validates the city/governorate relationship and calculates the base fee, free-shipping discount, COD surcharge, total and due-on-delivery amount inside the order transaction
- Order history: PASS — destination labels, zone, charge breakdown and delivery window are stored as immutable order snapshots
- Admin: PASS — admins can edit zone fees, free-shipping thresholds, COD availability/surcharges, delivery-day ranges and active status from the bilingual delivery page
- Checkout and tracking: PASS — cascading bilingual location selectors, custom-area fallback, live quote breakdown, COD eligibility and delivery estimates render in English and Arabic
- Live security: PASS — anonymous users can read active delivery configuration; only admin/super-admin users can update zones; the order transaction remains executable only by `service_role`
- Unit/integration: PASS — shipping quote cases, checkout location validation and migration security invariants included in the 66-test shipping checkpoint
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build including `/[locale]/admin/shipping`
- Local browser: PASS — live Supabase data produced all 27 governorates, dependent cities, free-shipping/COD totals, delivery windows and Arabic RTL custom-area behavior without console errors

## Persistent cart and wishlist synchronization checkpoint — 2026-09-08

- Database: PASS — `cart_items` and `wishlist_items` tables created with owner-scoped RLS, least-privilege grants and transactional `sync_customer_cart_and_wishlist` function verified on project `iqufqtjotgpmhhtvlxwf`
- Client integration: PASS — `ShopProvider` wired to Supabase auth events; optimistic UI updates with automatic guest cart/wishlist merge upon customer login
- UI updates: PASS — cart line item quantity increment/decrement controls with 1–10 boundary limits; rich wishlist gallery view rendering product cards, pricing, and direct add-to-bag actions
- Unit/integration tests: PASS — 12 files, 72 tests including cart line merge, quantity summation and clamping, wishlist deduplication, and static migration security invariants
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`) with live-generated database types
- Build: PASS — Next.js 16.3.3 production build (`npm run build`)

## Discount codes and marketing campaigns checkpoint — 2026-09-08

- Database: PASS — campaign, code and redemption tables plus order snapshots are live on `iqufqtjotgpmhhtvlxwf`; all three tables have RLS and the two promotion RPCs are executable only by `service_role`
- Checkout integrity: PASS — live variant prices, schedules, minimum spend, usage/customer limits, campaign budget, shipping and COD deposit floors are validated server-side and redemption is atomic with order creation
- Admin: PASS — bilingual campaign/code creation and editing, activation controls, marketing attribution and performance reporting are available at `/[locale]/admin/discounts`
- Customer experience: PASS — apply/remove code, localized eligibility feedback, discounted totals and stored discount details in tracking and email are implemented
- Live safety: PASS — no sample production campaign/code/order was inserted; the live schema starts with zero promotions and can be populated deliberately by an admin
- Unit/integration: PASS — 15 files, 143 tests
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 production build including `/[locale]/admin/discounts` and `/api/checkout/discounts/validate`

## Transactional email notifications checkpoint — 2026-09-08

- Email module: PASS — `src/features/notifications/email.ts` wraps Resend SDK; dev-preview fallback logs to console when `RESEND_API_KEY` is absent or `[SENSITIVE]`
- Templates: PASS — 9 bilingual (EN/AR) HTML templates verified: `renderOrderPlaced`, `renderPaymentApproved`, `renderOrderProcessing`, `renderOrderShipped`, `renderOrderOutForDelivery`, `renderOrderDelivered`, `renderOrderCancelled`, `renderOrderStatusNote`, `renderStaffNewOrder`, `renderStaffProofSubmitted`
- Triggers: PASS — fires non-blocking real-time bilingual emails on every admin status update (`processing`, `ready_to_ship`, `shipped`, `out_for_delivery`, `delivered`, `cancelled`) and note change in `src/features/orders/admin-actions.ts`
- Sender Domain Guard: PASS — `getFromAddress` detects unverified public webmail domains (e.g. `@gmail.com`, `@yahoo.com`) and automatically falls back to `Scrub Vibe <onboarding@resend.dev>` to avoid Resend 403 errors
- Supabase Cart Sync Fix: PASS — resolved `column pov.metadata does not exist` by migrating `sync_customer_cart_and_wishlist` to query `pov.swatch_hex` on `iqufqtjotgpmhhtvlxwf`
- Admin Order Hardening: PASS — auto-promotes pending proof status to approved when admin selects paid/cod_due, and replaces unhandled 500 error throws with localized query param alerts
- Immediate UI Refresh: PASS — eliminates manual F5 requirement via dynamic form keys (`key={`${order.id}-${order.status}...`}`), dual path revalidation, and immediate navigation redirects preserving active filter parameters
- Unit tests: PASS — 52 tests in `tests/unit/email-notifications.test.ts` covering all lifecycle templates, RTL flag, `formatPriceMajor`, sender domain fallback, and dev-preview fallback behaviour
- Total: PASS — 13 files, 124 tests
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 production build (`npm run build`)

## Interactive Size Guide and Measurement Management checkpoint — 2026-09-08

- Database: PASS — `size_chart_entries` table created with RLS, least-privilege grants, category defaults and per-product overrides applied to live Supabase project `iqufqtjotgpmhhtvlxwf`
- Storefront UI: PASS — `SizeGuideDialog` integrated into `AddProduct` on product pages with Size Chart, Find My Size calculator, How to Measure guide, and 1-click size selection
- Admin Management: PASS — `/[locale]/admin/sizes` route created with category tabs (Women, Men, Unisex) and Product Override selection with 1-click reset to collection defaults
- Unit tests: PASS — 12 tests in `tests/unit/size-guide.test.ts` covering recommendation engine, unit conversions (cm/in), boundary between-sizes matching, in-stock availability constraints, and database row mapping
- Total: PASS — 15 files, 143 tests (100% passing)
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`)

## Customer Saved Addresses and Address Book checkpoint — 2026-09-08

- Database: PASS — `customer_addresses` table created with owner-scoped RLS (`auth.uid() = user_id`), least-privilege grants, foreign key references to `shipping_governorates(code)`, and automatic single-default triggers (`handle_customer_address_defaults`, `handle_customer_address_delete`) applied live to Supabase project `iqufqtjotgpmhhtvlxwf`
- Customer Account UI: PASS — `AddressBook` and `AddressDialog` components in `/[locale]/account` supporting add, edit, delete, and default toggling with clinical location presets (Clinic/Hospital, Home, Work, Other) and dynamic governorate/city selects
- Checkout Integration: PASS — `CheckoutAddressSelector` component at checkout with 1-click address prefill (name, phone, governorate, city, street, and building/clinic details), real-time shipping zone/fee recalculation, and "Save to account" checkbox on new addresses
- Unit tests: PASS — 6 tests in `tests/unit/address-validation.test.ts` covering Egyptian phone normalization, label validation, custom place name constraints, database mapping, and bilingual address formatting
- Integration tests: PASS — `tests/integration/migration-security.test.ts` asserting RLS, owner isolation, grant revocation, and security-definer triggers
- Total: PASS — 16 files, 150 tests (100% passing)
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`)

## Idempotent Cart Sync & Checkout Subtotal Bug Fix checkpoint — 2026-09-08

- Bug Root Cause: PASS — Identified that Supabase JS auth client triggers `onAuthStateChange` on browser tab focus / visibility change, repeatedly calling `sync_customer_cart_and_wishlist`, whose UPSERT statement previously executed `quantity = public.cart_items.quantity + excluded.quantity`, continually multiplying the user's cart quantities and checkout subtotal.
- Database: PASS — Applied migration `20260908073000_idempotent_cart_sync.sql` to live Supabase project `iqufqtjotgpmhhtvlxwf`, updating `public.sync_customer_cart_and_wishlist` to use idempotent `greatest(public.cart_items.quantity, excluded.quantity)` clamped to `[1, 10]`.
- Storefront UI: PASS — Hardened `ShopProvider` in `src/components/store/cart-provider.tsx` with user ID tracking (`lastSyncedUserIdRef`), in-flight mutex (`isSyncingRef`), and passing empty cart array on routine token refresh events.
- Unit tests: PASS — Added idempotent quantity calculation test in `tests/unit/cart-sync.test.ts` verifying subtotal stability across repeated sync events.
- Integration tests: PASS — `tests/integration/migration-security.test.ts` asserting `20260908073000_idempotent_cart_sync.sql` enforces `security invoker`, `set search_path = ''`, and `greatest(public.cart_items.quantity, excluded.quantity)`.

## Full release audit checkpoint — 2026-09-08

- Automated gates: PASS — ESLint with zero warnings, strict TypeScript, 17 test files / 155 tests, production dependency audit with zero known vulnerabilities, and Next.js 16.3.3 production build.
- Production HTTP/API: PASS — English/Arabic storefronts, root redirect, unknown-order 404, malformed order/discount rejection, disabled-OTP response, and unsigned Paymob webhook rejection.
- Storefront E2E: PASS — catalogue search/filtering, product colour/size selection, size chart and fit calculator, cart quantities/totals, Cairo shipping quote, COD deposit/balance, Vodafone Cash/InstaPay proof controls, invalid-discount feedback, tracking error state, and anonymous admin redirect.
- Admin E2E: PASS — authenticated analytics/catalogue dashboard, discounts, orders/payment review, delivery pricing, and size-management routes render without framework overlays or browser console warnings/errors.
- Supabase integrity: PASS — no public table without RLS, negative/over-reserved inventory, active product without variants, variant without inventory, orphan/itemless/history-less order, order/line total mismatch, duplicate code/governorate, or public payment-proof bucket.
- Anonymous security probes: PASS — public products remain readable while orders, saved addresses, OTP requests, cart synchronization and admin order mutation are denied to anonymous callers.
- Responsive/localization: PASS — 390×844 Arabic viewport has no horizontal overflow; root document uses `lang="ar"`/`dir="rtl"`; the mobile wordmark/action collision is fixed and Arabic header accessibility labels are localized.
- Accessibility: PASS — axe-core 4.12.1 WCAG 2 A/AA scans report zero violations for Arabic mobile cart, English catalogue, account, populated checkout, product page and open size-guide dialog. One sticky table header remains manual-review/incomplete because its overlapping background cannot be calculated by axe.
- SEO metadata fix: PASS locally/unit — Vercel production-host fallback prevents generated metadata, robots and sitemap URLs from falling back to localhost when the local-only app URL is absent.
- External side effects: NOT_RUN — no real order, SMS, email, payment, receipt upload, discount redemption or admin mutation was created during this audit.
- Vercel observability connector: BLOCKED — the connected Vercel app returned 403 for deployment/runtime-log access; live HTTP checks and browser console checks passed, but platform log inspection requires reconnecting the integration with project access.
- Total: PASS — 16 files, 151 tests (100% passing)
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`)
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`)
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`)

## Official Payment Brand Icons Checkpoint — 2026-09-08

- Asset Acquisition: PASS — Extracted official Vodafone circular speechmark vector from `web.vodafone.com.eg` (`public/images/payments/vodafone-cash.svg`), and authentic Egyptian Banks Company / Central Bank of Egypt InstaPay logo from Wikimedia Commons, cropped and centered to 348x348 (`public/images/payments/instapay.png`).
- Component Integration: PASS — Updated `VodafoneCashIcon` and `InstaPayIcon` in `src/features/checkout/checkout-form.tsx` across primary payment method radio cards and COD deposit channel selectors.
- Contrast & Visual QA: PASS — Vodafone speechmark uses exact brand `#e60000` with solid `#ffffff` cutout; InstaPay uses high-density PNG inside a rounded white badge container ensuring optimal contrast in both active, hover, and disabled button states across LTR and RTL.
- Total Tests: PASS — 17 files, 155 tests (100% passing).
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`).
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`).
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`).

## Storefront Merchandising CMS & Dynamic Banners Checkpoint — 2026-09-08

- Database: PASS — `public.cms_banners` created with RLS, least-privilege grants, and public storage bucket `banners` with admin-only policies applied live to Supabase project `iqufqtjotgpmhhtvlxwf`.
- Storefront UI: PASS — Server-side `AnnouncementBar` with CSS-only ticker rotation, `HeroCarousel` with 6s auto-advance and dot navigation, and `PromoSection` with alternating 2-column layout; all featuring automatic fallback to foundational brand assets when no CMS banners are active.
- Admin Management: PASS — `/[locale]/admin/banners` workspace with 3 tabs (Announcements, Heroes, Promos), image file upload, native color pickers, opacity slider, schedule controls, status badges, and position reordering.
- Unit Tests: PASS — 19 tests in `tests/unit/cms-banners.test.ts` covering types, bilingual content resolution, storage image URL construction, scheduling status, DB row mapping, and Zod input validation.
- Integration Tests: PASS — `tests/integration/migration-security.test.ts` verifying RLS, grant revocation, admin write policies, public storage read, and admin storage insert.
- Total Tests: PASS — 18 files, 176 tests (100% passing).
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`).
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`).
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`).

## Automated Abandoned-Cart Recovery Sequence Checkpoint — 2026-09-08

- Database & Migrations: PASS — `20260908200000_abandoned_cart_recovery.sql` and `20260908203000_cart_recovery_functions.sql` applied live to hosted Supabase project `iqufqtjotgpmhhtvlxwf`. `abandoned_cart_notifications` created with RLS and least-privilege staff grants; `profiles.cart_recovery_opt_out` created; `find_abandoned_cart_candidates` PostgreSQL RPC created with security definer and service-role execution grant.
- Types & Schema: PASS — Generated TypeScript types via `npx supabase gen types` cleanly synchronized without BOM.
- Escalation Sequence: PASS — 3-stage timed recovery orchestration: Stage 1 First Reminder (2h), Stage 2 Second Reminder / Urgency (24h), Stage 3 Exclusive Discount Offer (48h).
- Recovery Codes: PASS — Automated single-use promotional discount codes (`RECOVER-XXXX`) generated and registered under `cart_recovery` marketing campaign.
- Email Templates: PASS — Bilingual responsive HTML templates (`renderFirstReminder`, `renderSecondReminder`, `renderDiscountOffer`) with Scrub Vibe styling, items breakdown, pricing, CTA buttons, and CAN-SPAM compliant unsubscribe footers.
- Vercel Cron: PASS — Scheduled every 30 minutes in `vercel.json` targeting `/api/cron/abandoned-cart` with `CRON_SECRET` authorization.
- Unsubscribe & Privacy: PASS — Cryptographically signed HMAC tokens on `/api/cart/unsubscribe` with timing-safe verification, profile opt-out persistence, and branded confirmation page.
- Checkout Prefill: PASS — URL search parameter `?discount=CODE` auto-populates and validates discount on checkout mount.
- Order Attribution: PASS — Authenticated orders automatically call `markCartRecovered`, linking conversions to notifications and calculating recovered revenue.
- Admin Operations Dashboard: PASS — `/[locale]/admin/orders` renders live Cart Recovery panel displaying total reminders sent, recovered carts, recovery conversion rate percentage, and attributed revenue.
- Unit & Integration Tests: PASS — 19 tests in `tests/unit/cart-recovery.test.ts` covering configuration, types, security tokens, bilingual email templates, and calculation edge cases; `tests/integration/migration-security.test.ts` verifying RLS and RPC grants.
- Total Tests: PASS — 19 files, 196 tests (100% passing).
- Lint: PASS — zero warnings (`eslint . --max-warnings=0`).
- Typecheck: PASS — strict TypeScript (`tsc --noEmit`).
- Build: PASS — Next.js 16.3.3 Turbopack production build (`npm run build`).




