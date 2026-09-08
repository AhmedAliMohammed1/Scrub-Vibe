# Tasks

## Phase 0 — Discovery

- [x] **DONE** Inspect repository (empty greenfield). Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Inspect reference information architecture and storefront journey. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Define phased architecture and recovery state. Tests: PASS. Commit: foundation checkpoint.

## Phase 1 — Foundation

- [x] **DONE** Create Next.js 16 / TypeScript / Tailwind project structure. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add design tokens, owned UI primitive and responsive bilingual shell. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add initial storefront, catalogue contract and original asset. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add Vitest and CI configuration. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Install dependencies and generate pnpm lockfile. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Pass lint, typecheck, unit tests and production build. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Browser QA at required breakpoints and RTL. Tests: PASS. Commit: foundation checkpoint.

## Phase 2 — Database/Auth

- [x] **DONE** Execute Supabase foundation migration and live RLS/grant/Data API tests. Tests: PASS. Project: `iqufqtjotgpmhhtvlxwf`.
- [x] **DONE** Implement normalized identity/catalogue/variant/inventory migration, grants and policies. Tests: PASS (static security invariants). Commit: pending Phase 2 checkpoint.
- [x] **DONE** Implement SSR auth and server-validated RBAC. Tests: PASS. Commit: pending Phase 2 checkpoint.
- [x] **DONE** Resolve the inventory multiple-permissive-policy advisor warning and generate live database types. Tests: PASS. Commit: pending follow-up checkpoint.

## Phase 3+

- [x] **DONE** Implement the production Supabase catalogue/inventory read repository and localized seed. Tests: PASS (live RLS + local browser).
- [x] **DONE** Implement localized URL-addressable catalogue search, richer filtering and sorting. Tests: PASS (26 total + local browser).
- [x] **DONE** Implement customer authentication UI against the existing SSR auth foundation. Tests: PASS (21 total + local browser).
- [x] **DONE** Rebrand the storefront and hosted catalogue to Scrub Vibe with sourced product photography, bilingual medical-apparel copy, 9 products and 53 size variants. Tests: PASS (27 total + production browser).
- [x] **DONE** Implement admin commerce/marketing dashboard and product management. Tests: PASS.
- [x] **DONE** Implement multi-colour products with exact colour/size inventory variants. Tests: PASS.
- [x] **DONE** Implement Egypt checkout, optional phone OTP flag, COD, Paymob, always-visible Vodafone Cash/InstaPay proof review, orders and shipment tracking. Tests: PASS (51 total + live transactional rollback test).
- [x] **DONE** Add per-product COD deposits, admin deposit editing, deposit-channel proof verification, branded payment icons and actionable checkout errors. Tests: PASS (52 total + live schema verification).
- [x] **DONE** Set business-approved COD deposits on all 9 active products and verify existing-cart deposit refresh.
- [x] **DONE** Prepare dormant Paymob integration with an explicit activation switch, strict readiness checks, idempotent callbacks, staff-only audit records and admin readiness visibility. Tests: PASS (61 total + live schema/RLS verification).
- [x] **DONE** Verify production manual proof records for COD and Vodafone Cash reach consistent approved payment/order states.
- [x] **DONE** Add shipping-zone pricing, delivery windows, governorate/city cascading selects and admin zone rate management. Tests: PASS (66 total).
- [x] **DONE** Implement database-backed persistent cart and wishlist synchronization with owner-scoped RLS, automatic sign-in merge, optimistic updates, quantity modifiers and rich wishlist view. Tests: PASS (72 total + live Supabase verification).
- [x] **DONE** Implement transactional email notifications via Resend — bilingual (EN/AR) HTML emails for Order Placed, Payment Approved and Order Shipped; staff alert emails for new orders and payment proof submissions; dev-preview console fallback when `RESEND_API_KEY` is absent. Tests: PASS (109 total).
- [x] **DONE** Implement Interactive Medical Scrub Size Guide and "Find My Size" measurement calculator on product pages with database-backed `size_chart_entries`, category defaults (Women/Men/Unisex), per-product overrides, unit toggling (cm/in), and full admin management in `/[locale]/admin/sizes`. Tests: PASS (143 total).
- [x] **DONE** Implement end-to-end discount codes and marketing campaigns with admin creation/editing, server-authoritative checkout validation, usage/budget limits, immutable order snapshots and campaign performance reporting. Tests: PASS (143 total + live Supabase RLS/grant/index verification).
- [x] **DONE** Implement Customer Saved Addresses and Address Book with database-backed `customer_addresses`, owner-scoped RLS, automatic default management triggers, account management UI, and 1-click checkout prefill with shipping zone recalculation. Tests: PASS (150 total + live Supabase verification).
- [ ] **ON HOLD** Add Paymob merchant credentials, register/test the webhook, run successful/declined sandbox payments and validate duplicate/delayed callbacks. Follow `PAYMOB_ACTIVATION.md`; merchant keys required.
- [ ] **TODO** Configure and validate production Twilio credentials if phone OTP should be enabled.
- [ ] **TODO** Implement WhatsApp notifications via Twilio/WhatsApp Business API.
- [ ] **TODO** Implement automated abandoned-cart recovery emails.
- [ ] **TODO** Add Resend sender domain verification and update `RESEND_FROM_EMAIL` in Vercel env vars.
- [ ] **TODO** Add production observability/monitoring (Sentry DSN, Upstash Redis rate limiting).
