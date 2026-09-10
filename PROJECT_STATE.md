# Project state

- **Current phase:** Production hardening and external-provider activation
- **Current branch:** `main`
- **Hosted application:** `https://scrub-vibe-tau.vercel.app`
- **Supabase project:** `iqufqtjotgpmhhtvlxwf`
- **Latest feature:** Production operations foundation: health/readiness, structured runtime errors, fail-closed cron security, operational escalation, verified backup/restore drills, release/rollback and incident runbooks, and automated smoke/security workflows
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
- Production operations with liveness/readiness endpoints, structured server-error logs, fail-closed cron authentication, expired-reservation cleanup, stale proof/payment/webhook escalation, database and Storage backup integrity tooling, non-production restore drills, hourly smoke monitoring, weekly dependency/CodeQL scanning and complete operator runbooks.

## Remaining or externally blocked

1. Activate and acceptance-test Paymob with merchant sandbox/live credentials and registered webhook.
2. Configure and validate production Twilio Verify credentials if checkout phone OTP is enabled.
3. Implement automated WhatsApp Business notifications; current WhatsApp usage is link-based only.
4. Verify a Scrub Vibe sender domain in Resend and set `RESEND_FROM_EMAIL`.
5. Configure GA4, Meta Pixel and Meta CAPI credentials and validate event deduplication in production.
6. Configure `CRON_SECRET` and `OPERATIONS_SECRET` in Vercel and confirm the deployed health/cron workflows.
7. Optionally add longer-retention external observability and distributed rate limiting (Vercel-native structured logging and smoke monitoring are implemented; Sentry and Upstash remain optional extensions).
8. Add committed Playwright end-to-end journeys for authentication, checkout, proof review, returns, reviews and admin operations.
9. Run the first encrypted backup and non-production restore drill, then record the measured RPO/RTO.
10. Upgrade Supabase to Pro if leaked-password protection is required; the setting is unavailable on the current Free plan. Re-review the remaining intentional/optimization advisor findings before launch sign-off.

## External configuration required

- Supabase URL, publishable key and server secret.
- Vodafone Cash destination and InstaPay address.
- Resend API key, verified sender and staff destination.
- `CRON_SECRET` for scheduled automation.
- Twilio Verify credentials only when OTP is enabled.
- Paymob keys/HMAC/integration IDs only when Paymob is activated.
- Optional GA4 and Meta credentials for external marketing attribution.

## Verification baseline

- Production operations checkpoint: **34 test files / 332 tests passed**; ESLint, strict TypeScript and the Next.js 16.3.3 production build passed.
- Live migration verification confirmed three operational indexes, eleven optimized owner policies and revoked direct access to trigger-only functions.
- Responsive English, Arabic/RTL and 390px product/review/admin flows remain covered by the previous browser QA checkpoint.
- Supabase leaked-password protection remains unavailable on the current Free plan; other remaining advisor entries are intentional access patterns or future optimization work.
- Full historical verification evidence is recorded in `TEST_REPORT.md`.

## Next action

Choose the next production-hardening or customer-growth feature after reviewing the remaining list above.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
