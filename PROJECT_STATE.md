# Project state

- **Current phase:** Production hardening and external-provider activation
- **Current branch:** `main`
- **Hosted application:** `https://scrub-vibe-tau.vercel.app`
- **Supabase project:** `iqufqtjotgpmhhtvlxwf`
- **Latest feature:** Customer Product Reviews & Star Ratings, followed by the product-page back-in-stock notification dialog
- **Known application bugs:** None confirmed in the implemented scope

## Implemented

- Responsive bilingual English/Arabic storefront with LTR/RTL layouts, accessible navigation, catalogue search/filter/sort, SEO metadata and mobile-first product discovery.
- Normalized Supabase catalogue with localized products, multi-colour and multi-size variants, colour-specific multi-image galleries, live inventory and safe admin creation/editing/deletion.
- Supabase Auth with PKCE sessions, registration, sign-in/out, password recovery, server-validated RBAC and owner-scoped account data.
- Persistent authenticated cart and wishlist with guest merge, optimistic updates, quantity controls and idempotent synchronization.
- Egypt-only transactional checkout with validated customer names and mobile numbers, simple/detailed addresses, saved-address prefill, shipping zones, promotions, stock reservation and actionable bilingual errors.
- COD with per-product deposits, Vodafone Cash and InstaPay private proof verification, replacement proof upload, and a complete but intentionally dormant Paymob integration.
- Customer order history, guest/account tracking, invoices, shipment details, fulfilment timeline and bilingual lifecycle email notifications.
- Customer returns/exchanges with evidence, item quantities, status history and customer-facing notes; role-scoped admin approval, receiving, restocking and refund/store-credit/exchange settlement.
- Verified-purchase product reviews with star ratings, fit and recommendation feedback, customer edit/delete, admin moderation/responses/featured reviews, aggregates and structured SEO data.
- Interactive size calculator and database-backed category/product size-chart administration.
- Admin-managed campaigns and discount codes with schedules, eligibility, caps, usage limits, budgets, atomic redemption and reporting.
- Storefront CMS for announcements, hero carousels and promotional sections with Supabase Storage media.
- Product bundles, cross-sell/complete-the-look recommendations, low-stock alerts, back-in-stock subscriptions and notification automation.
- First-party commerce analytics, admin dashboards, CSV exports, Google Merchant feed, optional GA4/Meta scripts and Meta Conversions API integration.
- Three-stage abandoned-cart recovery with signed unsubscribe, recovery discounts, conversion attribution and Vercel Cron scheduling.
- Pagination for long customer and admin collections, responsive admin tools and role-aware navigation.
- RLS, least-privilege grants, private storage, server-authoritative commerce operations, idempotent callbacks and security regression coverage.

## Remaining or externally blocked

1. Activate and acceptance-test Paymob with merchant sandbox/live credentials and registered webhook.
2. Configure and validate production Twilio Verify credentials if checkout phone OTP is enabled.
3. Implement automated WhatsApp Business notifications; current WhatsApp usage is link-based only.
4. Verify a Scrub Vibe sender domain in Resend and set `RESEND_FROM_EMAIL`.
5. Configure GA4, Meta Pixel and Meta CAPI credentials and validate event deduplication in production.
6. Configure/confirm `CRON_SECRET` and monitor the recovery and commercial cron executions.
7. Add production observability and distributed rate limiting (Sentry and Upstash Redis are reserved in the environment contract but not integrated).
8. Add committed Playwright end-to-end journeys for authentication, checkout, proof review, returns, reviews and admin operations.
9. Complete production backup/restore, rollback, incident-response and monitoring runbooks.
10. Re-run final live Supabase security/performance advisors and verify Auth leaked-password protection before launch sign-off.

## External configuration required

- Supabase URL, publishable key and server secret.
- Vodafone Cash destination and InstaPay address.
- Resend API key, verified sender and staff destination.
- `CRON_SECRET` for scheduled automation.
- Twilio Verify credentials only when OTP is enabled.
- Paymob keys/HMAC/integration IDs only when Paymob is activated.
- Optional GA4 and Meta credentials for external marketing attribution.

## Verification baseline

- Customer Reviews checkpoint: **32 test files / 319 tests passed**, ESLint passed, strict TypeScript passed and Next.js 16.3.3 production build passed.
- Review security was checked against the hosted Supabase project, including anonymous/authenticated execution boundaries.
- Responsive English, Arabic/RTL and 390px product/review/admin flows passed browser QA without horizontal overflow or framework overlays.
- The subsequent back-in-stock PDP notification UI includes dedicated Vitest coverage.

## Next action

Choose the next production-hardening or customer-growth feature after reviewing the remaining list above.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
