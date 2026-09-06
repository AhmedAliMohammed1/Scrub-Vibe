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
- Unit/integration: PASS — 8 files, 44 tests including both manual payment methods, Egyptian phone normalization, checkout validation, catalogue variant mapping and migration security invariants
- Lint: PASS — zero warnings
- Typecheck: PASS — strict TypeScript
- Build: PASS — Next.js 16.3.3 production build including checkout, OTP, Paymob webhook, order tracking and admin fulfilment routes
- Local browser: PASS — live Supabase product, exact Burgundy/XS variant handoff, all Egyptian governorates, OTP gate, COD, Vodafone Cash and InstaPay checkout options
- External providers: NOT_RUN — production Twilio Verify and Paymob credentials are not configured; no SMS or real payment was attempted
