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
- [x] **DONE** Fix checkout subtotal multiplying bug on browser tab switches by making `public.sync_customer_cart_and_wishlist` idempotent in PostgreSQL (`20260908073000_idempotent_cart_sync.sql`), guarding `ShopProvider` against duplicate syncs and passing empty cart array on background token refreshes. Tests: PASS (151 total + live Supabase verification).
- [x] **DONE** Replace handcrafted payment SVG approximations with authentic official brand iconography for Vodafone Cash (official speechmark vector from Vodafone Egypt) and InstaPay Egypt (official CBE/EBC logo mark from Wikimedia) across checkout payment methods and COD deposit options. Tests: PASS (155 total).
- [x] **DONE** Implement Storefront Merchandising CMS & Dynamic Banners with database-backed `cms_banners` table, public `banners` storage bucket, admin workspace (`/[locale]/admin/banners`), server-side ticker announcement bar, client hero carousel, editorial promo sections, and graceful fallback to foundational assets. Tests: PASS (176 total + live Supabase verification).
- [ ] **ON HOLD** Add Paymob merchant credentials, register/test the webhook, run successful/declined sandbox payments and validate duplicate/delayed callbacks. Follow `PAYMOB_ACTIVATION.md`; merchant keys required.
- [ ] **TODO** Configure and validate production Twilio credentials if phone OTP should be enabled.
- [ ] **TODO** Implement WhatsApp notifications via Twilio/WhatsApp Business API.
- [x] **DONE** Implement Automated Abandoned-Cart Recovery Sequence with database-backed `abandoned_cart_notifications` tracking, `cart_recovery_opt_out` profile flag, index-backed RPC candidate selection, 3-stage bilingual email sequence (2h, 24h, 48h), single-use recovery discount codes (`RECOVER-XXXX`), 30-minute Vercel Cron, HMAC-signed 1-click unsubscribe, checkout URL prefill, non-blocking order conversion attribution, and admin operations dashboard metrics. Tests: PASS (196 total + live Supabase verification).
- [x] **DONE** Implement commercial growth and after-sales operations: product bundles, recommendations, stock subscriptions/alerts, returns/refunds, invoices, exports, Merchant feed and optional GA4/Meta integrations.
- [x] **DONE** Complete the customer return lifecycle with evidence, notes, role-scoped settlement, partial quantities, restocking and terminal order synchronization.
- [x] **DONE** Add full admin product editing/deletion, colour-specific multi-image galleries, pagination and hardened mobile/RTL layouts.
- [x] **DONE** Implement verified-purchase Customer Product Reviews & Star Ratings with customer management, moderation, responses, aggregates, catalogue ratings and structured SEO. Tests: PASS (319 total + live Supabase verification).
- [x] **DONE** Add an accessible product-page back-in-stock notification dialog for unavailable variants with dedicated tests.
- [ ] **TODO** Add Resend sender domain verification and update `RESEND_FROM_EMAIL` in Vercel env vars.
- [x] **DONE** Implement production operations: structured Vercel logs, liveness/readiness, fail-closed cron authentication, expired-reservation and stale-payment escalation, verified database/Storage backups, protected non-production restore drills, release/rollback and incident runbooks, hourly smoke checks and weekly dependency/CodeQL scanning.
- [ ] **TODO** Configure GA4, Meta Pixel and Meta CAPI credentials and validate event deduplication.
- [ ] **TODO** Add committed Playwright end-to-end journeys for critical customer and staff workflows.
- [ ] **TODO** Configure production operations secrets, run the first encrypted backup/non-production restore drill, and record measured RPO/RTO evidence.
- [ ] **BLOCKED** Enable Supabase leaked-password protection after upgrading the project from Free to Pro; the signed-in dashboard confirms the feature is plan-gated.
